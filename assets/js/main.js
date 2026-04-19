(function () {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  let W,
    H,
    nodes = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const N_NODES = 55;
  const MAX_DIST = 180;

  for (let i = 0; i < N_NODES; i++) {
    nodes.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.2 + 0.3,
      phase: Math.random() * Math.PI * 2,
    });
  }

  let t = 0;
  function draw() {
    t += 0.008;
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < 3; i++) {
      const cx = W * (0.2 + i * 0.3) + Math.sin(t * 0.3 + i) * 80;
      const cy = H * 0.5 + Math.cos(t * 0.2 + i * 1.4) * 60;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 280 + i * 40);
      grad.addColorStop(0, `rgba(255,255,255,0.018)`);
      grad.addColorStop(1, `rgba(0,0,0,0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, 380, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    for (let n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.2 + n.phase);
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * (0.7 + 0.3 * pulse), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.12 + 0.08 * pulse})`;
      ctx.fill();
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.07;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

// Clock
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const clockEl = document.getElementById("clock");
  if (clockEl) clockEl.textContent = `${h}:${m}`;
}
updateClock();
setInterval(updateClock, 10000);

// Engines
const ENGINES = [
  {
    id: "google",
    name: "Google",
    icon: "G",
    url: "https://www.google.com/search?q=",
  },
  {
    id: "duckduckgo",
    name: "DuckDuckGo",
    icon: "⬤",
    url: "https://duckduckgo.com/?q=",
  },
  {
    id: "bing",
    name: "Bing",
    icon: "B",
    url: "https://www.bing.com/search?q=",
  },
  {
    id: "brave",
    name: "Brave",
    icon: "▲",
    url: "https://search.brave.com/search?q=",
  },
  {
    id: "yandex",
    name: "Yandex",
    icon: "Я",
    url: "https://yandex.ru/search/?text=",
  },
];

let currentEngine = localStorage.getItem("engine") || "google";

function getEngine() {
  return ENGINES.find((e) => e.id === currentEngine) || ENGINES[0];
}

function renderEngineBtn() {
  const iconEl = document.getElementById("engine-icon");
  if (iconEl) iconEl.textContent = getEngine().icon;
}

function renderEngineMenu() {
  const menu = document.getElementById("engine-menu");
  if (!menu) return;
  menu.innerHTML = ENGINES.map(
    (e) => `
    <div class="engine-option ${e.id === currentEngine ? "selected" : ""}" data-id="${e.id}">
      <span class="engine-dot"></span>${e.name}
    </div>
  `,
  ).join("");
  menu.querySelectorAll(".engine-option").forEach((el) => {
    el.addEventListener("click", () => {
      currentEngine = el.dataset.id;
      localStorage.setItem("engine", currentEngine);
      renderEngineBtn();
      renderEngineMenu();
      closeEngineMenu();
    });
  });
}

let engineMenuOpen = false;
function openEngineMenu() {
  engineMenuOpen = true;
  document.getElementById("engine-menu").classList.add("visible");
  renderEngineMenu();
}
function closeEngineMenu() {
  engineMenuOpen = false;
  document.getElementById("engine-menu").classList.remove("visible");
}

document.getElementById("engine-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  engineMenuOpen ? closeEngineMenu() : openEngineMenu();
});

document.addEventListener("click", () => {
  closeEngineMenu();
  closeSuggestions();
});

renderEngineBtn();

// Search
function doSearch(q) {
  if (!q.trim()) return;
  if (/^https?:\/\//i.test(q) || /^[a-z0-9-]+\.[a-z]{2,}/i.test(q)) {
    const url = /^https?:\/\//i.test(q) ? q : "https://" + q;
    window.location.href = url;
  } else {
    window.location.href = getEngine().url + encodeURIComponent(q);
  }
}

const searchInput = document.getElementById("search-input");
document.getElementById("search-btn").addEventListener("click", () => doSearch(searchInput.value));
document.getElementById("search-form").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const active = document.querySelector(".suggestion-item.active");
    if (active) doSearch(active.dataset.q);
    else doSearch(searchInput.value);
  }
  if (e.key === "Escape") {
    closeSuggestions();
    searchInput.blur();
  }
  if (e.key === "ArrowDown") navigateSuggestions(1);
  if (e.key === "ArrowUp") navigateSuggestions(-1);
});

// Suggestions
const QUICK = [
  "youtube.com",
  "github.com",
  "wikipedia.org",
  "reddit.com",
  "x.com",
  "figma.com",
  "vercel.com",
  "notion.so",
  "linear.app",
];

function renderSuggestions(val) {
  const box = document.getElementById("suggestions");
  if (!val.trim()) {
    closeSuggestions();
    return;
  }
  const matches = QUICK.filter((q) => q.includes(val.toLowerCase())).slice(0, 4);
  const items = [
    { label: val, icon: "→", q: val },
    ...matches.map((m) => ({ label: m, icon: "⌁", q: m })),
  ].slice(0, 5);
  box.innerHTML = items
    .map(
      (it) =>
        `<div class="suggestion-item" data-q="${it.q}"><span class="icon">${it.icon}</span>${it.label}</div>`,
    )
    .join("");
  box.querySelectorAll(".suggestion-item").forEach((el) => {
    el.addEventListener("mousedown", (e) => {
      e.preventDefault();
      doSearch(el.dataset.q);
    });
  });
  box.classList.add("visible");
}

function closeSuggestions() {
  document.getElementById("suggestions").classList.remove("visible");
  document.querySelectorAll(".suggestion-item").forEach((el) => el.classList.remove("active"));
}

function navigateSuggestions(dir) {
  const items = [...document.querySelectorAll(".suggestion-item")];
  if (!items.length) return;
  const cur = items.findIndex((el) => el.classList.contains("active"));
  items.forEach((el) => el.classList.remove("active"));
  let next = cur + dir;
  if (next < 0) next = items.length - 1;
  if (next >= items.length) next = 0;
  items[next].classList.add("active");
  searchInput.value = items[next].dataset.q;
}

searchInput.addEventListener("input", (e) => renderSuggestions(e.target.value));
searchInput.addEventListener("focus", (e) => {
  if (e.target.value) renderSuggestions(e.target.value);
});
searchInput.addEventListener("click", (e) => e.stopPropagation());

// Tabs
const DEFAULT_TABS = [
  { name: "GitHub", url: "https://github.com", emoji: "⌥" },
  { name: "YouTube", url: "https://youtube.com", emoji: "▶" },
  { name: "Reddit", url: "https://reddit.com", emoji: "◈" },
  { name: "Figma", url: "https://figma.com", emoji: "◇" },
];

let tabs = JSON.parse(localStorage.getItem("tabs") || "null") || DEFAULT_TABS;

function saveTabs() {
  localStorage.setItem("tabs", JSON.stringify(tabs));
}

function getFavicon(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
}

function renderTabs() {
  const grid = document.getElementById("tabs-grid");
  if (!grid) return;
  grid.innerHTML = "";
  tabs.forEach((tab, i) => {
    const favicon = getFavicon(tab.url);
    const card = document.createElement("a");
    card.className = "tab-card";
    card.href = tab.url;
    card.innerHTML = `
      <div class="tab-favicon">
        ${favicon ? `<img src="${favicon}" alt="" onerror="this.parentElement.textContent='${tab.emoji || "○"}'">` : `<span>${tab.emoji || "○"}</span>`}
      </div>
      <span class="tab-name">${tab.name}</span>
      <button class="tab-remove" data-i="${i}" title="Удалить">×</button>
    `;
    card.querySelector(".tab-remove").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      tabs.splice(i, 1);
      saveTabs();
      renderTabs();
    });
    grid.appendChild(card);
  });
}
renderTabs();

// Modal
const overlay = document.getElementById("modal-overlay");
const modalName = document.getElementById("modal-name");
const modalUrl = document.getElementById("modal-url");

document.getElementById("add-tab-btn").addEventListener("click", () => {
  modalName.value = "";
  modalUrl.value = "";
  overlay.classList.add("visible");
  setTimeout(() => modalName.focus(), 50);
});

document
  .getElementById("modal-cancel")
  .addEventListener("click", () => overlay.classList.remove("visible"));
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) overlay.classList.remove("visible");
});

document.getElementById("modal-save").addEventListener("click", () => {
  const name = modalName.value.trim();
  const url = modalUrl.value.trim();
  if (!name || !url) return;
  const fullUrl = /^https?:\/\//i.test(url) ? url : "https://" + url;
  tabs.push({ name, url: fullUrl, emoji: "○" });
  saveTabs();
  renderTabs();
  overlay.classList.remove("visible");
});

document.getElementById("modal").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("modal-save").click();
  if (e.key === "Escape") overlay.classList.remove("visible");
});

// Focus search on type
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
    searchInput.focus();
  }
});
