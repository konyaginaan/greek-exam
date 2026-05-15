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

function buildCards(tasks) {
  const grid = document.getElementById('grid');
  const navInner = document.getElementById('nav-inner');
  const badge = document.querySelector('.badge-blue');
  if (badge) badge.textContent = tasks.length + ' тем';

  tasks.forEach((t, i) => {
    const num = i + 1;
    const id = 'dialog-' + num;

    // Build nav item
    const navBtn = document.createElement('button');
    navBtn.className = 'nav-item';
    navBtn.textContent = num + '. ' + t.titleRu;
    navBtn.dataset.target = id;
    navBtn.addEventListener('click', () => {
      const card = document.getElementById(id);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (!card.classList.contains('open')) {
          card.classList.add('open');
        }
      }
    });
    navInner.appendChild(navBtn);

    // Build card
    const card = document.createElement('div');
    card.className = 'card';
    card.id = id;
    card.style.setProperty('--card-accent', t.accent);
    card.style.setProperty('--card-icon-bg', t.iconBg);

    card.innerHTML = `
      <div class="card-top">
        <span class="card-num">${num}</span>
        <div class="card-icon">${t.emoji}</div>
        <div class="card-title-block">
          <div class="card-title">${t.titleRu}</div>
          <div class="card-hint">${t.topic}</div>
        </div>
        <div class="card-toggle">+</div>
      </div>
      <div class="card-body">
        <div class="panel-left">
          <div class="panel-left-title">Подсказки</div>

          <div class="panel-left-title" style="margin-top:4px">Роль А</div>
          ${makeExpandBtn('Критерии А', true)}
          ${makeExpandContent(t.criteriaA, true)}
          ${makeExpandBtn('Аргументы А', false)}
          ${makeExpandContent(t.argsA, false)}

          <div class="panel-left-title" style="margin-top:8px">Роль Б</div>
          ${makeExpandBtn('Критерии Б', true)}
          ${makeExpandContent(t.criteriaB, true)}
          ${makeExpandBtn('Аргументы Б', false)}
          ${makeExpandContent(t.argsB, false)}

          <div class="vocab-section" style="margin-top:8px">
            <div class="section-label">Лексика</div>
            <div class="vocab-wrap">
              ${t.vocab.map(v => `<span class="vocab-tag">${v}</span>`).join('')}
            </div>
          </div>
        </div>

        <div class="panel-right">
          <div class="role-block">
            <div class="role-block-label">Ρόλος Α</div>
            <div class="role-block-text">${t.roleA}</div>
          </div>
          <div class="role-block">
            <div class="role-block-label">Ρόλος Β</div>
            <div class="role-block-text">${t.roleB}</div>
          </div>
        </div>
      </div>
    `;

    card.querySelector('.card-top').addEventListener('click', () => {
      card.classList.toggle('open');
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
  });

  // Highlight active nav item on scroll
  const navItems = navInner.querySelectorAll('.nav-item');
  const cards = grid.querySelectorAll('.card');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navItems.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.target === id);
        });
        // scroll nav to show active item
        const activeBtn = navInner.querySelector('.nav-item.active');
        if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  }, { threshold: 0.3 });

  cards.forEach(card => observer.observe(card));
}

/* ── LOAD TASKS ── */
fetch('tasks.json')
  .then(r => r.json())
  .then(buildCards)
  .catch(err => {
    document.getElementById('grid').innerHTML =
      '<p style="color:var(--muted);padding:20px">Ошибка загрузки заданий: ' + err.message + '</p>';
  });

/* ── TRANSLATION ON SELECTION via MyMemory API ── */
let popup, popupContent;
let translateTimer = null;
let lastTranslated = '';

document.addEventListener('DOMContentLoaded', () => {
  popup = document.getElementById('translate-popup');
  popupContent = document.getElementById('tpop-content');

  document.addEventListener('mouseup', (e) => {
    if (!popup || popup.contains(e.target)) return;
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : '';
    if (!text || text.length < 2) { hidePopup(); return; }
    if (text === lastTranslated && popup.style.display === 'block') return;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    showPopup(rect, text);
  });

  document.addEventListener('mousedown', (e) => {
    if (!popup || popup.contains(e.target)) return;
    hidePopup();
  });
});

function showPopup(rect, text) {
  if (!popup || !popupContent) return;
  lastTranslated = text;
  popupContent.innerHTML = '<span class="tpop-loader">переводим...</span>';
  popup.style.display = 'block';
  popup.style.position = 'fixed';
  popup.style.transform = 'none';

  const popW = 280;
  const popH = 72;
  const margin = 10;

  let left = rect.left + rect.width / 2 - popW / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - popW - margin));

  let top;
  if (rect.top > popH + margin) {
    top = rect.top - popH - margin;
  } else {
    top = rect.bottom + margin;
  }

  popup.style.left = left + 'px';
  popup.style.top = top + 'px';

  clearTimeout(translateTimer);
  translateTimer = setTimeout(() => doTranslate(text), 400);
}

function hidePopup() {
  if (!popup) return;
  popup.style.display = 'none';
  lastTranslated = '';
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
