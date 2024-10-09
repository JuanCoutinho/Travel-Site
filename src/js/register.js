import { registerUser } from "./firebase.js";

document
  .getElementById("register-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    registerUser(email, password)
      .then(() => {
        showNotification("Cadastro bem-sucedido!", "success");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000); 
      })
      .catch((error) => {
        showNotification("Erro: " + error.message, "error");
      });
  });

  // mudei o alert lucão

function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;


  document.body.prepend(notification);

  // Fade-in
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
  });

  
  setTimeout(() => {
    // Fade-out
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 500); 
  }, 3000);
}