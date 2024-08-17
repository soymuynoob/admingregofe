const apiUrl = "https://pripri-production.up.railway.app/api/user";
const apiUrlTicket = "https://pripri-production.up.railway.app/api/ticket/widget/home";
const roleApiUrl = "https://pripri-production.up.railway.app/api/general_variables/ref"; // API para obtener roles
const rowsPerPage = 10; // Número de registros por página
let currentPage = 1; // Página actual
let totalPages = 1; // Número total de páginas
let roles = []; // Almacena los roles para el filtro
let editingUserId = null; // ID del usuario que se está editando

// Reemplaza esto con tu token real
const token = localStorage.getItem("authToken");
document.addEventListener("DOMContentLoaded", () => {});
loadRoles(); // Cargar roles al iniciar
loadTable();
widget();
document.getElementById("search").addEventListener("input", loadTable);
document.getElementById("role-filter").addEventListener("change", loadTable);
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

async function loadRoles() {
  try {
    const response = await fetch(`${roleApiUrl}/rol`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    if (data.status) {
      roles = data.data.rows;

      const roleFilter = document.getElementById("role-filter");
      roleFilter.innerHTML = '<option value="">Todos</option>'; // Resetear opciones del filtro

      roles.forEach((role) => {
        const option = document.createElement("option");
        option.value = role.id_code;
        option.textContent = role.value;
        roleFilter.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error loading roles:", error);
  }
}

async function loadTable() {
  try {
    const search = document.getElementById("search").value;
    const role = document.getElementById("role-filter").value;
    const response = await fetch(
      `${apiUrl}?page=${currentPage}&limit=${rowsPerPage}&order=desc&search=${search}&rol=${role}`,
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

    const tableBody = document.querySelector("#user-table tbody");
    tableBody.innerHTML = "";

    if (data.status) {
      if (data.data.results.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8">Sin resultados</td></tr>';
      } else {
        data.data.results.forEach((item) => {
          const row = document.createElement("tr");
          row.innerHTML = `
                          <td>${item.id}</td>
                          <td>${item.name_p} ${item.name_s} ${
            item.lastname_p
          } ${item.lastname_m}</td>
                          <td>${item.email}</td>
                          <td>${item.number_phone_1}</td>
                          <td>${item.address}</td>
                          <td>${item.salary}</td>
                          <td>${item.rol}</td>
                          <td>${
                            item.state === 1 ? "Activo" : "Desactivado"
                          }</td>
                        <td >
                          <div class="optionsTable">
                              <button onclick="editUser(${
                                item.id
                              })" class="btn-icon">
                                  <i class="fa fa-pencil" aria-hidden="true"></i>
                              </button>
  
                              <button onclick="toggleUserState(${item.id}, ${
            item.state === 1
          })" class="btn-icon">
                                  ${
                                    item.state === 1
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

async function toggleUserState(userId, isActive) {
  const newState = !isActive;

  try {
    const response = await fetch(`${apiUrl}/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ state: newState }),
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

async function editUser(userId) {
  editingUserId = userId;
  try {
    const response = await fetch(`${apiUrl}/${userId}`, {
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
function setFormValues(user) {
  document.getElementById("name_p").value = user.name_p || "";
  document.getElementById("name_s").value = user.name_s || "";
  document.getElementById("lastname_p").value = user.lastname_p || "";
  document.getElementById("lastname_m").value = user.lastname_m || "";
  document.getElementById("number_document").value = user.number_document || "";
  document.getElementById("number_phone_1").value = user.number_phone_1 || "";
  document.getElementById("number_phone_2").value = user.number_phone_2 || "";
  document.getElementById("address").value = user.address || "";
  document.getElementById("salary").value = user.salary || "";
  document.getElementById("birthdate").value = user.birthdate || "";
  document.getElementById("code").value = user.code || "";

  // Verificar valores obtenidos
  console.log("Type Document ID:", user.type_document_id);
  console.log("Gender ID:", user.gender_id);
  console.log("Rol ID:", user.rol_id);

  // Preseleccionar valores en selectores
  const typeDocumentSelect = document.getElementById("type_document_id_edit");
  const genderSelect = document.getElementById("gender_id_edit");
  const rolSelect = document.getElementById("rol_id_edit");

  if (typeDocumentSelect) {
    typeDocumentSelect.value = user.type_document_id || "";
    console.log("Type Document Select Value:", typeDocumentSelect.value);
  } else {
    console.error("Element #type_document_id_edit not found");
  }

  if (genderSelect) {
    genderSelect.value = user.gender_id || "";
    console.log("Gender Select Value:", genderSelect.value);
  } else {
    console.error("Element #gender_id_edit not found");
  }

  if (rolSelect) {
    rolSelect.value = user.rol_id || "";
    console.log("Rol Select Value:", rolSelect.value);
  } else {
    console.error("Element #rol_id_edit not found");
  }
}
document.addEventListener("DOMContentLoaded", () => {
  // loadOptions(); // Cargar opciones
  loadTable(); // Cargar tabla
});

function closePopupUser() {
  document.getElementById("edit-popup").style.display = "none";
}
document
  .getElementById("edit-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const userId = editingUserId;
    const formData = new FormData(event.target);
    const userData = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`${apiUrl}/${userId}`, {
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
        showToast("¡Usuario editado con éxito!", true);
      }

      await response.json();
      closePopupUser();
      loadTable(); // Recargar la tabla después de editar
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
function closeCreatePopupUser() {
  createForm.reset();
  
  document.getElementById("create-popup").style.display = "none";
}

async function loadFormOptions() {
  try {
    // Cargar niveles
    const levelsResponse = await fetch(`${roleApiUrl}/level`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!levelsResponse.ok) throw new Error("Error fetching levels");
    const levelsData = await levelsResponse.json();
    console.log("Niveles:", levelsData);
    populateSelect("level_id", levelsData.data.rows);

    // Cargar géneros
    const gendersResponse = await fetch(`${roleApiUrl}/gender`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!gendersResponse.ok) throw new Error("Error fetching genders");
    const gendersData = await gendersResponse.json();
    console.log("Géneros:", gendersData);
    populateSelect("gender_id", gendersData.data.rows);
    populateSelect("gender_id_edit", gendersData.data.rows);

    // Cargar tipos de documentos
    const docTypesResponse = await fetch(`${roleApiUrl}/dni`, {
      // Verifica el endpoint
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!docTypesResponse.ok) throw new Error("Error fetching document types");
    const docTypesData = await docTypesResponse.json();
    console.log("Tipos de Documentos:", docTypesData);
    populateSelect("type_document_id", docTypesData.data.rows);
    populateSelect("type_document_id_edit", docTypesData.data.rows);

    // Cargar roles
    const rolesResponse = await fetch(`${roleApiUrl}/rol`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!rolesResponse.ok) throw new Error("Error fetching roles");
    const rolesData = await rolesResponse.json();
    console.log("Roles:", rolesData);
    populateSelect("rol_id", rolesData.data.rows);
    populateSelect("rol_id_edit", rolesData.data.rows);
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
      showToast("¡Usuario creado con éxito!", true); // Mensaje de éxito
      closeCreatePopupUser();
    }

    //   await response.json(); // Asegúrate de que esto se maneje correctamente

    loadTable(); // Recargar la tabla después de crear el usuario
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
  }, 500);
}

async function widget() {
  const dateInit = "2023-06-01";
  const dateEnd = "2028-07-31";
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
        ".confirmar"
      ).innerHTML = `${data.data.pendingConfirmation}<sup style="font-size: 20px">#</sup>`;
      document.querySelector(
        ".realizar"
      ).innerHTML = `${data.data.pendingRealization}<sup style="font-size: 20px">#</sup>`;
      document.querySelector(
        ".ingreso"
      ).innerHTML = `${data.data.totalIncome}<sup style="font-size: 20px">/s</sup>`;
      document.querySelector(
        ".egreso"
      ).innerHTML = `${data.data.totalExpense}<sup style="font-size: 20px">/s</sup>`;
    } else {
      console.error("Error: ", data.message);
    }
  } catch (error) {
    console.error("Error fetching data: ", error);
  }
}

widget(); // Llamar a la función para que se ejecute
