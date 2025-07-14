// script/magazine.js
import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const container = document.getElementById("magazineContent");

async function loadMagazine() {
  if (!id) {
    return showError("매거진 ID가 없습니다.");
  }

  const ref = doc(db, "magazines", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return showError("매거진을 찾을 수 없습니다.");
  }

  const data = snap.data();
  render(data);
}

function render(data) {
container.innerHTML = `
  <div class="magazine-detail">
    <!-- 커버 + 메타 정보 -->
    <div class="magazine-header">
      <img src="${data.cover || 'assets/img/default.jpg'}" alt="${data.title}" class="card-img" />
      <div class="meta">
        <h1>${data.title || '무제'}</h1>
        <p class="curator">by <strong>${data.curator || 'Unknown'}</strong></p>
        <div class="tags">
          ${(data.tags || []).map(tag => `<span class="tag">${tag}</span>`).join(' ')}
        </div>
      </div>
    </div>

    <hr style="border: 0; border-top: 1px solid #333; margin: 2rem 0;" />

    <!-- 본문 -->
    <div class="canvas-render">
      ${data.content || '<p style="color: gray;">콘텐츠가 준비 중입니다.</p>'}
    </div>
  </div>
`;
}

function showError(msg) {
  container.innerHTML = `
    <div style="
      text-align: center;
      padding: 3rem;
      color: #ff0055;
      font-family: 'Space Grotesk', sans-serif;
    ">
      <h2>⚠️ 오류</h2>
      <p>${msg}</p>
      <a href="library.html" class="btn-mini" style="margin-top: 1rem; display: inline-block;">← 도서관으로 돌아가기</a>
    </div>
  `;
}


loadMagazine();
