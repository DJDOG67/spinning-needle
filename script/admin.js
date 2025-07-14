// admin.js
import {
  db,
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc
} from './firebase-config.js';

// ✅ 관리자 권한 검사
const role = localStorage.getItem('userRole');
if (role !== 'admin') {
  alert('관리자 권한이 없습니다.');
  location.href = 'index.html';
}

// 📊 활동 통계 집계
async function countStats() {
  const usersSnap = await getDocs(collection(db, 'users'));
  const magazinesSnap = await getDocs(collection(db, 'magazines'));

  const totalUsers = usersSnap.size;
  let curatorCount = 0;
  usersSnap.forEach(doc => {
    if (doc.data().role === 'curator') curatorCount++;
  });

  document.getElementById('userCount').textContent = totalUsers;
  document.getElementById('curatorCount').textContent = curatorCount;
  document.getElementById('magazineCount').textContent = magazinesSnap.size;
}

// 👥 유저 목록 불러오기
async function loadUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  const tbody = document.querySelector('#userTable tbody');
  tbody.innerHTML = '';

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${data.nickname}</td>
      <td>${data.email}</td>
      <td>${data.role}</td>
      <td>
        <select data-id="${docSnap.id}">
          <option value="reader" ${data.role === 'reader' ? 'selected' : ''}>reader</option>
          <option value="curator" ${data.role === 'curator' ? 'selected' : ''}>curator</option>
          <option value="admin" ${data.role === 'admin' ? 'selected' : ''}>admin</option>
        </select>
      </td>
    `;

    tbody.appendChild(row);
  });

  addRoleChangeEvents();
}

// 🔁 권한 변경 핸들러
function addRoleChangeEvents() {
  document.querySelectorAll('select[data-id]').forEach(select => {
    select.addEventListener('change', async (e) => {
      const uid = e.target.getAttribute('data-id');
      const newRole = e.target.value;
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      alert(`권한이 ${newRole}로 변경되었습니다.`);
    });
  });
}

// 📢 공지 등록
async function submitNotice() {
  const text = document.getElementById('noticeText').value.trim();
  if (!text) return alert('공지 내용을 입력하세요.');

  await addDoc(collection(db, 'notices'), {
    content: text,
    createdAt: new Date()
  });

  alert('공지사항이 등록되었습니다!');
  document.getElementById('noticeText').value = '';
}

// 초기 실행
countStats();
loadUsers();
window.submitNotice = submitNotice;
