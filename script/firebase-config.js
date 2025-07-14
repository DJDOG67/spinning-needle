// script/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 🔐 Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyDoHzGz-LwC4LepI6bd5dywKifmttdWNqw",
  authDomain: "auth-fd684.firebaseapp.com",
  projectId: "auth-fd684",
  storageBucket: "auth-fd684.firebasestorage.app",
  messagingSenderId: "45987500753",
  appId: "1:45987500753:web:6b357d231d30089b602bf0",
  measurementId: "G-GKG8L23FTP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

export { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, doc, setDoc, getDoc };

export async function firebaseLogout() {
  await firebase.auth().signOut(); // 또는 signOut(auth);
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("userRole");
  localStorage.removeItem("profileURL");
  location.reload();
}

window.auth = auth;
window.db = db;