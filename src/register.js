const firebaseConfig = {
  apiKey: "AIzaSyCi9URQIfKDzs1CoCaUqRzZoHJ7A0OOxfA",
  authDomain: "travel-site-a23ca.firebaseapp.com",
  projectId: "travel-site-a23ca",
  storageBucket: "travel-site-a23ca.appspot.com",
  messagingSenderId: "766683940274",
  appId: "1:766683940274:web:5ac80a91bde4870d4490ab",
  measurementId: "G-2WJRMR14W0",
};

firebase.initializeApp(firebaseConfig);

document
  .getElementById("login-form")
  ?.addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        alert("Login bem-sucedido!");
        window.location.href = "index.html";
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        alert("Erro: " + errorMessage);
      });
  });

document
  .getElementById("register-form")
  ?.addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        alert("Cadastro bem-sucedido!");
        window.location.href = "login.html";
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        alert("Erro: " + errorMessage);
      });
  });
