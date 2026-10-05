/* ==========================================================================
   COSMIC QUIZ MASTER — Progress Tracker & CBT Loader
   Tracks quiz attempt progress per library.
   Adds MANUAL Mark / Unmark toggle on every quiz card.
   Filter: All | Attempted ✅ | Not Attempted ❌
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

  // Current filter state
  let currentFilter = 'all'; // 'all' | 'attempted' | 'not-attempted'

  // ── Styles ──────────────────────────────────────────────────────────────
  const addProgressStyle = () => {
    if (document.getElementById('tb-progress-style')) return;
    const style = document.createElement('style');
    style.id = 'tb-progress-style';
    style.textContent = `
      /* ── Progress Bar ── */
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

      /* ── Filter Bar ── */
      .quiz-filter-bar {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
        margin: 14px 0 16px;
        padding: 10px 14px;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 10px;
        background: rgba(255,255,255,0.04);
      }
      .quiz-filter-bar .filter-label {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        opacity: 0.6;
        margin-right: 4px;
      }
      .quiz-filter-btn {
        padding: 6px 14px;
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 20px;
        background: transparent;
        color: inherit;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
      }
      .quiz-filter-btn:hover {
        border-color: rgba(56,189,248,0.5);
        background: rgba(56,189,248,0.08);
      }
      .quiz-filter-btn.active {
        background: #0284c7;
        color: #fff;
        border-color: #0284c7;
      }
      .quiz-filter-btn .filter-count {
        display: inline-block;
        min-width: 18px;
        padding: 1px 5px;
        margin-left: 5px;
        border-radius: 10px;
        background: rgba(255,255,255,0.15);
        font-size: 10px;
        font-weight: 800;
        text-align: center;
      }
      .quiz-filter-btn.active .filter-count {
        background: rgba(255,255,255,0.25);
      }

      /* ── Quiz Card Attempted State ── */
      .quiz-card {
        position: relative !important;
      }
      .quiz-card.is-attempted {
        border-color: #10b981 !important;
        box-shadow: 0 0 0 1.5px #10b981, 0 4px 14px rgba(16,185,129,0.15) !important;
      }
      .quiz-card.is-attempted::after {
        content: '✅';
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 16px;
        line-height: 1;
        pointer-events: none;
      }
      .quiz-card:not(.is-attempted)::after {
        content: '☐';
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 16px;
        line-height: 1;
        color: rgba(255,255,255,0.3);
        pointer-events: none;
      }

      /* ── Mark / Unmark Toggle Button ── */
      .quiz-mark-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        width: 100%;
        margin-top: 10px;
        padding: 7px 10px;
        border: 1.5px solid rgba(255,255,255,0.15);
        border-radius: 6px;
        background: rgba(255,255,255,0.05);
        color: inherit;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .quiz-mark-btn:hover {
        background: rgba(16,185,129,0.12);
        border-color: #10b981;
      }
      .quiz-mark-btn.is-marked {
        background: rgba(16,185,129,0.15);
        border-color: #10b981;
        color: #10b981;
      }
      .quiz-mark-btn.is-marked:hover {
        background: rgba(239,68,68,0.12);
        border-color: #ef4444;
        color: #ef4444;
      }

      /* ── Summary Stats Row ── */
      .quiz-summary-stats {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        margin: 8px 0 4px;
      }
      .quiz-summary-stat {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        opacity: 0.8;
      }
      .quiz-summary-stat .stat-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      .stat-dot.dot-attempted { background: #10b981; }
      .stat-dot.dot-not-attempted { background: #ef4444; }
      .stat-dot.dot-total { background: #38bdf8; }

      /* Hidden cards when filtered */
      .quiz-card.filter-hidden {
        display: none !important;
      }
    `;
    document.head.append(style);
  };

  // ── Toggle mark/unmark for a quiz ───────────────────────────────────────
  function toggleMark(quizId, e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (state.attempted[quizId]) {
      delete state.attempted[quizId];
    } else {
      state.attempted[quizId] = true;
    }
    save();
    refresh();
  }

  // ── Apply filter ────────────────────────────────────────────────────────
  function applyFilter(filter) {
    currentFilter = filter;
    // Update filter buttons
    document.querySelectorAll('.quiz-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    // Show/hide cards
    document.querySelectorAll('#quiz-grid .quiz-card').forEach(card => {
      const quizId = card.dataset.quizId;
      const isAttempted = Boolean(state.attempted[quizId]);
      let show = true;
      if (filter === 'attempted') show = isAttempted;
      if (filter === 'not-attempted') show = !isAttempted;
      card.classList.toggle('filter-hidden', !show);
    });
    // Update visible count
    updateVisibleCount();
  }

  function updateVisibleCount() {
    const visibleCards = document.querySelectorAll('#quiz-grid .quiz-card:not(.filter-hidden)').length;
    const totalCards = total();
    const counter = document.getElementById('counter');
    if (counter) {
      if (currentFilter === 'all') {
        counter.textContent = `${totalCards} quiz${totalCards === 1 ? '' : 'zes'} available`;
      } else {
        counter.textContent = `${visibleCards} of ${totalCards} quiz${totalCards === 1 ? '' : 'zes'} shown (${currentFilter.replace('-', ' ')})`;
      }
    }
  }

  // ── Refresh UI ──────────────────────────────────────────────────────────
  function refresh() {
    state = read();
    const count = total(), done = attempted();
    const notDone = count - done;
    const percent = count ? Math.round(done / count * 100) : 0;

    // Update progress bar
    const progress = document.querySelector('.study-progress');
    if (progress) {
      const label = progress.querySelector('[data-progress-count]');
      if (label) label.textContent = `${done} of ${count} Tests Attempted (${percent}%)`;
      const fill = progress.querySelector('.study-progress__fill');
      if (fill) fill.style.width = `${percent}%`;
    }

    // Update summary stats
    const statsRow = document.querySelector('.quiz-summary-stats');
    if (statsRow) {
      statsRow.innerHTML = `
        <span class="quiz-summary-stat"><span class="stat-dot dot-total"></span>${count} Total</span>
        <span class="quiz-summary-stat"><span class="stat-dot dot-attempted"></span>${done} Attempted ✅</span>
        <span class="quiz-summary-stat"><span class="stat-dot dot-not-attempted"></span>${notDone} Not Attempted ❌</span>
      `;
    }

    // Update filter button counts
    document.querySelectorAll('.quiz-filter-btn').forEach(btn => {
      const countSpan = btn.querySelector('.filter-count');
      if (!countSpan) return;
      if (btn.dataset.filter === 'all') countSpan.textContent = count;
      if (btn.dataset.filter === 'attempted') countSpan.textContent = done;
      if (btn.dataset.filter === 'not-attempted') countSpan.textContent = notDone;
    });

    // Update each quiz card
    document.querySelectorAll('#quiz-grid .quiz-card').forEach((card, index) => {
      const quizId = card.dataset.quizId || String(index + 1);
      card.dataset.quizId = quizId;
      const isAttempted = Boolean(state.attempted[quizId]);
      card.classList.toggle('is-attempted', isAttempted);

      // Add or update mark button
      let markBtn = card.querySelector('.quiz-mark-btn');
      if (!markBtn) {
        markBtn = document.createElement('button');
        markBtn.type = 'button';
        markBtn.className = 'quiz-mark-btn';
        markBtn.addEventListener('click', (e) => toggleMark(quizId, e));
        card.append(markBtn);
      }
      markBtn.classList.toggle('is-marked', isAttempted);
      markBtn.innerHTML = isAttempted
        ? '✅ Attempted — Click to Unmark'
        : '☐ Not Attempted — Click to Mark';
      markBtn.title = isAttempted
        ? 'Click to unmark this quiz as not attempted'
        : 'Click to mark this quiz as attempted';
    });

    // Re-apply current filter
    applyFilter(currentFilter);
  }

  // ── Install progress bar + filter bar ───────────────────────────────────
  function installProgress() {
    const grid = document.querySelector('#quiz-grid');
    if (!grid) return;

    // Install filter bar
    if (!document.querySelector('.quiz-filter-bar')) {
      const filterBar = document.createElement('div');
      filterBar.className = 'quiz-filter-bar';
      filterBar.innerHTML = `
        <span class="filter-label">Filter:</span>
        <button type="button" class="quiz-filter-btn active" data-filter="all">
          All <span class="filter-count">0</span>
        </button>
        <button type="button" class="quiz-filter-btn" data-filter="attempted">
          ✅ Attempted <span class="filter-count">0</span>
        </button>
        <button type="button" class="quiz-filter-btn" data-filter="not-attempted">
          ❌ Not Attempted <span class="filter-count">0</span>
        </button>
      `;
      filterBar.querySelectorAll('.quiz-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
      });
      grid.before(filterBar);
    }

    // Install progress bar
    if (!document.querySelector('.study-progress')) {
      const progress = document.createElement('section');
      progress.className = 'study-progress';
      progress.innerHTML = `
        <div class="study-progress__top">
          <span>Test Series Completion</span>
          <strong data-progress-count></strong>
        </div>
        <div class="study-progress__track"><div class="study-progress__fill"></div></div>
        <div class="quiz-summary-stats"></div>
        <small class="study-progress__note">Click the ☐ button on any quiz card to manually mark it as attempted. Use filter buttons to see only attempted or not-attempted quizzes.</small>
      `;
      const filterBar = document.querySelector('.quiz-filter-bar');
      if (filterBar) {
        filterBar.before(progress);
      } else {
        grid.before(progress);
      }
    }

    refresh();
    new MutationObserver(refresh).observe(grid, { childList: true });
  }

  // ── Watch loaded quiz iframe for score (auto-mark on complete) ──────────
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

        // Listen for score on finish/submit — auto-mark as attempted
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
