import { registerUser } from "./firebase.js";

document
  .getElementById("register-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    registerUser(email, password)
      .then(() => {
        alert("Cadastro bem-sucedido!");
        window.location.href = "login.html";
      })
      .catch((error) => {
        alert("Erro: " + error.message);
      });
  });
