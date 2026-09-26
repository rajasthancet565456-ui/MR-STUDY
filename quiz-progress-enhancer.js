/* ==========================================================================
   TESTBOOK PROGRESS & CBT CONTROLLER
   Integrated Progress Tracking, Readability Guard, and Testbook UI Adapter
   ========================================================================== */

// 1. Ensure Testbook CSS and Engines are loaded
if (!document.getElementById('testbook-theme-link')) {
  const link = document.createElement('link');
  link.id = 'testbook-theme-link';
  link.rel = 'stylesheet';
  link.href = 'testbook-theme.css';
  document.head.append(link);
}
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
  const key = `cosmic-quiz-progress:${location.pathname}`;
  const read = () => { try { return JSON.parse(localStorage.getItem(key)) || { attempted: {}, scores: {} }; } catch { return { attempted: {}, scores: {} }; } };
  let state = read();
  const save = () => localStorage.setItem(key, JSON.stringify(state));
  const id = () => decodeURIComponent(location.hash.replace(/^#quiz\//, ''));
  const total = () => document.querySelectorAll('#quiz-grid .quiz-card').length || Number((document.querySelector('#counter')?.textContent || '').match(/\d+/)?.[0]) || 0;
  const attempted = () => Object.keys(state.attempted).length;

  const addStyle = () => {
    if (document.getElementById('tb-progress-style')) return;
    const style = document.createElement('style');
    style.id = 'tb-progress-style';
    style.textContent = `
      .study-progress {
        margin: 0 0 25px;
        padding: 18px 20px;
        border: 1px solid var(--tb-card-border, #dbe2ea);
        border-radius: 10px;
        background: #ffffff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      }
      .study-progress__top {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
      }
      .study-progress__top strong {
        color: #0284c7;
        font-size: 14px;
      }
      .study-progress__track {
        height: 8px;
        margin-top: 10px;
        overflow: hidden;
        border-radius: 999px;
        background: #e2e8f0;
      }
      .study-progress__fill {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #0284c7, #10b981);
        transition: width .25s ease;
      }
      .study-progress__note {
        display: block;
        margin-top: 8px;
        color: #64748b;
        font-size: 12px;
      }
      .quiz-card.is-attempted {
        border-color: #10b981 !important;
      }
    `;
    document.head.append(style);
  };

  function refresh() {
    const count = total(), done = attempted(), percent = count ? Math.round(done / count * 100) : 0;
    const progress = document.querySelector('.study-progress');
    if (progress) {
      const label = progress.querySelector('[data-progress-count]');
      if (label) label.textContent = `${done} of ${count} Tests Attempted (${percent}%)`;
      const fill = progress.querySelector('.study-progress__fill');
      if (fill) fill.style.width = `${percent}%`;
    }

    document.querySelectorAll('#quiz-grid .quiz-card').forEach((card, index) => {
      const label = card.textContent;
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
      <small class="study-progress__note">Attempt tests to build exam speed, track accuracy, and simulate real CBT examination environment.</small>
    `;
    grid.before(progress);
    refresh();
    new MutationObserver(refresh).observe(grid, { childList: true });
  }

  // Sanitize and adapt any loaded quiz iframe
  function applyTestbookEngine(doc) {
    if (!doc || !doc.head) return;
    
    // Purge conflicting broken styles
    const brokenStyles = doc.querySelectorAll('#cosmic-readable-quiz-theme, #lavender-quiz-layer, #lavender-quiz-app-ui, #readability-safeguard, #light-celestial-readability');
    brokenStyles.forEach(s => s.remove());

    // Apply Testbook in-quiz styles
    if (window.TestbookCBTEngine) {
      window.TestbookCBTEngine.applyContrastSafeguard(doc);
    } else {
      const link = doc.createElement('script');
      link.src = 'testbook-cbt-engine.js';
      doc.head.append(link);
    }
  }

  function watchFrame() {
    const frame = document.querySelector('.quiz-frame');
    if (!frame || frame.dataset.tbWatch) return;
    frame.dataset.tbWatch = 'true';

    const onFrameLoad = () => {
      try {
        const doc = frame.contentDocument;
        if (!doc) return;
        applyTestbookEngine(doc);

        // Listen for internal submit/score buttons
        doc.addEventListener('click', event => {
          const button = event.target.closest('button');
          if (!button || !/finish|submit|complete|result|summary/i.test(button.textContent)) return;
          setTimeout(() => {
            const scoreEl = doc.querySelector('#score-display, [data-score], .score-display, #headerScore');
            const totalEl = doc.querySelector('#total-display, [data-total], .total-score');
            const score = scoreEl?.textContent.trim().match(/\d+/)?.[0];
            const totalScore = totalEl?.textContent.trim().match(/\d+/)?.[0] || '90';
            if (score) {
              state.scores[id()] = { score, total: totalScore, savedAt: Date.now() };
              state.attempted[id()] = true;
              save();
              refresh();
            }
          }, 0);
        }, true);
      } catch (e) {}
    };

    frame.addEventListener('load', onFrameLoad);
    try {
      if (frame.contentDocument?.readyState === 'complete') onFrameLoad();
    } catch (e) {}
  }

  addStyle();
  const tick = () => {
    installProgress();
    watchFrame();
    refresh();
  };
  tick();
  window.addEventListener('hashchange', () => setTimeout(tick, 50));
  setInterval(tick, 1000);
})();
