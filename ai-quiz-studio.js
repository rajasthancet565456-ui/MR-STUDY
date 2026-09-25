/**
 * Cosmic Quiz Universe - AI Studio & Universal Library Engine
 * Complete integration:
 * 1. AI Generation with Multimodal support (PDF, Image, Notes) via Gemini & ChatGPT.
 * 2. Universal Quiz Importer (HTML files, JSON, or text from ChatGPT/Gemini).
 * 3. Full Add & Remove Libraries (syncs with homepage grid).
 * 4. Full Add, Edit, Remove, & Play Quizzes.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'cosmicQuizStudioV1';
  const SETTINGS_KEY = 'cosmic_quiz_api_settings';

  const DEFAULT_LIBRARIES = [
    { id: 'hr-ca-quiz-hub', name: 'HR Current Affairs', tag: 'HR CA', description: 'Current-affairs practice collection.', colour: '#7654cc', url: 'hr-ca-quiz-hub.html#library' },
    { id: 'speedyca-quiz-hub', name: 'SpeedyCA Archive', tag: 'SpeedyCA', description: 'Full SpeedyCA quiz archive.', colour: '#47a8d3', url: 'speedyca-quiz-hub.html#library' },
    { id: 'hr-eklavya-quiz-hub', name: 'HR Eklavya Book', tag: 'Eklavya', description: 'Quizz series plus D-series trainers.', colour: '#d95ea6', url: 'hr-eklavya-quiz-hub.html#library' },
    { id: 'hr-pyq-quiz-hub', name: 'Previous-Year Questions', tag: 'HR PYQ', description: 'Previous-year question practice.', colour: '#d8952c', url: 'hr-pyq-quiz-hub.html#library' },
    { id: 'ah-quiz-hub', name: 'AH Collection', tag: 'AH Quiz', description: 'Dedicated AH interactive quizzes.', colour: '#50aa89', url: 'ah-quiz-hub.html#library' },
    { id: 'computer-quiz-hub', name: 'Computer Studies', tag: 'Computer', description: 'Computer knowledge practice sets.', colour: '#7654cc', url: 'computer-quiz-hub.html#library' },
    { id: 'english-vocab-quiz-hub', name: 'English Vocabulary', tag: 'Vocab Energy', description: 'Blackbook vocabulary mastery missions.', colour: '#f471bd', url: 'english-vocab-quiz-hub.html#library' }
  ];

  let settings = {
    geminiKey: '',
    geminiModel: 'gemini-2.0-flash',
    openaiKey: '',
    openaiModel: 'gpt-4o-mini',
    activeProvider: 'gemini'
  };

  function loadSettings() {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) settings = Object.assign(settings, JSON.parse(saved));
      // Fix any invalid or non-existent models from old cache
      if (!settings.geminiModel || settings.geminiModel.includes('3.6') || settings.geminiModel.includes('3.5')) {
        settings.geminiModel = 'gemini-2.0-flash';
        saveSettings();
      }
    } catch (e) {
      console.warn('Could not load settings', e);
    }
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  // --- Storage Management (Always ensures default libraries exist) ---
  function getStudioData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let data = raw ? JSON.parse(raw) : null;
      if (!data || typeof data !== 'object') {
        data = { libraries: [], quizzes: [] };
      }
      if (!Array.isArray(data.libraries)) data.libraries = [];
      if (!Array.isArray(data.quizzes)) data.quizzes = [];

      // Always guarantee default libraries exist
      DEFAULT_LIBRARIES.forEach(defLib => {
        if (!data.libraries.some(l => l.id === defLib.id)) {
          data.libraries.push(JSON.parse(JSON.stringify(defLib)));
        }
      });

      return data;
    } catch (e) {
      console.error('Storage parse error', e);
      return { libraries: JSON.parse(JSON.stringify(DEFAULT_LIBRARIES)), quizzes: [] };
    }
  }

  function saveStudioData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    renderHomepageLibraryGrid();
    updateStatsCounter();
  }

  // --- Library Operations (Add / Remove) ---
  function addLibrary(name, description, colour, tag) {
    const data = getStudioData();
    const id = 'lib_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4);
    const newLib = {
      id: id,
      name: name.trim(),
      tag: (tag || name.slice(0, 10)).trim(),
      description: (description || 'Custom quiz study collection.').trim(),
      colour: colour || '#7654cc',
      isCustom: true
    };
    data.libraries.push(newLib);
    saveStudioData(data);
    return newLib;
  }

  function removeLibrary(libId) {
    const data = getStudioData();
    data.libraries = data.libraries.filter(l => l.id !== libId);
    data.quizzes = data.quizzes.filter(q => q.libraryId !== libId);
    saveStudioData(data);
  }

  // --- Quiz Operations (Add / Edit / Remove) ---
  function addQuiz(quiz) {
    const data = getStudioData();
    if (!quiz.id) quiz.id = 'quiz_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    if (!quiz.createdAt) quiz.createdAt = new Date().toISOString();

    quiz.questions = (quiz.questions || []).map(q => ({
      question: q.question || q.q || 'Question',
      options: Array.isArray(q.options) ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
      answer: typeof q.answer === 'number' ? q.answer : (typeof q.correctIndex === 'number' ? q.correctIndex : 0),
      explanation: q.explanation || '',
      word: q.word || q.vocabularyWord || '',
      category: q.category || '',
      categoryName: q.categoryName || '',
      difficulty: q.difficulty || '',
      hint: q.hint || '',
      hindi: q.hindi || q.hindiMeaning || '',
      synAnt: q.synAnt || q.synonyms || '',
      examTip: q.examTip || ''
    }));

    quiz.libraryId = quiz.libraryId || (data.libraries[0] ? data.libraries[0].id : 'custom');
    data.quizzes.unshift(quiz);
    saveStudioData(data);
    return quiz;
  }

  function updateQuiz(updatedQuiz) {
    const data = getStudioData();
    data.quizzes = data.quizzes.map(q => q.id === updatedQuiz.id ? Object.assign(q, updatedQuiz) : q);
    saveStudioData(data);
  }

  function removeQuiz(quizId) {
    const data = getStudioData();
    data.quizzes = data.quizzes.filter(q => q.id !== quizId);
    saveStudioData(data);
  }

  // --- CSS Injection ---
  function injectStyles() {
    if (document.getElementById('ai-quiz-studio-styles')) return;
    const style = document.createElement('style');
    style.id = 'ai-quiz-studio-styles';
    style.textContent = `
      .cq-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 9px 16px;
        font: 700 0.72rem 'DM Mono', monospace;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        border-radius: 10px;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
      }
      .cq-btn-primary {
        background: linear-gradient(110deg, #7654cc, #d95ea6);
        color: #ffffff !important;
        box-shadow: 0 6px 20px rgba(118, 84, 204, 0.35);
      }
      .cq-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(118, 84, 204, 0.45);
      }
      .cq-btn-secondary {
        background: rgba(118, 84, 204, 0.12);
        color: #271946;
        border: 1px solid rgba(118, 84, 204, 0.3);
      }
      .cq-btn-secondary:hover {
        background: rgba(118, 84, 204, 0.22);
        transform: translateY(-1px);
      }
      .cq-btn-danger {
        background: rgba(220, 38, 38, 0.1);
        color: #dc2626;
        border: 1px solid rgba(220, 38, 38, 0.3);
      }
      .cq-btn-danger:hover {
        background: #dc2626;
        color: #ffffff;
      }
      .cq-btn-outline-gold {
        background: rgba(216, 149, 44, 0.12);
        color: #b07212;
        border: 1px solid rgba(216, 149, 44, 0.4);
      }
      .cq-btn-outline-gold:hover {
        background: #d8952c;
        color: #ffffff;
      }

      /* Modals */
      .cq-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(18, 11, 35, 0.82);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease;
      }
      .cq-modal-overlay.active {
        opacity: 1;
        pointer-events: auto;
      }
      .cq-modal {
        background: #ffffff;
        color: #271946;
        border-radius: 24px;
        width: min(880px, 100%);
        max-height: 90vh;
        overflow-y: auto;
        padding: 32px;
        box-shadow: 0 25px 60px rgba(39, 25, 70, 0.35);
        transform: translateY(20px) scale(0.98);
        transition: transform 0.25s ease;
        position: relative;
        font-family: 'Manrope', system-ui, sans-serif;
      }
      .cq-modal-overlay.active .cq-modal {
        transform: translateY(0) scale(1);
      }
      .cq-modal-close {
        position: absolute;
        top: 22px;
        right: 22px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(118, 84, 204, 0.08);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        color: #665878;
        transition: all 0.2s;
      }
      .cq-modal-close:hover {
        background: rgba(118, 84, 204, 0.2);
        color: #271946;
      }

      .cq-form-group {
        margin-bottom: 16px;
      }
      .cq-form-group label {
        display: block;
        font: 700 0.74rem 'DM Mono', monospace;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #7654cc;
        margin-bottom: 6px;
      }
      .cq-input, .cq-select, .cq-textarea {
        width: 100%;
        padding: 11px 14px;
        border-radius: 12px;
        border: 1.5px solid rgba(118, 84, 204, 0.25);
        background: #faf7ff;
        font-family: 'Manrope', system-ui, sans-serif;
        font-size: 0.95rem;
        color: #271946;
        outline: none;
        box-sizing: border-box;
      }
      .cq-input:focus, .cq-select:focus, .cq-textarea:focus {
        border-color: #7654cc;
        box-shadow: 0 0 0 3px rgba(118, 84, 204, 0.15);
      }
      .cq-textarea {
        min-height: 100px;
        resize: vertical;
      }
      .cq-grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      @media(max-width: 640px) {
        .cq-grid-2 { grid-template-columns: 1fr; }
      }

      /* Drag & Drop Upload Zone */
      .cq-upload-zone {
        border: 2px dashed rgba(118, 84, 204, 0.4);
        background: rgba(118, 84, 204, 0.04);
        border-radius: 16px;
        padding: 22px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 16px;
      }
      .cq-upload-zone:hover {
        border-color: #7654cc;
        background: rgba(118, 84, 204, 0.09);
      }

      /* Provider Card */
      .cq-provider-cards {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 18px;
      }
      .cq-provider-card {
        border: 2px solid rgba(118, 84, 204, 0.2);
        border-radius: 14px;
        padding: 12px 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 12px;
        background: #ffffff;
      }
      .cq-provider-card.selected {
        border-color: #7654cc;
        background: rgba(118, 84, 204, 0.08);
      }

      /* Row Cards */
      .cq-row-card {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(246, 235, 255, 0.7));
        border: 1px solid rgba(118, 84, 204, 0.22);
        border-radius: 14px;
        padding: 16px 20px;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
      }
      .cq-badge {
        display: inline-block;
        padding: 3px 9px;
        border-radius: 6px;
        font: 700 0.65rem 'DM Mono', monospace;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        background: rgba(118, 84, 204, 0.12);
        color: #7654cc;
      }

      /* Runner options */
      .cq-runner-option {
        width: 100%;
        text-align: left;
        padding: 14px 18px;
        margin-bottom: 10px;
        background: #faf7ff;
        border: 1.5px solid rgba(118, 84, 204, 0.2);
        border-radius: 12px;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.2s;
        font-family: 'Manrope', system-ui, sans-serif;
      }
      .cq-runner-option:hover {
        background: rgba(118, 84, 204, 0.08);
        border-color: #7654cc;
      }
      .cq-runner-option.correct {
        background: rgba(34, 197, 94, 0.15) !important;
        border-color: #22c55e !important;
        color: #15803d !important;
        font-weight: 700;
      }
      .cq-runner-option.wrong {
        background: rgba(239, 68, 68, 0.15) !important;
        border-color: #ef4444 !important;
        color: #b91c1c !important;
        font-weight: 700;
      }
      .cq-explanation-box {
        margin-top: 16px;
        padding: 14px 18px;
        background: rgba(216, 149, 44, 0.1);
        border-left: 4px solid #d8952c;
        border-radius: 8px;
        font-size: 0.9rem;
      }

      .cq-status-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 10000;
        background: #271946;
        color: #ffffff;
        padding: 14px 22px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        gap: 12px;
        font: 600 0.88rem 'Manrope', sans-serif;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
      }
      .cq-status-toast.show {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }
    `;
    document.head.appendChild(style);
  }

  function showToast(message, isError = false) {
    let toast = document.getElementById('cq-status-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cq-status-toast';
      toast.className = 'cq-status-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = (isError ? '⚠️ ' : '✨ ') + message;
    toast.style.background = isError ? '#991b1b' : '#271946';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  // --- Dynamic Homepage Library Grid ---
  function renderHomepageLibraryGrid() {
    const data = getStudioData();
    const grid = document.querySelector('.libraries .grid');
    if (!grid) return;

    grid.innerHTML = data.libraries.map(lib => {
      const quizCount = data.quizzes.filter(q => q.libraryId === lib.id).length;
      const countTag = quizCount > 0 ? ` · ${quizCount} Quiz${quizCount === 1 ? '' : 'zes'}` : '';
      // Original libraries keep their existing hubs. Every library created in
      // AI Quiz Developer receives its own normal, card-based library page.
      const href = lib.url || `custom-quiz-library.html#library/${lib.id}`;

      return `
        <div class="card" style="--ring:${lib.colour || '#7654cc'};--halo:#d95ea6; position: relative;">
          <a href="${href}" style="text-decoration:none; color:inherit; display:block;">
            <span class="tag">${escapeHtml(lib.tag)}${countTag}</span>
            <h3>${escapeHtml(lib.name)}</h3>
            <p>${escapeHtml(lib.description || 'Practice collection.')}</p>
            <span class="open">Open Library →</span>
          </a>
          <div style="position: absolute; top: 18px; right: 18px; display: flex; gap: 6px; z-index: 5;">
            <button title="View & Add Quizzes in this Library" style="background: rgba(118,84,204,0.15); border:none; border-radius:6px; padding:4px 8px; cursor:pointer; font-size:0.75rem;" onclick="event.stopPropagation(); window.cqStudio.openLibraryQuizzes('${lib.id}')">📚</button>
            <button title="Delete this Library" style="background: rgba(220,38,38,0.15); border:none; border-radius:6px; padding:4px 8px; cursor:pointer; font-size:0.75rem; color:#dc2626;" onclick="event.stopPropagation(); window.cqStudio.confirmDeleteLibrary('${lib.id}')">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function updateStatsCounter() {
    const data = getStudioData();
    const count = data.quizzes ? data.quizzes.length : 0;
    const metaEl = document.querySelector('.meta');
    if (metaEl) {
      metaEl.innerHTML = `<span><b>${388 + count}</b> quiz trainers${count > 0 ? ` (+${count} added)` : ''}</span><span><b>${data.libraries.length}</b> study libraries</span>`;
    }
  }

  // --- Top Navigation & Hero Controls ---
  function injectTopControls() {
    // Nav links
    const nav = document.querySelector('header nav');
    if (nav && !document.getElementById('cq-nav-studio-btn')) {
      nav.innerHTML += `
        <a id="cq-nav-studio-btn" href="javascript:void(0)" onclick="window.cqStudio.openStudioModal()" style="color:#d95ea6; font-weight:800;">✨ AI Studio</a>
        <a href="javascript:void(0)" onclick="window.cqStudio.openImportModal()">📥 Import Quiz</a>
        <a href="javascript:void(0)" onclick="window.cqStudio.openManageModal()">📚 Quizzes</a>
        <a href="javascript:void(0)" onclick="window.cqStudio.openLibraryManagerModal()">🏛️ Libraries</a>
        <a href="javascript:void(0)" onclick="window.cqStudio.openSettingsModal()">⚙️ AI Keys</a>
      `;
    }

    // Hero Action Buttons
    const heroSection = document.querySelector('.hero');
    if (heroSection && !document.getElementById('cq-hero-actions-wrap')) {
      const wrap = document.createElement('div');
      wrap.id = 'cq-hero-actions-wrap';
      wrap.style.cssText = 'display:flex; flex-wrap:wrap; gap:12px; margin:24px 0 16px;';
      wrap.innerHTML = `
        <button class="cq-btn cq-btn-primary" onclick="window.cqStudio.openStudioModal()">✨ AI Quiz Creator (PDF / Image / Prompt)</button>
        <button class="cq-btn cq-btn-secondary" onclick="window.cqStudio.openImportModal()">📥 Import HTML / JSON Quiz File</button>
        <button class="cq-btn cq-btn-secondary" onclick="window.cqStudio.openManageModal()">📂 Manage Quizzes</button>
        <button class="cq-btn cq-btn-outline-gold" onclick="window.cqStudio.openLibraryManagerModal()">🏛️ Manage Libraries</button>
      `;

      const jump = heroSection.querySelector('.jump');
      if (jump && jump.parentNode) jump.parentNode.insertBefore(wrap, jump.nextSibling);
      else heroSection.appendChild(wrap);
    }

    // Libraries Section Header Controls
    const libHeader = document.querySelector('.libraries h2');
    if (libHeader && !document.getElementById('cq-lib-header-btns')) {
      const headWrap = document.createElement('div');
      headWrap.id = 'cq-lib-header-btns';
      headWrap.style.cssText = 'display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:18px;';
      libHeader.parentNode.insertBefore(headWrap, libHeader);
      headWrap.appendChild(libHeader);

      const btns = document.createElement('div');
      btns.style.cssText = 'display:flex; gap:10px;';
      btns.innerHTML = `
        <button class="cq-btn cq-btn-primary" onclick="window.cqStudio.openAddLibraryModal()">+ Add New Library</button>
        <button class="cq-btn cq-btn-secondary" onclick="window.cqStudio.openLibraryManagerModal()">⚙️ Manage Libraries</button>
      `;
      headWrap.appendChild(btns);
    }
  }

  // --- Modals Setup ---

  // 1. Library Manager Modal
  function createLibraryManagerModal() {
    if (document.getElementById('cq-lib-manager-modal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'cq-lib-manager-modal';
    overlay.className = 'cq-modal-overlay';
    overlay.innerHTML = `
      <div class="cq-modal">
        <button class="cq-modal-close" onclick="window.cqStudio.closeModal('cq-lib-manager-modal')">&times;</button>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
          <div>
            <h2 style="font-family:'Playfair Display',serif; font-size:2.2rem; margin:0 0 6px;">Manage Libraries</h2>
            <p style="color:#665878; font-size:0.92rem; margin:0;">Create new libraries or remove existing ones from your website.</p>
          </div>
          <button class="cq-btn cq-btn-primary" onclick="window.cqStudio.openAddLibraryModal()">+ Add New Library</button>
        </div>

        <div id="cq-lib-list-container" style="max-height:55vh; overflow-y:auto; margin-top:20px;"></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function openLibraryManagerModal() {
    renderLibraryManagerList();
    document.getElementById('cq-lib-manager-modal').classList.add('active');
  }

  function renderLibraryManagerList() {
    const container = document.getElementById('cq-lib-list-container');
    if (!container) return;
    const data = getStudioData();

    container.innerHTML = data.libraries.map(lib => {
      const quizCount = data.quizzes.filter(q => q.libraryId === lib.id).length;
      return `
        <div class="cq-row-card">
          <div style="display:flex; align-items:center; gap:14px;">
            <div style="width:20px; height:20px; border-radius:50%; background:${lib.colour || '#7654cc'}; flex-shrink:0;"></div>
            <div>
              <strong style="font-size:1.15rem; font-family:'Playfair Display',serif; display:block;">${escapeHtml(lib.name)}</strong>
              <small style="color:#665878;">Tag: <b>${escapeHtml(lib.tag)}</b> · ${quizCount} stored quiz${quizCount === 1 ? '' : 'zes'}</small>
              <p style="margin:4px 0 0; font-size:0.84rem; color:#665878;">${escapeHtml(lib.description || '')}</p>
            </div>
          </div>
          <div style="display:flex; gap:8px; flex-shrink:0;">
            <button class="cq-btn cq-btn-secondary" style="padding:6px 12px;" onclick="window.cqStudio.openLibraryQuizzes('${lib.id}')">Quizzes (${quizCount})</button>
            <button class="cq-btn cq-btn-danger" style="padding:6px 12px;" onclick="window.cqStudio.confirmDeleteLibrary('${lib.id}')">🗑️ Remove</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // 2. Add New Library Modal
  function createAddLibraryModal() {
    if (document.getElementById('cq-add-lib-modal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'cq-add-lib-modal';
    overlay.className = 'cq-modal-overlay';
    overlay.innerHTML = `
      <div class="cq-modal" style="width:min(640px, 100%);">
        <button class="cq-modal-close" onclick="window.cqStudio.closeModal('cq-add-lib-modal')">&times;</button>
        <h2 style="font-family:'Playfair Display',serif; font-size:2rem; margin:0 0 6px;">Add New Library</h2>
        <p style="color:#665878; font-size:0.9rem; margin:0 0 20px;">This library will immediately show up as a card on your website homepage.</p>

        <div class="cq-form-group">
          <label>Library Name</label>
          <input type="text" id="cq-new-lib-name" class="cq-input" placeholder="e.g. Indian Polity & Governance">
        </div>

        <div class="cq-grid-2">
          <div class="cq-form-group">
            <label>Short Tag / Badge</label>
            <input type="text" id="cq-new-lib-tag" class="cq-input" placeholder="e.g. Polity">
          </div>
          <div class="cq-form-group">
            <label>Accent Color</label>
            <input type="color" id="cq-new-lib-colour" class="cq-input" value="#7654cc" style="height:44px; padding:4px;">
          </div>
        </div>

        <div class="cq-form-group">
          <label>Description</label>
          <input type="text" id="cq-new-lib-desc" class="cq-input" placeholder="A short description for the library card">
        </div>

        <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:24px;">
          <button class="cq-btn cq-btn-secondary" onclick="window.cqStudio.closeModal('cq-add-lib-modal')">Cancel</button>
          <button class="cq-btn cq-btn-primary" onclick="window.cqStudio.saveNewLibraryForm()">✨ Create Library</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function openAddLibraryModal() {
    document.getElementById('cq-new-lib-name').value = '';
    document.getElementById('cq-new-lib-tag').value = '';
    document.getElementById('cq-new-lib-desc').value = '';
    document.getElementById('cq-add-lib-modal').classList.add('active');
  }

  function saveNewLibraryForm() {
    const name = document.getElementById('cq-new-lib-name').value.trim();
    if (!name) {
      showToast('Please enter a library name.', true);
      return;
    }
    const tag = document.getElementById('cq-new-lib-tag').value.trim();
    const colour = document.getElementById('cq-new-lib-colour').value;
    const desc = document.getElementById('cq-new-lib-desc').value.trim();

    addLibrary(name, desc, colour, tag);
    closeModal('cq-add-lib-modal');
    renderLibraryManagerList();
    showToast(`🎉 Library "${name}" created and added to homepage!`);
  }

  // 3. AI Studio Modal (Multimodal PDF / Image Upload)
  let attachedFileData = null;

  function createStudioModal() {
    if (document.getElementById('cq-studio-modal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'cq-studio-modal';
    overlay.className = 'cq-modal-overlay';
    overlay.innerHTML = `
      <div class="cq-modal">
        <button class="cq-modal-close" onclick="window.cqStudio.closeModal('cq-studio-modal')">&times;</button>
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:6px;">
          <span style="font-size:2rem;">✨</span>
          <h2 style="font-family:'Playfair Display',serif; font-size:2.2rem; margin:0;">AI Quiz Studio</h2>
        </div>
        <p style="color:#665878; font-size:0.92rem; margin:0 0 20px;">Upload a <b>PDF, Image, or Notes</b>, give your prompt, and AI will generate the quiz and store it in your library.</p>

        <!-- Provider Selection -->
        <div class="cq-provider-cards">
          <label class="cq-provider-card ${settings.activeProvider === 'gemini' ? 'selected' : ''}" id="cq-card-gemini" onclick="window.cqStudio.selectProvider('gemini')">
            <input type="radio" name="ai_provider" value="gemini" ${settings.activeProvider === 'gemini' ? 'checked' : ''}>
            <div>
              <strong style="display:block; font-size:0.95rem;">🔮 Google Gemini (Recommended)</strong>
              <span style="font-size:0.75rem; color:#665878;">Direct PDF & Image reading via Gemini Vision</span>
            </div>
          </label>
          <label class="cq-provider-card ${settings.activeProvider === 'openai' ? 'selected' : ''}" id="cq-card-openai" onclick="window.cqStudio.selectProvider('openai')">
            <input type="radio" name="ai_provider" value="openai" ${settings.activeProvider === 'openai' ? 'checked' : ''}>
            <div>
              <strong style="display:block; font-size:0.95rem;">🤖 ChatGPT (OpenAI)</strong>
              <span style="font-size:0.75rem; color:#665878;">Text & Syllabus prompt generation</span>
            </div>
          </label>
        </div>

        <!-- File Upload Zone (PDF / Image) -->
        <div class="cq-upload-zone" id="cq-drop-zone" onclick="document.getElementById('cq-file-input').click()">
          <input type="file" id="cq-file-input" accept="image/*,.pdf,.txt" style="display:none;" onchange="window.cqStudio.handleFileSelect(event)">
          <span style="font-size:2rem; display:block; margin-bottom:6px;">📄 🖼️</span>
          <strong id="cq-upload-label" style="font-size:0.95rem; color:#7654cc;">Click to Select or Drag & Drop PDF, Image, or Study Notes here</strong>
          <span style="display:block; font-size:0.78rem; color:#665878; margin-top:4px;">Gemini will read text directly from the image or document</span>
        </div>

        <!-- Target Library & Title -->
        <div class="cq-grid-2">
          <div class="cq-form-group">
            <label>Save into Library</label>
            <select id="cq-gen-library" class="cq-select"></select>
          </div>
          <div class="cq-form-group">
            <label>Quiz Title</label>
            <input type="text" id="cq-gen-title" class="cq-input" placeholder="e.g. Current Affairs Practice 1">
          </div>
        </div>

        <div class="cq-form-group">
          <label>Prompt / Instructions</label>
          <textarea id="cq-gen-prompt" class="cq-textarea" placeholder="Enter instructions (e.g. 'Create questions from this PDF' or 'Focus on major national awards')"></textarea>
        </div>

        <div id="cq-gen-status" style="display:none; padding:14px; border-radius:12px; background:rgba(118,84,204,0.08); margin-bottom:18px; font-size:0.9rem; color:#7654cc; font-weight:600;">
          ⏳ Generating quiz with AI... Please wait a few moments.
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <button class="cq-btn cq-btn-secondary" onclick="window.cqStudio.openSettingsModal()">⚙️ AI API Keys</button>
          <div style="display:flex; gap:10px;">
            <button class="cq-btn cq-btn-secondary" onclick="window.cqStudio.closeModal('cq-studio-modal')">Cancel</button>
            <button class="cq-btn cq-btn-primary" id="cq-btn-generate" onclick="window.cqStudio.generateQuizAction()">✨ Generate & Add to Library</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function openStudioModal(preselectedLibId = null) {
    loadSettings();
    const data = getStudioData();
    const select = document.getElementById('cq-gen-library');
    if (select) {
      select.innerHTML = data.libraries.map(lib => `<option value="${lib.id}" ${lib.id === preselectedLibId ? 'selected' : ''}>${escapeHtml(lib.name)} (${escapeHtml(lib.tag)})</option>`).join('');
    }

    attachedFileData = null;
    const label = document.getElementById('cq-upload-label');
    if (label) label.innerText = 'Click to Select or Drag & Drop PDF, Image, or Study Notes here';
    const input = document.getElementById('cq-file-input');
    if (input) input.value = '';

    // Check if keys are set
    if (!settings.geminiKey && !settings.openaiKey) {
      showToast('Please paste your Gemini or ChatGPT API key first!', true);
      openSettingsModal();
      return;
    }

    document.getElementById('cq-studio-modal').classList.add('active');
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const label = document.getElementById('cq-upload-label');
    label.innerHTML = `📎 Attached: <b>${escapeHtml(file.name)}</b> (${Math.round(file.size / 1024)} KB)`;

    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target.result;
      const base64 = dataUrl.split(',')[1];
      attachedFileData = {
        name: file.name,
        type: file.type || 'application/pdf',
        base64: base64
      };
      showToast(`Attached ${file.name}`);
    };
    reader.readAsDataURL(file);
  }

  // 4. Universal Import Modal
  function createImportModal() {
    if (document.getElementById('cq-import-modal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'cq-import-modal';
    overlay.className = 'cq-modal-overlay';
    overlay.innerHTML = `
      <div class="cq-modal" style="width:min(780px, 100%);">
        <button class="cq-modal-close" onclick="window.cqStudio.closeModal('cq-import-modal')">&times;</button>
        <h2 style="font-family:'Playfair Display',serif; font-size:2.2rem; margin:0 0 6px;">Import Quiz (HTML / JSON / Text)</h2>
        <p style="color:#665878; font-size:0.92rem; margin:0 0 20px;">If you made a quiz in ChatGPT or Gemini and downloaded an HTML file or got text, upload or paste it here to add it to your library.</p>

        <div class="cq-grid-2">
          <div class="cq-form-group">
            <label>Target Library</label>
            <select id="cq-import-library" class="cq-select"></select>
          </div>
          <div class="cq-form-group">
            <label>Quiz Title</label>
            <input type="text" id="cq-import-title" class="cq-input" placeholder="e.g. ChatGPT Current Affairs Quiz">
          </div>
        </div>

        <!-- File upload for HTML/JSON -->
        <div class="cq-upload-zone" onclick="document.getElementById('cq-import-file-input').click()">
          <input type="file" id="cq-import-file-input" accept=".html,.htm,.json,.txt" style="display:none;" onchange="window.cqStudio.handleImportFile(event)">
          <span style="font-size:1.8rem; display:block; margin-bottom:4px;">📥</span>
          <strong id="cq-import-file-label" style="font-size:0.95rem; color:#7654cc;">Upload HTML or JSON Quiz File</strong>
          <span style="display:block; font-size:0.75rem; color:#665878; margin-top:2px;">JSON/text questions are converted into the library player. A complete .html quiz is kept and opened exactly as it was made.</span>
        </div>

        <div class="cq-form-group">
          <label>Or Paste Quiz Content (HTML code, JSON, or Questions text)</label>
          <textarea id="cq-import-paste" class="cq-textarea" style="min-height:140px;" placeholder="Paste the HTML or JSON from ChatGPT/Gemini here..."></textarea>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:12px;">
          <button class="cq-btn cq-btn-secondary" onclick="window.cqStudio.closeModal('cq-import-modal')">Cancel</button>
          <button class="cq-btn cq-btn-primary" onclick="window.cqStudio.executeImport()">📥 Import & Save to Library</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function openImportModal(preselectedLibId = null) {
    const data = getStudioData();
    const select = document.getElementById('cq-import-library');
    if (select) {
      select.innerHTML = data.libraries.map(lib => `<option value="${lib.id}" ${lib.id === preselectedLibId ? 'selected' : ''}>${escapeHtml(lib.name)} (${escapeHtml(lib.tag)})</option>`).join('');
    }

    document.getElementById('cq-import-title').value = '';
    document.getElementById('cq-import-paste').value = '';
    document.getElementById('cq-import-file-label').innerText = 'Upload HTML or JSON Quiz File';
    document.getElementById('cq-import-modal').classList.add('active');
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('cq-import-file-label').innerHTML = `Selected: <b>${escapeHtml(file.name)}</b>`;
    if (!document.getElementById('cq-import-title').value) {
      document.getElementById('cq-import-title').value = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    }
    const reader = new FileReader();
    reader.onload = ev => {
      document.getElementById('cq-import-paste').value = ev.target.result;
      showToast(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
  }

  // --- Universal Parser (Handles JSON, HTML files, and Plain Text) ---
  function questionListFromPayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];
    if (Array.isArray(payload.questions)) return payload.questions;
    if (Array.isArray(payload.quiz)) return payload.quiz;
    if (Array.isArray(payload.data)) return payload.data;
    if (payload.quiz && Array.isArray(payload.quiz.questions)) return payload.quiz.questions;
    if (payload.data && Array.isArray(payload.data.questions)) return payload.data.questions;
    if (payload.quizData && Array.isArray(payload.quizData.questions)) return payload.quizData.questions;
    return [];
  }

  function assignedJsonValues(source) {
    const values = [];
    const assignment = /\b(?:const|let|var)\s+(?:quiz(?:Data)?|questions|data)\s*=\s*/gi;
    let match;
    while ((match = assignment.exec(source))) {
      const start = assignment.lastIndex;
      const first = source[start];
      if (first !== '[' && first !== '{') continue;
      let depth = 0, quote = '', escaped = false, end = -1;
      for (let index = start; index < source.length; index++) {
        const character = source[index];
        if (quote) {
          if (escaped) escaped = false;
          else if (character === '\\') escaped = true;
          else if (character === quote) quote = '';
          continue;
        }
        if (character === '"') { quote = character; continue; }
        if (character === '[' || character === '{') depth++;
        if (character === ']' || character === '}') {
          depth--;
          if (depth === 0) { end = index + 1; break; }
        }
      }
      if (end > start) values.push(source.slice(start, end));
    }
    return values;
  }

  function parseUniversalQuiz(rawText) {
    if (!rawText || !rawText.trim()) throw new Error('Please paste quiz text or upload an HTML/JSON file first.');
    let text = rawText.trim();

    // Strategy 1: JSON array or JSON object
    let jsonCandidates = [
      text,
      text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, ''),
      ...assignedJsonValues(text)
    ].filter(Boolean);

    for (const cand of jsonCandidates) {
      try {
        const parsed = JSON.parse(cand.trim());
        const list = questionListFromPayload(parsed);
        if (list.length > 0) {
          const validated = normalizeParsedQuestions(list);
          if (validated.length > 0) return validated;
        }
      } catch (e) {}
    }

    // Strategy 2: HTML DOM Document
    if (text.includes('<') && text.includes('>')) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        // Check <script> tags for JSON. The balanced extractor supports full
        // JavaScript quiz files, including nested arrays and explanations.
        const scripts = doc.querySelectorAll('script');
        for (const sc of scripts) {
          const scText = sc.textContent || '';
          for (const candidate of assignedJsonValues(scText)) {
            try {
              const list = questionListFromPayload(JSON.parse(candidate));
              if (list.length > 0) return normalizeParsedQuestions(list);
            } catch (e) {}
          }
        }

        // Check HTML elements
        const candidateContainers = doc.querySelectorAll('.question-block, .quiz-item, .question-card, .card, .question, fieldset, li, article, section');
        const questions = [];

        candidateContainers.forEach(container => {
          const qTitle = container.querySelector('h1, h2, h3, h4, .q-text, .question-text, legend, strong, b');
          const qText = qTitle ? qTitle.textContent.trim().replace(/^\d+[\.\)]\s*/, '') : '';
          const optionEls = container.querySelectorAll('button, .option, label, li');
          const options = Array.from(optionEls).map(o => o.textContent.trim().replace(/^[A-D][\.\)]\s*/i, '')).filter(t => t.length > 0 && t !== qText);

          if (qText && options.length >= 2) {
            let answer = 0;
            optionEls.forEach((o, i) => {
              if (o.classList.contains('correct') || o.getAttribute('data-correct') === 'true' || o.querySelector('input:checked')) answer = i;
            });
            const expEl = container.querySelector('.explanation, .exp, .feedback');
            const exp = expEl ? expEl.textContent.trim() : '';

            questions.push({
              question: qText,
              options: options.slice(0, 4),
              answer: answer,
              explanation: exp
            });
          }
        });

        if (questions.length > 0) return questions;
      } catch (e) {
        console.warn('DOM parser error', e);
      }
    }

    // Strategy 3: Plain text line-by-line parser
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const questions = [];
    let currentQ = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const qMatch = line.match(/^(?:(?:Q|Question)\s*\d+[:\.]?|\d+[\.\)])\s*(.+)/i);
      if (qMatch) {
        if (currentQ && currentQ.options.length >= 2) questions.push(currentQ);
        currentQ = { question: qMatch[1].trim(), options: [], answer: 0, explanation: '' };
        continue;
      }

      const optMatch = line.match(/^(?:\(?([A-D])\)?[.:\s]+)(.+)/i);
      if (optMatch && currentQ) {
        currentQ.options.push(optMatch[2].trim());
        continue;
      }

      const ansMatch = line.match(/^(?:ans(?:wer)?|correct)[:\s]+(?:\(?([A-D]|\d+)\)?)/i);
      if (ansMatch && currentQ) {
        const val = ansMatch[1].toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(val)) currentQ.answer = val.charCodeAt(0) - 65;
        else if (!isNaN(parseInt(val, 10))) currentQ.answer = Math.max(0, parseInt(val, 10) - 1);
        continue;
      }

      const expMatch = line.match(/^(?:exp(?:lanation)?|reason)[:\s]+(.+)/i);
      if (expMatch && currentQ) {
        currentQ.explanation = expMatch[1].trim();
        continue;
      }

      if (currentQ && currentQ.options.length < 4 && !line.includes(':') && currentQ.options.length > 0) {
        currentQ.options.push(line);
      }
    }

    if (currentQ && currentQ.options.length >= 2) questions.push(currentQ);
    if (questions.length > 0) return questions;

    throw new Error('Could not parse questions. Make sure questions have 4 options and an answer.');
  }

  function normalizeParsedQuestions(list) {
    return list.map(q => {
      const options = Array.isArray(q.options) ? q.options : (Array.isArray(q.answers) ? q.answers : [q.optionA || q.a, q.optionB || q.b, q.optionC || q.c, q.optionD || q.d].filter(Boolean));
      const rawAnswer = q.answer ?? q.correctIndex ?? q.correctAnswer ?? q.correct_answer ?? q.correct ?? q.answerIndex;
      let answer = 0;
      if (typeof rawAnswer === 'number') answer = rawAnswer;
      else if (typeof rawAnswer === 'string') {
        const value = rawAnswer.trim();
        if (/^[A-D]$/i.test(value)) answer = value.toUpperCase().charCodeAt(0) - 65;
        else if (/^\d+$/.test(value)) answer = Math.max(0, Number(value) - (Number(value) > 0 ? 1 : 0));
        else { const optionIndex = options.findIndex(option => String(option).trim().toLowerCase() === value.toLowerCase()); if (optionIndex >= 0) answer = optionIndex; }
      }
      return {
        question: q.question || q.q || q.text || q.questionText || 'Question',
        options: options.map(String),
        answer: Math.min(Math.max(0, answer), Math.max(0, options.length - 1)),
        explanation: q.explanation || q.reason || q.feedback || '',
        word: q.word || q.vocabularyWord || '',
        category: q.category || '',
        categoryName: q.categoryName || '',
        difficulty: q.difficulty || '',
        hint: q.hint || '',
        hindi: q.hindi || q.hindiMeaning || '',
        synAnt: q.synAnt || q.synonyms || '',
        examTip: q.examTip || ''
      };
    }).filter(q => q.question !== 'Question' && q.options.length >= 2);
  }

  function executeImport() {
    const raw = document.getElementById('cq-import-paste').value;
    const libraryId = document.getElementById('cq-import-library').value;
    let title = document.getElementById('cq-import-title').value.trim() || 'Imported Quiz';

    try {
      if (!libraryId) throw new Error('Choose the library where this quiz should be saved.');
      let questions = [];
      let importedHtml = '';
      try {
        questions = parseUniversalQuiz(raw);
        if (!questions.length) throw new Error('No valid quiz questions were found in this file.');
      } catch (parseError) {
        // Many AI quiz downloads are complete, self-contained HTML apps. They
        // should remain playable even when their questions are not exposed as
        // a JSON array or visible HTML option elements.
        if (/<html[\s>]|<!doctype\s+html/i.test(raw)) {
          importedHtml = raw;
        } else {
          throw parseError;
        }
      }
      addQuiz({
        title: title,
        libraryId: libraryId,
        questions: questions,
        importedHtml: importedHtml,
        importedAt: new Date().toISOString()
      });

      closeModal('cq-import-modal');
      showToast(importedHtml ? '🎉 HTML quiz imported and kept in its original format!' : `🎉 Imported ${questions.length} questions successfully!`);
      openManageModal(libraryId);
    } catch (e) {
      showToast(e.message, true);
      alert('Import Error:\n' + e.message);
    }
  }

  // 5. Quiz Manager Modal
  function createManageModal() {
    if (document.getElementById('cq-manage-modal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'cq-manage-modal';
    overlay.className = 'cq-modal-overlay';
    overlay.innerHTML = `
      <div class="cq-modal" style="width:min(960px, 100%);">
        <button class="cq-modal-close" onclick="window.cqStudio.closeModal('cq-manage-modal')">&times;</button>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; flex-wrap:wrap; gap:12px;">
          <div>
            <h2 style="font-family:'Playfair Display',serif; font-size:2.2rem; margin:0 0 6px;">Quiz Library Manager</h2>
            <p style="color:#665878; font-size:0.9rem; margin:0;">Add, edit, remove, and practice all quizzes across your libraries.</p>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="cq-btn cq-btn-primary" onclick="window.cqStudio.openStudioModal()">✨ AI Generator</button>
            <button class="cq-btn cq-btn-secondary" onclick="window.cqStudio.openImportModal()">📥 Import Quiz File</button>
            <button class="cq-btn cq-btn-outline-gold" onclick="window.cqStudio.exportAllBackup()">💾 Download Backup</button>
          </div>
        </div>

        <div style="display:flex; gap:8px; margin:16px 0; overflow-x:auto; padding-bottom:6px;" id="cq-filter-bar"></div>
        <div id="cq-quiz-list-container" style="max-height:52vh; overflow-y:auto; padding-right:4px;"></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function openManageModal(filterLib = 'all') {
    renderFilterBar(filterLib);
    renderQuizList(filterLib);
    document.getElementById('cq-manage-modal').classList.add('active');
  }

  function renderFilterBar(activeFilter = 'all') {
    const bar = document.getElementById('cq-filter-bar');
    if (!bar) return;
    const data = getStudioData();
    bar.innerHTML = `
      <button class="cq-btn cq-btn-secondary ${activeFilter === 'all' ? 'active' : ''}" onclick="window.cqStudio.filterManagerQuizzes('all', this)">All Libraries</button>
      ${data.libraries.map(l => `<button class="cq-btn cq-btn-secondary ${activeFilter === l.id ? 'active' : ''}" onclick="window.cqStudio.filterManagerQuizzes('${l.id}', this)">${escapeHtml(l.tag)}</button>`).join('')}
    `;
  }

  function renderQuizList(filterLibrary = 'all') {
    const container = document.getElementById('cq-quiz-list-container');
    if (!container) return;

    const data = getStudioData();
    const quizzes = data.quizzes || [];
    const filtered = filterLibrary === 'all' ? quizzes : quizzes.filter(q => q.libraryId === filterLibrary);

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:44px 20px; color:#665878; background:rgba(118,84,204,0.04); border-radius:16px;">
          <span style="font-size:3rem; display:block; margin-bottom:10px;">🪐</span>
          <h3 style="font-family:'Playfair Display'; font-size:1.5rem; margin:0 0 8px; color:#271946;">No custom quizzes in this library yet</h3>
          <p style="margin:0 0 18px;">Create one with AI, import an HTML/JSON quiz file, or add one manually!</p>
          <div style="display:flex; justify-content:center; gap:10px;">
            <button class="cq-btn cq-btn-primary" onclick="window.cqStudio.openStudioModal()">✨ Generate with AI</button>
            <button class="cq-btn cq-btn-secondary" onclick="window.cqStudio.openImportModal('${filterLibrary !== 'all' ? filterLibrary : ''}')">📥 Import Quiz</button>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(q => {
      const lib = data.libraries.find(l => l.id === q.libraryId) || { name: 'Custom', tag: 'Quiz' };
      const qCount = q.importedHtml ? 'Original HTML' : (q.questions ? q.questions.length : 0);
      const dateStr = q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'Recent';

      return `
        <div class="cq-row-card">
          <div style="flex:1; min-width:240px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
              <span class="cq-badge">${escapeHtml(lib.tag)}</span>
              <span style="font-size:0.75rem; color:#665878;">${dateStr}</span>
              <span style="font-size:0.75rem; color:#d8952c; font-weight:700;">${typeof qCount === 'number' ? qCount + ' Questions' : qCount}</span>
              ${q.generatedBy ? `<span style="font-size:0.7rem; color:#7654cc; font-family:'DM Mono';">Via ${q.generatedBy.toUpperCase()}</span>` : ''}
            </div>
            <h4 style="margin:0 0 4px; font-size:1.15rem; color:#271946; font-family:'Playfair Display',serif;">${escapeHtml(q.title || 'Untitled Quiz')}</h4>
            <p style="margin:0; font-size:0.82rem; color:#665878;">Library: <strong>${escapeHtml(lib.name)}</strong></p>
          </div>
          <div style="display:flex; gap:8px; flex-shrink:0; flex-wrap:wrap;">
            <button class="cq-btn cq-btn-primary" style="padding:7px 12px;" onclick="window.cqStudio.playQuiz('${q.id}')">▶ Play</button>
            <button class="cq-btn cq-btn-secondary" style="padding:7px 12px;" onclick="window.cqStudio.openEditModal('${q.id}')">✏️ Edit</button>
            <button class="cq-btn cq-btn-danger" style="padding:7px 12px;" onclick="window.cqStudio.confirmDeleteQuiz('${q.id}')">🗑️ Remove</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // 6. Interactive Player Modal
  let activeQuizState = { quiz: null, currentIndex: 0, score: 0 };

  function createPlayerModal() {
    if (document.getElementById('cq-player-modal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'cq-player-modal';
    overlay.className = 'cq-modal-overlay';
    overlay.innerHTML = `
      <div class="cq-modal" style="width:min(760px, 100%);">
        <button class="cq-modal-close" onclick="window.cqStudio.closeModal('cq-player-modal')">&times;</button>
        <div id="cq-player-content"></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function playQuiz(quizId) {
    const data = getStudioData();
    const quiz = data.quizzes.find(q => q.id === quizId);
    if (quiz && quiz.importedHtml) {
      const container = document.getElementById('cq-player-content');
      container.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px;">
          <div><span class="cq-badge">Original HTML Quiz</span><h3 style="font-family:'Playfair Display',serif; margin:7px 0 0;">${escapeHtml(quiz.title || 'Imported Quiz')}</h3></div>
          <button class="cq-btn cq-btn-secondary" onclick="window.cqStudio.closeModal('cq-player-modal')">Close</button>
        </div>
        <iframe id="cq-imported-html-frame" title="${escapeHtml(quiz.title || 'Imported Quiz')}" sandbox="allow-scripts allow-forms allow-popups" style="display:block; width:100%; height:min(70vh,760px); border:1px solid rgba(118,84,204,.25); border-radius:12px; background:white;"></iframe>`;
      document.getElementById('cq-imported-html-frame').srcdoc = quiz.importedHtml;
      document.getElementById('cq-player-modal').classList.add('active');
      return;
    }
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      showToast('This quiz has no questions to play.', true);
      return;
    }

    activeQuizState = { quiz, currentIndex: 0, score: 0 };
    renderPlayerQuestion();
    document.getElementById('cq-player-modal').classList.add('active');
  }

  function renderPlayerQuestion() {
    const container = document.getElementById('cq-player-content');
    const { quiz, currentIndex } = activeQuizState;
    const q = quiz.questions[currentIndex];
    const total = quiz.questions.length;
    const answerIndex = typeof q.answer === 'number' ? q.answer : 0;

    container.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(118,84,204,0.15); padding-bottom:14px; margin-bottom:20px;">
        <div>
          <span class="cq-badge">${escapeHtml(quiz.title || 'Cosmic Quiz')}</span>
          <span style="font-size:0.8rem; color:#665878; margin-left:8px;">Question ${currentIndex + 1} of ${total}</span>
        </div>
        <div style="font-weight:800; font-family:'DM Mono'; color:#7654cc;">Score: ${activeQuizState.score} / ${currentIndex}</div>
      </div>

      <h3 style="font-size:1.35rem; line-height:1.45; font-family:'Playfair Display',serif; margin:0 0 24px; color:#271946;">
        ${escapeHtml(q.question)}
      </h3>

      <div>
        ${q.options.map((opt, idx) => `
          <button class="cq-runner-option" onclick="window.cqStudio.handleAnswerSelected(${idx}, ${answerIndex})">
            <span style="font-family:'DM Mono'; font-weight:700; margin-right:8px; color:#7654cc;">${String.fromCharCode(65 + idx)}.</span>
            ${escapeHtml(opt)}
          </button>
        `).join('')}
      </div>

      <div id="cq-runner-feedback" style="display:none;">
        <div class="cq-explanation-box">
          <strong style="display:block; margin-bottom:4px; color:#b07212;">Explanation:</strong>
          <span>${escapeHtml(q.explanation || 'No explanation provided.')}</span>
        </div>
        <div style="display:flex; justify-content:flex-end; margin-top:20px;">
          <button class="cq-btn cq-btn-primary" onclick="window.cqStudio.nextPlayerQuestion()">
            ${currentIndex + 1 < total ? 'Next Question →' : 'View Final Score 🏆'}
          </button>
        </div>
      </div>
    `;
  }

  function handleAnswerSelected(selectedIndex, correctIndex) {
    const optionButtons = document.querySelectorAll('.cq-runner-option');
    optionButtons.forEach(btn => btn.style.pointerEvents = 'none');

    const isCorrect = selectedIndex === correctIndex;
    if (isCorrect) activeQuizState.score++;

    optionButtons[selectedIndex].classList.add(isCorrect ? 'correct' : 'wrong');
    if (!isCorrect && optionButtons[correctIndex]) {
      optionButtons[correctIndex].classList.add('correct');
    }

    document.getElementById('cq-runner-feedback').style.display = 'block';
  }

  function nextPlayerQuestion() {
    activeQuizState.currentIndex++;
    if (activeQuizState.currentIndex < activeQuizState.quiz.questions.length) {
      renderPlayerQuestion();
    } else {
      renderPlayerResult();
    }
  }

  function renderPlayerResult() {
    const container = document.getElementById('cq-player-content');
    const { quiz, score } = activeQuizState;
    const total = quiz.questions.length;
    const percentage = Math.round((score / total) * 100);

    container.innerHTML = `
      <div style="text-align:center; padding:30px 10px;">
        <span style="font-size:4rem; display:block; margin-bottom:12px;">🌟</span>
        <h2 style="font-family:'Playfair Display',serif; font-size:2.4rem; margin:0 0 8px;">Quiz Completed!</h2>
        <p style="color:#665878; font-size:1.1rem; margin:0 0 24px;">${escapeHtml(quiz.title)}</p>

        <div style="display:inline-flex; flex-direction:column; align-items:center; padding:24px 36px; background:rgba(118,84,204,0.08); border-radius:20px; margin-bottom:28px;">
          <span style="font-size:3.5rem; font-weight:800; color:#7654cc; font-family:'DM Mono';">${percentage}%</span>
          <span style="font-size:1rem; font-weight:700; color:#271946;">You scored ${score} out of ${total}</span>
        </div>

        <div style="display:flex; justify-content:center; gap:14px;">
          <button class="cq-btn cq-btn-secondary" onclick="window.cqStudio.playQuiz('${quiz.id}')">🔄 Retry Quiz</button>
          <button class="cq-btn cq-btn-primary" onclick="window.cqStudio.closeModal('cq-player-modal')">Finish & Return</button>
        </div>
      </div>
    `;
  }

  // 7. Settings Modal
  function createSettingsModal() {
    if (document.getElementById('cq-settings-modal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'cq-settings-modal';
    overlay.className = 'cq-modal-overlay';
    overlay.innerHTML = `
      <div class="cq-modal">
        <button class="cq-modal-close" onclick="window.cqStudio.closeModal('cq-settings-modal')">&times;</button>
        <h2 style="font-family:'Playfair Display',serif; font-size:2rem; margin:0 0 8px;">AI Account Setup</h2>
        <p style="color:#665878; font-size:0.92rem; margin:0 0 24px;">Connect your Google Gemini and ChatGPT (OpenAI) accounts.</p>

        <!-- Gemini -->
        <div style="background:rgba(118,84,204,0.05); border:1.5px solid rgba(118,84,204,0.2); border-radius:16px; padding:20px; margin-bottom:20px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:1.5rem;">🔮</span>
              <h3 style="margin:0; font-size:1.2rem;">Google Gemini API</h3>
            </div>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" style="font-size:0.75rem; font-family:'DM Mono'; color:#7654cc; text-decoration:underline; font-weight:700;">Get Free Gemini Key ↗</a>
          </div>
          <div class="cq-form-group">
            <label>Gemini API Key</label>
            <input type="password" id="cq-gemini-key" class="cq-input" placeholder="AIzaSy...">
          </div>
          <div class="cq-grid-2">
            <div class="cq-form-group">
              <label>Gemini Model</label>
              <select id="cq-gemini-model" class="cq-select">
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Recommended · Fastest & Smartest)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Standard)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
              </select>
            </div>
            <div style="display:flex; align-items:flex-end; padding-bottom:16px;">
              <button class="cq-btn cq-btn-secondary" style="width:100%;" onclick="window.cqStudio.testKey('gemini')">⚡ Test Gemini Key</button>
            </div>
          </div>
        </div>

        <!-- ChatGPT -->
        <div style="background:rgba(80,170,137,0.05); border:1.5px solid rgba(80,170,137,0.25); border-radius:16px; padding:20px; margin-bottom:24px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:1.5rem;">🤖</span>
              <h3 style="margin:0; font-size:1.2rem;">OpenAI ChatGPT API</h3>
            </div>
            <a href="https://platform.openai.com/api-keys" target="_blank" style="font-size:0.75rem; font-family:'DM Mono'; color:#50aa89; text-decoration:underline; font-weight:700;">Get OpenAI Key ↗</a>
          </div>
          <div class="cq-form-group">
            <label>ChatGPT API Key</label>
            <input type="password" id="cq-openai-key" class="cq-input" placeholder="sk-proj-...">
          </div>
          <div class="cq-grid-2">
            <div class="cq-form-group">
              <label>Model</label>
              <select id="cq-openai-model" class="cq-select">
                <option value="gpt-4o-mini">GPT-4o mini</option>
                <option value="gpt-4o">GPT-4o</option>
              </select>
            </div>
            <div style="display:flex; align-items:flex-end; padding-bottom:16px;">
              <button class="cq-btn cq-btn-secondary" style="width:100%;" onclick="window.cqStudio.testKey('openai')">⚡ Test ChatGPT Key</button>
            </div>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:12px;">
          <button class="cq-btn cq-btn-secondary" onclick="window.cqStudio.closeModal('cq-settings-modal')">Cancel</button>
          <button class="cq-btn cq-btn-primary" onclick="window.cqStudio.saveSettingsForm()">💾 Save Keys</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function openSettingsModal() {
    loadSettings();
    document.getElementById('cq-gemini-key').value = settings.geminiKey || '';
    document.getElementById('cq-gemini-model').value = settings.geminiModel || 'gemini-2.0-flash';
    document.getElementById('cq-openai-key').value = settings.openaiKey || '';
    document.getElementById('cq-openai-model').value = settings.openaiModel || 'gpt-4o-mini';
    document.getElementById('cq-settings-modal').classList.add('active');
  }

  // --- AI Generation Engine ---
  async function generateQuizAction() {
    const provider = settings.activeProvider;
    const libraryId = document.getElementById('cq-gen-library').value;
    const title = document.getElementById('cq-gen-title').value.trim() || 'AI Generated Quiz';
    const promptText = document.getElementById('cq-gen-prompt').value.trim();

    if (!promptText && !title && !attachedFileData) {
      showToast('Please attach a PDF/Image or enter prompt instructions.', true);
      return;
    }

    const statusEl = document.getElementById('cq-gen-status');
    const genBtn = document.getElementById('cq-btn-generate');
    statusEl.style.display = 'block';
    genBtn.disabled = true;

    try {
      let questions = [];
      if (provider === 'gemini') {
        const apiKey = (settings.geminiKey || '').trim().replace(/^["']|["']$/g, '');
        if (!apiKey) throw new Error('Please add your Gemini API key in AI Keys settings.');
        questions = await callGeminiWithMultimodal(apiKey, libraryId, title, promptText, attachedFileData);
      } else {
        const apiKey = (settings.openaiKey || '').trim().replace(/^["']|["']$/g, '');
        if (!apiKey) throw new Error('Please add your ChatGPT API key in AI Keys settings.');
        questions = await callOpenAIWithText(apiKey, libraryId, title, promptText);
      }

      if (!questions || questions.length === 0) throw new Error('No questions returned by AI. Try a different prompt.');

      addQuiz({
        title: title,
        libraryId: libraryId,
        questions: questions,
        generatedBy: provider
      });

      statusEl.style.display = 'none';
      genBtn.disabled = false;
      closeModal('cq-studio-modal');

      showToast(`✨ Generated ${questions.length} questions & stored in library!`);
      openManageModal(libraryId);
    } catch (err) {
      console.error(err);
      statusEl.style.display = 'none';
      genBtn.disabled = false;
      showToast(err.message || 'Generation failed', true);
      alert('Generation Error:\n' + err.message);
    }
  }

  function libraryGenerationSchema(libraryId) {
    return `
Every question MUST contain ALL of these fields:
- word: the key term, topic, chapter, or focus concept
- category: a short code such as GENERAL, CONCEPT, FACT, ASSERTION, MATCHING, or REVISION
- categoryName: readable category name
- difficulty: Easy, Moderate, or Hard
- question, options (exactly four unique strings), answer (0–3)
- hint: useful exam clue
- explanation: detailed exam rationale
- hindi: Hindi meaning, Hindi context, or a concise bilingual revision note
- synAnt: related concepts, synonyms/antonyms, comparison, or memory aid
- examTip: a concise competitive-exam revision tip.
Use your user's requested question count, topic, source range and exam level. All questions must be genuinely unique; never recycle a fact or option set.`;
  }

  async function callGeminiWithMultimodal(apiKey, libraryId, title, promptText, fileData) {
    const data = getStudioData();
    const lib = data.libraries.find(l => l.id === libraryId) || { name: 'Study Library' };

    const instruction = `You are an expert exam quiz creator for "${lib.name}".
Create the exact number of multiple-choice questions requested in the user's instructions.
Quiz Title: "${title}".
${promptText ? 'User Instructions (including question count and difficulty): ' + promptText : ''}
${fileData ? 'Extract and create questions directly from the attached file: ' + fileData.name : ''}
${libraryGenerationSchema(libraryId)}

Output MUST be valid JSON with this exact schema:
{
  "title": "${title}",
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 0,
      "explanation": "Detailed explanation of why this answer is correct",
      "word": "Vocabulary word when applicable",
      "category": "OWS when applicable",
      "categoryName": "Readable category when applicable",
      "difficulty": "Easy, Moderate, or Hard when applicable",
      "hint": "Useful clue when applicable",
      "hindi": "Hindi meaning when applicable",
      "synAnt": "Synonyms and antonyms when applicable",
      "examTip": "Revision tip when applicable"
    }
  ]
}`;

    const parts = [];
    if (fileData && fileData.base64) {
      parts.push({
        inlineData: {
          mimeType: fileData.type || 'application/pdf',
          data: fileData.base64
        }
      });
    }
    parts.push({ text: instruction });

    const modelsToTry = [settings.geminiModel || 'gemini-2.0-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'].filter((v, i, a) => a.indexOf(v) === i && !v.includes('3.6') && !v.includes('3.5'));

    let lastError = null;
    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: parts }],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: 'application/json'
            }
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Empty response from Gemini.');

        return parseUniversalQuiz(text);
      } catch (err) {
        lastError = err;
        console.warn(`Model ${model} failed, trying next fallback...`, err);
      }
    }
    throw lastError || new Error('Gemini generation failed. Please verify your API key and connection.');
  }

  async function callOpenAIWithText(apiKey, libraryId, title, promptText) {
    const data = getStudioData();
    const lib = data.libraries.find(l => l.id === libraryId) || { name: 'Study Library' };

    const systemPrompt = `You are an expert exam quiz creator for "${lib.name}".
Follow the user's requested number of questions and difficulty exactly.
${libraryGenerationSchema(libraryId)}
Return ONLY valid JSON:
{
  "title": "${title}",
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "explanation": "Detailed explanation",
      "word": "Vocabulary word when applicable",
      "category": "OWS when applicable",
      "categoryName": "Readable category when applicable",
      "difficulty": "Easy, Moderate, or Hard when applicable",
      "hint": "Useful clue when applicable",
      "hindi": "Hindi meaning when applicable",
      "synAnt": "Synonyms and antonyms when applicable",
      "examTip": "Revision tip when applicable"
    }
  ]
}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: settings.openaiModel || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: promptText || title }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || res.statusText);
    }

    const dataRes = await res.json();
    const content = dataRes.choices?.[0]?.message?.content;
    return parseUniversalQuiz(content);
  }

  // Backup
  function exportAllBackup() {
    const data = getStudioData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cosmic-quiz-complete-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('Saved complete backup to your computer!');
  }

  function openEditModal(quizId) {
    const data = getStudioData();
    const quiz = data.quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    const newTitle = prompt('Edit Quiz Title:', quiz.title || '');
    if (newTitle !== null && newTitle.trim()) {
      quiz.title = newTitle.trim();
      updateQuiz(quiz);
      renderQuizList('all');
      showToast('Quiz title updated!');
    }
  }

  // --- Public API & Global Window bindings ---
  const studioApi = {
    closeModal,
    openStudioModal,
    openManageModal,
    openLibraryManagerModal,
    openAddLibraryModal,
    openImportModal,
    openSettingsModal,
    openEditModal,
    playQuiz,
    nextPlayerQuestion,
    handleAnswerSelected,
    handleFileSelect,
    handleImportFile,
    executeImport,
    generateQuizAction,
    saveNewLibraryForm,
    exportAllBackup,
    openLibraryQuizzes: function (libId) {
      openManageModal(libId);
    },
    confirmDeleteLibrary: function (libId) {
      const data = getStudioData();
      const lib = data.libraries.find(l => l.id === libId);
      if (!lib) return;
      if (confirm(`Are you sure you want to remove the library "${lib.name}" and all its quizzes?`)) {
        removeLibrary(libId);
        renderLibraryManagerList();
        showToast(`Library "${lib.name}" removed.`);
      }
    },
    confirmDeleteQuiz: function (quizId) {
      if (confirm('Are you sure you want to remove this quiz from the library?')) {
        removeQuiz(quizId);
        renderQuizList('all');
        showToast('Quiz removed from library.');
      }
    },
    filterManagerQuizzes: function (libId, btn) {
      const buttons = document.querySelectorAll('#cq-filter-bar button');
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderQuizList(libId);
    },
    selectProvider: function (prov) {
      settings.activeProvider = prov;
      document.getElementById('cq-card-gemini').classList.toggle('selected', prov === 'gemini');
      document.getElementById('cq-card-openai').classList.toggle('selected', prov === 'openai');
      saveSettings();
    },
    saveSettingsForm: function () {
      settings.geminiKey = document.getElementById('cq-gemini-key').value.trim().replace(/^["']|["']$/g, '');
      settings.geminiModel = document.getElementById('cq-gemini-model').value;
      settings.openaiKey = document.getElementById('cq-openai-key').value.trim().replace(/^["']|["']$/g, '');
      settings.openaiModel = document.getElementById('cq-openai-model').value;
      saveSettings();
      closeModal('cq-settings-modal');
      showToast('API keys saved!');
    },
    testKey: async function (type) {
      showToast(`Testing ${type === 'gemini' ? 'Gemini' : 'ChatGPT'} key...`);
      try {
        if (type === 'gemini') {
          const keyInput = document.getElementById('cq-gemini-key');
          const key = (keyInput ? keyInput.value : settings.geminiKey || '').trim().replace(/^["']|["']$/g, '');
          if (!key) throw new Error('Please paste your Gemini key first.');
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error?.message || `HTTP ${res.status}: ${res.statusText}`);
          }
          const d = await res.json();
          showToast(`✅ Gemini connected! (${d.models ? d.models.length : 0} models ready)`);
        } else {
          const keyInput = document.getElementById('cq-openai-key');
          const key = (keyInput ? keyInput.value : settings.openaiKey || '').trim().replace(/^["']|["']$/g, '');
          if (!key) throw new Error('Please paste your OpenAI key first.');
          const res = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${key}` }
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error?.message || res.statusText);
          }
          showToast('✅ ChatGPT connected successfully!');
        }
      } catch (e) {
        showToast('❌ ' + e.message, true);
        alert('Key Connection Error:\n' + e.message);
      }
    }
  };

  window.cqStudio = studioApi;

  // Also bind to window directly for any unqualified inline calls
  window.openStudioModal = openStudioModal;
  window.openImportModal = openImportModal;
  window.openManageModal = openManageModal;
  window.openLibraryManagerModal = openLibraryManagerModal;
  window.openAddLibraryModal = openAddLibraryModal;
  window.openSettingsModal = openSettingsModal;

  function init() {
    loadSettings();
    injectStyles();
    injectTopControls();
    createLibraryManagerModal();
    createAddLibraryModal();
    createStudioModal();
    createImportModal();
    createManageModal();
    createPlayerModal();
    createSettingsModal();
    renderHomepageLibraryGrid();
    updateStatsCounter();
    const route = location.hash.match(/^#cq-(ai|manage)=([^&]+)/);
    if (route) {
      const libraryId = decodeURIComponent(route[2]);
      setTimeout(() => route[1] === 'ai' ? openStudioModal(libraryId) : openManageModal(libraryId), 0);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
