/**
 * Cosmic Gemini — Real Google Gemini AI Side Chat & Interactive Quiz Master
 * Works identically to real Google Gemini (gemini.google.com/app):
 * - Direct connection to official Google Gemini 2.0 Flash API
 * - Real conversational intelligence, explanations, and doubts clearing
 * - Interactive quiz generation with live runner & instant scoring
 * - Sliding side panel on cosmic-quiz-master.html (like Edge Copilot / Gemini Web)
 * - 100% non-invasive: does not touch or alter any existing quiz libraries or code!
 */
(function () {
  'use strict';

  const SETTINGS_KEY = 'cosmic_quiz_api_settings';
  const STORAGE_SAVED = 'gemini_saved_quizzes_v1';
  const STORAGE_CHAT = 'gemini_chat_history_v3';

  let settings = {
    geminiKey: '',
    geminiModel: 'gemini-2.0-flash'
  };

  let messages = [];
  let currentAttachment = null;
  let isPanelOpen = false;
  let isExpanded = false;
  let activeRunnerQuiz = null;
  let activeQuestionIdx = 0;
  let userAnswers = [];

  function loadSettings() {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) settings = Object.assign(settings, JSON.parse(saved));
      if (!settings.geminiModel || settings.geminiModel.includes('3.6') || settings.geminiModel.includes('3.5')) {
        settings.geminiModel = 'gemini-2.0-flash';
        saveSettings();
      }
    } catch (e) {}
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {}
  }

  function loadChatHistory() {
    try {
      messages = JSON.parse(localStorage.getItem(STORAGE_CHAT) || '[]');
      if (!Array.isArray(messages)) messages = [];
    } catch (e) { messages = []; }
  }

  function saveChatHistory() {
    try {
      localStorage.setItem(STORAGE_CHAT, JSON.stringify(messages.slice(-20)));
    } catch (e) {}
  }

  // --- Inject CSS Styles (Real Google Gemini Theme) ---
  function injectStyles() {
    if (document.getElementById('real-gemini-styles')) return;
    const style = document.createElement('style');
    style.id = 'real-gemini-styles';
    style.textContent = `
      /* Floating Side Button (Right Edge) */
      .real-gemini-trigger {
        position: fixed;
        right: 0;
        top: 45%;
        transform: translateY(-50%);
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 12px 18px 12px 14px;
        background: linear-gradient(135deg, #1e1f20 0%, #282a2c 100%);
        color: #ffffff;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 0.88rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        border-radius: 28px 0 0 28px;
        border: 1.5px solid rgba(168, 85, 247, 0.45);
        border-right: none;
        cursor: pointer;
        box-shadow: -6px 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(168, 85, 247, 0.35);
        transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        user-select: none;
      }
      .real-gemini-trigger:hover {
        padding-left: 20px;
        border-color: rgba(244, 114, 182, 0.8);
        box-shadow: -8px 12px 35px rgba(168, 85, 247, 0.55);
        transform: translateY(-50%) scale(1.03);
      }
      .real-gemini-trigger .sparkle-icon {
        font-size: 1.25rem;
        background: linear-gradient(135deg, #38bdf8, #c084fc, #ec4899);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: geminiSparkle 2s infinite;
      }

      /* Sliding Side Panel (Google Gemini Dark Theme) */
      .real-gemini-panel {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: min(520px, 100vw);
        background: #131314;
        border-left: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: -20px 0 60px rgba(0, 0, 0, 0.85);
        z-index: 100000;
        display: flex;
        flex-direction: column;
        transform: translateX(105%);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), width 0.25s ease;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #e3e3e3;
      }
      .real-gemini-panel.open {
        transform: translateX(0%);
      }
      .real-gemini-panel.expanded {
        width: min(880px, 100vw);
      }

      /* Header */
      .gemini-top {
        height: 60px;
        padding: 0 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        background: #131314;
        flex-shrink: 0;
      }
      .gemini-title-group {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .gemini-badge {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        background: linear-gradient(135deg, #1a73e8, #a142f4, #ea4335);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        color: #fff;
        box-shadow: 0 0 12px rgba(161, 66, 244, 0.4);
      }
      .gemini-name {
        font-size: 1.1rem;
        font-weight: 700;
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .gemini-status {
        font-size: 0.7rem;
        font-family: monospace;
        padding: 2px 7px;
        border-radius: 999px;
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.4);
        color: #34d399;
      }
      .gemini-status.unconnected {
        background: rgba(245, 158, 11, 0.15);
        border-color: rgba(245, 158, 11, 0.4);
        color: #fbbf24;
      }

      .gemini-btn-row {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .gemini-icon-btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #c4c7c5;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        cursor: pointer;
        transition: 0.18s;
      }
      .gemini-icon-btn:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
      }

      /* Scrollable Chat / Content Body */
      .gemini-scroll-area {
        flex: 1;
        overflow-y: auto;
        padding: 18px 18px 24px;
        display: flex;
        flex-direction: column;
      }

      /* Real Gemini "Where should we start?" Greeting */
      .gemini-welcome-box {
        margin: auto 0;
        text-align: center;
        padding: 24px 8px;
      }
      .gemini-welcome-box h2 {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: clamp(2.1rem, 4vw, 2.7rem);
        font-weight: 700;
        margin-bottom: 22px;
        background: linear-gradient(180deg, #ffffff 40%, #c4b5fd 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .gemini-pills-list {
        display: flex;
        flex-direction: column;
        gap: 9px;
        margin-top: 18px;
      }
      .gemini-pill {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 13px 18px;
        background: #1e1f20;
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 12px;
        font-size: 0.9rem;
        color: #c4c7c5;
        cursor: pointer;
        text-align: left;
        transition: 0.2s;
      }
      .gemini-pill:hover {
        background: #282a2c;
        border-color: rgba(192, 132, 252, 0.4);
        color: #fff;
        transform: translateX(4px);
      }
      .gemini-pill-arrow {
        color: #c084fc;
        font-family: monospace;
      }

      /* Prominent Key Setup Card (When no API key is set) */
      .gemini-key-card {
        background: linear-gradient(145deg, #1e1f20, #25232b);
        border: 1.5px solid rgba(168, 85, 247, 0.4);
        border-radius: 16px;
        padding: 18px;
        margin-bottom: 18px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
      }
      .gemini-key-card h4 {
        margin: 0 0 6px;
        font-size: 1rem;
        color: #fff;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .gemini-key-card p {
        margin: 0 0 12px;
        font-size: 0.83rem;
        color: #a7a7a7;
        line-height: 1.45;
      }
      .gemini-key-row {
        display: flex;
        gap: 8px;
      }
      .gemini-key-input {
        flex: 1;
        padding: 10px 12px;
        background: #131314;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        color: #fff;
        font-size: 0.88rem;
        outline: none;
      }
      .gemini-key-input:focus {
        border-color: #a855f7;
      }
      .gemini-connect-btn {
        padding: 10px 16px;
        background: linear-gradient(110deg, #7c3aed, #db2777);
        border: none;
        border-radius: 8px;
        color: #fff;
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
        flex-shrink: 0;
        transition: 0.2s;
      }
      .gemini-connect-btn:hover {
        transform: scale(1.03);
      }

      /* Chat Messages Stream */
      .gemini-messages {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .msg-item {
        display: flex;
        gap: 12px;
        animation: msgIn 0.25s ease;
      }
      .msg-item.user {
        justify-content: flex-end;
      }
      .msg-avatar {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        flex-shrink: 0;
      }
      .msg-item.user .msg-avatar {
        order: 2;
        background: linear-gradient(135deg, #6d28d9, #9333ea);
        color: #fff;
      }
      .msg-item.assistant .msg-avatar {
        background: linear-gradient(135deg, #1a73e8, #a142f4, #ea4335);
        color: #fff;
      }
      .msg-body {
        max-width: 86%;
        padding: 14px 18px;
        border-radius: 14px;
        font-size: 0.94rem;
        line-height: 1.62;
      }
      .msg-item.user .msg-body {
        order: 1;
        background: linear-gradient(135deg, #5b21b6, #7e22ce);
        color: #fff;
        border-radius: 16px 4px 16px 16px;
      }
      .msg-item.assistant .msg-body {
        background: #1e1f20;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 4px 16px 16px 16px;
        color: #e3e3e3;
      }
      .msg-body p { margin-bottom: 10px; }
      .msg-body p:last-child { margin-bottom: 0; }
      .msg-body ul, .msg-body ol { margin: 8px 0 10px 20px; }
      .msg-body li { margin-bottom: 4px; }
      .msg-body strong { color: #fff; }
      .msg-body code {
        background: rgba(0, 0, 0, 0.4);
        padding: 2px 6px;
        border-radius: 5px;
        color: #f472b6;
        font-family: monospace;
        font-size: 0.88em;
      }

      /* Interactive Quiz Box */
      .quiz-embed-box {
        margin-top: 14px;
        padding: 16px;
        background: linear-gradient(145deg, #231c38, #151024);
        border: 1.5px solid rgba(192, 132, 252, 0.45);
        border-radius: 14px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      }
      .quiz-embed-title {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 1.25rem;
        font-weight: 700;
        color: #fff;
        margin-bottom: 6px;
      }
      .quiz-embed-meta {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-bottom: 14px;
      }
      .quiz-tag {
        font-family: monospace;
        font-size: 0.7rem;
        padding: 3px 8px;
        border-radius: 999px;
        background: rgba(168, 85, 247, 0.2);
        border: 1px solid rgba(168, 85, 247, 0.4);
        color: #e9d5ff;
        text-transform: uppercase;
      }
      .quiz-tag.count {
        background: rgba(251, 191, 36, 0.2);
        border-color: rgba(251, 191, 36, 0.45);
        color: #fde047;
      }
      .quiz-btn-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .act-btn {
        padding: 8px 14px;
        border-radius: 8px;
        font-size: 0.84rem;
        font-weight: 700;
        cursor: pointer;
        border: none;
        transition: 0.18s;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .act-btn.play {
        background: linear-gradient(110deg, #10b981, #059669);
        color: #fff;
      }
      .act-btn.save {
        background: linear-gradient(110deg, #7c3aed, #db2777);
        color: #fff;
      }
      .act-btn.copy {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #d1c8e6;
      }
      .act-btn:hover { transform: translateY(-1px); }

      /* Footer Prompt Capsule (Matching Google Gemini screenshot) */
      .gemini-bottom-dock {
        padding: 14px 18px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        background: #131314;
        flex-shrink: 0;
      }
      .gemini-input-capsule {
        background: #1e1f20;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 24px;
        padding: 10px 16px;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .gemini-input-capsule:focus-within {
        border-color: rgba(192, 132, 252, 0.7);
        box-shadow: 0 4px 22px rgba(168, 85, 247, 0.35);
      }
      .capsule-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .capsule-plus {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.06);
        border: none;
        color: #c4b5fd;
        font-size: 19px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .capsule-plus:hover { background: rgba(168, 85, 247, 0.3); color: #fff; }
      .capsule-text {
        flex: 1;
        background: transparent;
        border: none;
        color: #fff;
        font-family: inherit;
        font-size: 0.95rem;
        line-height: 1.45;
        resize: none;
        max-height: 130px;
        min-height: 24px;
        outline: none;
        padding: 2px 0;
      }
      .capsule-text::placeholder { color: #7e749c; }
      .capsule-send {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(110deg, #7c3aed, #db2777);
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        flex-shrink: 0;
        transition: 0.2s;
      }
      .capsule-send:hover { transform: scale(1.08); }

      /* Quiz Runner Modal */
      .gemini-runner-modal {
        position: fixed;
        inset: 0;
        z-index: 100001;
        background: rgba(5, 3, 12, 0.88);
        backdrop-filter: blur(12px);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .gemini-runner-modal.active { display: flex; }
      .runner-window {
        width: min(780px, 100%);
        max-height: 90vh;
        background: linear-gradient(155deg, #181133, #0d081f);
        border: 2px solid rgba(168, 85, 247, 0.4);
        border-radius: 22px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.8);
        color: #fff;
      }
      .runner-opt-btn {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 18px;
        margin-bottom: 10px;
        background: rgba(255, 255, 255, 0.04);
        border: 1.5px solid rgba(168, 85, 247, 0.2);
        border-radius: 12px;
        color: #e2d9f3;
        font-size: 0.95rem;
        cursor: pointer;
        text-align: left;
        transition: 0.18s;
      }
      .runner-opt-btn:hover:not(:disabled) {
        background: rgba(168, 85, 247, 0.18);
        border-color: rgba(192, 132, 252, 0.5);
      }
      .runner-opt-btn.correct {
        background: rgba(16, 185, 129, 0.2) !important;
        border-color: #10b981 !important;
        color: #6ee7b7 !important;
      }
      .runner-opt-btn.wrong {
        background: rgba(239, 68, 68, 0.2) !important;
        border-color: #ef4444 !important;
        color: #fca5a5 !important;
      }
      .runner-opt-letter {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: monospace;
        font-weight: 700;
        font-size: 0.8rem;
        flex-shrink: 0;
      }

      @keyframes geminiSparkle { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.18); } }
      @keyframes msgIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);
  }

  // --- Build Side Panel Elements ---
  function buildUI() {
    if (document.getElementById('real-gemini-panel')) return;

    // 1. Floating Right Edge Button
    const trigger = document.createElement('div');
    trigger.id = 'real-gemini-trigger';
    trigger.className = 'real-gemini-trigger';
    trigger.title = 'Open Google Gemini (Alt+C)';
    trigger.innerHTML = `<span class="sparkle-icon">✦</span> <span>Gemini</span>`;
    document.body.appendChild(trigger);

    // 2. Also inject in navigation
    const nav = document.querySelector('header nav');
    if (nav && !document.getElementById('real-gemini-nav-link')) {
      const link = document.createElement('a');
      link.id = 'real-gemini-nav-link';
      link.href = 'javascript:void(0)';
      link.style.cssText = 'color:#f472b6; font-weight:800; display:inline-flex; align-items:center; gap:5px;';
      link.innerHTML = `✦ Gemini`;
      nav.appendChild(link);
    }

    // 3. Sliding Side Panel
    const panel = document.createElement('aside');
    panel.id = 'real-gemini-panel';
    panel.className = 'real-gemini-panel';
    panel.innerHTML = `
      <header class="gemini-top">
        <div class="gemini-title-group">
          <div class="gemini-badge">✦</div>
          <div class="gemini-name">Gemini <span id="gemini-status-tag" class="gemini-status unconnected">Key Required</span></div>
        </div>
        <div class="gemini-btn-row">
          <button class="gemini-icon-btn" title="Toggle Fullscreen Width" onclick="window.cqRealGemini.toggleExpand()">⛶</button>
          <button class="gemini-icon-btn" title="New Chat" onclick="window.cqRealGemini.clearChat()">＋</button>
          <button class="gemini-icon-btn" title="API Key Settings" onclick="window.cqRealGemini.showKeyPrompt()">⚙️</button>
          <button class="gemini-icon-btn" style="color:#f87171;" title="Close Panel" onclick="window.cqRealGemini.closePanel()">✕</button>
        </div>
      </header>

      <div class="gemini-scroll-area" id="gemini-scroll-area">
        <!-- Messages or Welcome View injected here -->
      </div>

      <footer class="gemini-bottom-dock">
        <div class="gemini-input-capsule">
          <div class="capsule-row">
            <button class="capsule-plus" type="button" title="Attach Notes or Image" onclick="document.getElementById('gemini-upload-file').click()">＋</button>
            <input type="file" id="gemini-upload-file" style="display:none;" accept=".pdf,image/*,.txt" onchange="window.cqRealGemini.handleUpload(event)">
            <textarea id="gemini-chat-text" class="capsule-text" placeholder="Ask Gemini anything or type: 'Make a 5-question quiz on...'"></textarea>
            <button class="capsule-send" id="gemini-submit-btn" type="button" title="Send" onclick="window.cqRealGemini.send()">➔</button>
          </div>
          <div id="gemini-file-tag" style="display:none; font-size:0.75rem; color:#fde047; margin-top:6px;">📎 Attached: <span id="gemini-file-label"></span></div>
        </div>
      </footer>
    `;
    document.body.appendChild(panel);

    // 4. Runner Modal (Play Quiz)
    const runner = document.createElement('div');
    runner.id = 'real-gemini-runner';
    runner.className = 'gemini-runner-modal';
    runner.innerHTML = `
      <div class="runner-window">
        <div style="padding:16px 20px; border-bottom:1px solid rgba(168,85,247,0.2); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h3 id="runner-title-txt" style="margin:0; font-size:1.15rem; font-family:'Playfair Display',serif;">Practice Quiz</h3>
            <small id="runner-counter-txt" style="color:#c4b5fd; font-family:monospace;">Question 1 / 5</small>
          </div>
          <button class="gemini-icon-btn" style="color:#f87171;" onclick="window.cqRealGemini.closeRunner()">✕</button>
        </div>

        <div style="padding:24px; overflow-y:auto; flex:1;" id="runner-q-container">
          <div id="runner-q-text" style="font-size:1.2rem; font-weight:600; line-height:1.45; margin-bottom:18px;">Question Statement</div>
          <div id="runner-choices"></div>
          <div id="runner-exp-box" style="display:none; margin-top:14px; padding:14px; background:rgba(30,20,56,0.7); border:1px solid rgba(168,85,247,0.3); border-radius:10px; font-size:0.9rem; color:#e9d5ff;">
            <b style="color:#fbbf24;">💡 Explanation:</b> <span id="runner-exp-msg"></span>
          </div>
        </div>

        <div style="display:none; padding:30px; text-align:center;" id="runner-score-container">
          <h2 style="font-family:'Playfair Display',serif; font-size:2.2rem; margin-bottom:8px;">Quiz Completed!</h2>
          <div id="runner-score-num" style="font-size:2.2rem; font-weight:800; color:#fbbf24; margin-bottom:12px;">5 / 5</div>
          <p id="runner-score-eval" style="color:#c4b5fd; margin-bottom:24px;">Great job!</p>
          <div style="display:flex; gap:10px; justify-content:center;">
            <button class="act-btn play" onclick="window.cqRealGemini.replayQuiz()">🔄 Play Again</button>
            <button class="act-btn save" onclick="window.cqRealGemini.saveCurrentQuiz()">💾 Save to Library</button>
            <button class="act-btn copy" onclick="window.cqRealGemini.closeRunner()">Close</button>
          </div>
        </div>

        <div style="padding:14px 20px; border-top:1px solid rgba(168,85,247,0.2); display:flex; justify-content:space-between;" id="runner-nav-row">
          <button class="act-btn copy" id="runner-btn-prev" onclick="window.cqRealGemini.prevQuestion()">← Prev</button>
          <button class="act-btn play" id="runner-btn-next" onclick="window.cqRealGemini.nextQuestion()">Next →</button>
        </div>
      </div>
    `;
    document.body.appendChild(runner);

    // Bind Enter key
    const ta = document.getElementById('gemini-chat-text');
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });

    // Keyboard shortcut Alt+C
    window.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        togglePanel();
      }
    });
  }

  // --- Panel Open / Close ---
  function openPanel() {
    isPanelOpen = true;
    document.getElementById('real-gemini-panel')?.classList.add('open');
    updateStatusTag();
    renderContent();
    setTimeout(() => document.getElementById('gemini-chat-text')?.focus(), 100);
  }

  function closePanel() {
    isPanelOpen = false;
    document.getElementById('real-gemini-panel')?.classList.remove('open');
  }

  function togglePanel() {
    if (isPanelOpen) closePanel();
    else openPanel();
  }

  function toggleExpand() {
    isExpanded = !isExpanded;
    const panel = document.getElementById('real-gemini-panel');
    if (panel) {
      if (isExpanded) panel.classList.add('expanded');
      else panel.classList.remove('expanded');
    }
  }

  function clearChat() {
    if (confirm('Start a new chat with Gemini?')) {
      messages = [];
      saveChatHistory();
      renderContent();
    }
  }

  function updateStatusTag() {
    const tag = document.getElementById('gemini-status-tag');
    if (!tag) return;
    if (settings.geminiKey) {
      tag.className = 'gemini-status';
      tag.textContent = 'Live AI Active';
      tag.title = 'Connected to official Google Gemini 2.0 Flash';
    } else {
      tag.className = 'gemini-status unconnected';
      tag.textContent = 'Key Required';
      tag.title = 'Paste your Google AI Studio key to activate real Gemini';
    }
  }

  function handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      currentAttachment = {
        name: file.name,
        type: file.type || 'application/octet-stream',
        base64: String(e.target.result).split(',')[1],
        isText: file.type.startsWith('text/')
      };
      document.getElementById('gemini-file-label').textContent = file.name;
      document.getElementById('gemini-file-tag').style.display = 'block';
    };
    if (file.type.startsWith('text/')) reader.readAsText(file);
    else reader.readAsDataURL(file);
  }

  function clearAttachment() {
    currentAttachment = null;
    document.getElementById('gemini-upload-file').value = '';
    document.getElementById('gemini-file-tag').style.display = 'none';
  }

  // --- Render Content ---
  function renderContent() {
    const container = document.getElementById('gemini-scroll-area');
    if (!container) return;

    let keyCardHtml = '';
    if (!settings.geminiKey) {
      keyCardHtml = `
        <div class="gemini-key-card" id="gemini-key-banner-card">
          <h4>✦ Connect Official Google Gemini</h4>
          <p>Paste your free Google AI Studio API key to enable live, unconstrained Gemini AI conversation and instant quiz generation:</p>
          <div class="gemini-key-row">
            <input type="password" id="inline-key-input" class="gemini-key-input" placeholder="Paste Google API key (AIzaSy...)">
            <button class="gemini-connect-btn" onclick="window.cqRealGemini.connectKey()">Connect ➔</button>
          </div>
          <div style="margin-top:8px; font-size:0.75rem; color:#c4b5fd;">
            Need a key? <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:#38bdf8; font-weight:700; text-decoration:none;">Click here to get a free key from Google AI Studio ↗</a>
          </div>
        </div>
      `;
    }

    if (messages.length === 0) {
      container.innerHTML = `
        ${keyCardHtml}
        <div class="gemini-welcome-box">
          <h2>Where should we start?</h2>
          <div class="gemini-pills-list">
            <div class="gemini-pill" onclick="window.cqRealGemini.quickAsk('Create a 5-question high-yield Current Affairs practice quiz with detailed explanations.')">
              <span class="gemini-pill-arrow">↳</span>
              <span>⚡ Create a 5-question Current Affairs practice quiz</span>
            </div>
            <div class="gemini-pill" onclick="window.cqRealGemini.quickAsk('Make a 5-question Indian History PYQ test on Ancient India with explanations.')">
              <span class="gemini-pill-arrow">↳</span>
              <span>🏛️ Make Indian History PYQ test with explanations</span>
            </div>
            <div class="gemini-pill" onclick="window.cqRealGemini.quickAsk('Create a 5-question quiz on Computer Architecture and Networking.')">
              <span class="gemini-pill-arrow">↳</span>
              <span>💻 Build a Computer Knowledge practice test</span>
            </div>
            <div class="gemini-pill" onclick="window.cqRealGemini.quickAsk('Test my English Vocabulary with 5 challenging Blackbook words and Hindi meanings.')">
              <span class="gemini-pill-arrow">↳</span>
              <span>📖 Test English Vocabulary with Synonyms</span>
            </div>
            <div class="gemini-pill" onclick="window.cqRealGemini.quickAsk('Explain the difference between GDP and GNP in simple words with real life examples.')">
              <span class="gemini-pill-arrow">↳</span>
              <span>💡 Clear doubt or explain any concept in simple words</span>
            </div>
          </div>
        </div>
      `;
      return;
    }

    let html = keyCardHtml + '<div class="gemini-messages">';
    messages.forEach((msg, idx) => {
      const isUser = msg.role === 'user';
      let contentText = (msg.text || '').replace(/```(?:json)?\s*[\s\S]*?\s*```/g, '').trim();
      let formattedText = contentText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

      html += `
        <div class="msg-item ${msg.role}">
          <div class="msg-avatar">${isUser ? '👤' : '✦'}</div>
          <div class="msg-body">
            ${msg.attachmentName ? `<div style="color:#fde047; font-size:0.75rem; margin-bottom:6px;">📎 Attached: ${escapeHtml(msg.attachmentName)}</div>` : ''}
            <p>${formattedText}</p>
            ${msg.quiz ? renderQuizCard(msg.quiz, idx) : ''}
          </div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
  }

  function renderQuizCard(quiz, idx) {
    return `
      <div class="quiz-embed-box">
        <div class="quiz-embed-title">🎯 ${escapeHtml(quiz.title || 'Interactive Quiz')}</div>
        <div class="quiz-embed-meta">
          <span class="quiz-tag">${escapeHtml(quiz.category || 'Practice')}</span>
          <span class="quiz-tag count">${quiz.questions ? quiz.questions.length : 0} Questions</span>
          <span class="quiz-tag">${escapeHtml(quiz.difficulty || 'All Levels')}</span>
        </div>
        <div class="quiz-btn-actions">
          <button class="act-btn play" onclick="window.cqRealGemini.playQuizFromIndex(${idx})">▶ Play Quiz Now</button>
          <button class="act-btn save" onclick="window.cqRealGemini.saveQuizFromIndex(${idx})">💾 Save</button>
          <button class="act-btn copy" onclick="window.cqRealGemini.copyQuizFromIndex(${idx})">📋 Copy</button>
        </div>
      </div>
    `;
  }

  // --- Real Google Gemini API Call ---
  async function callGoogleGemini(apiKey, promptText, attach) {
    const key = apiKey.trim().replace(/^["']|["']$/g, '');
    const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

    const systemPrompt = `You are Google Gemini, an intelligent, helpful, and articulate AI study assistant and quiz creator.
Answer the user's questions clearly, naturally, and warmly with clean markdown formatting, bold highlights, and helpful explanations.
WHEN ASKED TO CREATE A QUIZ (or test, MCQs, or practice questions), provide high quality questions and ALWAYS append a structured JSON block at the very end inside \`\`\`json ... \`\`\` with this exact format:
\`\`\`json
{
  "title": "Topic Quiz Title",
  "category": "Subject Category",
  "difficulty": "Easy|Medium|Hard",
  "questions": [
    {
      "question": "Question statement?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 0,
      "explanation": "Detailed explanation of correct answer."
    }
  ]
}
\`\`\`
The "answer" must be an integer: 0 for Option A, 1 for Option B, 2 for Option C, 3 for Option D.`;

    // Strictly alternate user and model messages without consecutive duplicates
    const contents = [];
    let lastRole = null;
    const historySlice = messages.slice(-8);

    for (let i = 0; i < historySlice.length - 1; i++) {
      const m = historySlice[i];
      const cleanM = (m.text || '').trim();
      if (!cleanM || cleanM.startsWith('⚠️') || cleanM.startsWith('Error:')) continue;
      const r = m.role === 'user' ? 'user' : 'model';
      if (r === lastRole) continue;
      contents.push({ role: r, parts: [{ text: cleanM }] });
      lastRole = r;
    }

    while (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents.pop();
    }

    const currentParts = [];
    if (attach && attach.base64 && !attach.isText) {
      currentParts.push({ inlineData: { mimeType: attach.type, data: attach.base64 } });
    }
    currentParts.push({ text: promptText || 'Analyze attachment' });
    contents.push({ role: 'user', parts: currentParts });

    let lastErr = null;
    for (const mName of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${encodeURIComponent(key)}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048
            }
          })
        });

        const data = await resp.json();
        if (!resp.ok) {
          throw new Error(data.error?.message || `HTTP ${resp.status}`);
        }

        settings.geminiModel = mName;
        saveSettings();
        return data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || 'No response received.';
      } catch (err) {
        lastErr = err;
      }
    }

    throw lastErr || new Error('Connection failed. Please check your API key.');
  }

  function extractQuizFromReply(text) {
    const m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (!m) return null;
    try {
      const q = JSON.parse(m[1]);
      if (q.questions && Array.isArray(q.questions) && q.questions.length > 0) return q;
    } catch (e) {}
    return null;
  }

  // --- Send Message ---
  async function send() {
    const input = document.getElementById('gemini-chat-text');
    const text = input.value.trim();
    if (!text && !currentAttachment) return;

    if (!settings.geminiKey) {
      showKeyPrompt();
      return;
    }

    const attach = currentAttachment;
    clearAttachment();

    messages.push({
      role: 'user',
      text: text,
      attachmentName: attach ? attach.name : null
    });

    input.value = '';
    input.style.height = 'auto';
    renderContent();

    const area = document.getElementById('gemini-scroll-area');
    const loadingId = 'loading-' + Date.now();
    const loadEl = document.createElement('div');
    loadEl.id = loadingId;
    loadEl.className = 'msg-item assistant';
    loadEl.innerHTML = `
      <div class="msg-avatar">✦</div>
      <div class="msg-body" style="color:#c4b5fd;">
        <span style="display:inline-block; animation:geminiSparkle 1.2s infinite;">✨ Gemini is thinking...</span>
      </div>
    `;
    area.appendChild(loadEl);
    area.scrollTop = area.scrollHeight;

    try {
      const reply = await callGoogleGemini(settings.geminiKey, text, attach);
      document.getElementById(loadingId)?.remove();

      const quiz = extractQuizFromReply(reply);
      messages.push({
        role: 'assistant',
        text: reply,
        quiz: quiz
      });
      saveChatHistory();
      renderContent();

    } catch (err) {
      document.getElementById(loadingId)?.remove();
      messages.push({
        role: 'assistant',
        text: `⚠️ **Gemini Connection Note**: ${err.message}\n\nPlease verify that your Google AI Studio API key is valid and has not exceeded quota.`
      });
      renderContent();
    }
  }

  function quickAsk(promptText) {
    document.getElementById('gemini-chat-text').value = promptText;
    send();
  }

  function connectKey() {
    const input = document.getElementById('inline-key-input');
    const val = (input ? input.value : '').trim().replace(/^["']|["']$/g, '');
    if (!val) {
      alert('Please paste your Google AI Studio API key.');
      return;
    }
    settings.geminiKey = val;
    saveSettings();
    updateStatusTag();
    renderContent();
    alert('✅ Real Google Gemini Connected! You can now chat freely or generate quizzes.');
  }

  function showKeyPrompt() {
    const key = prompt('Paste your Google Gemini API Key from Google AI Studio:\n(Get one free from aistudio.google.com/apikey)', settings.geminiKey || '');
    if (key !== null) {
      settings.geminiKey = key.trim().replace(/^["']|["']$/g, '');
      saveSettings();
      updateStatusTag();
      renderContent();
      if (settings.geminiKey) alert('✅ Gemini Key Saved! You can now chat with real Google AI.');
    }
  }

  // --- Quiz Runner Modal ---
  function playQuiz(quiz) {
    activeRunnerQuiz = quiz;
    activeQuestionIdx = 0;
    userAnswers = new Array(quiz.questions.length).fill(null);

    document.getElementById('runner-title-txt').textContent = quiz.title || 'Interactive Quiz';
    document.getElementById('runner-q-container').style.display = 'block';
    document.getElementById('runner-score-container').style.display = 'none';
    document.getElementById('runner-nav-row').style.display = 'flex';

    document.getElementById('real-gemini-runner').classList.add('active');
    renderQuestion();
  }

  function renderQuestion() {
    const qz = activeRunnerQuiz;
    const q = qz.questions[activeQuestionIdx];
    const total = qz.questions.length;

    document.getElementById('runner-counter-txt').textContent = `Question ${activeQuestionIdx + 1} / ${total} • ${qz.category || 'Practice'}`;
    document.getElementById('runner-q-text').textContent = q.question;

    const wrap = document.getElementById('runner-choices');
    wrap.innerHTML = '';

    const letters = ['A', 'B', 'C', 'D', 'E'];
    const chosen = userAnswers[activeQuestionIdx];

    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'runner-opt-btn';
      btn.innerHTML = `<span class="runner-opt-letter">${letters[idx]}</span> <span>${escapeHtml(opt)}</span>`;

      if (chosen !== null) {
        btn.disabled = true;
        if (idx === q.answer) btn.classList.add('correct');
        if (idx === chosen && chosen !== q.answer) btn.classList.add('wrong');
      } else {
        btn.onclick = () => {
          userAnswers[activeQuestionIdx] = idx;
          renderQuestion();
        };
      }
      wrap.appendChild(btn);
    });

    const exp = document.getElementById('runner-exp-box');
    if (chosen !== null) {
      exp.style.display = 'block';
      document.getElementById('runner-exp-msg').textContent = q.explanation || 'No detailed explanation provided.';
    } else {
      exp.style.display = 'none';
    }

    document.getElementById('runner-btn-prev').disabled = activeQuestionIdx === 0;
    document.getElementById('runner-btn-next').textContent = activeQuestionIdx === total - 1 ? 'Finish ➔' : 'Next →';
  }

  function nextQuestion() {
    if (activeQuestionIdx < activeRunnerQuiz.questions.length - 1) {
      activeQuestionIdx++;
      renderQuestion();
    } else {
      finishQuiz();
    }
  }

  function prevQuestion() {
    if (activeQuestionIdx > 0) {
      activeQuestionIdx--;
      renderQuestion();
    }
  }

  function finishQuiz() {
    document.getElementById('runner-q-container').style.display = 'none';
    document.getElementById('runner-nav-row').style.display = 'none';
    document.getElementById('runner-score-container').style.display = 'block';

    let score = 0;
    const total = activeRunnerQuiz.questions.length;
    activeRunnerQuiz.questions.forEach((q, i) => {
      if (userAnswers[i] === q.answer) score++;
    });

    document.getElementById('runner-score-num').textContent = `${score} / ${total}`;
    const pct = Math.round((score / total) * 100);
    document.getElementById('runner-score-eval').textContent = pct >= 80
      ? `🌟 Outstanding Mastery! (${pct}% Accuracy)`
      : pct >= 50 ? `👍 Good effort! (${pct}% Accuracy)` : `💪 Keep practicing! (${pct}% Accuracy)`;
  }

  function replayQuiz() {
    if (activeRunnerQuiz) playQuiz(activeRunnerQuiz);
  }

  function closeRunner() {
    document.getElementById('real-gemini-runner')?.classList.remove('active');
  }

  function playQuizFromIndex(idx) {
    const msg = messages[idx];
    if (msg && msg.quiz) playQuiz(msg.quiz);
  }

  function saveQuiz(quiz) {
    try {
      const list = JSON.parse(localStorage.getItem(STORAGE_SAVED) || '[]');
      quiz.id = 'qz_' + Date.now().toString(36);
      quiz.savedAt = new Date().toLocaleDateString();
      list.unshift(quiz);
      localStorage.setItem(STORAGE_SAVED, JSON.stringify(list));

      if (window.cqStudio && typeof window.cqStudio.addQuiz === 'function') {
        window.cqStudio.addQuiz(quiz);
      }
      alert(`✅ "${quiz.title}" has been saved to your library!`);
    } catch (e) {
      alert('Error saving quiz: ' + e.message);
    }
  }

  function saveQuizFromIndex(idx) {
    const msg = messages[idx];
    if (msg && msg.quiz) saveQuiz(msg.quiz);
  }

  function saveCurrentQuiz() {
    if (activeRunnerQuiz) saveQuiz(activeRunnerQuiz);
  }

  function copyQuizFromIndex(idx) {
    const msg = messages[idx];
    if (msg && msg.quiz) {
      navigator.clipboard.writeText(JSON.stringify(msg.quiz, null, 2));
      alert('📋 Quiz JSON copied to clipboard!');
    }
  }

  function escapeHtml(val) {
    return String(val || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  // --- Initialize ---
  function init() {
    loadSettings();
    loadChatHistory();
    injectStyles();
    buildUI();
    updateStatusTag();

    // Event delegation on document so clicks NEVER fail
    document.addEventListener('click', (e) => {
      if (e.target.closest('#real-gemini-trigger') || e.target.closest('#real-gemini-nav-link') || e.target.closest('.real-gemini-trigger')) {
        e.preventDefault();
        togglePanel();
      }
    });
  }

  window.cqRealGemini = {
    openPanel,
    closePanel,
    togglePanel,
    toggleExpand,
    clearChat,
    handleUpload,
    send,
    quickAsk,
    connectKey,
    showKeyPrompt,
    playQuizFromIndex,
    saveQuizFromIndex,
    copyQuizFromIndex,
    nextQuestion,
    prevQuestion,
    replayQuiz,
    saveCurrentQuiz,
    closeRunner
  };

  // Backward compatibility
  window.cqGemini = window.cqRealGemini;
  window.cqCopilot = window.cqRealGemini;
  window.cqChat = { open: openPanel };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
