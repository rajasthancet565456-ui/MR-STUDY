/* Shared presentation layer for every direct quiz page.
   Preserves the original beautiful dark/cosmic quiz theme.
   Only adds message bridge + glow enhancements for correct/incorrect. */
(() => {
  // 1. Purge broken white-on-white styles
  const purgeBrokenStyles = () => {
    document.querySelectorAll(
      '#cosmic-readable-quiz-theme, #lavender-quiz-layer, #lavender-quiz-app-ui, #readability-safeguard, #light-celestial-readability'
    ).forEach(el => el.remove());
  };
  purgeBrokenStyles();
  document.addEventListener('DOMContentLoaded', purgeBrokenStyles);

  if (document.getElementById('quiz-ui-v2-layer')) return;

  const isInFrame = (window.self !== window.top);

  const style = document.createElement('style');
  style.id = 'quiz-ui-v2-layer';
  style.textContent = `

    /* ================================================================
       CORRECT ANSWER — Vivid Green Glow (works on dark & light theme)
       ================================================================ */
    #options-container button[class*="bg-emerald"],
    #options-container button[class*="border-emerald"],
    #options button[class*="bg-emerald"],
    #options button[class*="border-emerald"],
    button[class*="bg-emerald-5"],
    button[class*="border-emerald-5"],
    .correct, .is-correct {
      box-shadow: 0 0 22px rgba(5, 150, 105, 0.65), 0 0 6px rgba(5, 150, 105, 0.35) !important;
      border-width: 2px !important;
    }

    /* ================================================================
       INCORRECT ANSWER — Vivid Red Glow (works on dark & light theme)
       ================================================================ */
    #options-container button[class*="bg-rose"],
    #options-container button[class*="border-rose"],
    #options button[class*="bg-rose"],
    #options button[class*="border-rose"],
    button[class*="bg-rose-5"],
    button[class*="border-rose-5"],
    .wrong, .incorrect, .is-incorrect {
      box-shadow: 0 0 22px rgba(220, 38, 38, 0.55), 0 0 6px rgba(220, 38, 38, 0.3) !important;
      border-width: 2px !important;
    }

    /* ================================================================
       DOCK — Show only when NOT inside a hub iframe
       ================================================================ */
    ${isInFrame
      ? `#quiz-question-dock, #direct-quiz-dock, #cosmic-quiz-dock { display: none !important; }`
      : `#quiz-question-dock, #direct-quiz-dock, #cosmic-quiz-dock { display: flex !important; }`
    }

    /* ================================================================
       RATIONALE / EXPLANATION BOX — always visible after answering
       ================================================================ */
    #rationale-box:not(.hidden),
    #explanation-box:not(.hidden) {
      opacity: 1 !important;
      visibility: visible !important;
    }

    /* Small cosmetic tweaks — don't override quiz background */
    .text-emerald-400 { color: #34d399 !important; }
    .text-rose-400    { color: #fb7185 !important; }
  `;
  document.head.append(style);

  // 2. Listen for navigation commands from parent Testbook CBT hub
  window.addEventListener('message', event => {
    const data = event.data;
    if (!data || !data.action) return;

    if (data.action === 'NEXT') {
      const btn = document.querySelector('#next-btn, #next, button[data-action="next"]');
      if (btn && !btn.disabled) btn.click();

    } else if (data.action === 'PREV') {
      const btn = document.querySelector('#prev-btn, #previous, #prevBtn, button[data-action="prev"]');
      if (btn && !btn.disabled) btn.click();

    } else if (data.action === 'JUMP') {
      const target = Number(data.question);
      const jumpInput = document.querySelector('#jump-input, input[id*="jump" i]');
      const jumpBtn = document.querySelector('#jump-btn, button[id*="jump" i]');
      if (jumpInput && jumpBtn) {
        jumpInput.value = target;
        jumpBtn.click();
      } else if (window.loadQuestion) {
        window.loadQuestion(target - 1);
      } else if (window.jumpToQuestion) {
        window.jumpToQuestion(target);
      }

    } else if (data.action === 'CLEAR') {
      document.querySelectorAll('.selected, [aria-checked="true"]').forEach(el => {
        el.classList.remove('selected');
        el.removeAttribute('aria-checked');
      });
    }
  });

  // 3. Report current quiz state to parent CBT hub
  const sendState = () => {
    if (!isInFrame) return;
    try {
      // Detect question counter
      const counterEl = document.querySelector(
        '#question-counter, #question-tracker, [data-question-number], .question-number'
      );
      const counterText = counterEl?.textContent || '';
      const match = counterText.match(/(\d+)\s*(?:of|\/)\s*(\d+)/i) || counterText.match(/(\d+)/);
      const currentQ = match ? Number(match[1]) : 1;
      const totalQ   = (match && match[2]) ? Number(match[2]) : (window.quizData?.length || 90);

      // Detect if current question has been answered
      const isAnswered = Boolean(
        document.querySelector(
          '[class*="bg-emerald"], [class*="bg-rose"], [class*="border-emerald-5"], [class*="border-rose-5"],' +
          '.correct, .wrong, .selected, [aria-checked="true"]'
        )
      );

      window.parent.postMessage({
        type: 'TB_QUIZ_STATE',
        currentQuestion: currentQ,
        totalQuestions: totalQ,
        isAnswered: isAnswered
      }, '*');
    } catch (e) {}
  };

  window.addEventListener('load', sendState);
  setInterval(sendState, 500);
})();
