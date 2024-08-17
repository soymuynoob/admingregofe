document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  const monthYearEl = document.getElementById("month-year");
  const prevMonthBtn = document.getElementById("prev-month");
  const nextMonthBtn = document.getElementById("next-month");
  const editPopup = document.getElementById("event-modal");
  const editForm = document.getElementById("edit-form-event");
  var selectedIdsInfo = "";
  let currentDate = new Date();
  const token = localStorage.getItem("authToken");

  // function fetchEvents() {
  //   fetch(
  //     "https://pripri-production.up.railway.app/api/ticket?page=1&limit=10&order=desc&search=",
  //     {
  //       method: "GET",
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   )
  //     .then((response) => response.json())
  //     .then(async (data) => {
  //       if (data.status && data.message === "Success") {
  //         await renderCalendar(data.data.results);
  //       }
  //     })
  //     .catch((error) => console.error("Error fetching data:", error));
  // }
  async function fetchEvents() {
    try {
      const response = await fetch(
        "https://pripri-production.up.railway.app/api/ticket?page=1&limit=10&order=desc&search=",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const responseBody = await response.text();
        const errorData = JSON.parse(responseBody);
        const errorMessage =
          errorData.errors[0]?.msg || "An unknown error occurred";
        showToast(errorMessage, false);
      } else {
        const data = await response.json();
        if (data.status && data.message === "Success") {
          await renderCalendar(data.data.results);
          showToast("¡Datos obtenidos con éxito!", true);
        } else {
          const errorMessage = data.message || "An unknown error occurred";
          showToast(errorMessage, false);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast("Error fetching data", false);
    }
  }

  async function renderCalendar(events) {
    calendarEl.innerHTML = "";
    const daysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();
    monthYearEl.innerText = `${currentDate.toLocaleString("default", {
      month: "long",
    })} ${currentDate.getFullYear()}`;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEl = document.createElement("div");
      dayEl.className = "day";
      dayEl.innerHTML = `<strong>${day}</strong>`;
      const dayDate = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      events.forEach((event) => {
        if (event.date === dayDate) {
          const eventEl = document.createElement("div");
          eventEl.className = `event ${getEventClass(
            +event.service_status_id
          )}`;
          eventEl.innerText = event.full_name;
          eventEl.addEventListener("click", async () => {
            await loadFormOptions();
            openEditPopup(event);
          });

          dayEl.appendChild(eventEl);
        }
      });

      calendarEl.appendChild(dayEl);
    }
  }

  function getEventClass(status) {
    switch (status) {
      case 19:
        return "confirmed";
      case 20:
        return "wait";
      case 21:
        return "pay";
      case 22:
        return "done";
      case 34:
        return "canceled";
      case 35:
        return "done-not-pay";
      default:
        return "";
    }
  }

  async function openEditPopup(event) {
    console.log({ event });
    console.log(event.status_payment_id, event.service_status_id);

    document.getElementById("service_id_evet").value = event.service_id || "";
    document.getElementById("client_id_evet").value = event.full_name || "";
    document.getElementById("address_evet").value = event.client_address || "";
    document.getElementById("technical_id_evet").value =
      event.technical_id || "";
    document.getElementById("client_number_phone_1_evet").value =
      event.client_number_phone_1 || "";
    document.getElementById("date_evet").value = event.date || "";
    document.getElementById("technical_number_phone_1_evet").value =
      event.technical_number_phone_1 || "";
    document.getElementById("hour_evet").value = event.hour || "";
    document.getElementById("type_payment_id_evet").value =
      event.type_payment_id || "";

    const s = document.getElementById("status_payment_id_evet");
    s.value = event.status_payment_id || "";
    document.getElementById("amount_evet").value = event.amount || "";
    document.getElementById("service_status_id_evet").value =
      event.service_status_id || "";
    document.getElementById("description_evet").value =
      event.description_ticket || "";
    document.getElementById("how_long_evet").value = event.how_long || "";
    document.getElementById("ticket_id").innerHTML = event.id || "";

    selectedIdsInfo = event.home_appliances || "";

    await homeAppliancesPayload(selectedIdsInfo);
    console.log(event.home_appliances, "home appliances");

    editPopup.style.display = "flex";
  }

  function closePopup() {
    editPopup.style.display = "none";
  }

  prevMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    fetchEvents();
  });

  nextMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    fetchEvents();
  });

  editForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Recolecta los IDs de los electrodomésticos seleccionados
    const homeAppliances = Array.from(
      document.querySelectorAll(
        "#home_appliances_container_edit input[type='checkbox']:checked"
      )
    ).map((checkbox) => parseInt(checkbox.value));

    const ticketData = {
      service_id: document.getElementById("service_id_evet").value,
      technical_id: document.getElementById("technical_id_evet").value,
      date: document.getElementById("date_evet").value,
      hour: document.getElementById("hour_evet").value,
      type_payment_id: document.getElementById("type_payment_id_evet").value,
      status_payment_id: document.getElementById("status_payment_id_evet")
        .value,
      amount: document.getElementById("amount_evet").value,
      service_status_id: document.getElementById("service_status_id_evet")
        .value,
      how_long: document.getElementById("how_long_evet").value,
      description: document.getElementById("description_evet").value,
      home_appliances: homeAppliances,
    };

    const ticketId = document.getElementById("ticket_id").innerText; // Assuming you have a hidden input for ticket ID

    try {
      const response = await fetch(
        `https://pripri-production.up.railway.app/api/ticket/${ticketId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(ticketData),
        }
      );

      if (!response.ok) {
        const responseBody = await response.text();
        const errorData = JSON.parse(responseBody);
        const errorMessage =
          errorData.errors[0]?.msg || "An unknown error occurred";
        showToast(errorMessage, false);
      } else {
        const data = await response.json();
        if (data.status && data.message === "Success") {
          fetchEvents();
          closePopup();
          showToast("¡Ticket editado con éxito!", true);
          widget();
        } else {
          const errorMessage = data.message || "An unknown error occurred";
          showToast(errorMessage, false);
        }
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      showToast("Error updating ticket", false);
    }
  });

  fetchEvents();
  window.closePopup = closePopup;

  const apiUrl = "https://pripri-production.up.railway.app/api"; // Reemplaza con la URL correcta de tu API

  async function loadFormOptions() {
    try {
      // Cargar Servicios
      const servicesResponse = await fetch(
        `${apiUrl}/service?page=1&limit=10000&order=desc`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!servicesResponse.ok) {
        const responseBody = await servicesResponse.text();
        const errorData = JSON.parse(responseBody);
        const errorMessage =
          errorData.errors[0]?.msg || "Error fetching services";
        showToast(errorMessage, false);
        throw new Error(errorMessage);
      }
      const servicesData = await servicesResponse.json();
      console.log("Servicios:", servicesData);
      populateSelectService("service_id_evet", servicesData.data.results);
      populateSelectService("service_id_create", servicesData.data.results);

      // Cargar Técnicos
      const technicalsResponse = await fetch(
        `${apiUrl}/user?page=1&limit=10000&order=desc&rol=3`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!technicalsResponse.ok) {
        const responseBody = await technicalsResponse.text();
        const errorData = JSON.parse(responseBody);
        const errorMessage =
          errorData.errors[0]?.msg || "Error fetching technicals";
        showToast(errorMessage, false);
        throw new Error(errorMessage);
      }
      const technicalsData = await technicalsResponse.json();
      console.log("Técnicos:", technicalsData);
      populateSelectTechnical("technical_id_evet", technicalsData.data.results);
      populateSelectTechnical(
        "technical_id_create",
        technicalsData.data.results
      );

      // Cargar Estados de Servicio
      const serviceStatusResponse = await fetch(
        `${apiUrl}/general_variables/ref/state_ticket`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!serviceStatusResponse.ok) {
        const responseBody = await serviceStatusResponse.text();
        const errorData = JSON.parse(responseBody);
        const errorMessage =
          errorData.errors[0]?.msg || "Error fetching service statuses";
        showToast(errorMessage, false);
        throw new Error(errorMessage);
      }
      const serviceStatusData = await serviceStatusResponse.json();
      console.log("Estados de Servicio:", serviceStatusData);
      populateSelect("service_status_id_evet", serviceStatusData.data.rows);
      populateSelect("service_status_id_create", serviceStatusData.data.rows);

      // Cargar Tipos de Pago
      const paymentTypeResponse = await fetch(
        `${apiUrl}/general_variables/ref/payment`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!paymentTypeResponse.ok) {
        const responseBody = await paymentTypeResponse.text();
        const errorData = JSON.parse(responseBody);
        const errorMessage =
          errorData.errors[0]?.msg || "Error fetching payment types";
        showToast(errorMessage, false);
        throw new Error(errorMessage);
      }
      const paymentTypeData = await paymentTypeResponse.json();
      console.log("Tipos de Pago:", paymentTypeData);
      populateSelect("type_payment_id_evet", paymentTypeData.data.rows);
      populateSelect("type_payment_id_create", paymentTypeData.data.rows);

      // Cargar Estados de Pago
      const statePaymentResponse = await fetch(
        `${apiUrl}/general_variables/ref/state_payment`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!statePaymentResponse.ok) {
        const responseBody = await statePaymentResponse.text();
        const errorData = JSON.parse(responseBody);
        const errorMessage =
          errorData.errors[0]?.msg || "Error fetching service statuses";
        showToast(errorMessage, false);
        throw new Error(errorMessage);
      }
      const statePaymentResponseData = await statePaymentResponse.json();
      console.log("Estados de pagos:", statePaymentResponseData);
      populateSelect(
        "status_payment_id_evet",
        statePaymentResponseData.data.rows
      );
      populateSelect(
        "status_payment_id_create",
        statePaymentResponseData.data.rows
      );

      // Cargar Género
      const genderResponse = await fetch(
        `${apiUrl}/general_variables/ref/gender`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!genderResponse.ok) {
        const responseBody = await genderResponse.text();
        const errorData = JSON.parse(responseBody);
        const errorMessage =
          errorData.errors[0]?.msg || "Error fetching genders";
        showToast(errorMessage, false);
        throw new Error(errorMessage);
      }
      const genderData = await genderResponse.json();
      console.log("Género:", genderData);
      populateSelect("gender_id_create", genderData.data.rows);

      // Cargar Electrodomésticos
      const homeAppliancesResponse = await fetch(
        `${apiUrl}/general_variables/ref/home_appliances`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!homeAppliancesResponse.ok) {
        const responseBody = await homeAppliancesResponse.text();
        const errorData = JSON.parse(responseBody);
        const errorMessage =
          errorData.errors[0]?.msg || "Error fetching home appliances";
        showToast(errorMessage, false);
        throw new Error(errorMessage);
      }
      const homeAppliancesData = await homeAppliancesResponse.json();
      console.log("Electrodomésticos:", homeAppliancesData);
      populateHomeAppliances(
        "home_appliances_container",
        homeAppliancesData.data.rows
      );

      showToast("¡Opciones de formulario cargadas con éxito!", true);
    } catch (error) {
      console.error("Error loading form options:", error);
      showToast("Error loading form options: " + error.message, false);
    }
  }

  function populateSelect(selectId, options) {
    const selectElement = document.getElementById(selectId);
    selectElement.innerHTML =
      `<option value="" disabled selected>Selecciona una opción</option>` +
      options
        .map(
          (option) =>
            `<option value="${option.id_code}">${option.value}</option>`
        )
        .join("");
  }
  function populateSelectService(selectId, options) {
    const selectElement = document.getElementById(selectId);

    selectElement.innerHTML =
      `<option value="" disabled selected>Selecciona una opción</option>` +
      options
        .map((option) => `<option value="${option.id}">${option.name}</option>`)
        .join("");
  }
  function populateSelectTechnical(selectId, options) {
    const selectElement = document.getElementById(selectId);

    selectElement.innerHTML =
      `<option value="" disabled selected>Selecciona una opción</option>` +
      options
        .map(
          (option) =>
            `<option value="${option.id}">${option.name_p} ${option.lastname_p} -  ${option.number_document} </option>`
        )
        .join("");
  }
  // async function homeAppliancesPayload(selectedIdsInfo) {
  //   // Cargar Electrodomésticos
  //   const homeAppliancesResponse = await fetch(
  //     `${apiUrl}/general_variables/ref/home_appliances`,
  //     {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     }
  //   );
  //   if (!homeAppliancesResponse.ok)
  //     throw new Error("Error fetching home appliances");
  //   const homeAppliancesData = await homeAppliancesResponse.json();
  //   console.log("Electrodomésticos:", homeAppliancesData);
  //   populateHomeAppliances(
  //     "home_appliances_container",
  //     homeAppliancesData.data.rows
  //   );

  //   // Llenar Electrodomésticos para Edición
  //   populateHomeAppliancesEdit(
  //     "home_appliances_container_edit",
  //     homeAppliancesData.data.rows,
  //     selectedIdsInfo
  //   );
  // }
  // Función para poblar checkboxes dinámicamente
  async function homeAppliancesPayload(selectedIdsInfo) {
    try {
      // Cargar Electrodomésticos
      const homeAppliancesResponse = await fetch(
        `${apiUrl}/general_variables/ref/home_appliances`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!homeAppliancesResponse.ok) {
        const responseBody = await homeAppliancesResponse.text();
        const errorData = JSON.parse(responseBody);
        const errorMessage =
          errorData.errors[0]?.msg || "Error fetching home appliances";
        showToast(errorMessage, false);
        throw new Error(errorMessage);
      }
      const homeAppliancesData = await homeAppliancesResponse.json();
      console.log("Electrodomésticos:", homeAppliancesData);
      populateHomeAppliances(
        "home_appliances_container",
        homeAppliancesData.data.rows
      );

      // Llenar Electrodomésticos para Edición
      populateHomeAppliancesEdit(
        "home_appliances_container_edit",
        homeAppliancesData.data.rows,
        selectedIdsInfo
      );

      showToast("¡Electrodomésticos cargados con éxito!", true);
    } catch (error) {
      console.error("Error fetching home appliances:", error);
      showToast("Error fetching home appliances: " + error.message, false);
    }
  }

  function populateHomeAppliances(containerId, options) {
    const container = document.getElementById(containerId);

    container.innerHTML = options
      .map(
        (option) => `
          <label>
            <input type="checkbox" name="home_appliances" value="${option.id_code}">
            ${option.value}
          </label>
        `
      )
      .join("");
  }
  function populateHomeAppliancesEdit(containerId, options, selectedIds) {
    console.log({ containerId, options, selectedIds });

    const container = document.getElementById(containerId);

    container.innerHTML = options
      .map(
        (option) => `
          <div class="col">
            <label>
              <input type="checkbox" name="home_appliances" value="${
                option.id_code
              }" ${selectedIds.includes(option.id_code) ? "checked" : ""}>
              ${option.value}
            </label>
          </div>
        `
      )
      .join("");
  }

  const createPopup = document.getElementById("create-event-modal");
  const createForm = document.getElementById("create-form-event");

  function openCreatePopup() {
    createPopup.style.display = "flex";
  }

  function closeCreatePopup() {
    document.getElementById("create-form-event").reset();
    console.log("entre cerrar");

    createPopup.style.display = "none";
  }

  createForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Recolecta los IDs de los electrodomésticos seleccionados
    const homeAppliances = Array.from(
      document.querySelectorAll(
        "#home_appliances_container input[type='checkbox']:checked"
      )
    ).map((checkbox) => parseInt(checkbox.value));

    const ticketData = {
      full_name: document.getElementById("full_name_create").value,
      service_id: document.getElementById("service_id_create").value,
      address: document.getElementById("address_create").value,
      technical_id: document.getElementById("technical_id_create").value,
      number_phone_1: document.getElementById("client_number_phone_1_create")
        .value,
      date: document.getElementById("date_create").value,
      hour: document.getElementById("hour_create").value,
      type_payment_id: document.getElementById("type_payment_id_create").value,
      status_payment_id: document.getElementById("status_payment_id_create")
        .value,
      amount: document.getElementById("amount_create").value,
      service_status_id: document.getElementById("service_status_id_create")
        .value,
      description: document.getElementById("description_create").value,
      how_long: document.getElementById("how_long_create").value,
      gender_id: document.getElementById("gender_id_create").value,
      home_appliances: homeAppliances,
    };

    fetch("https://pripri-production.up.railway.app/api/ticket", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ticketData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.status || data.message !== "Success") {
          const errorMessage =
            data.errors[0]?.msg || "An unknown error occurred";
          showToast(errorMessage, false);
        } else {
          fetchEvents();
          closeCreatePopup();
          widget();
          showToast("¡Ticket creado con éxito!", true);
        }
      })
      .catch((error) => {
        console.error("Error creating ticket:", error);
        showToast("Error creando ticket: " + error.message, false);
      });
  });

  window.openCreatePopup = openCreatePopup;
  window.closeCreatePopup = closeCreatePopup;

  createPopup.addEventListener("show", loadFormOptions());

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

  document.getElementById('client_number_phone_1_create').addEventListener('input', async function() {
    const phoneNumber = this.value;

    if (phoneNumber.length >= 1) { // Realizar la búsqueda después de 3 caracteres
        try {
            const response = await fetch(`${apiUrl}/client?search=${phoneNumber}&page=1&limit=10000&order=desc`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();

            if (data.status && data.data.results.length > 0) {
                const clients = data.data.results;
                showPhoneNumberSelection(clients, phoneNumber);
            } else {
                clearDropdown();
            }
        } catch (error) {
            console.error('Error al buscar el cliente:', error);
        }
    } else {
        clearDropdown();
    }
});

function fillClientFields(client) {
    document.getElementById('full_name_create').value = client.full_name;
    document.getElementById('address_create').value = client.address;
    document.getElementById('client_number_phone_1_create').value = client.number_phone_1;
}

function showPhoneNumberSelection(clients, phoneNumber) {
    const dropdown = document.createElement('ul');
    dropdown.classList.add('dropdown-list');
    
    clients.forEach(client => {
        const listItem = document.createElement('li');
        listItem.textContent = client.number_phone_1;
        listItem.addEventListener('click', function() {
            fillClientFields(client);
            dropdown.remove();
        });
        dropdown.appendChild(listItem);
    });

    clearDropdown();

    const phoneInput = document.getElementById('client_number_phone_1_create');
    phoneInput.parentNode.appendChild(dropdown);

    // Aplicar estilos para posicionar la lista correctamente
    dropdown.style.position = 'absolute';
    dropdown.style.left = phoneInput.offsetLeft + 'px';
    dropdown.style.top = (phoneInput.offsetTop + phoneInput.offsetHeight) + 'px';
    dropdown.style.width = phoneInput.offsetWidth + 'px';
    dropdown.style.border = '1px solid #ccc';
    dropdown.style.backgroundColor = '#fff';
    dropdown.style.zIndex = '1000';
    dropdown.style.listStyle = 'none';
    dropdown.style.padding = '0';
    dropdown.style.margin = '0';
    dropdown.style.cursor = 'pointer';
}

function clearDropdown() {
    const existingDropdown = document.querySelector('.dropdown-list');
    if (existingDropdown) {
        existingDropdown.remove();
    }
}

});
