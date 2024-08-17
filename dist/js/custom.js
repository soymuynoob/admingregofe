function checkAuthToken() {
    const authToken = localStorage.getItem("authToken");
  
    if (!authToken) {
        // Si no hay token, redirige a la página de inicio de sesión
        window.location.href = "/index.html";
    }
  }
  checkAuthToken()
document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    document.getElementById("name-user").textContent = user.userName + " " + user.userLastName;


});
