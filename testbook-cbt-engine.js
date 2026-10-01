/* ==========================================================================
   COSMIC CBT ENGINE — Contrast Enhancement & Message Bridge
   Guarantees 100% High-Contrast Readability & Answer Feedback Across All Libraries
   ========================================================================== */

(() => {
  const isInsideFrame = window.self !== window.top;

  const enhancementCSS = `
    /* Remove any broken legacy theme styles */
    #cosmic-readable-quiz-theme,
    #lavender-quiz-layer,
    #lavender-quiz-app-ui,
    #readability-safeguard,
    #light-celestial-readability,
    #light-vocab-readability {
      display: none !important;
    }

    /* Hide internal dock when inside hub iframe (hub handles navigation) */
    #quiz-question-dock,
    #direct-quiz-dock,
    #cosmic-quiz-dock {
      display: none !important;
    }

    /* ================================================================
       CORRECT ANSWER — Vivid Emerald Green (All libraries & themes)
       ================================================================ */
    .option-card.selected-correct,
    .option-card.reveal-correct,
    button.selected-correct,
    button.reveal-correct,
    button[class*="emerald"],
    button[class*="green"],
    button.correct,
    button.is-correct,
    .correct,
    .is-correct {
      background-color: #059669 !important;
      background-image: none !important;
      border: 2px solid #10b981 !important;
      color: #ffffff !important;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.15) !important;
      opacity: 1 !important;
    }
    .option-card.selected-correct *,
    .option-card.reveal-correct *,
    button.selected-correct *,
    button.reveal-correct *,
    button[class*="emerald"] *,
    button[class*="green"] *,
    button.correct *,
    button.is-correct * {
      color: #ffffff !important;
      text-shadow: none !important;
    }

    /* ================================================================
       INCORRECT ANSWER — Vivid Crimson Red (All libraries & themes)
       ================================================================ */
    .option-card.selected-incorrect,
    button.selected-incorrect,
    button[class*="rose"],
    button[class*="red"],
    button.wrong,
    button.incorrect,
    button.is-incorrect,
    .wrong,
    .incorrect,
    .is-incorrect {
      background-color: #dc2626 !important;
      background-image: none !important;
      border: 2px solid #ef4444 !important;
      color: #ffffff !important;
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.15) !important;
      opacity: 1 !important;
    }
    .option-card.selected-incorrect *,
    button.selected-incorrect *,
    button[class*="rose"] *,
    button[class*="red"] *,
    button.wrong *,
    button.incorrect *,
    button.is-incorrect * {
      color: #ffffff !important;
      text-shadow: none !important;
    }

    /* RATIONALE BOX — always visible after answer */
    #rationale-box:not(.hidden),
    #explanation-box:not(.hidden),
    #explanationBox:not(.hidden) {
      opacity: 1 !important;
      visibility: visible !important;
      display: block !important;
    }

    /* OPTION A/B/C/D BADGE STYLES */
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
      '#cosmic-readable-quiz-theme, #lavender-quiz-layer, #readability-safeguard, #light-celestial-readability, #light-vocab-readability'
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
    const options = doc.querySelectorAll('#options-container button, #options button, #optionsGrid button, .option, .option-card');
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
      const target = document.querySelector('#quiz-container, #options-container, #optionsGrid, main');
      if (target) observer.observe(target, { childList: true, subtree: true });
      notifyParentState();
    });

    function notifyParentState() {
      try {
        const counterEl = document.querySelector(
          '#questionNumBadge, #question-counter, #question-tracker, #current-q-num, [data-question-number]'
        );
        const counterText = counterEl?.textContent || '';
        const match = counterText.match(/(\d+)\s*(?:of|\/)\s*(\d+)/i) || counterText.match(/(\d+)/);
        const currentQ = match ? Number(match[1]) : 1;
        const totalQ = (match && match[2]) ? Number(match[2]) : (window.quizData?.length || window.rawQuestions?.length || window.questions?.length || 90);
        const isAnswered = Boolean(
          document.querySelector(
            '[class*="emerald"],[class*="green"],[class*="rose"],[class*="red"],' +
            '.option-card.selected-correct, .option-card.selected-incorrect, .option-card.reveal-correct,' +
            '.selected-correct, .selected-incorrect, .reveal-correct,' +
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

    setInterval(notifyParentState, 400);

    // Listen to parent CBT hub commands
    window.addEventListener('message', event => {
      const data = event.data;
      if (!data || !data.action) return;

      if (data.action === 'NEXT') {
        const btn = document.querySelector('#nextBtn, #next-btn, #next, button[data-action="next"]');
        if (btn && !btn.disabled) {
          btn.click();
        } else if (window.navigateQuestion) {
          window.navigateQuestion(1);
        }

      } else if (data.action === 'PREV') {
        const btn = document.querySelector('#prevBtn, #prev-btn, #previous, button[data-action="prev"]');
        if (btn && !btn.disabled) {
          btn.click();
        } else if (window.navigateQuestion) {
          window.navigateQuestion(-1);
        }

      } else if (data.action === 'JUMP') {
        const targetQ = Number(data.question);
        const jumpInput = document.querySelector('#jumpInput, #jump-input, input[id*="jump" i]');
        const jumpBtn = document.querySelector('#jump-btn, button[id*="jump" i]');
        if (jumpInput) jumpInput.value = targetQ;
        if (window.executeJump) {
          window.executeJump();
        } else if (jumpBtn) {
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

  window.TestbookCBTEngine = {
    applyContrastSafeguard: applyEnhancements
  };
})();
