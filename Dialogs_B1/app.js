/* ── CATEGORIES ── */
const CATEGORIES = [
  { id: 'all',        label: '🗂 Все' },
  { id: 'discussion', label: '💬 Дискуссии' },
  { id: 'services',   label: '🏛 Сервисы' },
  { id: 'shopping',   label: '🛍 Покупки' },
  { id: 'transport',  label: '🚗 Транспорт' },
  { id: 'health',     label: '🏥 Здоровье' },
  { id: 'leisure',    label: '🎭 Досуг' },
  { id: 'work',       label: '💼 Работа' },
  { id: 'home',       label: '🏠 Дом и быт' },
];

let activeCategory = 'all';
let allCards = [];

/* ── CARD RENDERING ── */
function makeExpandBtn(label, isCriteria) {
  return `<button class="expand-btn${isCriteria ? ' criteria-btn' : ''}">
    <span>${label}</span><span class="arrow">▾</span>
  </button>`;
}

function makeExpandContent(items, isCriteria) {
  return `<ul class="expand-content${isCriteria ? ' criteria-content' : ''}">
    ${items.map(a => `<li>${a}</li>`).join('')}
  </ul>`;
}

function applyFilter(category) {
  activeCategory = category;

  // update buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === category);
  });

  // close all open cards first
  allCards.forEach(({ card }) => card.classList.remove('open'));

  // show/hide cards
  let visible = 0;
  allCards.forEach(({ card, taskCategory }) => {
    const show = category === 'all' || taskCategory === category;
    card.classList.toggle('hidden', !show);
    if (show) visible++;
  });

  // empty state
  const grid = document.getElementById('grid');
  const existing = grid.querySelector('.empty-state');
  if (existing) existing.remove();
  if (visible === 0) {
    const el = document.createElement('div');
    el.className = 'empty-state';
    el.textContent = 'Нет диалогов в этой категории';
    grid.appendChild(el);
  }

  // scroll to top of grid
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildFilters() {
  const container = document.getElementById('filter-inner');
  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (cat.id === 'all' ? ' active' : '');
    btn.dataset.cat = cat.id;
    btn.textContent = cat.label;
    btn.addEventListener('click', () => applyFilter(cat.id));
    container.appendChild(btn);
  });
}

function buildCards(tasks) {
  const grid = document.getElementById('grid');
  const badge = document.querySelector('.badge-blue');
  if (badge) badge.textContent = tasks.length + ' тем';

  tasks.forEach((t, i) => {
    const num = i + 1;
    const id = 'dialog-' + num;

    const card = document.createElement('div');
    card.className = 'card';
    card.id = id;
    card.dataset.category = t.category || 'discussion';
    card.style.setProperty('--card-accent', t.accent);
    card.style.setProperty('--card-icon-bg', t.iconBg);

    card.innerHTML = `
      <div class="card-top">
        <span class="card-num">${num}</span>
        <div class="card-icon">${t.emoji}</div>
        <div class="card-title-block">
          <div class="card-title">${t.topic}</div>
          <div class="card-hint">${t.titleRu}</div>
        </div>
        <div class="card-toggle">+</div>
      </div>
      <div class="card-body">
        <div class="divider"></div>
        <div class="roles-split">
          <div class="role-block role-block-a">
            <div class="role-block-label">Ρόλος Α</div>
            <div class="role-block-text">${t.roleA}</div>
          </div>
          <div class="role-block role-block-b">
            <div class="role-block-label">Ρόλος Β</div>
            <div class="role-block-text">${t.roleB}</div>
          </div>
          <div class="hints-block hints-a">
            ${makeExpandBtn('Критерии выполнения А', true)}
            ${makeExpandContent(t.criteriaA, true)}
            ${makeExpandBtn('Аргументы для роли А', false)}
            ${makeExpandContent(t.argsA, false)}
          </div>
          <div class="hints-block hints-b">
            ${makeExpandBtn('Критерии выполнения Б', true)}
            ${makeExpandContent(t.criteriaB, true)}
            ${makeExpandBtn('Аргументы для роли Б', false)}
            ${makeExpandContent(t.argsB, false)}
          </div>
        </div>
      </div>
    `;

    card.querySelector('.card-top').addEventListener('click', () => {
      const isOpen = card.classList.contains('open');
      grid.querySelectorAll('.card').forEach(c => c.classList.remove('open'));
      if (!isOpen) card.classList.add('open');
    });

    card.querySelectorAll('.expand-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const content = btn.nextElementSibling;
        btn.classList.toggle('open');
        content.classList.toggle('open');
      });
    });

    grid.appendChild(card);
    allCards.push({ card, taskCategory: t.category || 'discussion' });
  });
}

/* ── LOAD TASKS ── */
fetch('tasks.json')
  .then(r => r.json())
  .then(tasks => {
    buildFilters();
    buildCards(tasks);
  })
  .catch(err => {
    document.getElementById('grid').innerHTML =
      '<p style="color:var(--muted);padding:20px">Ошибка загрузки заданий: ' + err.message + '</p>';
  });

/* ── BACK TO TOP ── */
const backToTop = document.getElementById('back-to-top');
if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  });
}

/* ── TRANSLATION ON SELECTION ── */
let popup, popupContent;
let translateTimer = null;
let lastText = '';
let mouseX = 0, mouseY = 0;

document.addEventListener('DOMContentLoaded', () => {
  popup = document.getElementById('translate-popup');
  popupContent = document.getElementById('tpop-content');
});

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

document.addEventListener('mouseup', (e) => {
  if (!popup || popup.contains(e.target)) return;
  setTimeout(() => {
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : '';
    if (!text || text.length < 2) { hidePopup(); return; }
    if (text === lastText && popup.style.display === 'block') return;
    showPopup(mouseX, mouseY, text);
  }, 10);
});

document.addEventListener('mousedown', (e) => {
  if (!popup || popup.contains(e.target)) return;
  hidePopup();
});

function showPopup(x, y, text) {
  if (!popup || !popupContent) return;
  lastText = text;
  popupContent.innerHTML = '<span class="tpop-loader">переводим...</span>';
  popup.style.display = 'block';
  popup.style.position = 'fixed';
  popup.style.transform = 'none';
  const popW = 280, popH = 72, margin = 12;
  let left = Math.max(margin, Math.min(x - popW / 2, window.innerWidth - popW - margin));
  let top = y > popH + margin ? y - popH - margin : y + margin + 20;
  popup.style.left = left + 'px';
  popup.style.top = top + 'px';
  clearTimeout(translateTimer);
  translateTimer = setTimeout(() => doTranslate(text), 400);
}

function hidePopup() {
  if (!popup) return;
  popup.style.display = 'none';
  lastText = '';
  clearTimeout(translateTimer);
}

async function doTranslate(text) {
  if (!popupContent) return;
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=el|ru`;
    const res = await fetch(url);
    const data = await res.json();
    const t = data?.responseData?.translatedText;
    popupContent.textContent = (t && t !== text) ? t : '—';
  } catch {
    popupContent.textContent = 'Ошибка перевода';
  }
}
