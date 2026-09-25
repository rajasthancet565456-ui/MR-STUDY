/* Adds AI-created quizzes to every original library without changing its supplied quiz files. */
(function () {
  'use strict';
  const libraryId = window.CQ_LIBRARY_ID;
  if (!libraryId) return;
  const storageKey = 'cosmicQuizStudioV1';
  const masterPage = 'cosmic-quiz-master.html';
  const customPage = 'custom-quiz-library.html';
  const safe = value => String(value || '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
  function read() {
    try { const data = JSON.parse(localStorage.getItem(storageKey) || '{"quizzes":[]}'); return Array.isArray(data.quizzes) ? data : { quizzes: [] }; }
    catch { return { quizzes: [] }; }
  }
  function getQuizzes() { return read().quizzes.filter(quiz => quiz.libraryId === libraryId); }
  function openMaster(mode) { location.href = `${masterPage}#cq-${mode}=${encodeURIComponent(libraryId)}`; }
  function render() {
    const grid = document.querySelector('.quiz-grid');
    if (!grid) return;
    grid.querySelectorAll('[data-cq-ai-quiz]').forEach(card => card.remove());
    getQuizzes().forEach((quiz, index) => {
      const card = document.createElement('button');
      card.type = 'button'; card.className = 'quiz-card'; card.dataset.cqAiQuiz = quiz.id;
      const count = quiz.importedHtml ? 'Original HTML quiz' : `${(quiz.questions || []).length} AI questions`;
      card.innerHTML = `<span class="quiz-number">AI · ${safe(quiz.title || `Quiz ${index + 1}`)}</span><small>${safe(count)} · Open practice quiz →</small>`;
      card.addEventListener('click', () => {
        const destination = `ai-quiz-runner.html?quiz=${encodeURIComponent(quiz.id)}`;
        location.href = destination;
      });
      grid.appendChild(card);
    });
    const counter = document.getElementById('counter');
    if (counter && getQuizzes().length) counter.textContent += ` · ${getQuizzes().length} AI quiz${getQuizzes().length === 1 ? '' : 'zes'} added`;
  }
  function addControls() {
    const nav = document.querySelector('.navlinks');
    if (!nav || document.getElementById('cq-library-tools')) return;
    const wrap = document.createElement('span'); wrap.id = 'cq-library-tools'; wrap.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap';
    wrap.innerHTML = `<button type="button" class="button" style="font-size:.58rem" title="Create an AI quiz in this library">✨ Add AI Quiz</button><button type="button" class="button" style="font-size:.58rem" title="Manage AI quizzes in this library">✎ Edit AI Quizzes</button>`;
    const [add, manage] = wrap.querySelectorAll('button');
    add.onclick = () => openMaster('ai'); manage.onclick = () => openMaster('manage'); nav.appendChild(wrap);
  }
  function start() { addControls(); render(); window.addEventListener('storage', render); }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
