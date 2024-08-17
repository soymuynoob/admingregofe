// token.custom.js

function getToken() {
  return localStorage.getItem("authToken");
}

function setToken(token) {
  localStorage.setItem("authToken", token);
}

module.exports = { getToken, setToken };
