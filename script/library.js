// script/library.js
import { db } from "./firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 카드 랜덤 섞기
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// 카드 그리기
function renderCards(data) {
  const container = document.getElementById('card-container');
  container.innerHTML = '';

  const shuffled = shuffle(data);

  shuffled.forEach(mag => {
    const card = document.createElement('div');
    card.className = 'lib-card';

    card.innerHTML = `
      <img src="${mag.cover || 'assets/img/default.jpg'}" alt="${mag.title}" class="card-img" />
      <h3>${mag.title}</h3>
      <p>by ${mag.curator}</p>
      <div class="tags" data-tags="${mag.tags?.join(',') || ''}">
        ${(mag.tags || []).map(tag => `<span>${tag}</span>`).join(' ')}
      </div>
    `;

    card.onclick = () => {
      // Firebase 문서는 ID 기반으로 이동
      if (mag.id) {
        window.location.href = `magazine.html?id=${mag.id}`;
      }
    };

    container.appendChild(card);
  });
}

// 로컬 초안 불러오기
function getLocalDraft() {
  try {
    const raw = localStorage.getItem("canvasDraft");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      id: "local-draft",
      title: "📝 임시 저장 매거진",
      curator: "나",
      tags: ["Draft"],
      cover: "assets/img/default.jpg"
    };
  } catch (e) {
    return null;
  }
}

// Firebase + Local Draft 불러오기
async function loadData() {
  const snapshot = await getDocs(collection(db, "magazines"));
  const published = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(doc => doc.status === "published");

  const localDraft = getLocalDraft();
  const all = localDraft ? [localDraft, ...published] : published;

  renderCards(all);
}

// 실행
loadData();

// 햄버거 메뉴 토글
function toggleFilter() {
  document.getElementById("filterPanel").classList.toggle("open");
}

// 태그 필터
function filterTag(tag) {
  const cards = document.querySelectorAll('.lib-card');
  cards.forEach(card => {
    const tagData = card.querySelector('.tags')?.dataset.tags || '';
    if (tagData.includes(tag)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// 필터 초기화
function resetFilter() {
  document.querySelectorAll('.lib-card').forEach(card => {
    card.style.display = 'block';
  });
}
