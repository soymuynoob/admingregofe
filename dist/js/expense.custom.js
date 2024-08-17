const apiUrl = "https://pripri-production.up.railway.app/api/expense";
const VarApiUrl = "https://pripri-production.up.railway.app/api/general_variables/ref"; // API para obtener variables
const apiUrlTicket = "https://pripri-production.up.railway.app/api/expense/widget/expense";
const rowsPerPage = 20; // Número de registros por página
let currentPage = 1; // Página actual
let totalPages = 1; // Número total de páginas
let editingclientId = null; // ID del usuario que se está editando

// Reemplaza esto con tu token real
const token = localStorage.getItem("authToken");
document.addEventListener("DOMContentLoaded", () => {});
validateAndLoadDates()

document.getElementById("search").addEventListener("input", validateAndLoadDates);
document.getElementById("prev").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    validateAndLoadDates()
  }
});
document.getElementById("next").addEventListener("click", () => {
  if (currentPage < totalPages) {
    currentPage++;
    validateAndLoadDates()
  }
});

async function loadTable({ dateInit, dateEnd }) {
  try {
    const search = document.getElementById("search").value;
    console.log(search);
    const response = await fetch(
      `${apiUrl}?page=${currentPage}&limit=${rowsPerPage}&order=desc&search=${search}&dateInit=${dateInit}&dateEnd=${dateEnd}`,
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

    const tableBody = document.querySelector("#expense-table tbody");
    tableBody.innerHTML = "";

    if (data.status) {
      if (data.data.results.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8">Sin resultados</td></tr>';
      } else {
        data.data.results.forEach((item) => {
          const row = document.createElement("tr");
          console.log({ item });
          row.innerHTML = `
                          <td>${item.id}</td>
                          <td>${item.expense_for}</td>
                          <td>${item.type_expense}</td>
                          <td>${item.coin}</td>
                          <td>${item.type_payment}</td>
                          <td>${item.amount}</td>
                          <td>${item.description}</td>
                          <td>${
                            item.status === 1 ? "Activo" : "Desactivado"
                          }</td>
                        <td >
                          <div class="optionsTable">
                              <button onclick="editUser(${
                                item.id
                              })" class="btn-icon">
                                  <i class="fa fa-pencil" aria-hidden="true"></i>
                              </button>
  
                              <button onclick="toggleUserstatus(${item.id}, ${
            item.status == 1
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

async function toggleUserstatus(clientId, isActive) {
  const newstatus = !isActive;

  try {
    const response = await fetch(`${apiUrl}/${clientId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newstatus }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    await response.json();
    validateAndLoadDates()
  } catch (error) {
    console.error("Error toggling expense status:", error);
  }
}

async function editUser(clientId) {
  editingclientId = clientId;
  try {
    const response = await fetch(`${apiUrl}/${clientId}`, {
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
    showToast(`Error loading expense for edit: ${error.message}`, false);
  }
}
function setFormValues(expense) {
  document.getElementById("amount_edit").value = expense.amount || "";
  document.getElementById("description_edit").value = expense.description || "";
  // Verificar valores obtenidos

  // Preseleccionar valores en selectores
  const expenseForSelect = document.getElementById("expense_for_id_edit");
  const typeExpenseSelect = document.getElementById("type_expense_id_edit");
  const coinSelect = document.getElementById("type_coin_id_edit");
  const typePaymentSelect = document.getElementById("type_payment_id_edit");
  expenseForSelect.value = expense.expense_for_id || "";
  typeExpenseSelect.value = expense.type_expense_id || "";
  coinSelect.value = expense.type_coin_id || "";
  typePaymentSelect.value = expense.type_payment_id || "";
}
document.addEventListener("DOMContentLoaded", () => {
  validateAndLoadDates()
});

function closePopup() {
  document.getElementById("edit-popup").style.display = "none";
}
document
  .getElementById("edit-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const clientId = editingclientId;
    const formData = new FormData(event.target);
    const userData = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`${apiUrl}/${clientId}`, {
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
        showToast("Finanza editado con éxito!", true);
      }

      await response.json();
      closePopup();
      validateAndLoadDates()
    } catch (error) {
      console.error("Error updating expense:", error);
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
      validateAndLoadDates()
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
    // motivo de gasto
    const expenseResponse = await fetch(`${VarApiUrl}/expense_for`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!expenseResponse.ok) throw new Error("Error fetching ");
    const expenseData = await expenseResponse.json();
    console.log("motivo:", expenseData);
    populateSelect("expense_for_id_edit", expenseData.data.rows);
    populateSelect("expense_for_id", expenseData.data.rows);

    // ingreso o egreso
    const typeExpenseResponse = await fetch(`${VarApiUrl}/expense`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!typeExpenseResponse.ok) throw new Error("Error fetching ");
    const typeExpenseData = await typeExpenseResponse.json();
    console.log("tipo de gasto:", typeExpenseData);
    populateSelect("type_expense_id_edit", typeExpenseData.data.rows);
    populateSelect("type_expense_id", typeExpenseData.data.rows);

    // tipo de pago
    const typePayment = await fetch(`${VarApiUrl}/payment`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!typePayment.ok) throw new Error("Error fetching ");
    const typePaymen = await typePayment.json();
    console.log("tipo de pago:", typePaymen);
    populateSelect("type_payment_id", typePaymen.data.rows);
    populateSelect("type_payment_id_edit", typePaymen.data.rows);

    // tipo de moneda
    const coin = await fetch(`${VarApiUrl}/coin`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!coin.ok) throw new Error("Error fetching ");
    const coinData = await coin.json();
    console.log("Géneros:", coinData);
    populateSelect("type_coin_id", coinData.data.rows);
    populateSelect("type_coin_id_edit", coinData.data.rows);
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
      showToast("Finanza creado con éxito!", true); // Mensaje de éxito
      closeCreatePopup();
    }

    //   await response.json(); // Asegúrate de que esto se maneje correctamente

    validateAndLoadDates()
  } catch (error) {
    console.log({ error: error.message });
    showToast("Error creating expense: " + error.message, false); // Mensaje de error
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
        ".outflow"
      ).innerHTML = `${data.data.suma_egresos}<sup style="font-size: 20px">/s</sup>`;
      document.querySelector(
        ".outflow-count"
      ).innerHTML = `${data.data.conteo_egresos}<sup style="font-size: 20px">#</sup>`;
      document.querySelector(
        ".income"
      ).innerHTML = `${data.data.suma_ingresos}<sup style="font-size: 20px">/s</sup>`;
      document.querySelector(
        ".income-count"
      ).innerHTML = `${data.data.conteo_ingresos}<sup style="font-size: 20px">#</sup>`;
    } else {
      console.error("Error: ", data.message);
    }
  } catch (error) {
    console.error("Error fetching data: ", error);
  }
}
async function validateAndLoadDates() {
  // Obtener las fechas de los inputs
  const dateInit = document.getElementById('start-date').value;
  const dateEnd = document.getElementById('end-date').value;

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
    showToast("La fecha de inicio no puede ser mayor que la fecha de fin.",false)
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
