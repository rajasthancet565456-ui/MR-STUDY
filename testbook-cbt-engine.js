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
    #explanationBox:not(.hidden),
    #explanation:not(.hidden) {
      opacity: 1 !important;
      visibility: visible !important;
      display: block !important;
    }

    /* OPTION A/B/C/D BADGE STYLES */
    .tb-opt-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1.5px solid currentColor;
      font-weight: 700;
      font-size: 11px;
      margin-right: 8px;
      flex-shrink: 0;
    }

    /* QUESTION TEXT READABILITY */
    #question-text, #questionText, #question-text-en, #question-text-hi, .question-text, h2#question {
      line-height: 1.6 !important;
      letter-spacing: 0.01em !important;
    }
  `;

  function applyEnhancements(doc) {
    if (!doc || !doc.head) return;
    if (doc.getElementById('cosmic-cbt-enhancements')) return;

    const styleEl = doc.createElement('style');
    styleEl.id = 'cosmic-cbt-enhancements';
    styleEl.textContent = enhancementCSS;
    doc.head.append(styleEl);

    addOptionBadges(doc);
  }

  function addOptionBadges(doc) {
    const options = doc.querySelectorAll(
      '#options-container button, #optionsContainer button, #options button, #optionsGrid .option-card, .options-container button'
    );
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    options.forEach((btn, idx) => {
      if (btn.querySelector('.tb-opt-badge')) return;
      const letter = letters[idx % letters.length];
      const badge = doc.createElement('span');
      badge.className = 'tb-opt-badge';
      badge.textContent = letter;
      const firstChild = btn.firstElementChild;
      if (firstChild && firstChild.classList.contains('tb-opt-badge')) return;
      if (!btn.textContent.trim().match(/^[A-F]\b/)) {
        btn.prepend(badge);
      }
    });
  }

  // Run inside quiz iframe
  if (isInsideFrame) {
    document.addEventListener('DOMContentLoaded', () => applyEnhancements(document));
    applyEnhancements(document);

    const observer = new MutationObserver(() => addOptionBadges(document));

    window.addEventListener('load', () => {
      applyEnhancements(document);
      const target = document.querySelector('#quiz-container, #options-container, #optionsContainer, #options, #optionsGrid, main');
      if (target) observer.observe(target, { childList: true, subtree: true });
      notifyParentState();
    });

    function notifyParentState() {
      try {
        const counterEl = document.querySelector(
          '#questionNumBadge, #question-counter, #question-tracker, #current-q-num, [data-question-number], #questionNumber, #question-number, #progressText, #progress-text'
        );
        const counterText = counterEl?.textContent || '';
        const match = counterText.match(/(\d+)\s*(?:of|\/)\s*(\d+)/i) || counterText.match(/(\d+)/);
        const currentQ = match ? Number(match[1]) : 1;
        const totalQ = (match && match[2]) ? Number(match[2]) : (
          window.quizData?.length ||
          window.rawQuestions?.length ||
          window.questions?.length ||
          50
        );
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
        const btn = document.querySelector('#nextBtn, #next-btn, #next, #nextButton, button[data-action="next"], button[onclick*="next" i]');
        if (btn && !btn.disabled) {
          btn.click();
        } else if (window.nextQuestion) {
          window.nextQuestion();
        } else if (window.navigateQuestion) {
          window.navigateQuestion(1);
        }

      } else if (data.action === 'PREV') {
        const btn = document.querySelector('#prevBtn, #prev-btn, #previous, #previousButton, button[data-action="prev"], button[onclick*="prev" i]');
        if (btn && !btn.disabled) {
          btn.click();
        } else if (window.previousQuestion) {
          window.previousQuestion();
        } else if (window.prevQuestion) {
          window.prevQuestion();
        } else if (window.navigateQuestion) {
          window.navigateQuestion(-1);
        }

      } else if (data.action === 'JUMP') {
        const targetQ = Number(data.question);
        const jumpInput = document.querySelector('#jumpInput, #jump-input, input[id*="jump" i]');
        const jumpBtn = document.querySelector('#jump-btn, #jumpBtn, button[id*="jump" i], button[onclick*="jump" i]');
        if (jumpInput) jumpInput.value = targetQ;
        if (window.jumpQuestion) {
          window.jumpQuestion(targetQ);
        } else if (window.jumpToQuestion) {
          window.jumpToQuestion(targetQ);
        } else if (window.executeJump) {
          window.executeJump();
        } else if (jumpBtn) {
          jumpBtn.click();
        } else if (window.loadQuestion) {
          window.loadQuestion(targetQ - 1);
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
