// ✅ script/init.js
console.log("✅ init.js loaded");
import {
  showLogin,
  showSignup,
  toggleAuthMode,
  handleAuth,
  firebaseLogout,
  resendVerificationEmail,
  saveProfileLocally
} from './login.js';

// 👇 전역 등록
window.showLogin = showLogin;
window.showSignup = showSignup;
window.toggleAuthMode = toggleAuthMode;
window.handleAuth = handleAuth;
window.firebaseLogout = firebaseLogout;
window.resendVerificationEmail = resendVerificationEmail;
window.saveProfileLocally = saveProfileLocally;

// 👇 DOM 바인딩은 여기서만
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginBtn")?.addEventListener("click", showLogin);
  document.getElementById("signupBtn")?.addEventListener("click", showSignup);
});
