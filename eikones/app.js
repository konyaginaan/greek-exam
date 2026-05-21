// ═══════════════════════════════════════════════════
// PERIGRAFI IKONON — app.js
// ═══════════════════════════════════════════════════

let IMAGES = [];
let currentTTS = null;
let currentTTSBtn = null;
let translateCache = {};

// ── INIT ─────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('data.json');
    const data = await res.json();
    IMAGES = data.images;
    document.getElementById('loadingMsg').style.display = 'none';

    // показать баннер плейлиста
    if (data.playlist) {
      const banner = document.getElementById('playlistBanner');
      const link = document.getElementById('playlistLink');
      link.href = data.playlist;
      banner.style.display = 'flex';
    }

    buildNav();
    buildSections();
    initTranslate();
  } catch (e) {
    document.getElementById('loadingMsg').textContent = 'Ошибка загрузки данных.';
    console.error('Не удалось загрузить data.json', e);
  }
}

// ── NAV ──────────────────────────────────────────
function buildNav() {
  const nav = document.getElementById('navBar');
  nav.innerHTML = '';
  IMAGES.forEach((img, i) => {
    const a = document.createElement('a');
    a.className = 'nav-pill' + (i === 0 ? ' active' : '');
    a.href = '#image-' + img.id;
    a.textContent = 'Εικόνα ' + img.id;
    a.onclick = () => {
      document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
      a.classList.add('active');
    };
    nav.appendChild(a);
  });
}

// ── SECTIONS ─────────────────────────────────────
function buildSections() {
  const container = document.getElementById('mainContainer');
  container.innerHTML = '';

  IMAGES.forEach((img, idx) => {
    const sec = document.createElement('section');
    sec.className = 'image-section';
    sec.id = 'image-' + img.id;
    sec.innerHTML = sectionHTML(img, idx);
    container.appendChild(sec);

    if (idx < IMAGES.length - 1) {
      const div = document.createElement('div');
      div.className = 'section-divider';
      container.appendChild(div);
    }
  });

  // attach events after render
  attachAllEvents();
}

function sectionHTML(img, idx) {
  const vocabA2Rows = img.vocab_a2.map((v, i) =>
    `<tr>
      <td><button class="speak-word" onclick="speakWord('${escQ(v.word)}')" title="Произнести">🔊</button> ${esc(v.word)}</td>
      <td>${esc(v.translation)}</td>
    </tr>`
  ).join('');

  const vocabB1Rows = img.vocab_b1.map((v, i) =>
    `<tr>
      <td><button class="speak-word" onclick="speakWord('${escQ(v.word)}')" title="Произнести">🔊</button> ${esc(v.word)}</td>
      <td>${esc(v.translation)}</td>
    </tr>`
  ).join('');

  const questionsHTML = img.questions.map((q, i) =>
    `<li>
      <span class="q-num">${i + 1}</span>
      <span>${esc(q)}</span>
      <button class="q-speak" onclick="speakWord('${escQ(q)}')" title="Произнести">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
      </button>
    </li>`
  ).join('');

  const sunoA2 = img.suno_a2
    ? `<a href="${esc(img.suno_a2)}" target="_blank" class="suno-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        Слушать на Suno (A2)
      </a>` : '';

  const sunoB1 = img.suno_b1
    ? `<a href="${esc(img.suno_b1)}" target="_blank" class="suno-btn b1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        Слушать на Suno (B1)
      </a>` : '';

  return `
    <div class="section-num">
      <div class="section-num-badge">${img.id}</div>
      <div class="section-num-title">${esc(img.title)}</div>
    </div>

    <!-- КАРТИНКА -->
    <div class="section-label">Εικόνα</div>
    <div class="image-card">
      <div class="image-wrap">
        <img src="${esc(img.image)}" alt="${esc(img.title)}" loading="lazy">
      </div>
      <div class="image-caption">
        <p>${esc(img.caption)}</p>
      </div>
    </div>

    <!-- ВОПРОСЫ -->
    <div class="block-card" id="questions-${img.id}">
      <h2 onclick="toggleBlock('questions-${img.id}')">
        <svg class="block-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        Τι μπορεί να σας ρωτήσει ο εξεταστής
      </h2>
      <ul class="question-list">
        ${questionsHTML}
      </ul>
    </div>

    <!-- ОПИСАНИЯ -->
    <div class="section-label">Περιγραφές</div>
    <div class="desc-grid">
      <div class="desc-card" id="desc-a2-${img.id}">
        <div class="desc-header" onclick="toggleDesc('desc-a2-${img.id}')">
          <div class="desc-header-left">
            <span class="level-pill a2-pill">A2</span>
            <span class="desc-title">Περιγραφή Α2</span>
          </div>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="desc-body">
          <div class="desc-inner">
            <p class="a2-text translatable">${esc(img.description_a2)}</p>
            <div class="desc-speak-row">
              <button class="speak-btn" id="tts-a2-${img.id}" onclick="toggleTTS('tts-a2-${img.id}', '${escQ(img.description_a2)}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                Прослушать
              </button>
            </div>
            ${img.audio_a2 ? `
            <div class="audio-row">
              <audio controls src="${esc(img.audio_a2)}" preload="none"></audio>
              ${sunoA2}
            </div>` : sunoA2}
          </div>
        </div>
      </div>

      <div class="desc-card" id="desc-b1-${img.id}">
        <div class="desc-header" onclick="toggleDesc('desc-b1-${img.id}')">
          <div class="desc-header-left">
            <span class="level-pill b1-pill">B1</span>
            <span class="desc-title">Περιγραφή Β1</span>
          </div>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="desc-body">
          <div class="desc-inner">
            <p class="b1-text translatable">${esc(img.description_b1)}</p>
            <div class="desc-speak-row">
              <button class="speak-btn" id="tts-b1-${img.id}" onclick="toggleTTS('tts-b1-${img.id}', '${escQ(img.description_b1)}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                Прослушать
              </button>
            </div>
            ${img.audio_b1 ? `
            <div class="audio-row">
              <audio controls src="${esc(img.audio_b1)}" preload="none"></audio>
              ${sunoB1}
            </div>` : sunoB1}
          </div>
        </div>
      </div>
    </div>

    <!-- СЛОВАРЬ -->
    <div class="vocab-card" id="vocab-${img.id}">
      <div class="vocab-header" onclick="toggleVocab('vocab-${img.id}')">
        <h2>
          <span>Λεξιλόγιο</span>
        </h2>
        <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="vocab-body">
        <div class="vocab-tabs">
          <div class="vocab-tab active a2" id="tab-a2-${img.id}" onclick="switchVocabTab(${img.id}, 'a2')">A2</div>
          <div class="vocab-tab b1" id="tab-b1-${img.id}" onclick="switchVocabTab(${img.id}, 'b1')">B1</div>
        </div>
        <div class="vocab-panel active" id="panel-a2-${img.id}">
          <table class="vocab-table"><tbody>${vocabA2Rows}</tbody></table>
        </div>
        <div class="vocab-panel" id="panel-b1-${img.id}">
          <table class="vocab-table"><tbody>${vocabB1Rows}</tbody></table>
        </div>
      </div>
    </div>

    <!-- SUNO -->
    ${(img.suno_a2 || img.suno_b1) ? `
    <div class="suno-card">
      <div class="suno-card-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        Слушать описание как песню
      </div>
      <div class="suno-card-btns">
        ${img.suno_a2 ? `<a href="${esc(img.suno_a2)}" target="_blank" class="suno-card-btn a2">
          <span class="level-pill a2-pill">A2</span> Открыть в Suno
        </a>` : ''}
        ${img.suno_b1 ? `<a href="${esc(img.suno_b1)}" target="_blank" class="suno-card-btn b1">
          <span class="level-pill b1-pill">B1</span> Открыть в Suno
        </a>` : ''}
      </div>
    </div>` : ''}

    <!-- TELEGRAM -->
    <a href="https://t.me/mathenoel" target="_blank" class="tg-btn">
      <svg viewBox="0 0 24 24" fill="none"><path d="M21.5 2.5L2 10l7 2.5L17 7l-6 7 7 3 3.5-14.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
      Больше материалов — в Telegram-канале
    </a>
  `;
}

// ── ACCORDION TOGGLES ─────────────────────────────
function toggleBlock(id) {
  document.getElementById(id).classList.toggle('open');
}

function toggleDesc(id) {
  document.getElementById(id).classList.toggle('open');
}

function toggleVocab(id) {
  document.getElementById(id).classList.toggle('open');
}

function switchVocabTab(imgId, level) {
  ['a2', 'b1'].forEach(l => {
    document.getElementById(`tab-${l}-${imgId}`).classList.toggle('active', l === level);
    document.getElementById(`panel-${l}-${imgId}`).classList.toggle('active', l === level);
  });
}

function attachAllEvents() {
  // open first questions block by default
  if (IMAGES.length > 0) {
    const first = document.getElementById(`questions-${IMAGES[0].id}`);
    if (first) first.classList.add('open');
  }
}

// ── TTS ──────────────────────────────────────────
function toggleTTS(btnId, text) {
  const btn = document.getElementById(btnId);

  // if same button — stop
  if (currentTTSBtn === btnId && currentTTS) {
    window.speechSynthesis.cancel();
    currentTTS = null;
    currentTTSBtn = null;
    btn.classList.remove('speaking');
    btn.querySelector('svg').style.stroke = '';
    return;
  }

  // stop previous
  if (currentTTS) {
    window.speechSynthesis.cancel();
    if (currentTTSBtn) {
      const prev = document.getElementById(currentTTSBtn);
      if (prev) {
        prev.classList.remove('speaking');
        prev.querySelector('svg').style.stroke = '';
      }
    }
  }

  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'el-GR';
  utt.rate = 0.9;

  utt.onend = () => {
    btn.classList.remove('speaking');
    btn.querySelector('svg').style.stroke = '';
    currentTTS = null;
    currentTTSBtn = null;
  };

  currentTTS = utt;
  currentTTSBtn = btnId;
  btn.classList.add('speaking');
  btn.querySelector('svg').style.stroke = 'var(--c1)';
  window.speechSynthesis.speak(utt);
}

function speakWord(word) {
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(word);
  utt.lang = 'el-GR';
  utt.rate = 0.85;
  window.speechSynthesis.speak(utt);
}

// ── ПЕРЕВОД ПО КЛИКУ ─────────────────────────────
function initTranslate() {
  const popup = document.getElementById('translatePopup');

  document.addEventListener('mouseup', async (e) => {
    const sel = window.getSelection();
    const word = sel ? sel.toString().trim() : '';

    if (!word || word.length > 60 || !e.target.closest('.translatable')) {
      popup.style.display = 'none';
      return;
    }

    // position popup near selection
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    popup.style.display = 'block';
    popup.style.left = (rect.left + window.scrollX) + 'px';
    popup.style.top = (rect.bottom + window.scrollY + 8) + 'px';
    popup.innerHTML = `<div class="original">${esc(word)}</div><div class="loading">перевожу…</div>`;

    const translation = await translate(word);
    popup.innerHTML = `<div class="original">${esc(word)}</div><div class="translation">${esc(translation)}</div>`;
  });

  document.addEventListener('mousedown', (e) => {
    if (!e.target.closest('#translatePopup')) {
      popup.style.display = 'none';
    }
  });
}

async function translate(word) {
  if (translateCache[word]) return translateCache[word];
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `Переведи греческое слово или фразу на русский язык. Дай только перевод, без пояснений: "${word}"`
        }]
      })
    });
    const data = await res.json();
    const result = data.content?.[0]?.text?.trim() || '—';
    translateCache[word] = result;
    return result;
  } catch {
    return '—';
  }
}

// ── HELPERS ──────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escQ(str) {
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// ── START ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
