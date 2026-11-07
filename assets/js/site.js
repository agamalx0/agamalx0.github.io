(() => {
  'use strict';
  function init() {
    const header = document.querySelector('.site-header');
    if (header) {
      const measure = () => document.documentElement.style.setProperty('--header-offset', Math.ceil(header.getBoundingClientRect().height + 16) + 'px');
      measure();
      if (window.ResizeObserver) new ResizeObserver(measure).observe(header);
    }
    document.querySelectorAll('[data-notes-root]').forEach(root => {
      const cards = Array.from(root.querySelectorAll('.note-card'));
      const buttons = Array.from(root.querySelectorAll('[data-topic-filter]'));
      const search = root.querySelector('[data-notes-search]');
      const empty = root.querySelector('[data-no-results]');
      const count = root.querySelector('[data-visible-count]');
      const topics = new Set(buttons.map(b => b.dataset.topicFilter));
      const records = cards.map(card => ({card, text: card.textContent.toLowerCase()}));
      let topic = 'all';
      const apply = () => {
        const terms = (search?.value || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
        let visible = 0;
        records.forEach(({card,text}) => {
          const show = (topic === 'all' || card.dataset.topic === topic) && terms.every(term => text.includes(term));
          card.hidden = !show;
          if (show) visible++;
        });
        buttons.forEach(button => {
          const active = button.dataset.topicFilter === topic;
          button.classList.toggle('on',active);
          button.setAttribute('aria-pressed',String(active));
        });
        if (count) count.textContent = visible + (visible === 1 ? ' note' : ' notes');
        if (empty) empty.hidden = visible !== 0;
      };
      const restore = () => {
        const params = new URL(location.href).searchParams;
        topic = topics.has(params.get('topic')) ? params.get('topic') : 'all';
        if (search) search.value = params.get('q') || '';
        apply();
      };
      const save = (push = false) => {
        const url = new URL(location.href);
        if (topic === 'all') url.searchParams.delete('topic'); else url.searchParams.set('topic',topic);
        const q = search?.value.trim() || '';
        if (q) url.searchParams.set('q',q); else url.searchParams.delete('q');
        if (url.href !== location.href) history[push?'pushState':'replaceState'](null,'',url);
        apply();
      };
      buttons.forEach(button => button.addEventListener('click',() => {topic = button.dataset.topicFilter; save(true);}));
      search?.addEventListener('input',() => save());
      window.addEventListener('popstate',restore);
      restore();
      root.querySelectorAll('[data-search-controls]').forEach(el => el.hidden = false);
    });
    document.querySelectorAll('[data-year]').forEach(el => el.textContent = String(new Date().getFullYear()));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
