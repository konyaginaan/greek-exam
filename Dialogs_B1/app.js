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
  // update badge count
  const badge = document.querySelector('.badge-blue');
  if (badge) badge.textContent = tasks.length + ' тем';

  tasks.forEach((t) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.setProperty('--card-accent', t.accent);
    card.style.setProperty('--card-icon-bg', t.iconBg);

    card.innerHTML = `
      <div class="card-top">
        <div class="card-icon">${t.emoji}</div>
        <div class="card-title-block">
          <div class="card-title">${t.titleRu}</div>
          <div class="card-hint">${t.topic}</div>
        </div>
        <div class="card-toggle">+</div>
      </div>
      <div class="card-body">
        <div class="divider"></div>
        <div class="roles-split">
          <div class="role-block">
            <div class="role-block-label">Ρόλος Α</div>
            <div class="role-block-text">${t.roleA}</div>
            ${makeExpandBtn('Критерии выполнения А', true)}
            ${makeExpandContent(t.criteriaA, true)}
            ${makeExpandBtn('Аргументы для роли А', false)}
            ${makeExpandContent(t.argsA, false)}
          </div>
          <div class="role-block">
            <div class="role-block-label">Ρόλος Β</div>
            <div class="role-block-text">${t.roleB}</div>
            ${makeExpandBtn('Критерии выполнения Б', true)}
            ${makeExpandContent(t.criteriaB, true)}
            ${makeExpandBtn('Аргументы для роли Б', false)}
            ${makeExpandContent(t.argsB, false)}
          </div>
        </div>
        <div class="section-label">Ключевая лексика</div>
        <div class="vocab-wrap">
          ${t.vocab.map(v => `<span class="vocab-tag">${v}</span>`).join('')}
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
const popup = document.getElementById('translate-popup');
const popupContent = document.getElementById('tpop-content');
let translateTimer = null;
let lastTranslated = '';

document.addEventListener('mouseup', (e) => {
  if (popup.contains(e.target)) return;
  const sel = window.getSelection();
  const text = sel ? sel.toString().trim() : '';
  if (!text || text.length < 2) { hidePopup(); return; }
  if (text === lastTranslated) return;
  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  showPopup(rect, text);
});

document.addEventListener('mousedown', (e) => {
  if (!popup.contains(e.target)) hidePopup();
});

function showPopup(rect, text) {
  lastTranslated = text;
  popupContent.innerHTML = '<span class="tpop-loader">переводим...</span>';
  popup.style.display = 'block';
  popup.style.transform = 'none';

  const popW = 280;
  const margin = 8;
  let left = rect.left + rect.width / 2 - popW / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - popW - margin));

  const spaceAbove = rect.top;
  const popH = 70;
  let top;
  if (spaceAbove > popH + margin) {
    top = rect.top + window.scrollY - popH - margin;
  } else {
    top = rect.bottom + window.scrollY + margin;
  }

  popup.style.left = left + 'px';
  popup.style.top = top + 'px';

  clearTimeout(translateTimer);
  translateTimer = setTimeout(() => doTranslate(text), 400);
}

function hidePopup() {
  popup.style.display = 'none';
  lastTranslated = '';
  clearTimeout(translateTimer);
}

async function doTranslate(text) {
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
