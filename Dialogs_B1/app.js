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

    // Nav item
    const navBtn = document.createElement('button');
    navBtn.className = 'nav-item';
    navBtn.textContent = num + '. ' + t.titleRu;
    navBtn.dataset.target = id;
    navBtn.addEventListener('click', () => {
      const card = document.getElementById(id);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (!card.classList.contains('open')) card.classList.add('open');
      }
    });
    navInner.appendChild(navBtn);

    // Card
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
      // close all cards
      grid.querySelectorAll('.card').forEach(c => c.classList.remove('open'));
      // open this one only if it was closed
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
  });

  // Active nav on scroll
  const navItems = navInner.querySelectorAll('.nav-item');
  const cards = grid.querySelectorAll('.card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const activeId = entry.target.id;
        navItems.forEach(btn => btn.classList.toggle('active', btn.dataset.target === activeId));
        const activeBtn = navInner.querySelector('.nav-item.active');
        if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  }, { threshold: 0.2 });
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

// Track mouse position at all times
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
    // Use actual mouse position — always correct regardless of scroll
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

  const popW = 280;
  const popH = 72;
  const margin = 12;

  // Place above the cursor if there's room, else below
  let left = x - popW / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - popW - margin));

  let top;
  if (y > popH + margin) {
    top = y - popH - margin;
  } else {
    top = y + margin + 20;
  }

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
