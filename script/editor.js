// 🔧 script/editor.js — 모든 오류 수정 + 드래그 보정 + 텍스트 입력/선택 정비

let canvas = document.getElementById("canvas");
let selectedEl = null;
let copiedElData = null;
let rotationMap = new Map();
let isDragging = false;
let isResizing = false;
let offsetX = 0;
let offsetY = 0;
let resizeHandle = null;
let originalWidth = 0;
let originalHeight = 0;
let startX = 0;
let startY = 0;
let undoStack = [];
let redoStack = [];


function selectElement(el) {
  if (selectedEl && selectedEl !== el) {
    selectedEl.classList.remove("selected");
    removeResizeHandle(selectedEl);
  }
  selectedEl = el;
  el.classList.add("selected");
  updatePropertiesPanel(el);
  addResizeHandle(el);
}


function addShape() {
  saveState();
  const type = document.getElementById("shapeSelect").value;
  const shape = document.createElement("div");
  shape.className = `shape ${type}`;
  shape.style.left = "100px";
  shape.style.top = "100px";
  shape.style.position = "absolute";
  shape.style.width = "100px";
  shape.style.height = "100px";
  shape.setAttribute("tabindex", 0);
  enableInteractions(shape);
  canvas.appendChild(shape);
  selectElement(shape);
  saveState();
}

function addText() {
  const text = document.createElement("div");
  text.className = "text-block";
  text.textContent = "더블클릭하여 텍스트 입력";
  text.contentEditable = true;
  text.style.position = "absolute";
  text.style.left = "100px";
  text.style.top = "100px";
  enableInteractions(text);
  canvas.appendChild(text);
  selectElement(text);
}

function addImage() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.src = event.target.result;
      img.className = "canvas-img";
      img.style.position = "absolute";
      img.style.left = "100px";
      img.style.top = "100px";
      enableInteractions(img);
      canvas.appendChild(img);
      selectElement(img);
      saveState();
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function addVideo() {
  const url = prompt("YouTube URL을 입력하세요:");
  if (!url) return;
  const iframe = document.createElement("iframe");
  iframe.src = url.replace("watch?v=", "embed/");
  iframe.width = "300";
  iframe.height = "169"; // 16:9
  iframe.style.position = "absolute";
  iframe.style.left = "100px";
  iframe.style.top = "100px";
  enableInteractions(iframe);
  canvas.appendChild(iframe);
  selectElement(iframe);
  saveState();
}

const coverInput = document.getElementById("coverUpload");
coverInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    localStorage.setItem("coverImage", event.target.result);
  };
  reader.readAsDataURL(file);
});

function copyElement() {
  if (!selectedEl) return;
  copiedElData = selectedEl.cloneNode(true);
}

function pasteElement() {
  if (!copiedElData) return;
  const clone = copiedElData.cloneNode(true);
  clone.style.left = parseInt(clone.style.left) + 20 + "px";
  clone.style.top = parseInt(clone.style.top) + 20 + "px";
  enableInteractions(clone);
  canvas.appendChild(clone);
  selectElement(clone);
  saveState();
}

const deleteBtn = document.getElementById("btnDelete");
deleteBtn.addEventListener("click", () => {
if (selectedEl) {
  selectedEl.remove();
  selectedEl = null;
  document.getElementById("properties").style.display = "none";
  document.getElementById("noSelection").style.display = "block";
  saveState();  // ✅ 추가
}
});

function enableInteractions(el) {
  el.setAttribute("tabindex", 0);

  // 1️⃣ 더블클릭 시 입력 모드로 진입
  el.addEventListener("dblclick", (e) => {
    if (el.classList.contains("text-block")) {
      el.contentEditable = true;
      el.focus();
      e.stopPropagation();
    }
  });

  // 2️⃣ 드래그 가능하게 하되, 입력 중이면 막지 않음
  el.addEventListener("mousedown", (e) => {
    const isText = el.classList.contains("text-block");

    // 텍스트 드래그 중이면 드래그 금지
    if (isText && !window.getSelection().isCollapsed) return;

    // 텍스트인 경우: 단일 클릭 시 contentEditable 유지 (드래그는 계속 가능)
    if (isText && el.contentEditable) {
      // 단일 클릭인데 입력 중이면 드래그 금지
      // 대신, 블러 처리 없이 두 번째 클릭 시 드래그 허용
      setTimeout(() => {
        el.contentEditable = false;
      }, 0);
    }

    isDragging = true;
    const rect = el.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    selectElement(el);
    e.preventDefault();
  });
}


canvas.addEventListener("mousedown", (e) => {
  if (
    selectedEl &&
    selectedEl.classList.contains("text-block") &&
    e.target !== selectedEl
  ) {
    selectedEl.blur();
    selectedEl.contentEditable = false;
    selectedEl.classList.remove("selected");
    selectedEl = null;
  }
});

function addResizeHandle(el) {
  removeResizeHandle(el);

  el.style.position = "absolute";           // 🔥 필수
  el.style.resize = "none";                // 기존 CSS resize 방지
  el.style.overflow = "visible";           // 핸들이 잘리지 않게
  el.style.zIndex = "1";                   // 기본값 보정
  el.style.boxSizing = "border-box";       // 크기 정확도 향상
  el.style.minWidth = "30px";
  el.style.minHeight = "30px";

  const handle = document.createElement("div");
  handle.className = "resize-handle";
  handle.style.position = "absolute";
  handle.style.right = "0";
  handle.style.bottom = "0";
  handle.style.width = "12px";
  handle.style.height = "12px";
  handle.style.background = "#0ff";
  handle.style.cursor = "se-resize";
  handle.style.zIndex = "10";

  handle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    isResizing = true;
    resizeHandle = handle;
    originalWidth = el.offsetWidth;
    originalHeight = el.offsetHeight;
    startX = e.clientX;
    startY = e.clientY;
  });

  el.appendChild(handle);
}


function removeResizeHandle(el) {
  const existing = el.querySelector(".resize-handle");
  if (existing) existing.remove();
}

document.addEventListener("mousemove", (e) => {
  if (isResizing && selectedEl) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (e.shiftKey) {
      const ratio = originalWidth / originalHeight;
      let newWidth = originalWidth + dx;
      let newHeight = newWidth / ratio;
      selectedEl.style.width = newWidth + "px";
      selectedEl.style.height = newHeight + "px";
    } else {
      selectedEl.style.width = originalWidth + dx + "px";
      selectedEl.style.height = originalHeight + dy + "px";
    }
  } else if (isDragging && selectedEl) {
    const canvasRect = canvas.getBoundingClientRect();
    selectedEl.style.left = (e.clientX - canvasRect.left - offsetX) + "px";
    selectedEl.style.top = (e.clientY - canvasRect.top - offsetY) + "px";
  }
});

document.addEventListener("mouseup", () => {
  if (isResizing && selectedEl) {
    selectedEl.style.width = selectedEl.offsetWidth + "px";
    selectedEl.style.height = selectedEl.offsetHeight + "px";
  }
  isDragging = false;
  isResizing = false;
});

document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  if (e.ctrlKey && !e.shiftKey && key === "z") {
    e.preventDefault();
    undo();
  }

  if (e.ctrlKey && e.shiftKey && key === "z") {
    e.preventDefault();
    redo();
  }

  if (e.ctrlKey && key === "c") copyElement();
  if (e.ctrlKey && key === "v") pasteElement();
  if (key === "delete" && selectedEl) selectedEl.remove();

  if (selectedEl && e.ctrlKey && (key === "arrowleft" || key === "arrowright")) {
    let angle = rotationMap.get(selectedEl) || 0;
    angle += key === "arrowleft" ? -5 : 5;
    selectedEl.style.transform = `rotate(${angle}deg)`;
    rotationMap.set(selectedEl, angle);
  }
});


['bgColor', 'borderColor', 'borderWidth', 'opacityRange', 'gradStart', 'gradEnd'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', applyStyles);
});
function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(canvas.innerHTML);
  const last = undoStack.pop();
  canvas.innerHTML = last;
  restoreInteractions();
}

function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(canvas.innerHTML);
  const last = redoStack.pop();
  canvas.innerHTML = last;
  restoreInteractions();
}

function saveState() {
  undoStack.push(canvas.innerHTML);
  redoStack = []; // 새로운 작업이 들어오면 redo 초기화
}

function restoreInteractions() {
  [...canvas.children].forEach(el => {
    enableInteractions(el);  // 다시 클릭/드래그/선택 기능 적용
  });
}

function applyStyles() {
  if (!selectedEl) return;
  const bg = document.getElementById("bgColor").value;
  const border = document.getElementById("borderColor").value;
  const borderW = document.getElementById("borderWidth").value + "px";
  const opacity = document.getElementById("opacityRange").value / 100;
  const useGrad = document.getElementById("useGradient").checked;
  const gradDir = document.getElementById("gradientDirection").value;
  const gradStart = document.getElementById("gradStart").value;
  const gradEnd = document.getElementById("gradEnd").value;

  if (useGrad) {
    selectedEl.style.background = `linear-gradient(${gradDir}, ${gradStart}, ${gradEnd})`;
  } else {
    selectedEl.style.background = bg;
  }

  selectedEl.style.borderColor = border;
  selectedEl.style.borderStyle = "solid";
  selectedEl.style.borderWidth = borderW;
  selectedEl.style.opacity = opacity;
}

function updatePropertiesPanel(el) {
  const panel = document.getElementById("properties");
  const noSel = document.getElementById("noSelection");
  panel.style.display = "block";
  noSel.style.display = "none";

  document.getElementById("bgColor").value = rgbToHex(getComputedStyle(el).backgroundColor);
  document.getElementById("borderColor").value = rgbToHex(getComputedStyle(el).borderColor);
  document.getElementById("borderWidth").value = parseInt(getComputedStyle(el).borderWidth) || 0;
  document.getElementById("opacityRange").value = parseFloat(getComputedStyle(el).opacity) * 100;
}

function rgbToHex(rgb) {
  if (!rgb || !rgb.startsWith("rgb")) return "#000000";
  const [r, g, b] = rgb.match(/\d+/g);
  return "#" + [r, g, b].map(x => (+x).toString(16).padStart(2, '0')).join("");
}

// 전역 등록
window.addShape = addShape;
window.addText = addText;
window.addImage = addImage;
window.addVideo = addVideo;
window.copyElement = copyElement;
window.pasteElement = pasteElement;
