// script/app.js

function enableFocusMode() {
  document.body.style.backgroundColor = "#000000";
}

function disableFocusMode() {
  document.body.style.backgroundColor = "#0a0a0a";
}
let magazineTitles = [];

// magazines.json에서 타이틀만 미리 불러오기
fetch('data/magazines.json')
  .then(res => res.json())
  .then(data => {
    magazineTitles = data.map(m => m.title);
  });

// 검색창 입력 이벤트
function handleSearch(value) {
  const list = document.getElementById('autocomplete-list');
  list.innerHTML = '';

  if (!value.trim()) {
    list.style.display = 'none';
    return;
  }

  const results = magazineTitles.filter(title =>
    title.toLowerCase().includes(value.toLowerCase())
  );

  if (results.length > 0) {
    list.style.display = 'block';
    results.slice(0, 5).forEach(title => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.textContent = title;
      item.onclick = () => {
        console.log(`선택한 제목: ${title}`);
        list.style.display = 'none';
        document.getElementById('searchInput').value = title;
        // 향후: 상세 페이지 이동도 가능
        // window.location.href = `magazine.html?title=${encodeURIComponent(title)}`
      };
      list.appendChild(item);
    });
  } else {
    list.style.display = 'none';
  }
}

// 포커스 잃었을 때 자동완성 숨기기 (1초 지연)
function hideAutocomplete() {
  setTimeout(() => {
    document.getElementById('autocomplete-list').style.display = 'none';
  }, 200);
}
