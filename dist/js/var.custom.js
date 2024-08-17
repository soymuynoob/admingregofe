const varApiUrl = "https://pripri-production.up.railway.app/api/general_variables"; // API para obtener variables
const apiUrlTicket = "https://pripri-production.up.railway.app/api/general_variables/widget/var";

const rowsPerPage = 20; // Número de registros por página
let currentPage = 1; // Página actual
let totalPages = 1; // Número total de páginas
let editingVarId = null; // ID del usuario que se está editando

const token = localStorage.getItem("authToken");
document.addEventListener("DOMContentLoaded", () => {});
loadTable();

document.getElementById("search").addEventListener("input", loadTable);
document.getElementById("prev").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    loadTable();
  }
});
document.getElementById("next").addEventListener("click", () => {
  if (currentPage < totalPages) {
    currentPage++;
    loadTable();
  }
});



async function loadTable() {
  try {
    const search = document.getElementById("search").value;
    const response = await fetch(
      `${varApiUrl}/all/code?page=${currentPage}&limit=${rowsPerPage}&order=desc&search=${search}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    const tableBody = document.querySelector("#var-table tbody");
    tableBody.innerHTML = "";

    if (data.status) {
      if (data.data.rows.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8">Sin resultados</td></tr>';
      } else {
        console.log("data",data.data.rows);
        
        data.data.rows.forEach((item) => {
          const row = document.createElement("tr");
          row.innerHTML = `
                          <td>${item.id}</td>
                          <td>${item.value}</td>
                          <td>${item.description}</td>
                          <td>${item.ref1}</td>
                          <td>${
                            item.status == 1 ? "Activo" : "Desactivado"
                          }</td>
                        <td>
                          <div class="optionsTable">
                              <button onclick="editUser(${
                                item.id_code
                              })" class="btn-icon">
                                  <i class="fa fa-pencil" aria-hidden="true"></i>
                              </button>
  
                              <button onclick="toggleUserState(${item.id_code}, ${
                                item.status == 1
                              })" class="btn-icon">
                                  ${
                                    item.status == 1
                                      ? '<i class="fa fa-times" aria-hidden="true"></i>'
                                      : '<i class="fa fa-check-circle" aria-hidden="true"></i>'
                                  }
                              </button>
                          </div>
                      </td>
  
                      `;
          tableBody.appendChild(row);
        });
      }
    const   count = Math.ceil(data.data.count / rowsPerPage) 
    console.log(count);
    
      totalPages = count;
      updatePagination();
    }
  } catch (error) {
    console.error("Error loading table:", error);
  }
}

async function toggleUserState(varId, isActive) {
  const newState = !isActive;
  console.log({isActive,newState});

  try {
    const response = await fetch(`${varApiUrl}/${varId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newState }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    await response.json();
    loadTable(); // Recargar la tabla después de cambiar el estado
    widget();
  } catch (error) {
    console.error("Error toggling user state:", error);
  }
}

async function editUser(varId) {
  editingVarId = varId;
  try {
    const response = await fetch(`${varApiUrl}/${varId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await loadFormOptions();

    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();

    if (data.status) {
      setFormValues(data.data); // Establecer valores del formulario
      document.getElementById("edit-popup").style.display = "flex";
    }
  } catch (error) {
    showToast(`Error loading user for edit: ${error.message}`, false);
  }
}
function setFormValues(varForm) {
  document.getElementById("value").value = varForm.value || "";
  document.getElementById("description").value = varForm.description || "";
  document.getElementById("ref1").value = varForm.ref1 || "";
}
document.addEventListener("DOMContentLoaded", () => {
  // loadOptions(); // Cargar opciones
  loadTable(); // Cargar tabla
});

function closePopup() {
  document.getElementById("edit-popup").style.display = "none";
}
document
  .getElementById("edit-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const varId = editingVarId;
    const formData = new FormData(event.target);
    const userData = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`${varApiUrl}/${varId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const responseBody = await response.text();
        const errorData = JSON.parse(responseBody);
        const errorMessage =
          errorData.errors[0]?.msg || "An unknown error occurred";
        showToast(errorMessage, false);
      } else {
        showToast("¡Variable editado con éxito!", true);
      }

      await response.json();
      closePopup();
      loadTable(); // Recargar la tabla después de editar
      widget();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  });

function updatePagination() {
  const paginationDiv = document.getElementById("page-numbers");
  paginationDiv.innerHTML = "";

  // Asegúrate de que los botones de navegación estén habilitados/deshabilitados
  document.getElementById("prev").disabled = currentPage <= 1;
  document.getElementById("next").disabled = currentPage >= totalPages;

  // Añadir los botones de las páginas
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    paginationDiv.innerHTML += `<button class="page-btn" data-page="1">1</button>`;
    if (startPage > 2) paginationDiv.innerHTML += `<span>...</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    paginationDiv.innerHTML += `<button class="page-btn ${
      i === currentPage ? "active" : ""
    }" data-page="${i}">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) paginationDiv.innerHTML += `<span>...</span>`;
    paginationDiv.innerHTML += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
  }

  // Agregar eventos a los botones de página
  document.querySelectorAll(".page-btn").forEach((button) => {
    button.addEventListener("click", () => {
      currentPage = parseInt(button.getAttribute("data-page"));
      loadTable();
    });
  });
  function showError(message) {
    const errorElement = document.getElementById("error-message");
    errorElement.textContent = message;
    errorElement.style.display = "block";
  }

  function hideError() {
    const errorElement = document.getElementById("error-message");
    errorElement.style.display = "none";
  }
}
// crea
const createPopup = document.getElementById("create-popup");
const createForm = document.getElementById("create-form");

// Abre el modal de creación
document.getElementById("open-create-popup").addEventListener("click", () => {
  createPopup.style.display = "flex";
  loadFormOptions(); // Cargar opciones para selects
});

// Cierra el modal de creación
function closeCreatePopup() {
  createForm.reset();
  createPopup.style.display = "none";
}

async function loadFormOptions() {
  try {
    // Cargar ref1
    const ref1Response = await fetch(`${varApiUrl}/all/code/no-repeat`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!ref1Response.ok) throw new Error("Error fetching ref1");
    const ref1Data = await ref1Response.json();
    console.log("ref1:", ref1Data);
    populateSelect("ref1-options", ref1Data.data.rows);
  } catch (error) {
    console.error("Error loading form options:", error);
    showError("Error loading form options: " + error.message); // Asegúrate de tener una función para mostrar errores
  }
}

// Función para llenar los selects
function populateSelect(selectId, options) {
  const select = document.getElementById(selectId);
  options.forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option.ref1;
    // opt.textContent = option.value;
    select.appendChild(opt);
  });
}

// // Maneja el envío del formulario de creación
createForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(createForm);
  const userData = Object.fromEntries(formData.entries());

  // Deshabilitar el botón de envío para prevenir envíos múltiples
  const submitButton = createForm.querySelector(".btn-submit");
  submitButton.disabled = true;

  try {
    const response = await fetch(varApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const responseBody = await response.text(); // Lee el cuerpo como texto
      const errorData = JSON.parse(responseBody); // Intenta analizar el texto como JSON
      const errorMessage =
        errorData.errors[0]?.msg || "An unknown error occurred";
      showToast(errorMessage, false); // Mensaje de error
    } else {
      showToast("¡Variable creado con éxito!", true); // Mensaje de éxito
      closeCreatePopup();
    }

    //   await response.json(); // Asegúrate de que esto se maneje correctamente

    loadTable(); // Recargar la tabla después de crear el usuario
    widget();
  } catch (error) {
    console.log({ error: error.message });
    showToast("Error creating user: " + error.message, false); // Mensaje de error
  } finally {
    // Rehabilitar el botón de envío
    submitButton.disabled = false;
  }
});

// script.js

function showToast(message, isSuccess = false) {
  const toastContainer = document.getElementById("toast-container");

  // Crear el elemento de toast
  const toast = document.createElement("div");
  toast.className = `toast ${isSuccess ? "success" : "error"}`;

  // Crear la barra de temporizador
  const timer = document.createElement("div");
  timer.className = "timer";
  toast.appendChild(timer);

  // Crear el mensaje
  const messageText = document.createElement("span");
  messageText.textContent = message;
  toast.appendChild(messageText);

  // Agregar el toast al contenedor
  toastContainer.appendChild(toast);

  // Ajustar el ancho de la barra de temporizador
  setTimeout(() => {
    timer.style.width = "0%";
  }, 0);

  // Eliminar el toast después de 5 segundos
  setTimeout(() => {
    toastContainer.removeChild(toast);
  }, 5000);
}
async function widget() {
  try {
    const response = await fetch(
      `${apiUrlTicket}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Error fetching data from API");

    const data = await response.json();

    if (data.status) {
      // Reemplazar los números en el HTML con los datos de la API
      document.querySelector(
        ".var"
      ).innerHTML = `${data.data.total_variables}<sup style="font-size: 20px">#</sup>`;
      document.querySelector(
        ".active"
      ).innerHTML = `${data.data.activos}<sup style="font-size: 20px">#</sup>`;
      document.querySelector(
        ".inactive"
      ).innerHTML = `${data.data.no_activos}<sup style="font-size: 20px">#</sup>`;
      document.querySelector(
        ".ref"
      ).innerHTML = `${data.data.conteo_ref1_unicos}<sup style="font-size: 20px">#</sup>`;
    } else {
      console.error("Error: ", data.message);
    }
  } catch (error) {
    console.error("Error fetching data: ", error);
  }
}

widget(); // Llamar a la función para que se ejecute
