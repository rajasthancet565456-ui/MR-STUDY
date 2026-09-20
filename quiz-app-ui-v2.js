/* Shared presentation layer for every direct quiz page. It preserves each
   quiz's questions, scoring, and navigation code while supplying a common UI. */
(() => {
  if (document.getElementById('lavender-quiz-layer')) return;
  const style = document.createElement('style');
  style.id = 'lavender-quiz-layer';
  style.textContent = `
    :root{--quiz-bg:#f0e6ff;--quiz-card:#fbf7ff;--quiz-primary:#6542c8;--quiz-ink:#30205d;--quiz-muted:#716782;--quiz-line:#dccbf2;--quiz-track:#ddd9e8;--quiz-hover:#f0e5ff;--quiz-success:#e2f5e8;--quiz-error:#fde7e9}
    html,body{min-height:100%;background:var(--quiz-bg)!important;color:var(--quiz-ink)!important}
    body{padding:22px 14px 122px!important;background:radial-gradient(circle at 100% 0,#e5d5fa 0,transparent 32%),linear-gradient(135deg,#f0e6ff,#fbf7ff)!important;font-family:Manrope,Inter,system-ui,sans-serif!important;overflow-x:hidden}
    header{position:sticky!important;top:12px!important;z-index:40!important;max-width:1000px!important;margin:0 auto 18px!important;padding:14px 20px!important;border:1px solid var(--quiz-line)!important;border-radius:20px!important;background:#e5d5fa!important;color:var(--quiz-ink)!important;box-shadow:0 10px 26px rgba(75,45,145,.12)!important}
    header h1,header h2{color:var(--quiz-ink)!important;text-shadow:none!important}header p{color:var(--quiz-muted)!important}
    main{width:min(940px,100%)!important;margin:0 auto!important;gap:18px!important}
    main>div,#quiz-card{border:1px solid var(--quiz-line)!important;border-radius:24px!important;background:var(--quiz-card)!important;color:var(--quiz-ink)!important;box-shadow:0 18px 42px rgba(75,45,145,.13)!important}
    #question-text,#question-text-en,#question-text-hi,[id*='question' i][class*='text']{color:var(--quiz-ink)!important;font-size:clamp(1.2rem,2.4vw,1.6rem)!important;line-height:1.5!important}
    .bg-slate-200,.bg-gray-200,.bg-indigo-100,.bg-purple-100,#progress-track{background:var(--quiz-track)!important}.bg-indigo-500,.bg-purple-500,#progress-bar{background:linear-gradient(90deg,#6542c8,#8a6ddd)!important;border-radius:999px!important;transition:width .28s ease!important}
    #options-container button,#options button,[id*='option' i] button,button[class*='option'],[role='radio']{width:100%!important;min-height:58px!important;margin:8px 0!important;padding:15px 17px!important;border:1.5px solid var(--quiz-line)!important;border-radius:14px!important;background:#fff!important;color:var(--quiz-ink)!important;text-align:left!important;box-shadow:none!important;transition:background .16s,border-color .16s,transform .16s,box-shadow .16s!important}
    #options-container button:hover,#options button:hover,[id*='option' i] button:hover,button[class*='option']:hover,[role='radio']:hover{background:var(--quiz-hover)!important;border-color:#a487df!important;transform:translateY(-1px)!important}
    .selected,[aria-checked='true'],[class*='selected' i]{border-color:var(--quiz-primary)!important;background:#eee7ff!important;box-shadow:0 0 0 3px rgba(101,66,200,.15)!important}
    [class*='correct' i],[class*='emerald' i],[class*='green' i]{background:var(--quiz-success)!important;border-color:#4e9b69!important;color:#174c2a!important}[class*='incorrect' i],[class*='rose' i],[class*='red' i]{background:var(--quiz-error)!important;border-color:#d26678!important;color:#731d2b!important}
    button,input,select,textarea{font:inherit}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[role='radio']:focus-visible{outline:3px solid var(--quiz-primary)!important;outline-offset:3px!important}
    input,select,textarea{border-color:var(--quiz-line)!important;background:#fff!important;color:var(--quiz-ink)!important}input:focus,select:focus,textarea:focus{border-color:var(--quiz-primary)!important;box-shadow:0 0 0 3px rgba(101,66,200,.15)!important}
    #hint-box{transition:opacity .18s ease,transform .18s ease}#hint-box:not(.hidden){animation:quizHint .18s ease-out}@keyframes quizHint{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}.quiz-question-enter{animation:quizQuestion .2s ease-out}@keyframes quizQuestion{from{opacity:.35;transform:translateY(5px)}to{opacity:1;transform:none}}
    #quiz-question-dock,#direct-dock{position:fixed!important;z-index:9999!important;left:50%!important;bottom:max(10px,env(safe-area-inset-bottom))!important;transform:translateX(-50%)!important;display:flex!important;align-items:center!important;gap:8px!important;width:min(720px,calc(100vw - 24px))!important;padding:10px 12px!important;border:1px solid var(--quiz-line)!important;border-radius:15px!important;background:rgba(251,247,255,.97)!important;box-shadow:0 14px 38px rgba(54,32,108,.2)!important;color:var(--quiz-ink)!important;backdrop-filter:blur(12px)}
    #quiz-question-dock button,#direct-dock button,#quiz-question-dock input,#direct-dock input{min-height:38px!important;border:1px solid var(--quiz-line)!important;border-radius:8px!important;background:#fff!important;color:var(--quiz-ink)!important}#quiz-question-dock .dock-next,#direct-dock .primary{background:var(--quiz-primary)!important;color:#fff!important;border-color:var(--quiz-primary)!important}.dock-label{color:var(--quiz-primary)!important}
    @media(max-width:560px){body{padding:10px 8px 158px!important}header{top:6px!important;padding:12px 14px!important;border-radius:16px!important}main>div,#quiz-card{border-radius:18px!important}#quiz-question-dock,#direct-dock{flex-wrap:wrap!important;justify-content:space-between!important;padding:8px!important}.dock-label{width:100%!important;margin:0!important}}
  `;
  document.head.append(style);
  const editable = node => node && node.matches('input,textarea,select,[contenteditable="true"]');
  const byText = expression => [...document.querySelectorAll('button')].find(button => expression.test(button.textContent.trim()));
  const previous = () => document.querySelector('#prev-btn,#previous,[data-action="previous"],[data-action="prev"],[id*="prev" i]') || byText(/^←?\s*previous|^←?\s*prev/i);
  const next = () => document.querySelector('#next-btn,#next,[data-action="next"],[id*="next" i]') || byText(/^next|^→/i);
  const jumpInput = () => document.querySelector('#jump-input,input[id*="jump" i]');
  const jumpButton = () => document.querySelector('#jump-btn,button[data-action="jump"],button[id*="jump" i]') || byText(/^go$/i);
  const click = button => { if (button && !button.disabled) button.click(); };
  if (!document.getElementById('quiz-question-dock') && (previous() || next())) {
    const dock = document.createElement('nav');
    dock.id = 'direct-dock'; dock.setAttribute('aria-label', 'Quiz navigation');
    dock.innerHTML = '<button type="button" data-action="prev">← Previous</button><button type="button" class="primary" data-action="next">Next →</button><input type="number" min="1" inputmode="numeric" aria-label="Question number" placeholder="Q#"><button type="button" data-action="jump">Go</button><button type="button" data-action="reset">Reset</button>';
    document.body.append(dock);
    const go = () => { const input = jumpInput(), value = Number(dock.querySelector('input').value), maximum = Number(input?.max) || Infinity; if (input && value >= 1 && value <= maximum) { input.value = value; input.dispatchEvent(new Event('input', {bubbles:true})); click(jumpButton()); } };
    dock.querySelector('[data-action="prev"]').onclick = () => click(previous()); dock.querySelector('[data-action="next"]').onclick = () => click(next());
    dock.querySelector('[data-action="jump"]').onclick = go; dock.querySelector('input').onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); go(); } };
    dock.querySelector('[data-action="reset"]').onclick = () => { if (confirm('Reset this quiz?')) location.reload(); };
  }
  if (!document.getElementById('quiz-question-dock')) document.addEventListener('keydown', event => { if (editable(event.target)) return; if (event.key === 'ArrowLeft') { event.preventDefault(); click(previous()); } if (event.key === 'ArrowRight') { event.preventDefault(); click(next()); } }, true);
  const question = document.querySelector('#question-text,#question-text-en,[id*="question" i][class*="text"]');
  if (question) new MutationObserver(() => { question.classList.remove('quiz-question-enter'); requestAnimationFrame(() => question.classList.add('quiz-question-enter')); }).observe(question, {childList:true,characterData:true,subtree:true});
})();
