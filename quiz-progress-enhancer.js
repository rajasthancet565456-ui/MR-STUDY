/* ================================================================
   COSMIC QUIZ — Manual Mark / Unmark per quiz card
   ================================================================ */

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

(function () {
  var STORE = 'cq-marks:' + location.pathname;
  var activeFilter = 'all';

  function getMarks() {
    try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { return {}; }
  }
  function saveMarks(m) {
    try { localStorage.setItem(STORE, JSON.stringify(m)); } catch (e) {}
  }

  /* ---- Toggle one quiz ---- */
  function toggle(id) {
    var m = getMarks();
    if (m[id]) { delete m[id]; } else { m[id] = 1; }
    saveMarks(m);
    updateAll();
  }

  /* ---- Update button colours + text ---- */
  function updateAll() {
    var m = getMarks();
    var wraps = document.querySelectorAll('#quiz-grid .cq-wrap');
    var total = wraps.length;
    var done = 0;

    for (var i = 0; i < wraps.length; i++) {
      var wrap = wraps[i];
      var id = wrap.getAttribute('data-cq');
      var isMarked = !!m[id];
      if (isMarked) done++;

      var btn = wrap.querySelector('.cq-mbtn');
      if (!btn) continue;

      if (isMarked) {
        btn.textContent = '✅  Attempted  —  Unmark karne ke liye click karo';
        btn.style.background = 'rgba(16,185,129,0.18)';
        btn.style.borderColor = '#10b981';
        btn.style.color = '#10b981';
        btn.style.borderTop = 'none';
      } else {
        btn.textContent = '❌  Not Attempted  —  Mark karne ke liye click karo';
        btn.style.background = 'rgba(30,41,59,0.9)';
        btn.style.borderColor = 'rgba(100,116,139,0.5)';
        btn.style.color = '#94a3b8';
        btn.style.borderTop = 'none';
      }
    }

    updateProgress(total, done);
    updateCounts(total, done);
    applyFilter();
  }

  /* ---- Progress bar ---- */
  function updateProgress(total, done) {
    var pct = total ? Math.round(done / total * 100) : 0;
    var el = document.getElementById('cq-progress-bar');
    if (!el) return;
    el.innerHTML =
      '<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;">' +
        '<span>📊 Progress</span>' +
        '<span style="color:#38bdf8;">' + done + ' / ' + total + ' Attempted (' + pct + '%)</span>' +
      '</div>' +
      '<div style="height:8px;margin-top:8px;border-radius:999px;background:rgba(255,255,255,0.12);overflow:hidden;">' +
        '<div style="height:100%;border-radius:inherit;background:linear-gradient(90deg,#0284c7,#10b981);width:' + pct + '%;transition:width 0.35s;"></div>' +
      '</div>' +
      '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:7px;font-size:11px;font-weight:600;opacity:0.7;">' +
        '<span>✅ ' + done + ' Attempted</span>' +
        '<span>❌ ' + (total - done) + ' Not Attempted</span>' +
        '<span>📋 ' + total + ' Total</span>' +
      '</div>';
  }

  /* ---- Filter counts ---- */
  function updateCounts(total, done) {
    var el;
    el = document.getElementById('cq-f-all');    if (el) el.textContent = total;
    el = document.getElementById('cq-f-done');   if (el) el.textContent = done;
    el = document.getElementById('cq-f-undone'); if (el) el.textContent = total - done;
  }

  /* ---- Apply filter ---- */
  function applyFilter() {
    var wraps = document.querySelectorAll('#quiz-grid .cq-wrap');
    var m = getMarks();
    for (var i = 0; i < wraps.length; i++) {
      var wrap = wraps[i];
      var id = wrap.getAttribute('data-cq');
      var isMarked = !!m[id];
      var show = true;
      if (activeFilter === 'attempted')     show = isMarked;
      if (activeFilter === 'not-attempted') show = !isMarked;
      wrap.style.display = show ? '' : 'none';
    }
  }

  /* ---- Build progress + filter bar above grid ---- */
  function buildUI() {
    var grid = document.getElementById('quiz-grid');
    if (!grid) return;

    /* Progress bar */
    if (!document.getElementById('cq-progress-bar')) {
      var pb = document.createElement('div');
      pb.id = 'cq-progress-bar';
      pb.style.cssText = 'margin-bottom:12px;padding:13px 16px;border-radius:12px;' +
        'border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);';
      grid.parentNode.insertBefore(pb, grid);
    }

    /* Filter bar */
    if (!document.getElementById('cq-filter-bar')) {
      var fb = document.createElement('div');
      fb.id = 'cq-filter-bar';
      fb.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;gap:7px;' +
        'margin-bottom:14px;padding:9px 13px;border-radius:10px;' +
        'border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);';

      fb.innerHTML =
        '<span style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;opacity:0.55;margin-right:4px;">Show:</span>' +
        '<button type="button" data-f="all"          style="' + btnStyle(true)  + '">📋 All <span id="cq-f-all" style="' + cntStyle() + '">0</span></button>' +
        '<button type="button" data-f="attempted"    style="' + btnStyle(false) + '">✅ Attempted <span id="cq-f-done" style="' + cntStyle() + '">0</span></button>' +
        '<button type="button" data-f="not-attempted" style="' + btnStyle(false) + '">❌ Not Attempted <span id="cq-f-undone" style="' + cntStyle() + '">0</span></button>';

      /* Click handlers */
      var btns = fb.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        (function (b) {
          b.addEventListener('click', function () {
            activeFilter = b.getAttribute('data-f');
            for (var j = 0; j < btns.length; j++) {
              btns[j].style.background = 'transparent';
              btns[j].style.borderColor = 'rgba(255,255,255,0.2)';
              btns[j].style.color = 'inherit';
            }
            b.style.background = '#0284c7';
            b.style.borderColor = '#0284c7';
            b.style.color = '#fff';
            applyFilter();
          });
        })(btns[i]);
      }

      var pb2 = document.getElementById('cq-progress-bar');
      if (pb2) { pb2.parentNode.insertBefore(fb, pb2.nextSibling); }
      else { grid.parentNode.insertBefore(fb, grid); }
    }
  }

  function btnStyle(active) {
    return 'padding:5px 12px;border-radius:999px;border:1.5px solid ' +
      (active ? '#0284c7' : 'rgba(255,255,255,0.2)') + ';background:' +
      (active ? '#0284c7' : 'transparent') + ';color:' +
      (active ? '#fff' : 'inherit') + ';font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;';
  }
  function cntStyle() {
    return 'display:inline-block;min-width:16px;padding:0 4px;border-radius:8px;' +
      'background:rgba(255,255,255,0.22);font-size:10px;font-weight:800;text-align:center;margin-left:3px;';
  }

  /* ---- Wrap cards ---- */
  function wrapCards() {
    var grid = document.getElementById('quiz-grid');
    if (!grid) return 0;

    /* Only direct-child quiz-card buttons that are not yet wrapped */
    var raw = grid.querySelectorAll(':scope > button.quiz-card');
    if (!raw || raw.length === 0) {
      /* Some hubs use div.quiz-card */
      raw = grid.querySelectorAll(':scope > .quiz-card:not(.cq-wrapped)');
    }
    if (!raw || raw.length === 0) return 0;

    for (var i = 0; i < raw.length; i++) {
      var card = raw[i];
      if (card.classList.contains('cq-wrapped')) continue;
      card.classList.add('cq-wrapped');

      var id = String(i + 1);

      /* Wrapper div */
      var wrap = document.createElement('div');
      wrap.className = 'cq-wrap';
      wrap.setAttribute('data-cq', id);
      wrap.style.cssText = 'display:flex;flex-direction:column;';

      /* Move card into wrapper */
      grid.insertBefore(wrap, card);
      wrap.appendChild(card);

      /* Adjust card border-radius so it connects with button below */
      card.style.borderBottomLeftRadius = '0';
      card.style.borderBottomRightRadius = '0';
      card.style.marginBottom = '0';

      /* Mark / Unmark button — BELOW the card */
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cq-mbtn';
      btn.style.cssText =
        'display:block;width:100%;padding:9px 10px;' +
        'border:1.5px solid rgba(100,116,139,0.5);border-top:none;' +
        'border-radius:0 0 10px 10px;' +
        'background:rgba(30,41,59,0.9);color:#94a3b8;' +
        'font-size:12px;font-weight:700;cursor:pointer;' +
        'font-family:inherit;text-align:center;letter-spacing:0.03em;' +
        'transition:background 0.2s,color 0.2s,border-color 0.2s;flex-shrink:0;';

      (function (capturedId) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          e.preventDefault();
          toggle(capturedId);
        });
      })(id);

      wrap.appendChild(btn);
    }

    return raw.length;
  }

  /* ---- Main run function ---- */
  function run() {
    buildUI();
    wrapCards();
    updateAll();
  }

  /* ---- Run multiple times to be sure ---- */
  run();
  setTimeout(run, 100);
  setTimeout(run, 500);
  setTimeout(run, 1200);

  /* ---- Hash change (library → quiz → library) ---- */
  window.addEventListener('hashchange', function () {
    setTimeout(run, 150);
    setTimeout(run, 500);
  });

  /* ---- Watch grid for re-renders (search filter) ---- */
  var gridEl = document.getElementById('quiz-grid');
  if (gridEl) {
    new MutationObserver(function () {
      setTimeout(run, 120);
    }).observe(gridEl, { childList: true });
  }

  /* ---- Interval safety net ---- */
  setInterval(function () {
    var unwrapped = document.querySelectorAll('#quiz-grid > .quiz-card:not(.cq-wrapped)');
    if (unwrapped && unwrapped.length > 0) run();
  }, 1000);

})();
