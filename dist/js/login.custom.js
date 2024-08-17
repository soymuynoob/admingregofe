const body = document.querySelector("body");
const modal = document.querySelector(".modal");
const modalButton = document.querySelector(".modal-button");
const closeButton = document.querySelector(".close-button");
const scrollDown = document.querySelector(".scroll-down");
// Integración con la API de login
const url = "https://pripri-production.up.railway.app/api/login";

let isOpened = false;

const openModal = () => {
  modal.classList.add("is-open");
  body.style.overflow = "hidden";
};

const closeModal = () => {
  modal.classList.remove("is-open");
  body.style.overflow = "initial";
};

window.addEventListener("scroll", () => {
  if (window.scrollY > window.innerHeight / 3 && !isOpened) {
    isOpened = true;
    scrollDown.style.display = "none";
    openModal();
  }
});

modalButton.addEventListener("click", openModal);
closeButton.addEventListener("click", closeModal);

document.onkeydown = (evt) => {
  evt = evt || window.event;
  evt.keyCode === 27 ? closeModal() : false;
};

document.addEventListener("DOMContentLoaded", function () {
  const submitButton = document.getElementById("submit");
  const errorMessage = document.getElementById("error-message");

  submitButton.addEventListener("click", function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Validación de email y contraseña
    if (!validateEmail(email)) {
      errorMessage.textContent =
        "Por favor, introduce una dirección de correo electrónico válida.";
      return;
    }
    if (password.trim() === "") {
      errorMessage.textContent = "La contraseña no puede estar vacía.";
      return;
    }
    // Obtén el primer elemento con la clase "loader"
    const spinner = document.getElementsByClassName("loader")[0];

    // Asegúrate de que el elemento existe antes de cambiar su estilo
    if (spinner) {
      spinner.style.display = "block"; // Cambia el display a block
    }
    fetch(`${url}/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email, password: password }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data.status);

        if (data.status === true) {
          localStorage.setItem("authToken", data.data.JWT); // Guarda el token en localStorage
          localStorage.setItem("user", JSON.stringify(data.data.user));
          console.log("entre");

          window.location.href = "./pages/main/home.html";
          spinner.style.display = "none"; // Cambia el display a none
        } else {
          spinner.style.display = "none"; // Cambia el display a none

          errorMessage.textContent =
            data.message || "Se ha producido un error. Inténtalo de nuevo.";
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        errorMessage.textContent =
          "Se ha producido un error. Inténtalo de nuevo.";
      });
  });
});

// Función para validar el correo electrónico
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
function logout() {
  fetch(`${url}/signout`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("authToken")}`, // Envía el token de autenticación si es necesario
    },
  })
    .then((response) => response.json())
    .then((data) => {
      localStorage.clear(); // Limpia el localStorage
      window.location.href = "/index.html"; // Redirige a la página de inicio de sesión
    })
    .catch((error) => {
      console.error("Error:", error);
      // Maneja el error de la llamada a la API
    });
}

// cambiar contraseña
// Función para abrir el pop-up de olvido de contraseña
function openForgotPasswordPopup() {
  document.getElementById("forgotPasswordPopup").classList.add("active");
}

// Función para cerrar el pop-up de olvido de contraseña
function closeForgotPasswordPopup() {
  document.getElementById("forgotPasswordPopup").classList.remove("active");
}

// Función para manejar el envío de los datos de cambio de contraseña
function submitForgotPassword() {
  const email = document.getElementById("forgot-email").value;
  const verificationCode = document.getElementById("verification-code").value;
  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const errorMessage = document.getElementById("forgot-error-message");
  const successMessage = document.getElementById("success-message");

  // Validación básica
  if (!email || !verificationCode || !newPassword || !confirmPassword) {
    errorMessage.textContent = "Por favor complete todos los campos.";
    return;
  }

  if (newPassword !== confirmPassword) {
    errorMessage.textContent = "Las contraseñas no coinciden.";
    return;
  }

  // Aquí haces la llamada a la API para cambiar la contraseña
  fetch(`${url}/change/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      code: verificationCode,
      password: newPassword,
      confirmPassword,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === true) {
        errorMessage.textContent = ""
        successMessage.textContent = "Se cambio la contraseña con éxito."

        setTimeout(function () {
          closeForgotPasswordPopup();
        }, 1000);
      } else {
        errorMessage.textContent = handleError(data);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      errorMessage.textContent = "Error al cambiar la contraseña.";
    });
}
function handleError(data) {
  // Comprueba si data.errors existe y es un array
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.map((error) => error.msg).join(", ");
  }

  // Si data.message existe y es una cadena
  if (typeof data?.message === "string") {
    return data.message;
  }

  // Mensaje de error genérico si no se pudo determinar el error específico
  return "Error al cambiar la contraseña.";
}
