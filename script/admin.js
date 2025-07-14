import {
  db,
  collection,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  Timestamp
} from './firebase-config.js';

window.addEventListener('DOMContentLoaded', async () => {
  const role = localStorage.getItem('userRole');
  const currentUID = localStorage.getItem('userUID'); // ✨ 추가로 UID 저장 필요

  if (role !== 'admin') {
    alert('관리자 권한이 없습니다.');
    location.href = 'index.html';
    return;
  }

  await countStats();
  await loadUsers(currentUID); // 현재 UID 전달
  window.submitNotice = submitNotice;
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
async function loadUsers(currentUID) {
  const snapshot = await getDocs(collection(db, "users"));
  const tbody = document.querySelector('#userTable tbody');
  tbody.innerHTML = '';

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const uid = docSnap.id;

    const row = document.createElement('tr');

    const isSelf = currentUID === uid;
    const isAdmin = data.role === 'admin';

    // ✨ 권한 변경 UI 제한
    const roleSelector = isAdmin || isSelf ? `
      <span style="color: gray;">변경 불가</span>
    ` : `
      <select data-id="${uid}">
        <option value="reader" ${data.role === 'reader' ? 'selected' : ''}>reader</option>
        <option value="curator" ${data.role === 'curator' ? 'selected' : ''}>curator</option>
      </select>
    `;

    row.innerHTML = `
      <td>${data.nickname}</td>
      <td>${data.email}</td>
      <td>${data.role}</td>
      <td>${roleSelector}</td>
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
