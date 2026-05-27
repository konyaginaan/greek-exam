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
let activeLevel = 'b1';
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
  randomQueue = [];
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === category);
  });
  renderCards();
}

function applyLevel(level) {
  activeLevel = level;
  randomQueue = [];
  document.querySelectorAll('.level-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.level === level);
  });
  // reset category filter when switching level
  activeCategory = 'all';
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === 'all');
  });
  renderCards();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCards() {
  // close all open cards
  allCards.forEach(({ card }) => card.classList.remove('open'));

  let visible = 0;
  allCards.forEach(({ card, taskCategory, taskLevel }) => {
    const levelMatch = taskLevel === activeLevel;
    const catMatch = activeCategory === 'all' || taskCategory === activeCategory;
    const show = levelMatch && catMatch;
    card.classList.toggle('hidden', !show);
    if (show) visible++;
  });

  const grid = document.getElementById('grid');
  const existing = grid.querySelector('.empty-state');
  if (existing) existing.remove();
  if (visible === 0) {
    const el = document.createElement('div');
    el.className = 'empty-state';
    el.textContent = 'Нет диалогов в этой категории';
    grid.appendChild(el);
  }
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

  // update level counts
  const b1count = tasks.filter(t => t.level === 'b1').length;
  const a2count = tasks.filter(t => t.level === 'a2').length;
  const countB1 = document.getElementById('count-b1');
  const countA2 = document.getElementById('count-a2');
  if (countB1) countB1.textContent = b1count + ' диалогов';
  if (countA2) countA2.textContent = a2count ? a2count + ' диалогов' : 'скоро';

  // level button listeners
  document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => applyLevel(btn.dataset.level));
  });

  const levelCounters = {};
  tasks.forEach((t, i) => {
    const lvl = t.level || 'b1';
    levelCounters[lvl] = (levelCounters[lvl] || 0) + 1;
    const num = levelCounters[lvl];
    const id = 'dialog-' + lvl + '-' + num;

    const card = document.createElement('div');
    card.className = 'card';
    card.id = id;
    card.dataset.category = t.category || 'discussion';
    card.dataset.level = t.level || 'b1';
    // hide a2 cards by default
    if ((t.level || 'b1') !== activeLevel) card.classList.add('hidden');
    card.style.setProperty('--card-accent', t.accent);
    card.style.setProperty('--card-icon-bg', t.iconBg);

    card.innerHTML = `
      <div class="card-top">
        ${t.year
          ? `<div class="card-number"><span class="num">${num}</span><span class="year">${t.year}</span></div>`
          : `<span class="card-num">${num}</span>`
        }
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
            ${makeExpandBtn('Подсказки для роли А', false)}
            ${makeExpandContent(t.argsA, false)}
          </div>
          <div class="hints-block hints-b">
            ${makeExpandBtn('Критерии выполнения Б', true)}
            ${makeExpandContent(t.criteriaB, true)}
            ${makeExpandBtn('Подсказки для роли Б', false)}
            ${makeExpandContent(t.argsB, false)}
          </div>
        </div>
      </div>
    `;

    card.querySelector('.card-top').addEventListener('click', () => {
      const isOpen = card.classList.contains('open');
      grid.querySelectorAll('.card').forEach(c => c.classList.remove('open'));
      if (!isOpen) {
        card.classList.add('open');
        if (window.innerWidth <= 680) {
          setTimeout(() => {
            card.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 20);
        }
      }
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
    allCards.push({ card, taskCategory: t.category || 'discussion', taskLevel: t.level || 'b1', taskData: t });
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

/* ── RANDOM DIALOG ── */
let randomQueue = [];

function getRandomPool() {
  return allCards.filter(({ taskLevel, taskCategory }) => {
    const levelMatch = taskLevel === activeLevel;
    const catMatch = activeCategory === 'all' || taskCategory === activeCategory;
    return levelMatch && catMatch;
  });
}

function pickRandom() {
  const pool = getRandomPool();
  if (!pool.length) return null;

  // refill queue if empty or pool changed
  if (!randomQueue.length) {
    randomQueue = pool.map(item => item.card.id);
    // shuffle
    for (let i = randomQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [randomQueue[i], randomQueue[j]] = [randomQueue[j], randomQueue[i]];
    }
  }

  const id = randomQueue.pop();
  return pool.find(item => item.card.id === id) || pool[0];
}

function openRandomModal(item) {
  if (!item) return;
  const card = item.card;
  const t = item.taskData;
  if (!t) return;

  document.getElementById('rmodal-num').textContent = card.querySelector('.card-num, .num')?.textContent || '';
  document.getElementById('rmodal-icon').textContent = t.emoji;
  document.getElementById('rmodal-icon').style.background = t.iconBg || 'var(--surface2)';
  document.getElementById('rmodal-title').textContent = t.topic;
  document.getElementById('rmodal-hint').textContent = t.titleRu;

  const roles = document.getElementById('rmodal-roles');
  roles.innerHTML = `
    <div class="role-block role-block-a" style="--card-accent:${t.accent}">
      <div class="role-block-label">Ρόλος Α</div>
      <div class="role-block-text">${t.roleA}</div>
    </div>
    <div class="role-block role-block-b" style="--card-accent:${t.accent}">
      <div class="role-block-label">Ρόλος Β</div>
      <div class="role-block-text">${t.roleB}</div>
    </div>
  `;

  document.getElementById('random-modal').style.display = 'flex';
}

/* ── RANDOM DIALOG INIT ── */
(function initRandom() {
  const randomBtn = document.getElementById('random-btn');
  const modal = document.getElementById('random-modal');
  const closeBtn = document.getElementById('rmodal-close');
  const refreshBtn = document.getElementById('rmodal-refresh');

  if (randomBtn) {
    randomBtn.addEventListener('click', () => openRandomModal(pickRandom()));
  }

  if (closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
  if (refreshBtn) refreshBtn.addEventListener('click', () => openRandomModal(pickRandom()));

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
      modal.style.display = 'none';
    }
  });
})();

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
