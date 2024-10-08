import { loginUser } from "./firebase.js";

document
  .getElementById("login-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    loginUser(email, password)
      .then(() => {
        alert("Login bem-sucedido!");
        window.location.href = "index.html";
      })
      .catch((error) => {
        alert("Erro: " + error.message);
      });
  });
