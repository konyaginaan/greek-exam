let VOCAB = {};
let cur = null;
let activeTab = 'A2';
let activeCategory = 'all';

const CATEGORIES = [
  { id: 'all',       label: '🗂 Все' },
  { id: 'transport', label: '🚗 Транспорт' },
  { id: 'leisure',   label: '🎭 Досуг' },
  { id: 'shopping',  label: '🛍 Покупки' },
  { id: 'home',      label: '🏠 Дом и быт' },
  { id: 'work',      label: '💼 Работа' },
  { id: 'health',    label: '🏥 Здоровье' },
  { id: 'services',  label: '🏛 Сервисы' },
  { id: 'nature',    label: '🌿 Природа' },
  { id: 'people',    label: '👥 Люди' },
];

fetch('tasks.json')
  .then(r => r.json())
  .then(data => {
    VOCAB = data;
    updateTabCounts();
    buildFilters();
    renderGrid();
    const h = location.hash.slice(1);
    if (h && VOCAB[h]) {
      // переключаем на нужный таб, если карточка в другом
      if (VOCAB[h].tab && VOCAB[h].tab !== activeTab) {
        setTab(VOCAB[h].tab);
      }
      const el = document.querySelector(`[data-id="${h}"]`);
      if (el) openCard(el);
    }
  });

function updateTabCounts() {
  ['A2', 'B1'].forEach(tab => {
    const n = getTabCards(tab).length;
    const el = document.getElementById('tabCount-' + tab);
    if (el) el.textContent = n + ' ' + pluralRu(n, 'картинка', 'картинки', 'картинок');
  });
}

function pluralRu(n, f1, f2, f5) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return f5;
  if (mod10 === 1) return f1;
  if (mod10 >= 2 && mod10 <= 4) return f2;
  return f5;
}


function getTabCards(tab) {
  return Object.entries(VOCAB).filter(([, d]) => d.tab === tab);
}

function buildFilters() {
  const container = document.getElementById('filterInner');
  if (!container) return;
  const tabCards = getTabCards(activeTab);
  const usedCats = new Set(tabCards.map(([, d]) => d.category));
  container.innerHTML = '';
  CATEGORIES.forEach(cat => {
    if (cat.id !== 'all' && !usedCats.has(cat.id)) return;
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (cat.id === activeCategory ? ' active' : '');
    btn.dataset.cat = cat.id;
    btn.textContent = cat.label;
    btn.addEventListener('click', () => applyFilter(cat.id));
    container.appendChild(btn);
  });
}

function applyFilter(category) {
  activeCategory = category;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === category);
  });
  renderGrid();
}

function renderGrid() {
  const grid = document.getElementById('cardsGrid');
  const all = getTabCards(activeTab);
  const cards = activeCategory === 'all'
    ? all
    : all.filter(([, d]) => d.category === activeCategory);
  grid.innerHTML = cards.map(([id, d], i) => `
    <div class="vcard" data-id="${id}" onclick="openCard(this)">
      <img src="${d.img.replace('w=1400', 'w=600')}" alt="" loading="lazy">
      <div class="card-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="card-label">
        <div class="card-label-gr">${d.titleGr}</div>
        <div class="card-label-ru">${d.titleRu}</div>
      </div>
      <div class="card-hint"><div class="card-hint-inner">открыть</div></div>
    </div>
  `).join('');
}

function setTab(tab) {
  activeTab = tab;
  activeCategory = 'all';
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('ac', btn.dataset.tab === tab);
  });
  buildFilters();
  renderGrid();
}

function buildDictHTML(d) {
  return `
    ${d.panels.map(p => `
      <div class="dpanel" style="border-left-color:${p.accent}">
        <div class="dpanel-hdr">
          <span class="dpanel-num" style="color:${p.accent}">${p.num}</span>
          <div>
            <div class="dpanel-title" style="color:${p.accent}">${p.titleGr}</div>
            <span class="dpanel-sub">${p.titleRu}</span>
          </div>
        </div>
        <ul class="wlist">
          ${p.words.map(w => `<li><span class="wgr">${w.gr}</span><span class="wru">— ${w.ru}</span></li>`).join('')}
        </ul>
      </div>`).join('')}
    <div class="verbs-bar">
      <span class="verbs-label">Χρήσιμα ρήματα — Полезные глаголы</span>
      <div class="vpills">
        ${d.verbs.map(v => `
          <div class="vpill" style="border-color:${d.accent}">
            <span class="vgr" style="color:${d.accent}">${v.gr}</span>
            <span class="vru">${v.ru}</span>
          </div>`).join('')}
      </div>
    </div>
    <div style="height:8px;flex-shrink:0"></div>
  `;
}

function openCard(el) {
  cur = el.dataset.id;
  const d = VOCAB[cur];
  if (!d) return;
  document.getElementById('lbImg').src = d.img;
  // title теперь в sticky bar (заполняется при openDict)
  const btn = document.getElementById('dictBtn');
  btn.style.borderColor = d.accent;
  btn.style.color = d.accent;
  btn.style.background = d.accent + '18';
  document.getElementById('lbInner').classList.remove('dict-open');
  document.getElementById('dictScroll').innerHTML = '';
  document.getElementById('ov').classList.add('on');
  document.getElementById('lb').classList.add('on');
  document.body.style.overflow = 'hidden';
  history.replaceState(null, '', '#' + cur);
}

function openDict() {
  if (!cur) return;
  const d = VOCAB[cur];
  document.getElementById('dictScroll').innerHTML = buildDictHTML(d);
  document.getElementById('dictScroll').scrollTop = 0;
  // sticky bar — title + level + copy color
  const titleEl = document.getElementById('stickyTitleGr');
  if (titleEl) { titleEl.textContent = d.titleGr; titleEl.style.color = d.accent; }
  const copyBtn = document.querySelector('.dict-sticky-copy');
  if (copyBtn) { copyBtn.style.borderColor = d.accent; copyBtn.style.color = d.accent; }
  document.getElementById('lbInner').classList.add('dict-open');
}

function closeDict() {
  document.getElementById('lbInner').classList.remove('dict-open');
  const copyBtn = document.querySelector('.dict-sticky-copy');
  if (copyBtn) { copyBtn.style.borderColor = ''; copyBtn.style.color = ''; }
  const titleEl = document.getElementById('stickyTitleGr');
  if (titleEl) { titleEl.textContent = ''; titleEl.style.color = ''; }
  setTimeout(() => { document.getElementById('dictScroll').innerHTML = ''; }, 460);
}

function closeAll() {
  cur = null;
  document.getElementById('ov').classList.remove('on');
  document.getElementById('lb').classList.remove('on');
  document.getElementById('lbInner').classList.remove('dict-open');
  document.getElementById('lbImg').src = '';
  document.getElementById('dictScroll').innerHTML = '';
  document.body.style.overflow = '';
  history.replaceState(null, '', location.pathname);
}

function shareCard() {
  const url = location.href.split('#')[0] + '#' + cur;
  navigator.clipboard.writeText(url).then(() => {
    const t = document.getElementById('toast');
    t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(16px)'; }, 2400);
  });
}

function copyVocab() {
  if (!cur) return;
  const d = VOCAB[cur];
  let text = d.titleGr + ' — ' + d.titleRu + '\n' + d.level + '\n\n';
  d.panels.forEach(p => {
    text += p.titleGr + ' / ' + p.titleRu + ':\n';
    p.words.forEach(w => { text += '  · ' + w.gr + ' — ' + w.ru + '\n'; });
    text += '\n';
  });
  text += 'Глаголы: ' + d.verbs.map(v => v.gr + ' (' + v.ru + ')').join(', ');
  navigator.clipboard.writeText(text).then(() => {
    document.querySelectorAll('.copy-btn,.dict-sticky-copy').forEach(btn => {
      btn.classList.add('copied');
      btn.title = 'Скопировано!';
      setTimeout(() => { btn.classList.remove('copied'); btn.title = 'Скопировать словарь'; }, 2000);
    });
    const t = document.getElementById('toast');
    t.textContent = 'Словарь скопирован!';
    t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => {
      t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(16px)';
      t.textContent = 'Ссылка скопирована!';
    }, 2000);
  });
}

function openRandom() {
  const all = getTabCards(activeTab);
  const cards = activeCategory === 'all'
    ? all
    : all.filter(([, d]) => d.category === activeCategory);
  if (!cards.length) return;
  const [id] = cards[Math.floor(Math.random() * cards.length)];
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) openCard(el);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (document.getElementById('lbInner').classList.contains('dict-open')) closeDict();
    else closeAll();
  }
});
