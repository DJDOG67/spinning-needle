// script/editor.js

import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 유튜브 ID 추출 함수 (전역 선언)
function extractYouTubeID(url) {
  const regex = /(?:youtube\.com.*[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

let selectedElement = null;
let historyStack = [];
let redoStack = [];

function addToCanvas(el) {
  document.getElementById("editorContent").appendChild(el);
  historyStack.push(el.outerHTML);
  redoStack = [];
}

window.makeSelectable = function (el) {
  el.classList.add("canvas-object");
  el.setAttribute("draggable", false);
  el.style.position = 'absolute';

  el.addEventListener("mousedown", () => {
    document.querySelectorAll(".canvas-object").forEach(e => e.classList.remove("selected"));
    selectedElement = el;
    el.classList.add("selected");
    updatePropertyPanel(el);
  });

  interact(el)
    .draggable({
      listeners: {
        move(event) {
          const target = event.target;
          const x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx;
          const y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;
          const angle = parseFloat(target.getAttribute("data-rotate")) || 0;
          target.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
          target.setAttribute("data-x", x);
          target.setAttribute("data-y", y);
        }
      }
    })
    .resizable({
      edges: { left: true, right: true, bottom: true, top: true },
      listeners: {
        move(event) {
          const target = event.target;
          let x = parseFloat(target.getAttribute('data-x')) || 0;
          let y = parseFloat(target.getAttribute('data-y')) || 0;
          const angle = parseFloat(target.getAttribute("data-rotate")) || 0;
          target.style.width = `${event.rect.width}px`;
          target.style.height = `${event.rect.height}px`;
          x += event.deltaRect.left;
          y += event.deltaRect.top;
          target.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
          target.setAttribute('data-x', x);
          target.setAttribute('data-y', y);
        }
      },
      modifiers: [
        interact.modifiers.restrictSize({
          min: { width: 20, height: 20 },
          max: { width: 1000, height: 1000 }
        })
      ]
    });
};

function updatePropertyPanel(el) {
  const fill = document.getElementById("fillColor");
  const stroke = document.getElementById("strokeColor");
  const opacity = document.getElementById("opacity");

  if (!fill || !stroke || !opacity) return;

  if (el.tagName.toLowerCase() === "svg") {
    const poly = el.querySelector("polygon");
    if (poly) {
      fill.value = rgbToHex(poly.getAttribute("fill") || "#cccccc");
      stroke.value = rgbToHex(poly.getAttribute("stroke") || "#333333");
    }
  } else {
    const style = window.getComputedStyle(el);
    fill.value = rgbToHex(style.backgroundColor);
    stroke.value = rgbToHex(style.borderColor);
  }
  opacity.value = el.style.opacity || 1;
}

function rgbToHex(rgb) {
  const result = rgb.match(/\d+/g);
  return result ? "#" + result.map(n => (+n).toString(16).padStart(2, "0")).join("") : "#ffffff";
}

function addTextBox() {
  const el = document.createElement("div");
  el.className = "editor-text editable canvas-object";
  el.contentEditable = true;
  el.textContent = "텍스트 입력";
  el.style.left = "100px";
  el.style.top = "100px";
  makeSelectable(el);
  addToCanvas(el);
}
window.addTextBox = addTextBox;

function addImage() {
  const url = prompt("이미지 URL 입력:");
  if (!url) return;
  const el = document.createElement("img");
  el.className = "editor-image canvas-object";
  el.src = url;
  el.style.left = "120px";
  el.style.top = "100px";
  makeSelectable(el);
  addToCanvas(el);
}
window.addImage = addImage;

function addShape(type) {
  let el;
  switch(type) {
    case "line":
      el = document.createElement("div");
      el.className = "shape line";
      el.style.width = "100px";
      el.style.height = "2px";
      el.style.background = "#333";
      break;
    case "rect":
      el = document.createElement("div");
      el.className = "shape rect";
      el.style.width = "80px";
      el.style.height = "60px";
      el.style.background = "#eee";
      break;
    case "circle":
      el = document.createElement("div");
      el.className = "shape circle";
      el.style.width = "60px";
      el.style.height = "60px";
      el.style.borderRadius = "50%";
      el.style.background = "#eee";
      break;
    case "triangle":
      el = document.createElement("div");
      el.className = "shape triangle";
      el.style.width = "0";
      el.style.height = "0";
      el.style.borderLeft = "40px solid transparent";
      el.style.borderRight = "40px solid transparent";
      el.style.borderBottom = "70px solid #eee";
      break;
    default:
      el = document.createElement("div");
      el.className = `shape ${type}`;
  }
  el.style.left = "150px";
  el.style.top = "100px";
  makeSelectable(el);
  addToCanvas(el);
}
window.addShape = addShape;

function addPolygon() {
  const sides = parseInt(prompt("변의 수 (3 이상):"));
  if (isNaN(sides) || sides < 3) {
    alert("3 이상이어야 합니다.");
    return;
  }
  const size = 100;
  const radius = size / 2;
  const centerX = radius;
  const centerY = radius;
  const points = [];
  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.style.position = "absolute";
  svg.style.left = "150px";
  svg.style.top = "100px";
  const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  polygon.setAttribute("points", points.join(" "));
  polygon.setAttribute("fill", "#ccc");
  polygon.setAttribute("stroke", "#333");
  polygon.setAttribute("stroke-width", "2");
  svg.appendChild(polygon);
  svg.classList.add("canvas-object");
  makeSelectable(svg);
  addToCanvas(svg);
}
window.addPolygon = addPolygon;

window.applyCanvasSize = () => {
  const w = parseInt(document.getElementById("canvasWidth").value);
  const h = parseInt(document.getElementById("canvasHeight").value);
  const canvas = document.getElementById("editorContent");
  if (w > 100 && h > 100) {
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  } else {
    alert("너비와 높이는 최소 100px 이상이어야 합니다.");
  }
};

window.addBackgroundMusic = function () {
  const url = prompt("YouTube 영상 URL 입력:");
  if (!url) return;
  const videoId = extractYouTubeID(url);
  if (!videoId) {
    alert("유효한 YouTube URL이 아닙니다.");
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&loop=1&playlist=${videoId}&controls=0`;
  iframe.width = "0";
  iframe.height = "0";
  iframe.allow = "autoplay";
  iframe.style.display = "none";
  iframe.setAttribute("data-type", "bg-music");
  document.getElementById("editorContent").appendChild(iframe);

  const eq = document.createElement("div");
  eq.className = "eq-visualizer";
  eq.innerHTML = `
    <svg width="60" height="40" viewBox="0 0 60 40">
      <rect x="5" y="10" width="10" height="30" fill="#0cf">
        <animate attributeName="height" values="5;30;10;25;5" dur="1s" repeatCount="indefinite" />
      </rect>
      <rect x="20" y="10" width="10" height="30" fill="#0cf">
        <animate attributeName="height" values="30;5;20;10;30" dur="1s" repeatCount="indefinite" />
      </rect>
      <rect x="35" y="10" width="10" height="30" fill="#0cf">
        <animate attributeName="height" values="10;25;5;30;10" dur="1s" repeatCount="indefinite" />
      </rect>
      <rect x="50" y="10" width="10" height="30" fill="#0cf">
        <animate attributeName="height" values="20;5;30;10;25" dur="1s" repeatCount="indefinite" />
      </rect>
    </svg>`;
  eq.style.position = "absolute";
  eq.style.bottom = "10px";
  eq.style.right = "10px";
  eq.style.zIndex = "9999";

  document.body.appendChild(eq);
};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnText")?.addEventListener("click", addTextBox);
  document.getElementById("btnUpload")?.addEventListener("click", () => document.getElementById("imgUpload")?.click());
  document.getElementById("btnLine")?.addEventListener("click", () => addShape("line"));
  document.getElementById("btnRect")?.addEventListener("click", () => addShape("rect"));
  document.getElementById("btnCircle")?.addEventListener("click", () => addShape("circle"));
  document.getElementById("btnTriangle")?.addEventListener("click", () => addShape("triangle"));
  document.getElementById("btnPolygon")?.addEventListener("click", addPolygon);
  document.getElementById("canvasWidth")?.addEventListener("change", applyCanvasSize);
  document.getElementById("canvasHeight")?.addEventListener("change", applyCanvasSize);

  const fillColor = document.getElementById("fillColor");
  const strokeColor = document.getElementById("strokeColor");
  const opacity = document.getElementById("opacity");

  fillColor?.addEventListener("input", (e) => {
    const el = document.querySelector(".selected");
    if (!el) return;
    if (el.tagName.toLowerCase() === "svg") {
      const poly = el.querySelector("polygon");
      if (poly) poly.setAttribute("fill", e.target.value);
    } else {
      el.style.backgroundColor = e.target.value;
    }
  });

  strokeColor?.addEventListener("input", (e) => {
    const el = document.querySelector(".selected");
    if (!el) return;
    if (el.tagName.toLowerCase() === "svg") {
      const poly = el.querySelector("polygon");
      if (poly) poly.setAttribute("stroke", e.target.value);
    } else {
      el.style.border = `2px solid ${e.target.value}`;
    }
  });

  opacity?.addEventListener("input", (e) => {
    const el = document.querySelector(".selected");
    if (el) el.style.opacity = e.target.value;
  });

  // 배경음악 버튼 이벤트
  document.getElementById("btnMusic")?.addEventListener("click", () => {
    const url = prompt("유튜브 영상 URL을 입력하세요:");
    if (!url) return;

    const videoId = extractYouTubeID(url);
    if (!videoId) return alert("올바른 유튜브 링크가 아닙니다.");

    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}`;
    iframe.width = "320";
    iframe.height = "180";
    iframe.style.position = "absolute";
    iframe.style.left = "50px";
    iframe.style.top = "50px";
    iframe.style.zIndex = "0";
    iframe.classList.add("canvas-object");

    makeSelectable(iframe);
    addToCanvas(iframe);
  });

  // 캔버스 배경색 이벤트
  const canvasBgColorInput = document.getElementById("canvasBgColor");
  const canvas = document.getElementById("editorContent");
  if (canvasBgColorInput && canvas) {
    canvasBgColorInput.addEventListener("input", (e) => {
      canvas.style.backgroundColor = e.target.value;
    });
  }
});

// 회전 기능
document.addEventListener("keydown", (e) => {
  if (!selectedElement || !e.ctrlKey) return;
  let angle = parseFloat(selectedElement.getAttribute("data-rotate")) || 0;
  if (e.key === "ArrowLeft") angle -= 5;
  if (e.key === "ArrowRight") angle += 5;
  selectedElement.setAttribute("data-rotate", angle);
  const x = parseFloat(selectedElement.getAttribute("data-x")) || 0;
  const y = parseFloat(selectedElement.getAttribute("data-y")) || 0;
  selectedElement.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
  e.preventDefault();
});