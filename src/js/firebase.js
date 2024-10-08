// firebase.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCi9URQIfKDzs1CoCaUqRzZoHJ7A0OOxfA",
  authDomain: "travel-site-a23ca.firebaseapp.com",
  projectId: "travel-site-a23ca",
  storageBucket: "travel-site-a23ca.appspot.com",
  messagingSenderId: "766683940274",
  appId: "1:766683940274:web:5ac80a91bde4870d4490ab",
  measurementId: "G-2WJRMR14W0",
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Função de login
export function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Função de cadastro
export function registerUser(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}
