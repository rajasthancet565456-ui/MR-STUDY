/* Shared progress controls for every Cosmic Quiz library. */
if (!document.getElementById('universe-theme-loader') && !document.getElementById('theme-toggle')) { const themeLoader = document.createElement('script'); themeLoader.id = 'universe-theme-loader'; themeLoader.src = 'theme-controller.js'; document.head.append(themeLoader); }
const existingThemeToggle = document.getElementById('theme-toggle'); if (existingThemeToggle) { try { const savedTheme = localStorage.getItem('quiz-universe-theme') || 'light'; if (document.documentElement.dataset.theme !== savedTheme) existingThemeToggle.click(); existingThemeToggle.addEventListener('click', () => localStorage.setItem('quiz-universe-theme', document.documentElement.dataset.theme)); } catch {} }
(() => {
  const key = `cosmic-quiz-progress:${location.pathname}`;
  const read = () => { try { return JSON.parse(localStorage.getItem(key)) || { attempted: {}, scores: {} }; } catch { return { attempted: {}, scores: {} }; } };
  let state = read();
  const save = () => localStorage.setItem(key, JSON.stringify(state));
  const id = () => decodeURIComponent(location.hash.replace(/^#quiz\//, ''));
  const total = () => document.querySelectorAll('#quiz-grid .quiz-card').length || Number((document.querySelector('#counter')?.textContent || '').match(/\d+/)?.[0]) || 0;
  const attempted = () => Object.keys(state.attempted).length;
  const addStyle = () => {
    const css = `.study-progress{margin:0 0 25px;padding:18px 19px;border:1px solid var(--line,rgba(118,84,204,.3));border-radius:12px;background:rgba(255,255,255,.12);box-shadow:0 10px 24px rgba(0,0,0,.08)}.study-progress__top{display:flex;justify-content:space-between;gap:14px;align-items:baseline;font:500 .68rem 'DM Mono',monospace;letter-spacing:.08em;text-transform:uppercase}.study-progress__top strong{color:var(--gold,#d8952c);font-size:.83rem}.study-progress__track,.quiz-card__track{height:9px;margin-top:11px;overflow:hidden;border-radius:999px;background:rgba(255,255,255,.22)}.study-progress__fill,.quiz-card__fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--gold,#d8952c),var(--pink,#d95ea6));transition:width .25s}.study-progress__note{display:block;margin-top:8px;color:var(--muted,#665878);font-size:.73rem;letter-spacing:0;text-transform:none}.quiz-card{position:relative}.quiz-card.is-attempted{border-color:var(--gold,#d8952c)}.quiz-card__report{position:relative;z-index:2;display:block;margin-top:13px;padding-top:10px;border-top:1px solid var(--line,rgba(255,255,255,.18));color:inherit;text-align:left}.quiz-card__report-top{display:flex;align-items:center;justify-content:space-between;gap:8px;font:600 .59rem 'DM Mono',monospace;letter-spacing:.06em;text-transform:uppercase}.quiz-card__report-top span{color:var(--gold,#d8952c)}.quiz-card__track{height:6px;margin-top:7px}.quiz-card__view-score{margin-top:8px;padding:0;border:0;background:none;color:var(--gold,#d8952c);font:600 .63rem 'DM Mono',monospace;letter-spacing:.05em;text-transform:uppercase;cursor:pointer}.quiz-card__view-score:hover{text-decoration:underline}.score-reveal{min-width:104px}.quiz-page{padding-bottom:78px}.question-nav-dock{position:fixed;z-index:50;left:50%;bottom:12px;transform:translateX(-50%);display:flex;align-items:center;gap:8px;width:min(710px,calc(100% - 28px));padding:10px 12px;border:1px solid var(--line,rgba(118,84,204,.35));border-radius:13px;background:rgba(8,17,30,.96);box-shadow:0 14px 38px rgba(0,0,0,.32);backdrop-filter:blur(12px)}.question-nav-dock .button{white-space:nowrap}.question-nav-dock input{width:58px;height:34px;border:1px solid var(--line,rgba(255,255,255,.3));border-radius:7px;background:rgba(255,255,255,.96);color:#271946;text-align:center;font:600 .74rem 'DM Mono',monospace}.question-nav-label{margin-right:auto;color:var(--gold,#d8952c);font:600 .64rem 'DM Mono',monospace;letter-spacing:.08em;text-transform:uppercase}.quiz-page:fullscreen{overflow:auto}.quiz-page:fullscreen .quiz-toolbar{position:sticky;top:0;z-index:4}.quiz-page:fullscreen .quiz-frame{height:calc(100vh - 77px)}@media(max-width:560px){.study-progress__top{font-size:.58rem}.quiz-actions{flex-wrap:wrap}.quiz-card__report-top{font-size:.53rem}.quiz-page{padding-bottom:126px}.question-nav-dock{flex-wrap:wrap;justify-content:space-between;bottom:7px;padding:8px}.question-nav-label{width:100%;margin:0;font-size:.55rem}.question-nav-dock .button{padding:7px 8px;font-size:.58rem}}`;
    const style = document.createElement('style'); style.textContent = css; document.head.append(style);
  };
  function refresh() {
    const count = total(), done = attempted(), percent = count ? Math.round(done / count * 100) : 0;
    const progress = document.querySelector('.study-progress');
    if (progress) { progress.querySelector('[data-progress-count]').textContent = `${done} of ${count} attempted · ${percent}%`; progress.querySelector('.study-progress__fill').style.width = `${percent}%`; progress.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', String(percent)); }
    document.querySelectorAll('#quiz-grid .quiz-card').forEach((card, index) => {
      const label = card.textContent;
      const quizId = card.dataset.quizId || (location.pathname.includes('hr-eklavya') ? (label.match(/\bD\s*(\d+)/i) ? `D${label.match(/\bD\s*(\d+)/i)[1]}` : `Q${label.match(/\b(?:Quizz|Quiz)\s*(\d+)/i)?.[1] || index + 1}`) : label.match(/(?:Quizz|Quiz|Mission|Vocabulary\s*Mission|D)[\s-]*(\d+)/i)?.[1] || String(index + 1));
      card.dataset.quizId = quizId;
      card.classList.toggle('is-attempted', Boolean(state.attempted[quizId]));
      const score = state.scores[quizId];
      let report = card.querySelector('.quiz-card__report');
      if (!report) { report = document.createElement('div'); report.className = 'quiz-card__report'; card.append(report); }
      if (score) {
        const scorePercent = Math.round(Number(score.score) / Number(score.total) * 100);
        report.innerHTML = `<div class="quiz-card__report-top"><span>Last attempt</span><b>Saved</b></div><div class="quiz-card__track"><div class="quiz-card__fill" style="width:${scorePercent}%"></div></div><button class="quiz-card__view-score" type="button">View last score</button>`;
        const view = report.querySelector('button'); view.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); view.textContent = `Last score: ${score.score} / ${score.total}`; view.disabled = true; });
      } else {
        report.innerHTML = `<div class="quiz-card__report-top"><span>${state.attempted[quizId] ? 'Attempted · score unavailable' : 'Not attempted'}</span><b>—</b></div><div class="quiz-card__track"><div class="quiz-card__fill" style="width:0%"></div></div>`;
      }
    });
  }
  function installProgress() {
    const grid = document.querySelector('#quiz-grid'); if (!grid || document.querySelector('.study-progress')) return;
    const progress = document.createElement('section'); progress.className = 'study-progress'; progress.setAttribute('aria-label', 'Quiz attempt progress');
    progress.innerHTML = `<div class="study-progress__top"><span>Your quiz progress</span><strong data-progress-count></strong></div><div class="study-progress__track" role="progressbar" aria-label="Attempted quizzes" aria-valuemin="0" aria-valuemax="100"><div class="study-progress__fill"></div></div><small class="study-progress__note">Mark a quiz when you finish it. You can remove it later at any time.</small>`;
    grid.before(progress); refresh(); new MutationObserver(refresh).observe(grid, { childList: true });
  }
  function markCurrent() {
    const quizId = id(); if (!quizId) return; if (state.attempted[quizId]) delete state.attempted[quizId]; else state.attempted[quizId] = true; save(); refresh(); updateActions();
  }
  function updateActions() {
    const quizId = id(), marked = Boolean(state.attempted[quizId]), score = state.scores[quizId];
    const mark = document.querySelector('#mark-attempted'); const reveal = document.querySelector('#reveal-score');
    if (mark) { mark.textContent = marked ? 'Remove attempted' : 'Mark attempted'; mark.setAttribute('aria-pressed', String(marked)); }
    if (reveal) { reveal.hidden = !score; reveal.textContent = score ? 'Show last score' : ''; }
  }
  function installActions() {
    const actions = document.querySelector('.quiz-actions'); if (!actions || document.querySelector('#mark-attempted')) return;
    const mark = document.createElement('button'); mark.id = 'mark-attempted'; mark.type = 'button'; mark.className = 'button'; mark.addEventListener('click', markCurrent);
    const reveal = document.createElement('button'); reveal.id = 'reveal-score'; reveal.type = 'button'; reveal.className = 'button score-reveal'; reveal.addEventListener('click', () => { const score = state.scores[id()]; if (score) { reveal.textContent = `Last score: ${score.score} / ${score.total}`; reveal.disabled = true; } });
    const fullscreen = document.createElement('button'); fullscreen.id = 'fullscreen-quiz'; fullscreen.type = 'button'; fullscreen.className = 'button'; fullscreen.textContent = 'Full screen'; fullscreen.addEventListener('click', async () => { const page = document.querySelector('#quiz-view'); if (document.fullscreenElement) await document.exitFullscreen(); else await page?.requestFullscreen?.(); }); document.addEventListener('fullscreenchange', () => { fullscreen.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen'; });
    const reset = document.createElement('button'); reset.type = 'button'; reset.className = 'button'; reset.textContent = 'Reset quiz'; reset.addEventListener('click', () => { const frame = document.querySelector('.quiz-frame'); try { if (frame?.contentWindow?.cosmicQuizReset) frame.contentWindow.cosmicQuizReset(); else if (frame) frame.src = frame.src; } catch { if (frame) frame.src = frame.src; } });
    actions.prepend(fullscreen, reset, reveal, mark); updateActions();
    const previousQuiz = actions.querySelector('#previous'), nextQuiz = actions.querySelector('#next');
    if (previousQuiz) { previousQuiz.hidden = false; previousQuiz.textContent = '← Previous quiz'; previousQuiz.title = 'Open the previous quiz'; }
    if (nextQuiz) { nextQuiz.hidden = false; nextQuiz.textContent = 'Next quiz →'; nextQuiz.title = 'Open the next quiz'; }
  }
  function installQuestionDock() {
    return; // The outer black navigation bar is disabled; native quiz controls remain enabled.
    const quizPage = document.querySelector('#quiz-view'); if (!quizPage || document.querySelector('#question-nav-dock')) return;
    const dock = document.createElement('nav'); dock.id = 'question-nav-dock'; dock.className = 'question-nav-dock'; dock.setAttribute('aria-label', 'Question navigation');
    dock.innerHTML = `<span class="question-nav-label">Question navigation</span><button class="button" type="button" data-question-action="prev">← Previous</button><button class="button" type="button" data-question-action="next">Next →</button><input type="number" min="1" inputmode="numeric" aria-label="Question number" placeholder="Q#"><button class="button" type="button" data-question-action="jump">Go</button>`;
    quizPage.append(dock);
    const getDoc = () => { try { return document.querySelector('.quiz-frame')?.contentDocument; } catch { return null; } };
    const clickQuestion = direction => { const quizDoc = getDoc(); const native = quizDoc?.querySelector(direction === 'prev' ? '#prev-btn, [data-action="previous"]' : '#next-btn, [data-action="next"]'); if (native && !native.disabled) native.click(); };
    const jump = () => { const value = Number(dock.querySelector('input').value); if (!value) return; const quizDoc = getDoc(), nativeInput = quizDoc?.querySelector('#jump-input'), nativeGo = quizDoc?.querySelector('#jump-btn'); if (nativeInput && nativeGo) { nativeInput.value = value; nativeGo.click(); } };
    dock.querySelector('[data-question-action="prev"]').addEventListener('click', () => clickQuestion('prev'));
    dock.querySelector('[data-question-action="next"]').addEventListener('click', () => clickQuestion('next'));
    dock.querySelector('[data-question-action="jump"]').addEventListener('click', jump);
    dock.querySelector('input').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); jump(); } });
    document.addEventListener('keydown', event => { if (!location.hash.startsWith('#quiz/') || event.target.matches('input,textarea,select,button')) return; if (event.key === 'ArrowLeft') { event.preventDefault(); clickQuestion('prev'); } else if (event.key === 'ArrowRight') { event.preventDefault(); clickQuestion('next'); } }, true);
  }
  function applyQuizAppUI(doc) {
    if (doc.getElementById('lavender-quiz-app-ui')) return;
    const style = doc.createElement('style'); style.id = 'lavender-quiz-app-ui'; style.textContent = `
      :root{--quiz-bg:#f0e6ff;--quiz-surface:#fbf7ff;--quiz-primary:#6542c8;--quiz-ink:#30205d;--quiz-muted:#716782;--quiz-line:#dccbf2;--quiz-hover:#f0e5ff;--quiz-accent:#f3a62a;--quiz-success:#3f9b68;--quiz-error:#c85b6d}
      html{background:var(--quiz-bg)!important}body{min-height:100vh!important;padding:28px 16px 112px!important;background:radial-gradient(circle at 100% 0,#e5d5fa 0,transparent 32%),linear-gradient(135deg,#f0e6ff,#faf7ff 58%,#eee4ff)!important;color:var(--quiz-ink)!important;font-family:Manrope,ui-sans-serif,system-ui,sans-serif!important}header{position:sticky!important;top:0!important;z-index:20!important;max-width:980px!important;margin:0 auto 20px!important;padding:15px 22px!important;border:1px solid var(--quiz-line)!important;border-radius:18px!important;background:#e5d5fa!important;color:var(--quiz-ink)!important;box-shadow:0 8px 22px rgba(70,42,139,.1)!important}header *{color:var(--quiz-ink)!important}main{max-width:980px!important;margin:auto!important}#quiz-card,main>div:not([class*='fixed']):not([class*='absolute']){max-width:900px!important;margin-left:auto!important;margin-right:auto!important;padding:clamp(22px,4vw,42px)!important;border:1px solid var(--quiz-line)!important;border-radius:24px!important;background:var(--quiz-surface)!important;color:var(--quiz-ink)!important;box-shadow:0 18px 42px rgba(70,42,139,.14)!important}#quiz-card *{color:inherit}#question-text,h1,h2,[data-question],.question-text{color:var(--quiz-ink)!important;font-size:clamp(1.35rem,2.2vw,1.62rem)!important;line-height:1.48!important;font-weight:800!important}#question-badge,[data-question-number],.question-number{display:inline-flex!important;align-items:center!important;min-height:30px!important;padding:5px 11px!important;border-radius:999px!important;background:#e9ddf8!important;color:var(--quiz-primary)!important;font-size:.76rem!important;font-weight:800!important;letter-spacing:.04em!important}.bg-slate-200,.bg-gray-200,.bg-gray-100,.bg-slate-100,#progress-track{background:#ddd9e8!important;border-radius:999px!important;overflow:hidden!important}.bg-indigo-500,.bg-purple-500,#progress-bar,[class*='progress']>div{background:linear-gradient(90deg,#6542c8,#8666db)!important;border-radius:inherit!important;transition:width .28s ease!important}.option,button[class*='option'],label[class*='option'],#options button,#options label,[role='radio']{width:100%!important;min-height:58px!important;margin:11px 0!important;padding:16px 18px!important;border:1.5px solid var(--quiz-line)!important;border-radius:14px!important;background:#fff!important;color:var(--quiz-ink)!important;text-align:left!important;font:700 .98rem/1.45 Manrope,system-ui,sans-serif!important;box-shadow:0 2px 6px rgba(70,42,139,.04)!important;transition:transform .16s ease,background .16s ease,border-color .16s ease,box-shadow .16s ease!important}.option:hover,button[class*='option']:hover,label[class*='option']:hover,#options button:hover,#options label:hover,[role='radio']:hover{transform:translateY(-1px)!important;background:var(--quiz-hover)!important;border-color:#a487df!important;box-shadow:0 7px 16px rgba(70,42,139,.1)!important}.selected,.option.selected,[aria-checked='true']{border-color:var(--quiz-primary)!important;background:#eee7ff!important;box-shadow:0 0 0 3px rgba(101,66,200,.15)!important}.correct,.is-correct{border-color:var(--quiz-success)!important;background:#e8f7ed!important}.incorrect,.is-incorrect{border-color:var(--quiz-error)!important;background:#ffedf0!important}button,input,select,textarea{font:inherit!important}button:focus-visible,input:focus-visible,label:focus-visible,[role='radio']:focus-visible{outline:3px solid var(--quiz-primary)!important;outline-offset:3px!important}.hint,[class*='hint'],#hint{border-radius:12px!important;background:#fff6d8!important;color:#614713!important}#cosmic-quiz-dock{background:rgba(251,247,255,.96)!important;border:1px solid var(--quiz-line)!important;border-radius:16px!important;box-shadow:0 14px 38px rgba(54,32,108,.2)!important;color:var(--quiz-ink)!important}#cosmic-quiz-dock button,#cosmic-quiz-dock input{border-color:var(--quiz-line)!important;background:#fff!important;color:var(--quiz-ink)!important}#cosmic-quiz-dock .cosmic-primary{background:var(--quiz-primary)!important;color:#fff!important;border-color:var(--quiz-primary)!important}.cosmic-dock-label{color:var(--quiz-muted)!important}@media(max-width:560px){body{padding:14px 10px 140px!important}header{padding:12px 14px!important;border-radius:14px!important}#quiz-card,main>div:not([class*='fixed']):not([class*='absolute']){padding:20px!important;border-radius:18px!important}.option,button[class*='option'],label[class*='option'],#options button,#options label{min-height:54px!important;padding:14px!important}}
    `; doc.head.append(style); doc.body.classList.add('lavender-quiz-app');
  }
  function decorateQuiz(doc) {
    if (doc.getElementById('cosmic-quiz-dock')) return;
    const prev = doc.querySelector('#prev-btn, #previous, #prevBtn');
    const next = doc.querySelector('#next-btn, #next, #nextBtn');
    if (!prev && !next) return;
    const sessionKey = `cosmic-quiz-session:${doc.location.pathname}`;
    const getSession = () => { try { return JSON.parse(localStorage.getItem(sessionKey)) || {}; } catch { return {}; } };
    const saveSession = data => localStorage.setItem(sessionKey, JSON.stringify({ ...getSession(), ...data, savedAt: Date.now() }));
    const style = doc.createElement('style'); style.textContent = `
      html{scroll-behavior:auto!important} body{padding-bottom:86px!important} header{position:sticky!important;top:0!important;z-index:20!important}
      #cosmic-quiz-dock{position:fixed;z-index:9999;left:50%;bottom:max(12px,env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;align-items:center;gap:8px;width:min(720px,calc(100vw - 24px));padding:10px 12px;border:1px solid rgba(92,57,168,.32);border-radius:14px;background:rgba(255,255,255,.96);box-shadow:0 14px 38px rgba(25,16,55,.23);font:600 12px system-ui,sans-serif;color:#281a4b;backdrop-filter:blur(12px)}
      #cosmic-quiz-dock button,#cosmic-quiz-dock input{min-height:38px;border:1px solid rgba(92,57,168,.28);border-radius:8px;background:#fff;color:#281a4b;font:inherit}#cosmic-quiz-dock button{padding:0 11px;cursor:pointer}#cosmic-quiz-dock button:hover{border-color:#7654cc;color:#5a3da4}#cosmic-quiz-dock .cosmic-primary{background:#7654cc;color:#fff;border-color:#7654cc}#cosmic-quiz-dock .cosmic-jump{display:flex;align-items:center;gap:5px;margin-left:auto}#cosmic-quiz-dock input{width:54px;padding:0 6px;text-align:center}.cosmic-dock-label{color:#665878;white-space:nowrap}@media(max-width:560px){body{padding-bottom:136px!important}#cosmic-quiz-dock{gap:6px;flex-wrap:wrap;justify-content:space-between;padding:9px}#cosmic-quiz-dock button{padding:0 9px}.cosmic-dock-label{order:-1;width:100%;font-size:10px}.cosmic-jump{margin-left:0!important}}
    `; doc.head.append(style);
    const dock = doc.createElement('nav'); dock.id = 'cosmic-quiz-dock'; dock.setAttribute('aria-label', 'Quiz navigation');
    dock.innerHTML = `<span class="cosmic-dock-label">Quiz navigation</span><button type="button" data-nav="prev">← Previous</button><button type="button" data-nav="next" class="cosmic-primary">Next →</button><span class="cosmic-jump"><input type="number" min="1" inputmode="numeric" aria-label="Question number" placeholder="Q#"><button type="button" data-nav="jump">Go</button></span><button type="button" data-nav="reset">Reset</button>`;
    doc.body.append(dock);
    const nativeJump = doc.querySelector('#jump-input, #jumpInput'); const nativeGo = doc.querySelector('#jump-btn, button[onclick*="executeJump"]'); const jump = dock.querySelector('input');
    const questionNo = () => Number((doc.querySelector('#question-badge, [data-question-number], .question-number, #questionNumBadge')?.textContent || '').match(/\d+/)?.[0]) || null;
    const remember = () => { const current = questionNo(); if (current) saveSession({ question: current }); };
    const goPrev = () => { if (!prev?.disabled) prev?.click(); setTimeout(remember, 30); };
    const goNext = () => { if (!next?.disabled) next?.click(); setTimeout(remember, 30); };
    const goJump = () => { const value = Number(jump.value); if (!value) return; if (nativeJump && nativeGo) { nativeJump.value = value; nativeGo.click(); } else { for (let index = 1; index < value; index++) next?.click(); } setTimeout(remember, 0); };
    dock.querySelector('[data-nav="prev"]').addEventListener('click', goPrev); dock.querySelector('[data-nav="next"]').addEventListener('click', goNext); dock.querySelector('[data-nav="jump"]').addEventListener('click', goJump);
    dock.querySelector('[data-nav="reset"]').addEventListener('click', () => doc.defaultView.cosmicQuizReset());
    jump.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); goJump(); } }, true);
    nativeJump?.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); nativeGo?.click(); setTimeout(remember, 30); } }, true);
    doc.addEventListener('keydown', event => { if (event.target !== jump && event.target.matches('input,textarea,select')) return; if (event.key === 'ArrowLeft') { event.preventDefault(); goPrev(); } else if (event.key === 'ArrowRight') { event.preventDefault(); goNext(); } else if (event.key === 'Enter' && event.target === jump) { event.preventDefault(); goJump(); } }, true);
    let startX = 0, startY = 0; doc.addEventListener('touchstart', event => { const point = event.changedTouches[0]; startX = point.clientX; startY = point.clientY; }, { passive: true }); doc.addEventListener('touchend', event => { const point = event.changedTouches[0], dx = point.clientX - startX, dy = point.clientY - startY; if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.4) dx < 0 ? goNext() : goPrev(); }, { passive: true });
    doc.defaultView.cosmicQuizReset = () => { localStorage.removeItem(sessionKey); doc.defaultView.location.reload(); };
    const saved = getSession().question; if (saved && nativeJump && nativeGo) { setTimeout(() => { nativeJump.value = saved; nativeGo.click(); }, 250); }
    [prev, next, nativeGo].filter(Boolean).forEach(button => button.addEventListener('click', () => setTimeout(remember, 0)));
  }
  function installParentKeyboard() {
    if (document.documentElement.dataset.cosmicParentKeys) return;
    document.documentElement.dataset.cosmicParentKeys = 'true';
    document.addEventListener('keydown', event => {
      if (!location.hash.startsWith('#quiz/') || event.target.matches('input,textarea,select,button')) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const frame = document.querySelector('.quiz-frame');
      try { const dock = frame?.contentDocument?.getElementById('cosmic-quiz-dock'); dock?.querySelector(event.key === 'ArrowLeft' ? '[data-nav="prev"]' : '[data-nav="next"]')?.click(); event.preventDefault(); } catch {}
    }, true);
  }
  function watchFrame() {
    const frame = document.querySelector('.quiz-frame'); if (!frame || frame.dataset.progressWatch) return;
    frame.dataset.progressWatch = 'true';
    frame.addEventListener('load', () => {
      try {
        const doc = frame.contentDocument;
        decorateQuiz(doc);
        applyQuizAppUI(doc);
        if (doc.documentElement.dataset.cosmicScoreWatch) return;
        doc.documentElement.dataset.cosmicScoreWatch = 'true';
        doc.addEventListener('click', event => {
          const button = event.target.closest('button');
          if (!button || !/finish|submit|complete|result|summary/i.test(button.textContent)) return;
          setTimeout(() => {
            const scoreEl = doc.querySelector('#score-display, [data-score], .score-display, #headerScore, #modalCorrect');
            const totalEl = doc.querySelector('#total-score-display, [data-total], .total-score, #headerTotal, #modalAttempted');
            const score = scoreEl?.textContent.trim().match(/\d+/)?.[0], totalScore = totalEl?.textContent.trim().match(/\d+/)?.[0];
            if (score && totalScore) { state.scores[id()] = { score, total: totalScore, savedAt: Date.now() }; state.attempted[id()] = true; save(); refresh(); updateActions(); }
          }, 0);
        }, true);
      } catch { /* A quiz loaded from another origin cannot be inspected. */ }
    });
    try { if (frame.contentDocument?.readyState === 'complete') frame.dispatchEvent(new Event('load')); } catch {}
  }
  addStyle();
  const tick = () => { installProgress(); installActions(); installQuestionDock(); watchFrame(); refresh(); };
  tick(); window.addEventListener('hashchange', () => setTimeout(tick, 0)); setInterval(tick, 800);
})();
