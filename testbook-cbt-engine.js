/* ==========================================================================
   TESTBOOK CBT ENGINE — Contrast Enhancement & Message Bridge
   Does NOT override the quiz's original dark/cosmic theme.
   Only removes broken white-on-white styles & adds glow to correct/incorrect.
   ========================================================================== */

(() => {
  const isInsideFrame = window.self !== window.top;

  // Enhancement CSS — does NOT set body background or text color globally
  const enhancementCSS = `
    /* ================================================================
       Remove any broken legacy theme styles
       ================================================================ */
    #cosmic-readable-quiz-theme,
    #lavender-quiz-layer,
    #lavender-quiz-app-ui,
    #readability-safeguard,
    #light-celestial-readability {
      display: none !important;
    }

    /* ================================================================
       HIDE internal dock when inside hub iframe (hub handles navigation)
       ================================================================ */
    #quiz-question-dock,
    #direct-quiz-dock,
    #cosmic-quiz-dock {
      display: none !important;
    }

    /* ================================================================
       CORRECT ANSWER — vivid emerald glow
       ================================================================ */
    button[class*="bg-emerald"],
    button[class*="border-emerald-5"],
    button[class*="border-emerald-6"],
    .correct, .is-correct {
      box-shadow: 0 0 22px rgba(5, 150, 105, 0.65), 0 0 6px rgba(5, 150, 105, 0.3) !important;
      border-width: 2px !important;
    }

    /* ================================================================
       INCORRECT ANSWER — vivid red glow
       ================================================================ */
    button[class*="bg-rose"],
    button[class*="border-rose-5"],
    button[class*="border-rose-6"],
    .wrong, .incorrect, .is-incorrect {
      box-shadow: 0 0 22px rgba(220, 38, 38, 0.55), 0 0 6px rgba(220, 38, 38, 0.25) !important;
      border-width: 2px !important;
    }

    /* ================================================================
       RATIONALE BOX — always visible after answer
       ================================================================ */
    #rationale-box:not(.hidden),
    #explanation-box:not(.hidden) {
      opacity: 1 !important;
      visibility: visible !important;
    }

    /* ================================================================
       OPTION A/B/C/D BADGE STYLES
       ================================================================ */
    .tb-opt-badge {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 26px !important;
      height: 26px !important;
      border-radius: 50% !important;
      font-weight: 700 !important;
      font-size: 12px !important;
      margin-right: 10px !important;
      flex-shrink: 0 !important;
    }
  `;

  function applyEnhancements(doc) {
    if (!doc || !doc.head) return;

    // Purge broken themes
    doc.querySelectorAll(
      '#cosmic-readable-quiz-theme, #lavender-quiz-layer, #readability-safeguard, #light-celestial-readability'
    ).forEach(el => el.remove());

    // Inject enhancement layer
    let sheet = doc.getElementById('tb-cbt-enhance-layer');
    if (!sheet) {
      sheet = doc.createElement('style');
      sheet.id = 'tb-cbt-enhance-layer';
      doc.head.append(sheet);
    }
    sheet.textContent = enhancementCSS;

    // Add A/B/C/D badges to options
    addOptionBadges(doc);
  }

  function addOptionBadges(doc) {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const options = doc.querySelectorAll('#options-container button, #options button, .option');
    options.forEach((btn, idx) => {
      if (btn.querySelector('.tb-opt-badge')) return;
      const letter = letters[idx % letters.length];
      const badge = doc.createElement('span');
      badge.className = 'tb-opt-badge';
      badge.style.cssText =
        'display:inline-flex;align-items:center;justify-content:center;' +
        'width:26px;height:26px;border-radius:50%;' +
        'background:rgba(255,255,255,0.15);border:1.5px solid rgba(255,255,255,0.3);' +
        'color:inherit;font-weight:700;font-size:12px;margin-right:10px;flex-shrink:0;';
      badge.textContent = letter;
      btn.prepend(badge);
    });
  }

  // Run inside quiz iframe
  if (isInsideFrame) {
    document.addEventListener('DOMContentLoaded', () => applyEnhancements(document));
    applyEnhancements(document);

    const observer = new MutationObserver(() => addOptionBadges(document));

    window.addEventListener('load', () => {
      applyEnhancements(document);
      const target = document.querySelector('#quiz-container, #options-container, main');
      if (target) observer.observe(target, { childList: true, subtree: true });
      notifyParentState();
    });

    // Notify parent of current question state
    function notifyParentState() {
      try {
        const counterText = document.querySelector(
          '#question-counter, #question-tracker, [data-question-number]'
        )?.textContent || '';
        const match = counterText.match(/(\d+)\s*(?:of|\/)\s*(\d+)/i) || counterText.match(/(\d+)/);
        const currentQ = match ? Number(match[1]) : 1;
        const totalQ = (match && match[2]) ? Number(match[2]) : (window.quizData?.length || 90);
        const isAnswered = Boolean(
          document.querySelector(
            '[class*="bg-emerald"],[class*="bg-rose"],[class*="border-emerald-5"],[class*="border-rose-5"],' +
            '.selected,.correct,.wrong,[aria-checked="true"]'
          )
        );
        window.parent.postMessage({
          type: 'TB_QUIZ_STATE',
          currentQuestion: currentQ,
          totalQuestions: totalQ,
          isAnswered: isAnswered
        }, '*');
      } catch (e) {}
    }

    setInterval(notifyParentState, 500);

    // Listen to parent CBT hub commands
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
        const targetQ = Number(data.question);
        const jumpInput = document.querySelector('#jump-input, input[id*="jump" i]');
        const jumpBtn = document.querySelector('#jump-btn, button[id*="jump" i]');
        if (jumpInput && jumpBtn) {
          jumpInput.value = targetQ;
          jumpBtn.click();
        } else if (window.loadQuestion) {
          window.loadQuestion(targetQ - 1);
        } else if (window.jumpToQuestion) {
          window.jumpToQuestion(targetQ);
        }

      } else if (data.action === 'CLEAR') {
        document.querySelectorAll('.selected, [aria-checked="true"]').forEach(s => {
          s.classList.remove('selected');
          s.removeAttribute('aria-checked');
        });
      }

      setTimeout(notifyParentState, 50);
    });
  }

  // Export for use by hub pages (applies to frames from outside)
  window.TestbookCBTEngine = {
    applyContrastSafeguard: applyEnhancements
  };
})();
