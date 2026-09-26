/* Shared presentation layer for every direct quiz page.
   Enforces high-contrast Testbook CBT layout and readability. */
(() => {
  // Purge broken white-on-white theme styles immediately
  const purgeBrokenStyles = () => {
    const broken = document.querySelectorAll('#cosmic-readable-quiz-theme, #lavender-quiz-layer, #lavender-quiz-app-ui, #readability-safeguard');
    broken.forEach(b => b.remove());
  };
  purgeBrokenStyles();
  document.addEventListener('DOMContentLoaded', purgeBrokenStyles);

  if (document.getElementById('testbook-quiz-cbt-layer')) return;
  const style = document.createElement('style');
  style.id = 'testbook-quiz-cbt-layer';
  style.textContent = `
    :root {
      --tb-text: #0f172a;
      --tb-body: #1e293b;
      --tb-surface: #ffffff;
      --tb-border: #cbd5e1;
      --tb-primary: #0284c7;
      --tb-green: #10b981;
      --tb-red: #ef4444;
    }
    html, body {
      background: #ffffff !important;
      color: var(--tb-text) !important;
      font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
      padding-bottom: 24px !important;
    }
    body:before, body:after { display: none !important; }
    
    /* Quiz Container */
    main > div, #quiz-card, #quiz-container {
      background: #ffffff !important;
      border: 1.5px solid #e2e8f0 !important;
      border-radius: 12px !important;
      color: var(--tb-text) !important;
      box-shadow: 0 2px 10px rgba(0,0,0,0.04) !important;
      padding: clamp(16px, 3vw, 28px) !important;
    }
    
    /* 100% Guaranteed Legible Question Text */
    #question-text, #question-text-en, #question-text-hi, [id*='question' i][class*='text'], h2#question-text, .question-text {
      color: #0f172a !important;
      font-size: clamp(1.1rem, 2vw, 1.35rem) !important;
      font-weight: 600 !important;
      line-height: 1.55 !important;
      text-shadow: none !important;
      margin-bottom: 20px !important;
    }

    #question-counter, #question-tag {
      color: #475569 !important;
      font-weight: 600 !important;
    }
    
    /* Testbook Option Cards */
    #options-container button, #options button, [id*='option' i] button, button[class*='option'], [role='radio'], .option {
      width: 100% !important;
      min-height: 52px !important;
      margin: 10px 0 !important;
      padding: 14px 18px !important;
      border: 1.5px solid #cbd5e1 !important;
      border-radius: 8px !important;
      background: #ffffff !important;
      color: #1e293b !important;
      font-size: 15px !important;
      font-weight: 500 !important;
      text-align: left !important;
      display: flex !important;
      align-items: center !important;
      box-shadow: none !important;
      text-shadow: none !important;
      transition: all 0.16s ease !important;
    }

    #options-container button:hover, #options button:hover, button[class*='option']:hover {
      background: #f0f7ff !important;
      border-color: #0284c7 !important;
      color: #0369a1 !important;
    }

    .selected, [aria-checked='true'] {
      border-color: #0284c7 !important;
      border-width: 2px !important;
      background: #e0f2fe !important;
      color: #0369a1 !important;
      font-weight: 600 !important;
    }

    [class*='correct' i], [class*='emerald' i], [class*='green' i] {
      background: #ecfdf5 !important;
      border-color: #10b981 !important;
      border-width: 2px !important;
      color: #065f46 !important;
      font-weight: 600 !important;
    }

    [class*='incorrect' i], [class*='rose' i], [class*='red' i], .wrong {
      background: #fef2f2 !important;
      border-color: #ef4444 !important;
      border-width: 2px !important;
      color: #991b1b !important;
      font-weight: 600 !important;
    }

    /* Explanation & Rationale */
    #rationale-box, .explanation-box, [id*='rationale' i], [id*='explanation' i] {
      background: #f8fafc !important;
      border: 1px solid #cbd5e1 !important;
      border-left: 4px solid #0284c7 !important;
      border-radius: 8px !important;
      padding: 16px !important;
      margin-top: 20px !important;
      color: #1e293b !important;
    }

    #rationale-title, .explanation-title {
      color: #0f172a !important;
      font-weight: 700 !important;
    }

    #rationale-text, .explanation-text {
      color: #334155 !important;
      line-height: 1.6 !important;
    }

    /* Hide redundant internal docked bar when framed */
    #quiz-question-dock, #direct-dock, #cosmic-quiz-dock {
      display: none !important;
    }
  `;
  document.head.append(style);

  // Auto-enhance options with A, B, C, D badges
  const addOptionBadges = () => {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const options = document.querySelectorAll('#options-container button, #options button, .option');
    options.forEach((btn, idx) => {
      if (btn.querySelector('.tb-opt-badge')) return;
      const letter = letters[idx % letters.length];
      const badge = document.createElement('span');
      badge.className = 'tb-opt-badge';
      badge.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#f1f5f9;color:#0f172a;font-weight:700;font-size:12px;margin-right:12px;flex-shrink:0;border:1px solid #cbd5e1;';
      badge.textContent = letter;
      btn.prepend(badge);
    });
  };

  addOptionBadges();
  new MutationObserver(addOptionBadges).observe(document.body, { childList: true, subtree: true });

  // Listen for navigation messages from parent Testbook CBT interface
  window.addEventListener('message', event => {
    const data = event.data;
    if (!data || !data.action) return;

    if (data.action === 'NEXT') {
      const nextBtn = document.querySelector('#next-btn, #next, button[data-action="next"]');
      if (nextBtn && !nextBtn.disabled) nextBtn.click();
    } else if (data.action === 'PREV') {
      const prevBtn = document.querySelector('#prev-btn, #previous, button[data-action="prev"]');
      if (prevBtn && !prevBtn.disabled) prevBtn.click();
    } else if (data.action === 'JUMP') {
      const target = Number(data.question);
      const jumpInput = document.querySelector('#jump-input, input[id*="jump" i]');
      const jumpBtn = document.querySelector('#jump-btn, button[id*="jump" i]');
      if (jumpInput && jumpBtn) {
        jumpInput.value = target;
        jumpBtn.click();
      } else if (window.loadQuestion) {
        window.loadQuestion(target - 1);
      }
    } else if (data.action === 'CLEAR') {
      document.querySelectorAll('.selected, [aria-checked="true"]').forEach(el => el.classList.remove('selected'));
    }
  });

  // Report state to parent
  const sendStateToParent = () => {
    try {
      const counterText = document.querySelector('#question-counter, [data-question-number], .question-number')?.textContent || '';
      const match = counterText.match(/(\d+)\s*(?:of|\/)\s*(\d+)/i) || counterText.match(/(\d+)/);
      const currentQ = match ? Number(match[1]) : 1;
      const totalQ = (match && match[2]) ? Number(match[2]) : (window.quizData?.length || 90);
      const isAnswered = Boolean(document.querySelector('.selected, .correct, .wrong, [aria-checked="true"]'));

      window.parent.postMessage({
        type: 'TB_QUIZ_STATE',
        currentQuestion: currentQ,
        totalQuestions: totalQ,
        isAnswered: isAnswered
      }, '*');
    } catch (e) {}
  };

  window.addEventListener('load', sendStateToParent);
  setInterval(sendStateToParent, 400);
})();
