/* ==========================================================================
   COSMIC QUIZ MASTER — Quiz Mark / Unmark Tool
   Har quiz card ke neeche ek button:
     ❌ Not Attempted  →  click karo  →  ✅ Attempted
     ✅ Attempted      →  click karo  →  ❌ Not Attempted
   Filter: All | ✅ Attempted | ❌ Not Attempted
   Data localStorage mein save hota hai (browser band karo/kholo — rahega)
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
  /* ── Storage ── */
  const STORE_KEY = 'cq-marks:' + location.pathname;
  const getMarks  = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { return {}; } };
  const saveMarks = (m) => { try { localStorage.setItem(STORE_KEY, JSON.stringify(m)); } catch (_) {} };

  let activeFilter = 'all'; // 'all' | 'attempted' | 'not-attempted'

  /* ── Toggle one quiz ── */
  function toggle(id) {
    const m = getMarks();
    if (m[id]) delete m[id];
    else m[id] = 1;
    saveMarks(m);
    refresh();
  }

  /* ── Inject one-time CSS (inline styles as fallback for theme conflicts) ── */
  function injectCSS() {
    if (document.getElementById('cq-style')) return;
    const s = document.createElement('style');
    s.id = 'cq-style';
    s.textContent = `
      #quiz-grid { display: grid; }

      /* Wrapper — becomes the grid cell */
      .cq-wrap {
        display: flex !important;
        flex-direction: column !important;
        gap: 0 !important;
      }

      /* Quiz card top-right badge */
      .cq-wrap .quiz-card {
        position: relative !important;
        border-bottom-left-radius: 0 !important;
        border-bottom-right-radius: 0 !important;
        flex: 1 !important;
      }

      .cq-badge {
        position: absolute !important;
        top: 6px !important;
        right: 8px !important;
        font-size: 15px !important;
        line-height: 1 !important;
        pointer-events: none !important;
        z-index: 3 !important;
      }

      /* ✅ Attempted card border */
      .cq-wrap.cq-done .quiz-card {
        border-color: #10b981 !important;
        box-shadow: 0 0 0 2px #10b981, 0 4px 14px rgba(16,185,129,0.18) !important;
      }

      /* Mark / Unmark button — BELOW the card */
      .cq-btn {
        width: 100% !important;
        padding: 9px 12px !important;
        border: 2px solid !important;
        border-top: none !important;
        border-bottom-left-radius: 10px !important;
        border-bottom-right-radius: 10px !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        font-family: inherit !important;
        text-align: center !important;
        letter-spacing: 0.04em !important;
        transition: opacity 0.15s, transform 0.1s !important;
        flex-shrink: 0 !important;
      }
      .cq-btn:active {
        transform: scale(0.97) !important;
        opacity: 0.85 !important;
      }

      /* Not-attempted style */
      .cq-wrap:not(.cq-done) .cq-btn {
        border-color: rgba(239,68,68,0.5) !important;
        background: rgba(239,68,68,0.08) !important;
        color: #ef4444 !important;
      }
      .cq-wrap:not(.cq-done) .cq-btn:hover {
        background: rgba(239,68,68,0.18) !important;
      }

      /* Attempted style */
      .cq-wrap.cq-done .cq-btn {
        border-color: #10b981 !important;
        background: rgba(16,185,129,0.15) !important;
        color: #10b981 !important;
      }
      .cq-wrap.cq-done .cq-btn:hover {
        background: rgba(239,68,68,0.12) !important;
        border-color: #ef4444 !important;
        color: #ef4444 !important;
      }

      /* Progress bar */
      .cq-progress {
        margin-bottom: 14px !important;
        padding: 13px 16px !important;
        border-radius: 12px !important;
        border: 1px solid rgba(255,255,255,0.14) !important;
        background: rgba(255,255,255,0.06) !important;
        backdrop-filter: blur(6px) !important;
      }
      .cq-progress-top {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        font-size: 13px !important;
        font-weight: 700 !important;
      }
      .cq-progress-num { color: #38bdf8 !important; }
      .cq-progress-track {
        height: 8px !important;
        margin-top: 8px !important;
        border-radius: 999px !important;
        background: rgba(255,255,255,0.14) !important;
        overflow: hidden !important;
      }
      .cq-progress-fill {
        height: 100% !important;
        border-radius: inherit !important;
        background: linear-gradient(90deg, #0284c7, #10b981) !important;
        transition: width 0.35s ease !important;
      }
      .cq-progress-stats {
        display: flex !important;
        gap: 14px !important;
        flex-wrap: wrap !important;
        margin-top: 7px !important;
        font-size: 11.5px !important;
        font-weight: 600 !important;
        opacity: 0.7 !important;
      }

      /* Filter bar */
      .cq-filters {
        display: flex !important;
        flex-wrap: wrap !important;
        align-items: center !important;
        gap: 7px !important;
        margin-bottom: 16px !important;
        padding: 9px 13px !important;
        border-radius: 10px !important;
        border: 1px solid rgba(255,255,255,0.1) !important;
        background: rgba(255,255,255,0.05) !important;
      }
      .cq-filter-lbl {
        font-size: 11px !important;
        font-weight: 700 !important;
        letter-spacing: 0.1em !important;
        text-transform: uppercase !important;
        opacity: 0.5 !important;
      }
      .cq-fbtn {
        padding: 5px 12px !important;
        border-radius: 999px !important;
        border: 1.5px solid rgba(255,255,255,0.2) !important;
        background: transparent !important;
        color: inherit !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        font-family: inherit !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 5px !important;
        transition: all 0.18s !important;
      }
      .cq-fbtn:hover { background: rgba(56,189,248,0.12) !important; border-color: #38bdf8 !important; }
      .cq-fbtn.cq-factive { background: #0284c7 !important; color: #fff !important; border-color: #0284c7 !important; }
      .cq-fbtn .cq-fc {
        display: inline-block !important;
        min-width: 16px !important;
        padding: 0 4px !important;
        border-radius: 8px !important;
        background: rgba(255,255,255,0.2) !important;
        font-size: 10px !important;
        font-weight: 800 !important;
        text-align: center !important;
      }

      /* Hidden by filter */
      .cq-wrap.cq-hidden { display: none !important; }
    `;
    document.head.append(s);
  }

  /* ── Refresh all card states ── */
  function refresh() {
    const m      = getMarks();
    const wraps  = Array.from(document.querySelectorAll('#quiz-grid .cq-wrap'));
    const total  = wraps.length;
    let   done   = 0;

    wraps.forEach(wrap => {
      const id       = wrap.dataset.cqId;
      const isMarked = !!m[id];
      if (isMarked) done++;

      wrap.classList.toggle('cq-done', isMarked);

      // Badge
      const badge = wrap.querySelector('.cq-badge');
      if (badge) badge.textContent = isMarked ? '✅' : '☐';

      // Button text & colour handled by CSS classes above
      const btn = wrap.querySelector('.cq-btn');
      if (btn) {
        btn.textContent = isMarked
          ? '✅ Attempted  —  Unmark karne ke liye click karo'
          : '❌ Not Attempted  —  Mark karne ke liye click karo';
      }
    });

    updateProgress(total, done);
    updateFilterCounts(total, done);
    applyFilter();
  }

  /* ── Progress bar ── */
  function updateProgress(total, done) {
    const pct  = total ? Math.round(done / total * 100) : 0;
    let   prog = document.querySelector('.cq-progress');

    if (!prog) {
      prog = document.createElement('div');
      prog.className = 'cq-progress';
      const grid = document.getElementById('quiz-grid');
      if (grid) {
        const filterBar = document.querySelector('.cq-filters');
        if (filterBar) filterBar.before(prog);
        else grid.before(prog);
      }
    }

    prog.innerHTML = `
      <div class="cq-progress-top">
        <span>📊 Progress</span>
        <span class="cq-progress-num">${done} / ${total} Attempted (${pct}%)</span>
      </div>
      <div class="cq-progress-track">
        <div class="cq-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="cq-progress-stats">
        <span>✅ ${done} Attempted</span>
        <span>❌ ${total - done} Not Attempted</span>
        <span>📋 ${total} Total</span>
      </div>
    `;
  }

  /* ── Filter bar ── */
  function buildFilterBar() {
    if (document.querySelector('.cq-filters')) return;

    const bar = document.createElement('div');
    bar.className = 'cq-filters';

    const lbl = document.createElement('span');
    lbl.className = 'cq-filter-lbl';
    lbl.textContent = 'Show:';
    bar.append(lbl);

    [
      ['all',          '📋 All',              ''],
      ['attempted',    '✅ Attempted',         ''],
      ['not-attempted','❌ Not Attempted',     ''],
    ].forEach(([filter, label]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cq-fbtn' + (filter === 'all' ? ' cq-factive' : '');
      btn.dataset.filter = filter;
      btn.innerHTML = `${label} <span class="cq-fc">0</span>`;
      btn.addEventListener('click', () => {
        activeFilter = filter;
        bar.querySelectorAll('.cq-fbtn').forEach(b =>
          b.classList.toggle('cq-factive', b.dataset.filter === filter));
        applyFilter();
      });
      bar.append(btn);
    });

    const grid = document.getElementById('quiz-grid');
    if (grid) grid.before(bar);
  }

  function updateFilterCounts(total, done) {
    const bar = document.querySelector('.cq-filters');
    if (!bar) return;
    const btns = bar.querySelectorAll('.cq-fbtn');
    btns.forEach(btn => {
      const fc = btn.querySelector('.cq-fc');
      if (!fc) return;
      if (btn.dataset.filter === 'all')          fc.textContent = total;
      if (btn.dataset.filter === 'attempted')    fc.textContent = done;
      if (btn.dataset.filter === 'not-attempted') fc.textContent = total - done;
    });
  }

  function applyFilter() {
    document.querySelectorAll('#quiz-grid .cq-wrap').forEach(wrap => {
      const isMarked = wrap.classList.contains('cq-done');
      let show = true;
      if (activeFilter === 'attempted')     show = isMarked;
      if (activeFilter === 'not-attempted') show = !isMarked;
      wrap.classList.toggle('cq-hidden', !show);
    });
  }

  /* ── Wrap quiz cards ── */
  function wrapCards() {
    const grid = document.getElementById('quiz-grid');
    if (!grid) return;

    // Only unwrapped direct-child quiz cards
    const raw = Array.from(grid.querySelectorAll(':scope > .quiz-card'));
    if (!raw.length) return;

    raw.forEach((card, idx) => {
      const id = String(idx + 1);
      card.dataset.quizId = id;

      // Create wrapper
      const wrap = document.createElement('div');
      wrap.className = 'cq-wrap';
      wrap.dataset.cqId = id;

      // Insert wrapper before card, move card inside
      grid.insertBefore(wrap, card);
      wrap.appendChild(card);

      // Status badge (non-interactive, inside the card)
      if (!card.querySelector('.cq-badge')) {
        const badge = document.createElement('span');
        badge.className = 'cq-badge';
        card.appendChild(badge);
      }

      // Mark / Unmark button — BELOW the card, OUTSIDE the card button
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cq-btn';
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // don't open quiz
        toggle(id);
      });
      wrap.appendChild(btn);
    });

    refresh();
  }

  /* ── Init ── */
  function init() {
    injectCSS();
    buildFilterBar();
    wrapCards();
    refresh();
  }

  // Run immediately if DOM ready, else wait
  if (document.readyState !== 'loading') {
    setTimeout(init, 50);
  } else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 50));
  }

  // Re-run on hash change (switching library → quiz → library)
  window.addEventListener('hashchange', () => setTimeout(init, 150));

  // Watch grid for re-renders (search filter uses replaceChildren)
  const gridEl = document.getElementById('quiz-grid');
  if (gridEl) {
    new MutationObserver(() => setTimeout(init, 80)).observe(gridEl, { childList: true });
  } else {
    // Grid might not exist yet — wait for it
    const bodyObserver = new MutationObserver(() => {
      const g = document.getElementById('quiz-grid');
      if (g) {
        bodyObserver.disconnect();
        new MutationObserver(() => setTimeout(init, 80)).observe(g, { childList: true });
        init();
      }
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }

  // Interval as backup safety net
  setInterval(() => {
    const raw = document.querySelectorAll('#quiz-grid > .quiz-card');
    if (raw.length) init();
  }, 1500);
})();
