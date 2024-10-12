import { loginUser } from "./firebase.js";

document
  .getElementById("login-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    loginUser(email, password)
      .then(() => {
        showNotification("Login bem-sucedido!", "success");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 2000); 
      })
      .catch((error) => {
        showNotification("Erro: " + error.message, "error");
      });
  });

function showNotification(message, type) {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.style.opacity = 1;

  setTimeout(() => {
    notification.style.opacity = 0;
  }, 3000); 
}