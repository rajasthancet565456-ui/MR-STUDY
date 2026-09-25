/* Direct-page companion for quiz trainers opened outside a library hub. */
(()=>{if(document.getElementById('direct-quiz-ui'))return;const s=document.createElement('style');s.id='direct-quiz-ui';s.textContent=`:root{--qbg:#f0e6ff;--qsurface:#fbf7ff;--qprimary:#6542c8;--qink:#30205d;--qmuted:#716782;--qline:#dccbf2}html,body{background:var(--qbg)!important;color:var(--qink)!important}body{padding:24px 14px 108px!important;background:radial-gradient(circle at 100% 0,#e5d5fa,transparent 32%),linear-gradient(135deg,#f0e6ff,#fbf7ff)!important;font-family:Manrope,system-ui,sans-serif!important}header{position:sticky!important;top:0!important;z-index:20!important;max-width:980px!important;margin:0 auto 18px!important;padding:14px 20px!important;border:1px solid var(--qline)!important;border-radius:18px!important;background:#e5d5fa!important;color:var(--qink)!important;box-shadow:0 8px 22px rgba(70,42,139,.1)!important}main{max-width:920px!important;margin:auto!important}#quiz-card,main>div{border:1px solid var(--qline)!important;border-radius:24px!important;background:var(--qsurface)!important;color:var(--qink)!important;box-shadow:0 18px 42px rgba(70,42,139,.14)!important}#question-text,h1,h2{color:var(--qink)!important;font-size:clamp(1.35rem,2.2vw,1.62rem)!important;line-height:1.48!important}.bg-slate-200,.bg-gray-200,#progress-track{background:#ddd9e8!important;border-radius:999px!important}.bg-indigo-500,.bg-purple-500,#progress-bar{background:linear-gradient(90deg,#6542c8,#8666db)!important;border-radius:999px!important;transition:width .28s ease!important}button[class*='option'],#options button,#options label,[role='radio']{width:100%!important;min-height:58px!important;margin:10px 0!important;padding:16px 18px!important;border:1.5px solid var(--qline)!important;border-radius:14px!important;background:#fff!important;color:var(--qink)!important;text-align:left!important;transition:.16s!important}button[class*='option']:hover,#options button:hover,#options label:hover,[role='radio']:hover{background:#f0e5ff!important;border-color:#a487df!important;transform:translateY(-1px)!important}.selected,[aria-checked='true']{border-color:var(--qprimary)!important;background:#eee7ff!important;box-shadow:0 0 0 3px rgba(101,66,200,.15)!important}button:focus-visible,input:focus-visible,[role='radio']:focus-visible{outline:3px solid var(--qprimary)!important;outline-offset:3px!important}#direct-quiz-dock{position:fixed;z-index:9999;left:50%;bottom:12px;transform:translateX(-50%);display:flex;align-items:center;gap:8px;width:min(720px,calc(100vw - 24px));padding:10px 12px;border:1px solid var(--qline);border-radius:15px;background:rgba(251,247,255,.96);box-shadow:0 14px 38px rgba(54,32,108,.2);color:var(--qink);backdrop-filter:blur(10px)}#direct-quiz-dock button,#direct-quiz-dock input{min-height:38px;padding:0 11px;border:1px solid var(--qline);border-radius:8px;background:#fff;color:var(--qink);font:600 12px system-ui}#direct-quiz-dock button{cursor:pointer}#direct-quiz-dock .primary{background:var(--qprimary);color:#fff;border-color:var(--qprimary)}#direct-quiz-dock input{width:55px;text-align:center}@media(max-width:560px){body{padding:12px 8px 142px!important}#direct-quiz-dock{flex-wrap:wrap;justify-content:space-between;padding:9px}#direct-quiz-dock button{padding:0 9px}}`;document.head.append(s);const prev=document.querySelector('#prev-btn,#previous,[data-action="previous"]'),next=document.querySelector('#next-btn,#next,[data-action="next"]'),jump=document.querySelector('#jump-input'),go=document.querySelector('#jump-btn');if(!prev&&!next)return;const dock=document.createElement('nav');dock.id='direct-quiz-dock';dock.setAttribute('aria-label','Quiz navigation');dock.innerHTML=`<button type="button" data-a="prev">← Previous</button><button type="button" class="primary" data-a="next">Next →</button><input type="number" min="1" inputmode="numeric" aria-label="Question number" placeholder="Q#"><button type="button" data-a="jump">Go</button><button type="button" data-a="reset">Reset</button>`;document.body.append(dock);const press=x=>{if(x&&!x.disabled)x.click()};dock.querySelector('[data-a="prev"]').onclick=()=>press(prev);dock.querySelector('[data-a="next"]').onclick=()=>press(next);const jumpTo=()=>{const value=Number(dock.querySelector('input').value);if(!value||!jump||!go)return;const max=Number(jump.max)||Infinity;if(value<1||value>max)return;jump.value=value;go.click()};dock.querySelector('[data-a="jump"]').onclick=jumpTo;dock.querySelector('input').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();jumpTo()}};dock.querySelector('[data-a="reset"]').onclick=()=>{if(confirm('Reset this quiz?'))location.reload()};document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select,[contenteditable="true"]'))return;if(e.key==='ArrowLeft'){e.preventDefault();press(prev)}if(e.key==='ArrowRight'){e.preventDefault();press(next)}},true)})();
// Automatic Floating Badge for connected pages
document.addEventListener("DOMContentLoaded", () => {
  // Home page par floating badge nahi dikhane ke liye
  if (window.location.pathname.includes("cosmic-quiz-master.html")) return;

  const badge = document.createElement("a");
  badge.href = "cosmic-quiz-master.html";
  badge.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px;
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50px;
    color: #ffffff;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 0.85rem;
    text-decoration: none;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    z-index: 9999;
  `;
  badge.innerHTML = `
    <img src="mohit.png" alt="Mohit Yadav" style="width:30px; height:30px; border-radius:50%; object-fit:cover; border:1.5px solid #8b5cf6;">
    <span>Created by <strong>Mohit Yadav</strong></span>
  `;
  document.body.appendChild(badge);
});
