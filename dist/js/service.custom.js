const apiUrl = "https://pripri-production.up.railway.app/api/service";
const varApiUrl = "https://pripri-production.up.railway.app/api/general_variables/ref"; // API para obtener variables
const apiUrlTicket = "https://pripri-production.up.railway.app/api/service/widget/service";

const rowsPerPage = 20; // Número de registros por página
let currentPage = 1; // Página actual
let totalPages = 1; // Número total de páginas
let editingserviceId = null; // ID del Servicio que se está editando

// Reemplaza esto con tu token real
const token = localStorage.getItem("authToken");
document.addEventListener("DOMContentLoaded", () => {});
validateAndLoadDates();

document.getElementById("search").addEventListener("input", validateAndLoadDates);
document.getElementById("prev").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    validateAndLoadDates();
  }
});
document.getElementById("next").addEventListener("click", () => {
  if (currentPage < totalPages) {
    currentPage++;
    validateAndLoadDates();
  }
});



async function loadTable({ dateInit, dateEnd }) {
  try {
    const search = document.getElementById("search").value;
    const response = await fetch(
      `${apiUrl}?page=${currentPage}&limit=${rowsPerPage}&order=desc&search=${search}&all=1&dateInit=${dateInit}&dateEnd=${dateEnd}`,
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

    const tableBody = document.querySelector("#service-table tbody");
    tableBody.innerHTML = "";

    if (data.status) {
      if (data.data.results.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8">Sin resultados</td></tr>';
      } else {
        data.data.results.forEach((item) => {
          const row = document.createElement("tr");
          row.innerHTML = `
                          <td>${item.id}</td>
                          <td>${item.name}</td>
                          <td>${item.level}</td>
                          <td>${item.description}</td>
                          <td>${
                            item.status === 1 ? "Activo" : "Desactivado"
                          }</td>
                        <td>
                          <div class="optionsTable">
                              <button onclick="editUser(${
                                item.id
                              })" class="btn-icon">
                                  <i class="fa fa-pencil" aria-hidden="true"></i>
                              </button>
  
                              <button onclick="toggleUserState(${item.id}, ${
                                item.status === 1
                              })" class="btn-icon">
                                  ${
                                    item.status === 1
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

      totalPages = data.data.totalPages;
      updatePagination();
    }
  } catch (error) {
    console.error("Error loading table:", error);
  }
}

async function toggleUserState(serviceId, isActive) {
  const newState = !isActive;
  console.log({isActive,newState});

  try {
    const response = await fetch(`${apiUrl}/${serviceId}`, {
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
    validateAndLoadDates(); // Recargar la tabla después de cambiar el estado
   
  } catch (error) {
    console.error("Error toggling user state:", error);
  }
}

async function editUser(serviceId) {
  editingserviceId = serviceId;
  try {
    const response = await fetch(`${apiUrl}/${serviceId}`, {
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
function setFormValues(service) {
  document.getElementById("name").value = service.name || "";
  document.getElementById("description").value = service.description || "";
  // Preseleccionar valores en selectores
  const level = document.getElementById("level_id_edit");
  level.value = service?.level_id || "";

  // if (level) {
  //   console.log("Type Document Select Value:", level.value);
  // } else {
  //   console.error("Element #type_document_id_edit not found");
  // }
}
document.addEventListener("DOMContentLoaded", () => {
  // loadOptions(); // Cargar opciones
  validateAndLoadDates(); // Cargar tabla
});

function closePopup() {
  document.getElementById("edit-popup").style.display = "none";
}
document
  .getElementById("edit-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const serviceId = editingserviceId;
    const formData = new FormData(event.target);
    const userData = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`${apiUrl}/${serviceId}`, {
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
        showToast("¡Servicio editado con éxito!", true);
      }

      await response.json();
      closePopup();
      validateAndLoadDates(); // Recargar la tabla después de editar
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
      validateAndLoadDates();
    });
  });

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
    // Cargar niveles
    const levelsResponse = await fetch(`${varApiUrl}/level`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!levelsResponse.ok) throw new Error("Error fetching levels");
    const levelsData = await levelsResponse.json();
    console.log("Niveles:", levelsData);
    populateSelect("level_id", levelsData.data.rows);
    populateSelect("level_id_edit", levelsData.data.rows);
  } catch (error) {
    console.error("Error loading form options:", error);
    showError("Error loading form options: " + error.message); // Asegúrate de tener una función para mostrar errores
  }
}

// Función para llenar los selects
function populateSelect(selectId, options) {
  const select = document.getElementById(selectId);
  select.innerHTML = '<option value="">Seleccione</option>';
  options.forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option.id_code;
    opt.textContent = option.value;
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
    const response = await fetch(apiUrl, {
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
      showToast("¡Servicio creado con éxito!", true); // Mensaje de éxito
      closeCreatePopup();
    }

    //   await response.json(); // Asegúrate de que esto se maneje correctamente

    validateAndLoadDates(); // Recargar la tabla después de crear el Servicio
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
async function widget({ dateInit, dateEnd }) {
  try {
    const response = await fetch(
      `${apiUrlTicket}?dateInit=${dateInit}&dateEnd=${dateEnd}`,
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
        ".services"
      ).innerHTML = `${data.data.total_servicios}<sup style="font-size: 20px">#</sup>`;
      document.querySelector(
        ".actives"
      ).innerHTML = `${data.data.total_servicios_activos}<sup style="font-size: 20px">#</sup>`;
      document.querySelector(
        ".in-wait"
      ).innerHTML = `${data.data.total_tickets_futuro}<sup style="font-size: 20px">#</sup>`;
      document.querySelector(
        ".done"
      ).innerHTML = `${data.data.total_servicios_asignados}<sup style="font-size: 20px">#</sup>`;
    } else {
      console.error("Error: ", data.message);
    }
  } catch (error) {
    console.error("Error fetching data: ", error);
  }
}
async function validateAndLoadDates() {
  // Obtener las fechas de los inputs
  const dateInit = document.getElementById("start-date").value;
  const dateEnd = document.getElementById("end-date").value;

  let startDate = dateInit;
  let endDate = dateEnd;

  // Obtener el año actual
  const currentYear = new Date().getFullYear();

  // Si alguna de las fechas está vacía, establecer el rango por defecto del año actual
  if (!startDate && !endDate) {
    startDate = `${currentYear}-01-01`;
    endDate = `${currentYear}-12-31`;
  } else if (!startDate) {
    startDate = `${new Date(dateEnd).getFullYear()}-01-01`;
  } else if (!endDate) {
    endDate = `${new Date(dateInit).getFullYear()}-12-31`;
  }

  // Validar que la fecha de inicio no sea mayor que la fecha de fin
  if (new Date(startDate) > new Date(endDate)) {
    showToast(
      "La fecha de inicio no puede ser mayor que la fecha de fin.",
      false
    );
    return;
  }

  // Crear el objeto con las fechas y llamar a las funciones asincrónicas
  const dateObject = { dateInit: startDate, dateEnd: endDate };
  await loadTable(dateObject);
  await widget(dateObject);
}
// Asociar la función de validación al botón
document
  .querySelector(".submit-btn")
  .addEventListener("click", validateAndLoadDates);
