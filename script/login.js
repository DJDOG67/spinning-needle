let isSignupMode = false;

// 모드 토글
export function toggleAuthMode() {
  isSignupMode = !isSignupMode;
  const title = document.getElementById("modalTitle");
  if (title) title.textContent = isSignupMode ? "회원가입" : "로그인";
}

// 회원가입
export async function firebaseSignup(email, password) {
  try {
    const userCred = await firebase.auth().createUserWithEmailAndPassword(email, password);
    const nickname = email.split("@")[0];
    await firebase.firestore().doc("users/" + userCred.user.uid).set({
      nickname,
      role: "reader",
      email
    });
    await userCred.user.sendEmailVerification();
    alert("회원가입 성공! 인증 이메일이 전송되었습니다.");
  } catch (e) {
    alert("회원가입 실패: " + e.message);
  }
}

// 로그인
export async function firebaseLogin(email, password) {
  try {
    const userCred = await firebase.auth().signInWithEmailAndPassword(email, password);
    const docSnap = await firebase.firestore().doc("users/" + userCred.user.uid).get();
    const nickname = docSnap.data().nickname;
    const role = docSnap.data().role;
    localStorage.setItem("loggedInUser", nickname);
    localStorage.setItem("userRole", role);
    location.reload();
  } catch (e) {
    alert("로그인 실패: " + e.message);
  }
}

//로그아웃
export async function firebaseLogout() {
  try {
    await signOut(auth);
    console.log("🔓 로그아웃 성공!");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userRole");
    localStorage.removeItem("profileURL");
    location.reload();
  } catch (e) {
    console.error("❌ 로그아웃 실패:", e.message);
    alert("로그아웃 중 오류가 발생했습니다: " + e.message);
  }
}

// 프로필 이미지 저장
export function saveProfileLocally() {
  const file = document.getElementById('profileImageInput').files[0];
  if (!file) return alert("이미지를 선택하세요.");
  const reader = new FileReader();
  reader.onload = function (e) {
    localStorage.setItem('profileURL', e.target.result);
    alert("프로필 이미지가 저장되었습니다!");
    location.reload();
  };
  reader.readAsDataURL(file);
}

// 인증 이메일 재전송
export async function resendVerificationEmail() {
  const user = firebase.auth().currentUser;
  if (!user) return alert("먼저 로그인하세요.");
  try {
    await user.sendEmailVerification();
    alert("인증 메일이 재발송되었습니다.");
  } catch (e) {
    alert("재발송 실패: " + e.message);
  }
}

// 로그인 후 UI 업데이트
window.addEventListener("DOMContentLoaded", () => {
  const nickname = localStorage.getItem("loggedInUser");
  const role = localStorage.getItem("userRole");
  const img = localStorage.getItem("profileURL");

  const authButtons = document.getElementById("authButtons");
  const userProfile = document.getElementById("userProfile");
  const nicknameSpan = document.getElementById("userNickname");
  const profileImg = document.querySelector(".profile-img");
  const userMenu = document.getElementById("userMenu");
  const profileSection = document.getElementById("profileSection");

  if (nickname) {
    if (authButtons) authButtons.classList.add("hidden");
    if (userProfile) userProfile.classList.remove("hidden");
    if (nicknameSpan) nicknameSpan.textContent = nickname;
    if (img && profileImg) profileImg.src = img;
    if (profileSection) profileSection.classList.remove("hidden");

    let menu = `<a href="#">🏠 나의 창고</a>`;
    if (role === "curator") {
      menu += `<a href="editor-canvas.html">✍️ 매거진 쓰기</a><a href="#">📚 내 매거진</a>`;
    } else if (role === "admin") {
      menu += `<a href="editor-canvas.html">✍️ 매거진 쓰기</a><a href="admin.html">👥 유저 관리</a>`;
    }
    menu += `<a href="#" onclick="firebaseLogout()">🚪 로그아웃</a>`;
    if (userMenu) userMenu.innerHTML = menu;
  } else {
    if (authButtons) authButtons.classList.remove("hidden");
    if (userProfile) userProfile.classList.add("hidden");
    if (profileSection) profileSection.classList.add("hidden");
  }
});

// 폼 처리
export function handleAuth(event) {
  event.preventDefault();
  const email = document.getElementById("authUsername").value.trim();
  const password = document.getElementById("authPassword").value;
  if (isSignupMode) {
    firebaseSignup(email, password);
  } else {
    firebaseLogin(email, password);
  }
}

// login.js 안에 다음 함수 추가
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

