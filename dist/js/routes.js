async function loadMenu() {
  try {
    const token = localStorage.getItem("authToken");
    const apiUrl = "https://pripri-production.up.railway.app/api/user";
    const url = "https://pripri-production.up.railway.app/api/login";

    // Realiza una solicitud al backend para obtener las rutas permitidas para este rol
    const response = await fetch(`${apiUrl}/routes/rol`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!result.status) {
      console.error("Error al obtener las rutas:", result.message);
      return;
    }

    const allowedRoutes = result.data;

    // Obtener la URL actual
    const currentPath = window.location.pathname;

    // Verificar si el usuario tiene acceso a la URL actual
    const hasAccess = allowedRoutes.some((route) => route.path === currentPath);

    if (!hasAccess) {
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

      // // Redirigir al usuario a la página de login si no tiene acceso a la URL actual
      // window.location.href = "/index.html";
      // return;
    }

    // Referencia al menú
    const menu = document.querySelector(".sidebar-menu");

    // Eliminar todos los elementos del menú excepto el logout
    const menuItems = menu.querySelectorAll("li:not(:last-child)");
    menuItems.forEach((item) => item.remove());

    // Recorrer las rutas permitidas y crear los elementos del menú
    allowedRoutes.forEach((route) => {
      const li = document.createElement("li");
      const a = document.createElement("a");

      a.href = route.path;
      a.innerHTML = `<i class="fa ${getIcon(route.path)}"></i> <span>${
        route.name
      }</span>`;

      // Verificar si es la ruta actual para añadir la clase active-main
      if (route.path === currentPath) {
        a.classList.add("active-main");
      }

      li.appendChild(a);
      menu.insertBefore(li, menu.lastElementChild); // Insertar antes del logout
    });
  } catch (err) {
    console.error("Error cargando el menú:", err);
  }
}

// Función para obtener el ícono basado en la ruta
function getIcon(path) {
  switch (path) {
    case "/pages/main/home.html":
      return "fa-dashboard";
    case "/pages/main/service.html":
      return "fa-wrench";
    case "/pages/main/client.html":
      return "fa-user";
    case "/pages/main/expense.html":
      return "fa-money";
    case "/pages/main/var.html":
      return "fa-cogs";
    case "/pages/main/report.html":
      return "fa-bar-chart";
    default:
      return "fa-file";
  }
}

// Llamar a la función al cargar la página
loadMenu();
