(() => {
  'use strict';
  const clean = (value) => String(value || '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
  const topicClass = (key) => 'topic-' + String(key || '').replace(/[^a-z0-9-]/g, '');
  const createCard = (note) => {
    const card = document.createElement('a');
    card.className = 'card note-card';
    card.href = note.url;
    card.dataset.topic = note.topicKey;
    card.setAttribute('aria-label', 'Open technical note: ' + note.title);
    const topic = document.createElement('span');
    topic.className = 'note-topic ' + topicClass(note.topicKey);
    topic.textContent = note.topic;
    const title = document.createElement('h3');
    title.textContent = note.title;
    const summary = document.createElement('p');
    summary.textContent = note.summary;
    const meta = document.createElement('div');
    meta.className = 'note-meta';
    const date = document.createElement('time');
    date.textContent = note.date;
    if (note.dateISO) date.dateTime = note.dateISO;
    const reading = document.createElement('span');
    reading.textContent = note.readingTime;
    meta.append(date, reading);
    card.append(topic, title, summary, meta);
    return card;
  };
  const setupFilters = (root, cards) => {
    const buttons = Array.from(root.querySelectorAll('[data-topic-filter]'));
    if (!buttons.length) return;
    const count = root.querySelector('[data-visible-count]');
    const apply = (key) => {
      let visible = 0;
      cards.forEach((card) => {
        const show = key === 'all' || card.dataset.topic === key;
        card.hidden = !show;
        if (show) visible += 1;
      });
      buttons.forEach((button) => {
        const active = button.dataset.topicFilter === key;
        button.classList.toggle('on', active);
        button.setAttribute('aria-pressed', String(active));
      });
      if (count) count.textContent = visible + (visible === 1 ? ' note' : ' notes');
    };
    buttons.forEach((button) => button.addEventListener('click', () => apply(button.dataset.topicFilter)));
    apply('all');
  };
  async function init() {
    const homeGrid = document.getElementById('notes-grid');
    const libraryGrid = document.getElementById('library-grid');
    const targets = [homeGrid, libraryGrid].filter(Boolean);
    if (!targets.length) return;
    const status = targets.find((node) => node.dataset.notesStatus);
    try {
      const response = await fetch('/notes.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error('Notes data returned HTTP ' + response.status);
      const notes = await response.json();
      if (!Array.isArray(notes)) throw new Error('Notes data is not an array');
      targets.forEach((grid) => {
        grid.replaceChildren(...notes.map(createCard));
        const root = grid.closest('[data-notes-root]') || grid.parentElement;
        setupFilters(root, Array.from(grid.children));
        const count = root.querySelector('[data-total-count]');
        if (count) count.textContent = String(notes.length);
        const countLabel = root.querySelector('[data-count-label]');
        if (countLabel) countLabel.textContent = notes.length + ' notes';
      });
      document.querySelectorAll('[data-total-notes]').forEach((el) => el.textContent = String(notes.length));
    } catch (error) {
      targets.forEach((grid) => {
        grid.innerHTML = '<p class="note-empty">The notes index is temporarily unavailable. Use the full article library link to browse the published guides.</p>';
      });
      if (window.console && console.warn) console.warn('[Spectrum] Could not load notes.json:', error);
    }
    document.querySelectorAll('[data-year]').forEach((el) => el.textContent = String(new Date().getFullYear()));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();