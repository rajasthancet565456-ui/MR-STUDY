/* ==========================================================================
   COSMIC QUIZ MASTER — Progress Tracker & CBT Loader
   Tracks quiz attempt progress per library.
   Loads Testbook CBT engine scripts for the quiz view.
   ========================================================================== */

// Load CBT engine scripts if not already loaded
if (!document.getElementById('testbook-engine-script')) {
  const s1 = document.createElement('script');
  s1.id = 'testbook-engine-script';
  s1.src = 'testbook-cbt-engine.js';
  document.head.append(s1);
}
if (!document.getElementById('testbook-hub-script')) {
  const s2 = document.createElement('script');
  s2.id = 'testbook-hub-script';
  s2.src = 'testbook-cbt-hub.js';
  document.head.append(s2);
}

(() => {
  // ── Progress tracking per library page ──────────────────────────────────
  const key = `cosmic-quiz-progress:${location.pathname}`;
  const read = () => {
    try { return JSON.parse(localStorage.getItem(key)) || { attempted: {}, scores: {} }; }
    catch { return { attempted: {}, scores: {} }; }
  };
  let state = read();
  const save = () => localStorage.setItem(key, JSON.stringify(state));
  const idFromHash = () => decodeURIComponent(location.hash.replace(/^#quiz\//, ''));
  const total = () =>
    document.querySelectorAll('#quiz-grid .quiz-card').length ||
    Number((document.querySelector('#counter')?.textContent || '').match(/\d+/)?.[0]) || 0;
  const attempted = () => Object.keys(state.attempted).length;

  // ── Progress bar styles ──────────────────────────────────────────────────
  const addProgressStyle = () => {
    if (document.getElementById('tb-progress-style')) return;
    const style = document.createElement('style');
    style.id = 'tb-progress-style';
    style.textContent = `
      .study-progress {
        margin: 0 0 20px;
        padding: 16px 18px;
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 12px;
        background: rgba(255,255,255,0.06);
        backdrop-filter: blur(6px);
      }
      .study-progress__top {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-size: 13px;
        font-weight: 600;
        color: inherit;
        opacity: 0.9;
      }
      .study-progress__top strong {
        color: #38bdf8;
        font-size: 13px;
      }
      .study-progress__track {
        height: 7px;
        margin-top: 10px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255,255,255,0.12);
      }
      .study-progress__fill {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #0284c7, #10b981);
        transition: width 0.3s ease;
      }
      .study-progress__note {
        display: block;
        margin-top: 7px;
        opacity: 0.6;
        font-size: 11px;
      }
      .quiz-card.is-attempted {
        border-color: #10b981 !important;
        box-shadow: 0 0 0 1px #10b981 !important;
      }
    `;
    document.head.append(style);
  };

  function refresh() {
    const count = total(), done = attempted();
    const percent = count ? Math.round(done / count * 100) : 0;
    const progress = document.querySelector('.study-progress');
    if (progress) {
      const label = progress.querySelector('[data-progress-count]');
      if (label) label.textContent = `${done} of ${count} Tests Attempted (${percent}%)`;
      const fill = progress.querySelector('.study-progress__fill');
      if (fill) fill.style.width = `${percent}%`;
    }
    document.querySelectorAll('#quiz-grid .quiz-card').forEach((card, index) => {
      const quizId = card.dataset.quizId || String(index + 1);
      card.dataset.quizId = quizId;
      card.classList.toggle('is-attempted', Boolean(state.attempted[quizId]));
    });
  }

  function installProgress() {
    const grid = document.querySelector('#quiz-grid');
    if (!grid || document.querySelector('.study-progress')) return;
    const progress = document.createElement('section');
    progress.className = 'study-progress';
    progress.innerHTML = `
      <div class="study-progress__top">
        <span>Test Series Completion</span>
        <strong data-progress-count></strong>
      </div>
      <div class="study-progress__track"><div class="study-progress__fill"></div></div>
      <small class="study-progress__note">Attempt tests to build exam speed, track accuracy, and simulate real CBT exams.</small>
    `;
    grid.before(progress);
    refresh();
    new MutationObserver(refresh).observe(grid, { childList: true });
  }

  // ── Watch loaded quiz iframe for score ───────────────────────────────────
  function watchFrame() {
    const frame = document.querySelector('.quiz-frame');
    if (!frame || frame.dataset.tbWatch) return;
    frame.dataset.tbWatch = 'true';

    const onLoad = () => {
      try {
        const doc = frame.contentDocument;
        if (!doc) return;

        // Apply CBT engine enhancements to the iframe
        if (window.TestbookCBTEngine) {
          window.TestbookCBTEngine.applyContrastSafeguard(doc);
        }

        // Listen for score on finish/submit
        doc.addEventListener('click', event => {
          const btn = event.target.closest('button');
          if (!btn || !/finish|submit|complete|result|summary/i.test(btn.textContent)) return;
          setTimeout(() => {
            const scoreEl = doc.querySelector('#score-display, [data-score], #headerScore');
            const totalEl = doc.querySelector('#total-display, [data-total]');
            const score = scoreEl?.textContent.trim().match(/\d+/)?.[0];
            const totalScore = totalEl?.textContent.trim().match(/\d+/)?.[0] || '90';
            if (score) {
              const qId = idFromHash();
              state.scores[qId] = { score, total: totalScore, savedAt: Date.now() };
              state.attempted[qId] = true;
              save();
              refresh();
            }
          }, 0);
        }, true);
      } catch (e) {}
    };

    frame.addEventListener('load', onLoad);
    try {
      if (frame.contentDocument?.readyState === 'complete') onLoad();
    } catch (e) {}
  }

  // ── Main tick ────────────────────────────────────────────────────────────
  addProgressStyle();
  const tick = () => {
    installProgress();
    watchFrame();
    refresh();
  };
  tick();
  window.addEventListener('hashchange', () => setTimeout(tick, 60));
  setInterval(tick, 1200);
})();
