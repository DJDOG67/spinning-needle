function isValidPassword(pw) {
  // 8자 이상 + 대문자 + 소문자 + 숫자 + 특수문자 (영문 이외 문자 ❌)
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=\[\]{};':"\\|,.<>/?-])[A-Za-z\d!@#$%^&*()_+=\[\]{};':"\\|,.<>/?-]{8,}$/;
  return pattern.test(pw);
}

// login-debug.js (로그 추적 전용 버전)
let isSignupMode = false;

// ✅ Firebase 객체 선언
const auth = firebase.auth();
const db = firebase.firestore();

// 모드 토글
export function toggleAuthMode() {
  isSignupMode = !isSignupMode;
  const title = document.getElementById("modalTitle");
  if (title) title.textContent = isSignupMode ? "회원가입" : "로그인";
  console.log("🌀 Auth 모드 변경됨:", isSignupMode ? "회원가입" : "로그인");
}

// 회원가입
export async function firebaseSignup(email, password) {
  console.log("🚀 회원가입 시도:", email);

  // 🔐 비밀번호 유효성 검사
  if (!email.includes("@") || !isValidPassword(password)) {
    alert("비밀번호는 8자 이상, 영문 대소문자, 숫자, 특수문자를 포함해야 합니다.");
    return;
  }

  try {
    const userCred = await auth.createUserWithEmailAndPassword(email, password);
    console.log("✅ Firebase 회원 생성됨:", userCred.user.uid);

    const nickname = email.split("@")[0];
    await db.doc("users/" + userCred.user.uid).set({
      nickname,
      role: "reader",
      email
    });

    console.log("📝 Firestore 사용자 정보 저장 완료");

    await userCred.user.sendEmailVerification();
    await auth.signOut(); // 🔒 인증 전 로그아웃
    alert("회원가입 성공! 인증 이메일이 전송되었습니다.\n이메일 인증 후 다시 로그인해 주세요.");
  } catch (e) {
    console.error("❌ 회원가입 실패:", e);
    alert("회원가입 실패: " + e.message);
  }
}

// 로그인
export async function firebaseLogin(email, password) {
  console.log("🔐 로그인 시도:", email);

  try {
    const userCred = await auth.signInWithEmailAndPassword(email, password);


    

    console.log("✅ 로그인 성공:", userCred.user.uid);

    const docSnap = await db.doc("users/" + userCred.user.uid).get();
    const nickname = docSnap.data().nickname;
    const role = docSnap.data().role;

    localStorage.setItem("loggedInUser", nickname);
    localStorage.setItem("userRole", role);
    localStorage.setItem("userUID", userCred.user.uid);

    location.reload();
  } catch (e) {
    console.error("❌ 로그인 실패:", e);
    alert("로그인 실패: " + e.message);
  }
}


// 로그아웃
export async function firebaseLogout() {
  try {
    await auth.signOut();
    console.log("🔓 로그아웃 성공!");
    localStorage.clear();
    location.reload();
  } catch (e) {
    console.error("❌ 로그아웃 실패:", e);
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
  const user = auth.currentUser;
  if (!user) return alert("먼저 로그인하세요.");

  try {
    await user.sendEmailVerification();
    alert("인증 메일이 재발송되었습니다.");
  } catch (e) {
    console.error("❌ 이메일 재전송 실패:", e);
    alert("재발송 실패: " + e.message);
  }
}

// 로그인 후 UI 렌더링
window.addEventListener("DOMContentLoaded", () => {
  console.log("📦 DOMContentLoaded 트리거됨");

  const nickname = localStorage.getItem("loggedInUser");
  const role = localStorage.getItem("userRole");
  const img = localStorage.getItem("profileURL");

  console.log("🧩 로컬스토리지 상태:", { nickname, role, img });

  const authButtons = document.getElementById("authButtons");
  const userProfile = document.getElementById("userProfile");
  const nicknameSpan = document.getElementById("userNickname");
  const profileImg = document.querySelector(".profile-img");
  const userMenu = document.getElementById("userMenu");
  const profileSection = document.getElementById("profileSection");
  const writeBtn = document.getElementById("writeBtn");

  if (nickname) {
    authButtons?.classList.add("hidden");
    userProfile?.classList.remove("hidden");
    if (nicknameSpan) nicknameSpan.textContent = nickname;
    if (img && profileImg) profileImg.src = img;
    profileSection?.classList.remove("hidden");

    let menu = `<a href="#">🏠 나의 창고</a>`;
    if (role === "curator") {
      menu += `<a href="editor-canvas.html">✍️ 매거진 쓰기</a><a href="#">📚 내 매거진</a>`;
    } else if (role === "admin") {
      menu += `<a href="editor-canvas.html">✍️ 매거진 쓰기</a><a href="admin.html">👥 유저 관리</a>`;
    }
    menu += `<a href="#" onclick="firebaseLogout()">🚪 로그아웃</a>`;
    if (userMenu) userMenu.innerHTML = menu;

    if (writeBtn)
      writeBtn.style.display = (role === "curator" || role === "admin") ? "block" : "none";

  } else {
    authButtons?.classList.remove("hidden");
    userProfile?.classList.add("hidden");
    profileSection?.classList.add("hidden");
    if (writeBtn) writeBtn.style.display = "none";
  }
});

// 폼 처리
export function handleAuth(event) {
  console.log("🟢 handleAuth() 호출됨");
  event.preventDefault?.();

  const email = document.getElementById("authUsername")?.value.trim();
  const password = document.getElementById("authPassword")?.value;

  if (!email || !password) {
    alert("이메일과 비밀번호를 입력하세요.");
    return;
  }

  if (isSignupMode) {
    firebaseSignup(email, password);
  } else {
    firebaseLogin(email, password);
  }
}