import {
  db,
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  Timestamp
} from './firebase-config.js';

let currentPage = 1;
const pageSize = 15;
let allUsers = [];

// ✅ 메인 진입: DOM 로드 후 실행
window.addEventListener('DOMContentLoaded', async () => {
  const role = localStorage.getItem('userRole');
  const currentUID = localStorage.getItem('userUID');

  if (role !== 'admin') {
    alert('관리자 권한이 없습니다.');
    location.href = 'index.html';
    return;
  }

  // 🔍 닉네임 검색 입력 연결
  document.getElementById("searchInput").addEventListener("input", (e) => {
    currentPage = 1;
    loadUsers(currentUID, e.target.value);
  });

  // 📢 공지 등록 버튼 연결
  document.getElementById("submitNoticeBtn").addEventListener("click", submitNotice);

  // 📊 초기 데이터 로딩
  await countStats();
  await loadUsers(currentUID);
});

// 📊 활동 통계
async function countStats() {
  const usersSnap = await getDocs(collection(db, 'users'));
  const magazinesSnap = await getDocs(collection(db, 'magazines'));

  let curatorCount = 0;
  usersSnap.forEach(doc => {
    if (doc.data().role === 'curator') curatorCount++;
  });

  document.getElementById('userCount').textContent = usersSnap.size;
  document.getElementById('curatorCount').textContent = curatorCount;
  document.getElementById('magazineCount').textContent = magazinesSnap.size;
}

// 👥 유저 목록 불러오기
async function loadUsers(currentUID, keyword = '') {
  const snapshot = await getDocs(collection(db, "users"));
  console.log(`📦 가져온 유저 수: ${snapshot.size}`); // ✅ 이 줄 추가

  const tbody = document.querySelector('#userTable tbody');
  tbody.innerHTML = '';
  allUsers = [];

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const uid = docSnap.id;
    const nickname = (data.nickname || '').toLowerCase();
    const keywordLC = keyword.toLowerCase();

    if (!keyword || nickname.includes(keywordLC)) {
      allUsers.push({ uid, ...data });
    }
  });

  console.log("✅ 필터링된 유저:", allUsers); // ✅ 이 줄도 추가
  renderPage(currentPage);
}


// 📄 유저 테이블 페이지 렌더링
function renderPage(page) {
  const tbody = document.querySelector('#userTable tbody');
  tbody.innerHTML = '';

  if (allUsers.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="4">🙅 유저가 없습니다.</td>`;
    tbody.appendChild(row);
    return;
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const currentUsers = allUsers.slice(start, end);

  currentUsers.forEach(user => {
    const isSelf = localStorage.getItem("userUID") === user.uid;
    const isAdmin = user.role === "admin";

    const roleSelector = isAdmin || isSelf
      ? `<span style="color: gray;">변경 불가</span>`
      : `<select data-id="${user.uid}">
           <option value="reader" ${user.role === 'reader' ? 'selected' : ''}>reader</option>
           <option value="curator" ${user.role === 'curator' ? 'selected' : ''}>curator</option>
         </select>`;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user.nickname || '(닉네임 없음)'}</td>
      <td>${user.email || '(이메일 없음)'}</td>
      <td>${user.role || '(권한 없음)'}</td>
      <td>${roleSelector}</td>
    `;
    tbody.appendChild(row);
  });

  addRoleChangeEvents();
  renderPagination();
}


// 🔁 권한 변경 핸들러
function addRoleChangeEvents() {
  document.querySelectorAll('select[data-id]').forEach(select => {
    select.addEventListener('change', async (e) => {
      const uid = e.target.getAttribute('data-id');
      const newRole = e.target.value;

      try {
        await updateDoc(doc(db, 'users', uid), { role: newRole });
        alert(`✅ 권한이 ${newRole}로 변경되었습니다.`);
        const currentUID = localStorage.getItem('userUID');
        await loadUsers(currentUID);
      } catch (err) {
        console.error('❌ 역할 변경 실패:', err);
        alert('변경 중 오류가 발생했습니다.');
      }
    });
  });
}

// 📢 공지 등록
async function submitNotice() {
  const text = document.getElementById('noticeText').value.trim();
  if (!text) return alert('공지 내용을 입력하세요.');

  try {
    await addDoc(collection(db, 'notices'), {
      content: text,
      createdAt: Timestamp.now()
    });
    alert('공지사항이 등록되었습니다!');
    document.getElementById('noticeText').value = '';
  } catch (e) {
    alert('등록 실패: ' + e.message);
  }
}

// ⏩ 페이지네이션 렌더링
function renderPagination() {
  const totalPages = Math.ceil(allUsers.length / pageSize);
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.disabled = true;
    btn.addEventListener("click", () => {
      currentPage = i;
      renderPage(currentPage);
    });
    pagination.appendChild(btn);
  }
}
