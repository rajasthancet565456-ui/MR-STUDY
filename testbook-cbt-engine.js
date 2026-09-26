/* ==========================================================================
   TESTBOOK CBT ENGINE & CONTRAST SAFEGUARD
   Guarantees 100% High-Contrast Readability & Testbook CBT Behavior
   ========================================================================== */

(() => {
  const isInsideFrame = window.self !== window.top;
  
  // 1. HIGH-CONTRAST TESTBOOK IN-QUIZ STYLESHEET
  const testbookInQuizCSS = `
    /* Force high-contrast Testbook CBT theme inside quiz */
    :root {
      --tb-text-dark: #0f172a !important;
      --tb-text-body: #1e293b !important;
      --tb-surface: #ffffff !important;
      --tb-border: #cbd5e1 !important;
      --tb-primary: #0284c7 !important;
      --tb-green: #10b981 !important;
      --tb-red: #ef4444 !important;
      --tb-purple: #7c3aed !important;
    }
    
    html, body {
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
      padding-bottom: 30px !important;
    }
    
    body:before, body:after {
      display: none !important;
    }
    
    /* Hide conflicting outer headers/docks inside iframe */
    #cosmic-quiz-dock, #direct-dock, #quiz-question-dock {
      display: none !important;
    }
    
    /* Main Quiz Container */
    main, main > div, #quiz-container, #quiz-card {
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05) !important;
      color: #0f172a !important;
      border-radius: 10px !important;
      padding: 24px !important;
      max-width: 100% !important;
      margin: 0 !important;
    }
    
    /* QUESTION TEXT - 100% GUARANTEED VISIBLE DARK CHARCOAL */
    #question-text, .question-text, h2#question-text, [data-question] {
      color: #0f172a !important;
      font-size: 1.15rem !important;
      font-weight: 600 !important;
      line-height: 1.6 !important;
      text-shadow: none !important;
      margin-bottom: 20px !important;
    }
    
    /* Question Meta / Tags */
    #question-counter, #question-tag, .question-tag {
      color: #475569 !important;
      font-weight: 600 !important;
    }
    
    #question-tag {
      background: #f1f5f9 !important;
      color: #0369a1 !important;
      border: 1px solid #cbd5e1 !important;
    }

    /* OPTIONS CONTAINER */
    #options-container, #options {
      display: flex !important;
      flex-direction: column !important;
      gap: 12px !important;
    }

    /* OPTION BUTTONS - TESTBOOK CARD STYLE */
    #options-container button, #options button, button[class*="option"], .option {
      width: 100% !important;
      min-height: 52px !important;
      padding: 14px 18px !important;
      background: #ffffff !important;
      border: 1.5px solid #cbd5e1 !important;
      border-radius: 8px !important;
      color: #1e293b !important;
      font-size: 15px !important;
      font-weight: 500 !important;
      text-align: left !important;
      display: flex !important;
      align-items: center !important;
      cursor: pointer !important;
      transition: all 0.15s ease-in-out !important;
      box-shadow: none !important;
      text-shadow: none !important;
      opacity: 1 !important;
    }
    
    #options-container button *, #options button *, button[class*="option"] * {
      color: inherit !important;
      text-shadow: none !important;
    }

    #options-container button:hover, #options button:hover {
      background: #f0f7ff !important;
      border-color: #0284c7 !important;
      color: #0369a1 !important;
    }

    /* Option States */
    .selected, [aria-checked="true"], button.selected {
      background: #e0f2fe !important;
      border-color: #0284c7 !important;
      border-width: 2px !important;
      color: #0369a1 !important;
      font-weight: 600 !important;
    }

    /* Correct Answer */
    [class*="emerald"], [class*="green"], .correct, .is-correct {
      background: #ecfdf5 !important;
      border-color: #10b981 !important;
      border-width: 2px !important;
      color: #065f46 !important;
      font-weight: 600 !important;
    }

    /* Incorrect Answer */
    [class*="rose"], [class*="red"], .wrong, .incorrect, .is-incorrect {
      background: #fef2f2 !important;
      border-color: #ef4444 !important;
      border-width: 2px !important;
      color: #991b1b !important;
      font-weight: 600 !important;
    }

    /* EXPLANATION / RATIONALE BOX */
    #rationale-box, .explanation-box, [id*="rationale" i], [id*="explanation" i] {
      background: #f8fafc !important;
      border: 1px solid #cbd5e1 !important;
      border-left: 4px solid #0284c7 !important;
      border-radius: 8px !important;
      padding: 16px !important;
      margin-top: 20px !important;
      color: #1e293b !important;
    }

    #rationale-title, .explanation-title {
      font-size: 14px !important;
      font-weight: 700 !important;
      margin-bottom: 6px !important;
      color: #0f172a !important;
    }

    #rationale-text, .explanation-text {
      font-size: 14px !important;
      line-height: 1.6 !important;
      color: #334155 !important;
    }

    /* HINT BOX */
    #hint-box {
      background: #fffbeb !important;
      border: 1px solid #fde68a !important;
      border-left: 4px solid #f59e0b !important;
      color: #92400e !important;
      border-radius: 8px !important;
      padding: 12px 16px !important;
      font-size: 13px !important;
    }

    /* INTERNAL NAVIGATION ROW - Styled like Testbook or hidden in favor of outer CBT bar */
    .flex.items-center.justify-between, .navigation-row {
      border-top: 1px solid #e2e8f0 !important;
      padding-top: 16px !important;
    }
  `;

  // Apply in quiz document
  function applyContrastSafeguard(doc) {
    if (!doc || !doc.head) return;
    
    // Purge conflicting white-on-white stylesheets
    const brokenThemes = doc.querySelectorAll('#cosmic-readable-quiz-theme, #lavender-quiz-layer, #lavender-quiz-app-ui, #readability-safeguard');
    brokenThemes.forEach(el => el.remove());

    // Inject Testbook High-Contrast Sheet
    let tbStyle = doc.getElementById('tb-high-contrast-layer');
    if (!tbStyle) {
      tbStyle = doc.createElement('style');
      tbStyle.id = 'tb-high-contrast-layer';
      doc.head.append(tbStyle);
    }
    tbStyle.textContent = testbookInQuizCSS;

    // Enhance Option Buttons with Testbook circular (A), (B), (C), (D) badges
    enhanceOptionBadges(doc);
  }

  function enhanceOptionBadges(doc) {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const options = doc.querySelectorAll('#options-container button, #options button, .option');
    options.forEach((btn, idx) => {
      if (btn.querySelector('.tb-opt-badge')) return;
      const letter = letters[idx % letters.length];
      const badge = doc.createElement('span');
      badge.className = 'tb-opt-badge';
      badge.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#f1f5f9;color:#0f172a;font-weight:700;font-size:12px;margin-right:12px;flex-shrink:0;border:1px solid #cbd5e1;';
      badge.textContent = letter;
      btn.prepend(badge);
    });
  }

  // If running inside iframe
  if (isInsideFrame) {
    document.addEventListener('DOMContentLoaded', () => applyContrastSafeguard(document));
    applyContrastSafeguard(document);
    
    // Watch for dynamic question renders
    const observer = new MutationObserver(() => {
      enhanceOptionBadges(document);
      notifyParentState();
    });
    
    window.addEventListener('load', () => {
      applyContrastSafeguard(document);
      const target = document.querySelector('#quiz-container, #options-container, main');
      if (target) observer.observe(target, { childList: true, subtree: true });
      notifyParentState();
    });

    // Notify parent CBT runner of current question state
    function notifyParentState() {
      try {
        const counterText = document.querySelector('#question-counter, [data-question-number], .question-number')?.textContent || '';
        const match = counterText.match(/(\d+)\s*(?:of|\/)\s*(\d+)/i) || counterText.match(/(\d+)/);
        const currentQ = match ? Number(match[1]) : 1;
        const totalQ = (match && match[2]) ? Number(match[2]) : (window.quizData?.length || 90);
        
        // Check if currently answered
        const isAnswered = Boolean(document.querySelector('.selected, .correct, .wrong, [aria-checked="true"]'));
        
        window.parent.postMessage({
          type: 'TB_QUIZ_STATE',
          currentQuestion: currentQ,
          totalQuestions: totalQ,
          isAnswered: isAnswered
        }, '*');
      } catch (e) {}
    }

    // Listen to parent CBT commands
    window.addEventListener('message', event => {
      const data = event.data;
      if (!data || !data.action) return;

      if (data.action === 'NEXT') {
        const btn = document.querySelector('#next-btn, #next, button[data-action="next"]');
        if (btn && !btn.disabled) btn.click();
      } else if (data.action === 'PREV') {
        const btn = document.querySelector('#prev-btn, #previous, button[data-action="prev"]');
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
        }
      } else if (data.action === 'CLEAR') {
        // Clear selection if allowed
        const selected = document.querySelectorAll('.selected, [aria-checked="true"]');
        selected.forEach(s => s.classList.remove('selected'));
      }
      setTimeout(notifyParentState, 50);
    });
  }

  // Export engine globally
  window.TestbookCBTEngine = {
    applyContrastSafeguard: applyContrastSafeguard
  };
})();
