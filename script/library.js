// 🔁 GitHub에서 JSON 파일 불러오기
async function loadMagazines() {
  const indexUrl = "https://djdog67.github.io/spinning-needle/magazines/index.json";
  const baseUrl = "https://djdog67.github.io/spinning-needle/magazines/";

  const res = await fetch(indexUrl);
  const filenames = await res.json(); // ex: ["001_quadrophenia.json", "002_interview.json", ...]

  const magazines = await Promise.all(
    filenames.map(file =>
      fetch(baseUrl + file).then(res => res.json())
    )
  );

  return magazines;
}

// 카드 랜덤 섞기
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// 카드 생성
function renderCards(data) {
  const container = document.getElementById('card-container');
  container.innerHTML = '';

  const shuffled = shuffle(data);

  shuffled.forEach((mag, idx) => {
    const card = document.createElement('div');
    card.className = 'lib-card';

    card.innerHTML = `
      <img src="${mag.cover || 'assets/img/default.jpg'}" alt="${mag.title}" class="card-img" />
      <h3>${mag.title}</h3>
      <p>by ${mag.curator || 'Unknown'}</p>
      <div class="tags" data-tags="${(mag.tags || []).join(',')}">
        ${(mag.tags || []).map(tag => `<span>${tag}</span>`).join(' ')}
      </div>
    `;

    card.onclick = () => {
      window.location.href = `magazine.html?title=${encodeURIComponent(mag.title)}`;
    };

    container.appendChild(card);
  });
}

// 필터 동작
function filterTag(tag) {
  document.querySelectorAll('.lib-card').forEach(card => {
    const tagData = card.querySelector('.tags')?.dataset.tags || '';
    card.style.display = tagData.includes(tag) ? 'block' : 'none';
  });
}

function resetFilter() {
  document.querySelectorAll('.lib-card').forEach(card => {
    card.style.display = 'block';
  });
}

// 메뉴 열기
function toggleFilter() {
  document.getElementById("filterPanel").classList.toggle("open");
}

// 시작
loadMagazines().then(renderCards);
