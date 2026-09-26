/* ==========================================================================
   TESTBOOK CBT HUB & QUESTION PALETTE CONTROLLER
   Delivers authentic Testbook Web CBT & Mobile App Experience to All Hubs
   ========================================================================== */

(() => {
  // Check if we are on a hub page with #quiz-view
  const quizView = document.getElementById('quiz-view');
  if (!quizView) return;

  // Global CBT State
  const state = {
    totalQuestions: 90,
    currentQuestion: 1,
    questionStatus: {}, // 1: 'answered' | 'not-answered' | 'marked' | 'not-visited'
    timerSeconds: 45 * 60, // 45 minutes standard exam timer
    timerInterval: null,
    examTitle: 'Interactive Practice Test'
  };

  // Build Testbook CBT Container
  function buildTestbookCBTLayout() {
    if (document.getElementById('tb-cbt-wrapper')) return;

    // Create container
    const wrapper = document.createElement('div');
    wrapper.id = 'tb-cbt-wrapper';
    wrapper.className = 'tb-cbt-container';
    wrapper.innerHTML = `
      <!-- Exam Sub-Header -->
      <div class="tb-cbt-header">
        <div class="tb-cbt-test-info">
          <a href="#library" class="tb-btn tb-btn-outline" style="padding:6px 12px;font-size:12px;">← All Tests</a>
          <span class="tb-cbt-title" id="tb-exam-title">Interactive Practice Test</span>
          <span class="tb-section-pill">Section 1: General Exam</span>
        </div>
        <div class="tb-cbt-tools">
          <div class="tb-timer-badge" id="tb-timer">
            <span class="tb-timer-icon">⏳</span>
            <span id="tb-timer-val">45:00</span>
          </div>
          <button type="button" class="tb-btn tb-btn-outline tb-btn-palette-toggle" id="tb-toggle-palette" style="display:none;">☰ Palette</button>
          <button type="button" class="tb-btn tb-btn-outline" id="tb-fullscreen-btn" title="Toggle Fullscreen">⛶ Fullscreen</button>
        </div>
      </div>

      <!-- CBT Body: Main Left + Right Palette -->
      <div class="tb-cbt-body">
        <!-- Left: Question Paper Area -->
        <div class="tb-cbt-main">
          <div class="tb-question-meta-bar">
            <span class="tb-question-num-tag" id="tb-q-num-tag">Question No. 1</span>
            <div class="tb-marking-scheme">
              <span class="tb-mark-pos">+1.00 Marks</span>
              <span class="tb-mark-neg">-0.25 Negative</span>
            </div>
          </div>
          
          <div class="tb-cbt-frame-wrap" id="tb-cbt-frame-wrap">
            <!-- Iframe will be mounted here -->
          </div>

          <!-- Bottom Action Bar (Testbook standard) -->
          <div class="tb-cbt-footer">
            <div class="tb-btn-group-left">
              <button type="button" class="tb-btn tb-btn-purple" id="tb-btn-review">★ Mark for Review & Next</button>
              <button type="button" class="tb-btn tb-btn-outline" id="tb-btn-clear">Clear Response</button>
            </div>
            <div class="tb-btn-group-right">
              <button type="button" class="tb-btn tb-btn-outline" id="tb-btn-prev">← Previous</button>
              <button type="button" class="tb-btn tb-btn-success" id="tb-btn-save-next">Save & Next →</button>
            </div>
          </div>
        </div>

        <!-- Right: Testbook Question Palette -->
        <div class="tb-cbt-palette" id="tb-palette-pane">
          <div class="tb-palette-header">
            <img src="mohit.png" alt="Candidate" class="tb-palette-avatar">
            <div class="tb-palette-user-info">
              <b>Mohit Yadav</b>
              <span>Candidate ID: MY-2026</span>
            </div>
          </div>

          <div class="tb-palette-legend">
            <div class="tb-legend-item"><span class="tb-badge-shape answered" id="tb-count-answered">0</span> Answered</div>
            <div class="tb-legend-item"><span class="tb-badge-shape not-answered" id="tb-count-not-answered">0</span> Not Answered</div>
            <div class="tb-legend-item"><span class="tb-badge-shape marked" id="tb-count-marked">0</span> Marked</div>
            <div class="tb-legend-item"><span class="tb-badge-shape not-visited" id="tb-count-not-visited">90</span> Not Visited</div>
          </div>

          <div class="tb-palette-grid-wrap">
            <div class="tb-palette-title">Question Palette (<span id="tb-total-q-badge">90</span> Questions)</div>
            <div class="tb-palette-grid" id="tb-palette-buttons"></div>
          </div>

          <div class="tb-palette-footer">
            <button type="button" class="tb-btn-submit-exam" id="tb-btn-submit-test">Submit Test</button>
          </div>
        </div>
      </div>
    `;

    // Hide old toolbar and move frame-host inside wrapper
    const oldToolbar = quizView.querySelector('.quiz-toolbar');
    if (oldToolbar) oldToolbar.style.display = 'none';

    const frameHost = document.getElementById('frame-host');
    quizView.replaceChildren(wrapper);
    if (frameHost) {
      document.getElementById('tb-cbt-frame-wrap').replaceChildren(frameHost);
    }

    // Attach Action Listeners
    attachActionListeners();
  }

  // Attach CBT Action Listeners
  function attachActionListeners() {
    const btnNext = document.getElementById('tb-btn-save-next');
    const btnPrev = document.getElementById('tb-btn-prev');
    const btnClear = document.getElementById('tb-btn-clear');
    const btnReview = document.getElementById('tb-btn-review');
    const btnSubmit = document.getElementById('tb-btn-submit-test');
    const btnFullscreen = document.getElementById('tb-fullscreen-btn');
    const btnTogglePalette = document.getElementById('tb-toggle-palette');

    const sendToFrame = action => {
      const frame = document.querySelector('.quiz-frame');
      if (frame && frame.contentWindow) {
        frame.contentWindow.postMessage({ action: action, question: state.currentQuestion }, '*');
      }
    };

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        // If current wasn't answered, mark as not-answered
        if (!state.questionStatus[state.currentQuestion] || state.questionStatus[state.currentQuestion] === 'not-visited') {
          state.questionStatus[state.currentQuestion] = 'not-answered';
        }
        sendToFrame('NEXT');
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        sendToFrame('PREV');
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        delete state.questionStatus[state.currentQuestion];
        state.questionStatus[state.currentQuestion] = 'not-answered';
        sendToFrame('CLEAR');
        updatePaletteGrid();
      });
    }

    if (btnReview) {
      btnReview.addEventListener('click', () => {
        state.questionStatus[state.currentQuestion] = 'marked';
        updatePaletteGrid();
        sendToFrame('NEXT');
      });
    }

    if (btnSubmit) {
      btnSubmit.addEventListener('click', showScorecardModal);
    }

    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          btnFullscreen.textContent = '⛶ Exit Fullscreen';
        } else {
          document.exitFullscreen().catch(() => {});
          btnFullscreen.textContent = '⛶ Fullscreen';
        }
      });
    }

    if (btnTogglePalette) {
      btnTogglePalette.addEventListener('click', () => {
        const palette = document.getElementById('tb-palette-pane');
        if (palette) palette.classList.toggle('open');
      });
    }
  }

  // Initialize Palette Grid with N buttons
  function initPaletteGrid(total) {
    state.totalQuestions = total || 90;
    const grid = document.getElementById('tb-palette-buttons');
    if (!grid) return;

    grid.innerHTML = '';
    for (let i = 1; i <= state.totalQuestions; i++) {
      if (!state.questionStatus[i]) {
        state.questionStatus[i] = 'not-visited';
      }
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `tb-palette-btn not-visited`;
      b.id = `tb-q-btn-${i}`;
      b.textContent = i;
      b.addEventListener('click', () => jumpToQuestion(i));
      grid.appendChild(b);
    }

    document.getElementById('tb-total-q-badge').textContent = state.totalQuestions;
    updatePaletteGrid();
  }

  // Jump to specific question
  function jumpToQuestion(qNum) {
    state.currentQuestion = qNum;
    if (state.questionStatus[qNum] === 'not-visited') {
      state.questionStatus[qNum] = 'not-answered';
    }
    const frame = document.querySelector('.quiz-frame');
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ action: 'JUMP', question: qNum }, '*');
    }
    updatePaletteGrid();
    
    // Close mobile palette drawer if open
    const palette = document.getElementById('tb-palette-pane');
    if (palette && window.innerWidth <= 820) palette.classList.remove('open');
  }

  // Update palette grid button colors and summary counts
  function updatePaletteGrid() {
    let countAnswered = 0;
    let countNotAnswered = 0;
    let countMarked = 0;
    let countNotVisited = 0;

    for (let i = 1; i <= state.totalQuestions; i++) {
      const btn = document.getElementById(`tb-q-btn-${i}`);
      const status = state.questionStatus[i] || 'not-visited';
      
      if (btn) {
        btn.className = `tb-palette-btn ${status} ${i === state.currentQuestion ? 'active' : ''}`;
      }

      if (status === 'answered') countAnswered++;
      else if (status === 'not-answered') countNotAnswered++;
      else if (status === 'marked') countMarked++;
      else countNotVisited++;
    }

    const elA = document.getElementById('tb-count-answered');
    const elNA = document.getElementById('tb-count-not-answered');
    const elM = document.getElementById('tb-count-marked');
    const elNV = document.getElementById('tb-count-not-visited');
    const elTag = document.getElementById('tb-q-num-tag');

    if (elA) elA.textContent = countAnswered;
    if (elNA) elNA.textContent = countNotAnswered;
    if (elM) elM.textContent = countMarked;
    if (elNV) elNV.textContent = countNotVisited;
    if (elTag) elTag.textContent = `Question No. ${state.currentQuestion}`;
  }

  // Timer Countdown
  function startTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerSeconds = 45 * 60; // 45 minutes

    const timerVal = document.getElementById('tb-timer-val');
    const timerBadge = document.getElementById('tb-timer');

    state.timerInterval = setInterval(() => {
      if (state.timerSeconds <= 0) {
        clearInterval(state.timerInterval);
        showScorecardModal();
        return;
      }
      state.timerSeconds--;
      const mins = Math.floor(state.timerSeconds / 60);
      const secs = state.timerSeconds % 60;
      if (timerVal) {
        timerVal.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
      if (timerBadge && state.timerSeconds <= 300) {
        timerBadge.classList.add('warning');
      }
    }, 1000);
  }

  // Testbook Scorecard / Submission Modal
  function showScorecardModal() {
    let countAnswered = 0;
    for (let i = 1; i <= state.totalQuestions; i++) {
      if (state.questionStatus[i] === 'answered') countAnswered++;
    }

    const frame = document.querySelector('.quiz-frame');
    let frameScore = 0;
    try {
      const scoreText = frame?.contentDocument?.querySelector('#score-display, [data-score], #headerScore')?.textContent || '0';
      frameScore = Number(scoreText.match(/\d+/)?.[0]) || countAnswered;
    } catch (e) {
      frameScore = countAnswered;
    }

    const correct = frameScore;
    const incorrect = Math.max(0, countAnswered - correct);
    const unattempted = state.totalQuestions - countAnswered;
    const marksScored = (correct * 1.0 - incorrect * 0.25).toFixed(2);
    const accuracy = countAnswered > 0 ? Math.round((correct / countAnswered) * 100) : 0;

    const modal = document.createElement('div');
    modal.className = 'tb-modal-backdrop';
    modal.id = 'tb-score-modal';
    modal.innerHTML = `
      <div class="tb-modal-card">
        <div class="tb-modal-header">
          <h3>Test Performance Summary</h3>
          <button type="button" style="background:none;border:0;color:#fff;font-size:20px;cursor:pointer;" id="tb-close-modal">✕</button>
        </div>
        <div class="tb-modal-body">
          <div class="tb-score-banner">
            <span class="tb-score-sub">Total Marks Scored</span>
            <div class="tb-score-number">${marksScored} <span style="font-size:16px;color:#64748b;">/ ${state.totalQuestions}.00</span></div>
            <span style="display:inline-block;margin-top:6px;font-size:12px;color:#10b981;font-weight:700;">Accuracy: ${accuracy}%</span>
          </div>

          <div class="tb-stat-grid">
            <div class="tb-stat-box"><b style="color:#0284c7;">${countAnswered}</b><span>Attempted</span></div>
            <div class="tb-stat-box"><b style="color:#10b981;">${correct}</b><span>Correct</span></div>
            <div class="tb-stat-box"><b style="color:#ef4444;">${incorrect}</b><span>Incorrect</span></div>
            <div class="tb-stat-box"><b style="color:#64748b;">${unattempted}</b><span>Unattempted</span></div>
            <div class="tb-stat-box"><b style="color:#7c3aed;">+1.00</b><span>Positive</span></div>
            <div class="tb-stat-box"><b style="color:#f97316;">-0.25</b><span>Negative</span></div>
          </div>
        </div>
        <div class="tb-modal-footer">
          <button type="button" class="tb-btn tb-btn-outline" id="tb-modal-review">Review Questions</button>
          <a href="#library" class="tb-btn tb-btn-primary" style="text-decoration:none;">Back to Test Series</a>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('tb-close-modal').onclick = () => modal.remove();
    document.getElementById('tb-modal-review').onclick = () => modal.remove();
  }

  // Listen to in-quiz state messages
  window.addEventListener('message', event => {
    const data = event.data;
    if (!data || data.type !== 'TB_QUIZ_STATE') return;

    if (data.totalQuestions && data.totalQuestions !== state.totalQuestions) {
      initPaletteGrid(data.totalQuestions);
    }

    if (data.currentQuestion) {
      state.currentQuestion = data.currentQuestion;
    }

    if (data.isAnswered) {
      state.questionStatus[state.currentQuestion] = 'answered';
    }

    updatePaletteGrid();
  });

  // Watch for quiz route activation
  function onRoute() {
    const hash = location.hash.replace('#', '') || 'home';
    if (hash.startsWith('quiz/')) {
      buildTestbookCBTLayout();
      startTimer();
      const title = document.getElementById('quiz-title')?.textContent || 'Interactive Practice Test';
      const elTitle = document.getElementById('tb-exam-title');
      if (elTitle) elTitle.textContent = title;
      
      // Check frame and sanitize immediately
      setTimeout(() => {
        const frame = document.querySelector('.quiz-frame');
        if (frame) {
          try {
            if (window.TestbookCBTEngine) {
              window.TestbookCBTEngine.applyContrastSafeguard(frame.contentDocument);
            }
          } catch(e) {}
        }
      }, 300);
    }
  }

  window.addEventListener('hashchange', onRoute);
  document.addEventListener('DOMContentLoaded', onRoute);
  setTimeout(onRoute, 100);
})();
