/* ==========================================================================
   COSMIC QUIZ MASTER — Individual Quiz Mark / Unmark Progress Tracker
   - Har quiz card ke NEECHE ek alag Mark / Unmark button
   - Filter: All | Attempted | Not Attempted
   - Progress bar showing completion stats
   - Data saves in localStorage per hub page
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
  // ── Storage ──────────────────────────────────────────────────────────────
  const storageKey = `cq-mark:${location.pathname}`;
  function readMarks() {
    try { return JSON.parse(localStorage.getItem(storageKey)) || {}; }
    catch { return {}; }
  }
  function saveMarks(data) {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch(e) {}
  }

  let marks = readMarks();
  let activeFilter = 'all'; // 'all' | 'attempted' | 'not-attempted'

  // ── Toggle mark for one quiz ─────────────────────────────────────────────
  function toggleMark(quizId) {
    marks = readMarks();
    if (marks[quizId]) {
      delete marks[quizId];
    } else {
      marks[quizId] = true;
    }
    saveMarks(marks);
    refreshAll();
  }

  // ── Inject CSS once ──────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('cq-mark-style')) return;
    const st = document.createElement('style');
    st.id = 'cq-mark-style';
    st.textContent = `
      /* Wrapper that groups card + mark button */
      .cq-card-wrap {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      /* Make the original quiz card fill wrapper */
      .cq-card-wrap > .quiz-card {
        flex: 1 1 auto;
        margin: 0 !important;
        border-bottom-left-radius: 0 !important;
        border-bottom-right-radius: 0 !important;
      }

      /* Attempted card highlight */
      .cq-card-wrap.cq-done > .quiz-card {
        border-top-color: #10b981 !important;
        border-left-color: #10b981 !important;
        border-right-color: #10b981 !important;
        box-shadow: 0 0 0 2px #10b981 !important;
        border-bottom-left-radius: 0 !important;
        border-bottom-right-radius: 0 !important;
      }

      /* Status badge on top-right of card */
      .cq-card-wrap > .quiz-card {
        position: relative !important;
      }
      .cq-status-badge {
        position: absolute;
        top: 7px;
        right: 9px;
        font-size: 15px;
        line-height: 1;
        pointer-events: none;
        z-index: 2;
      }

      /* Mark / Unmark Button — sits directly below the quiz card */
      .cq-mark-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        padding: 9px 12px;
        border: 2px solid #10b981;
        border-top: none;
        border-bottom-left-radius: 10px;
        border-bottom-right-radius: 10px;
        background: rgba(16,185,129,0.08);
        color: #10b981;
        font-size: 11.5px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        cursor: pointer;
        transition: background 0.18s, color 0.18s, border-color 0.18s;
        font-family: inherit;
      }
      .cq-mark-btn:hover {
        background: rgba(16,185,129,0.22);
      }
      /* Not-attempted state */
      .cq-card-wrap:not(.cq-done) .cq-mark-btn {
        border-color: rgba(148,163,184,0.4);
        background: rgba(148,163,184,0.06);
        color: rgba(148,163,184,0.8);
      }
      .cq-card-wrap:not(.cq-done) .cq-mark-btn:hover {
        border-color: #10b981;
        background: rgba(16,185,129,0.1);
        color: #10b981;
      }

      /* Filter bar */
      .cq-filter-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin: 14px 0 16px;
        padding: 10px 14px;
        border-radius: 10px;
        background: rgba(255,255,255,0.07);
        border: 1px solid rgba(255,255,255,0.1);
      }
      .cq-filter-label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        opacity: 0.55;
        flex-shrink: 0;
      }
      .cq-filter-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 6px 13px;
        border-radius: 999px;
        border: 1.5px solid rgba(255,255,255,0.18);
        background: transparent;
        color: inherit;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.18s;
        font-family: inherit;
        white-space: nowrap;
      }
      .cq-filter-btn:hover {
        border-color: rgba(56,189,248,0.5);
        background: rgba(56,189,248,0.08);
      }
      .cq-filter-btn.cq-active {
        background: #0284c7;
        color: #fff;
        border-color: #0284c7;
      }
      .cq-filter-btn .cq-cnt {
        display: inline-block;
        min-width: 18px;
        padding: 1px 4px;
        border-radius: 8px;
        background: rgba(255,255,255,0.18);
        font-size: 10px;
        font-weight: 800;
        text-align: center;
      }
      .cq-filter-btn.cq-active .cq-cnt {
        background: rgba(255,255,255,0.3);
      }

      /* Progress bar */
      .cq-progress-wrap {
        margin: 0 0 14px;
        padding: 14px 16px;
        border-radius: 12px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.12);
        backdrop-filter: blur(6px);
      }
      .cq-progress-top {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-size: 13px;
        font-weight: 600;
        opacity: 0.9;
      }
      .cq-progress-top strong { color: #38bdf8; }
      .cq-progress-track {
        height: 7px;
        margin-top: 9px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255,255,255,0.12);
      }
      .cq-progress-fill {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #0284c7, #10b981);
        transition: width 0.35s ease;
      }
      .cq-progress-stats {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        margin-top: 8px;
        font-size: 11.5px;
        font-weight: 600;
        opacity: 0.7;
      }

      /* Hidden cards when filtered */
      .cq-card-wrap.cq-hidden {
        display: none !important;
      }

      /* Responsive: keep grid working with wrapper as grid item */
      #quiz-grid {
        /* grid is already set by each hub's CSS; wrappers become the grid items */
      }
    `;
    document.head.append(st);
  }

  // ── Build / refresh progress bar ─────────────────────────────────────────
  function upsertProgressBar(total, done) {
    const pct = total ? Math.round(done / total * 100) : 0;
    let wrap = document.querySelector('.cq-progress-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'cq-progress-wrap';
      const grid = document.querySelector('#quiz-grid');
      if (grid) grid.before(wrap);
    }
    wrap.innerHTML = `
      <div class="cq-progress-top">
        <span>📊 Progress</span>
        <strong>${done} / ${total} Attempted (${pct}%)</strong>
      </div>
      <div class="cq-progress-track"><div class="cq-progress-fill" style="width:${pct}%"></div></div>
      <div class="cq-progress-stats">
        <span>✅ ${done} Attempted</span>
        <span>❌ ${total - done} Not Attempted</span>
        <span>📋 ${total} Total</span>
      </div>
    `;
  }

  // ── Build / refresh filter bar ───────────────────────────────────────────
  function upsertFilterBar(total, done) {
    const notDone = total - done;
    let bar = document.querySelector('.cq-filter-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'cq-filter-bar';
      const grid = document.querySelector('#quiz-grid');
      if (grid) grid.before(bar);

      const makeBtn = (filter, icon, label) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cq-filter-btn' + (filter === 'all' ? ' cq-active' : '');
        btn.dataset.filter = filter;
        btn.innerHTML = `${icon} ${label} <span class="cq-cnt">0</span>`;
        btn.addEventListener('click', () => {
          activeFilter = filter;
          document.querySelectorAll('.cq-filter-btn').forEach(b => {
            b.classList.toggle('cq-active', b.dataset.filter === filter);
          });
          applyFilter();
        });
        bar.append(btn);
      };

      const lbl = document.createElement('span');
      lbl.className = 'cq-filter-label';
      lbl.textContent = 'Show:';
      bar.append(lbl);

      makeBtn('all', '📋', 'All');
      makeBtn('attempted', '✅', 'Attempted');
      makeBtn('not-attempted', '❌', 'Not Attempted');
    }

    // Update counts
    const btns = bar.querySelectorAll('.cq-filter-btn .cq-cnt');
    if (btns[0]) btns[0].textContent = total;
    if (btns[1]) btns[1].textContent = done;
    if (btns[2]) btns[2].textContent = notDone;
  }

  // ── Apply filter visibility ──────────────────────────────────────────────
  function applyFilter() {
    document.querySelectorAll('#quiz-grid .cq-card-wrap').forEach(wrap => {
      const isDone = wrap.classList.contains('cq-done');
      let show = true;
      if (activeFilter === 'attempted') show = isDone;
      if (activeFilter === 'not-attempted') show = !isDone;
      wrap.classList.toggle('cq-hidden', !show);
    });
  }

  // ── Wrap each quiz card & add mark button below it ───────────────────────
  function wrapCards() {
    const grid = document.querySelector('#quiz-grid');
    if (!grid) return;

    // Get all direct quiz-card children that are NOT yet wrapped
    const rawCards = Array.from(grid.querySelectorAll(':scope > .quiz-card'));
    rawCards.forEach((card, idx) => {
      const quizId = card.dataset.quizId || String(idx + 1);
      card.dataset.quizId = quizId;

      // Create wrapper
      const wrap = document.createElement('div');
      wrap.className = 'cq-card-wrap';
      wrap.dataset.quizId = quizId;
      grid.insertBefore(wrap, card);
      wrap.appendChild(card);

      // Add status badge inside card
      if (!card.querySelector('.cq-status-badge')) {
        const badge = document.createElement('span');
        badge.className = 'cq-status-badge';
        card.appendChild(badge);
      }

      // Add mark/unmark button BELOW card (sibling inside wrapper, not inside button)
      const markBtn = document.createElement('button');
      markBtn.type = 'button';
      markBtn.className = 'cq-mark-btn';
      markBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMark(quizId);
      });
      wrap.appendChild(markBtn);
    });
  }

  // ── Refresh all card states ──────────────────────────────────────────────
  function refreshAll() {
    marks = readMarks();

    const allWraps = document.querySelectorAll('#quiz-grid .cq-card-wrap');
    const total = allWraps.length;
    let done = 0;

    allWraps.forEach(wrap => {
      const quizId = wrap.dataset.quizId;
      const isAttempted = Boolean(marks[quizId]);
      if (isAttempted) done++;

      wrap.classList.toggle('cq-done', isAttempted);

      // Update badge
      const badge = wrap.querySelector('.cq-status-badge');
      if (badge) badge.textContent = isAttempted ? '✅' : '☐';

      // Update mark button text
      const btn = wrap.querySelector('.cq-mark-btn');
      if (btn) {
        btn.textContent = isAttempted
          ? '✅ Attempted — Click to Unmark'
          : '☐ Not Attempted — Click to Mark';
        btn.title = isAttempted
          ? 'Is quiz attempt kiya hai. Unmark karne ke liye click karo.'
          : 'Yeh quiz abhi attempt nahi ki. Mark karne ke liye click karo.';
      }
    });

    upsertProgressBar(total, done);
    upsertFilterBar(total, done);
    applyFilter();
  }

  // ── Watch iframe for auto-mark on finish ────────────────────────────────
  function watchFrame() {
    const frame = document.querySelector('.quiz-frame');
    if (!frame || frame.dataset.cqWatch) return;
    frame.dataset.cqWatch = '1';

    frame.addEventListener('load', () => {
      try {
        const doc = frame.contentDocument;
        if (!doc) return;

        if (window.TestbookCBTEngine) {
          window.TestbookCBTEngine.applyContrastSafeguard(doc);
        }

        doc.addEventListener('click', ev => {
          const btn = ev.target.closest('button');
          if (!btn || !/finish|submit|complete|result|summary/i.test(btn.textContent)) return;
          setTimeout(() => {
            const qId = decodeURIComponent(location.hash.replace(/^#quiz\//, ''));
            if (qId) {
              marks[qId] = true;
              saveMarks(marks);
              refreshAll();
            }
          }, 0);
        }, true);
      } catch(e) {}
    });
  }

  // ── Main init ────────────────────────────────────────────────────────────
  injectStyles();

  function tick() {
    const grid = document.querySelector('#quiz-grid');
    if (!grid) return;

    // Check if new raw cards appeared (from search re-render)
    const rawCards = grid.querySelectorAll(':scope > .quiz-card');
    if (rawCards.length > 0) {
      wrapCards();
    }

    refreshAll();
    watchFrame();
  }

  tick();
  window.addEventListener('hashchange', () => setTimeout(tick, 80));

  // Re-run when grid re-renders (search filter, etc.)
  const grid = document.querySelector('#quiz-grid');
  if (grid) {
    new MutationObserver(() => setTimeout(tick, 80)).observe(grid, { childList: true });
  }

  setInterval(tick, 1500);
})();
