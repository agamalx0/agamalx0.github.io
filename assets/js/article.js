(() => {
  'use strict';
  const esc = (s) => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const slug = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'section';
  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    const area = document.createElement('textarea');
    area.value = text; area.style.position = 'fixed'; area.style.opacity = '0';
    document.body.appendChild(area); area.select();
    const ok = document.execCommand('copy'); area.remove();
    if (!ok) throw new Error('Copy command was not accepted');
  };
  function enhanceCode(content) {
    content.querySelectorAll('pre').forEach((pre) => {
      if (pre.closest('.code-block')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block';
      const parent = pre.parentElement;
      if (parent && parent.classList.contains('code') && parent.children.length === 1) {
        parent.parentNode.insertBefore(wrapper, parent);
        wrapper.appendChild(pre);
        parent.remove();
      } else {
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
      }
      const code = pre.querySelector('code');
      const rawLang = (pre.className + ' ' + (code ? code.className : '')).match(/(?:language-|lang-)([a-z0-9_+-]+)/i);
      const toolbar = document.createElement('div');
      toolbar.className = 'code-toolbar';
      const label = document.createElement('span');
      label.textContent = rawLang ? rawLang[1].toUpperCase() : 'CODE';
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'code-copy'; button.textContent = 'COPY';
      button.addEventListener('click', async () => {
        try {
          await copyText(code ? code.textContent : pre.textContent);
          button.textContent = 'COPIED';
          window.setTimeout(() => { button.textContent = 'COPY'; }, 1600);
        } catch (_) {
          button.textContent = 'COPY FAILED';
          window.setTimeout(() => { button.textContent = 'COPY'; }, 1800);
        }
      });
      toolbar.append(label, button);
      wrapper.insertBefore(toolbar, pre);
      pre.setAttribute('tabindex', '0');
    });
    content.querySelectorAll('table').forEach((table) => {
      if (table.parentElement && table.parentElement.matches('.table-scroll,.table-wrap')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'table-scroll';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
    content.querySelectorAll('img').forEach((img) => {
      if (!img.closest('.article-cover-figure')) {
        img.loading = 'lazy'; img.decoding = 'async';
      }
    });
  }
  function makeToc(toc, content) {
    if (!toc || !content) return;
    const headings = Array.from(content.querySelectorAll('h2,h3')).filter(heading => !heading.closest('.more-topic'));
    let used = new Set();
    headings.forEach((heading) => {
      if (!heading.id) heading.id = slug(heading.textContent);
      let id = heading.id, n = 2;
      while (used.has(id)) id = heading.id + '-' + n++;
      heading.id = id; used.add(id);
    });
    let details = toc.querySelector('details');
    if (!details) {
      details = document.createElement('details');
      details.className = 'article-toc-details';
      details.open = true;
      const summary = document.createElement('summary');
      summary.textContent = toc.querySelector('strong')?.textContent.trim() || 'In this guide';
      const nav = document.createElement('nav'); nav.className = 'article-toc-nav';
      details.append(summary, nav);
      toc.replaceChildren(details);
    }
    const nav = details.querySelector('nav') || details.appendChild(document.createElement('nav'));
    nav.className = 'article-toc-nav';
    nav.setAttribute('aria-label', 'Table of contents');
    nav.replaceChildren();
    headings.forEach((heading) => {
      const link = document.createElement('a');
      link.href = '#' + heading.id;
      link.textContent = heading.textContent.trim();
      link.dataset.level = heading.tagName === 'H3' ? '3' : '2';
      nav.appendChild(link);
    });
    if (!headings.length) toc.hidden = true;
    else if (!details.querySelector('summary')) {
      const summary = document.createElement('summary'); summary.textContent = 'In this guide'; details.prepend(summary);
    }
  }
  function enhanceImages(content) {
    const dialog = document.createElement('dialog');
    dialog.className = 'image-zoom';
    dialog.innerHTML = '<button type="button" class="image-zoom-close" aria-label="Close enlarged image">CLOSE ×</button><img alt=""><p></p>';
    document.body.appendChild(dialog);
    const zoomImg = dialog.querySelector('img');
    const caption = dialog.querySelector('p');
    const close = () => dialog.close();
    dialog.querySelector('button').addEventListener('click', close);
    dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
    content.querySelectorAll('figure img').forEach((img) => {
      if (img.closest('a')) return;
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', 'Enlarge image: ' + (img.alt || 'article image'));
      img.style.cursor = 'zoom-in';
      const open = () => {
        zoomImg.src = img.currentSrc || img.src;
        zoomImg.alt = img.alt || '';
        caption.textContent = img.closest('figure')?.querySelector('figcaption')?.textContent || img.alt || '';
        dialog.showModal();
      };
      img.addEventListener('click', open);
      img.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
    });
  }
  function appendNavigation(content, note, notes) {
    if (!content || !note || content.querySelector('.article-pagination')) return;
    const index = notes.findIndex(item => item.url === note.url);
    const previous = index > 0 ? notes[index - 1] : null;
    const next = index >= 0 && index < notes.length - 1 ? notes[index + 1] : null;
    const pagination = document.createElement('nav');
    pagination.className = 'article-pagination';
    pagination.setAttribute('aria-label', 'Previous and next articles');
    const link = (item, label) => {
      if (!item) return '<span></span>';
      return '<a href="' + esc(item.url) + '"><small>' + label + '</small><strong>' + esc(item.title) + '</strong></a>';
    };
    pagination.innerHTML = link(previous, '← PREVIOUS NOTE') + link(next, 'NEXT NOTE →');
    content.appendChild(pagination);
    const related = notes.filter(item => item.topicKey === note.topicKey && item.url !== note.url).slice(0,3);
    if (related.length) {
      const section = document.createElement('section');
      section.className = 'more-topic';
      section.innerHTML = '<h2>More from ' + esc(note.topic) + '</h2><div class="more-topic-grid">' +
        related.map(item => '<a href="' + esc(item.url) + '"><small>' + esc(item.date) + '</small><strong>' + esc(item.title) + '</strong></a>').join('') +
        '</div>';
      content.appendChild(section);
    }
  }
  function normalizeHeader() {
    let header = document.querySelector('.topbar');
    if (!header) {
      header = document.createElement('header'); header.className = 'site-header';
      document.body.prepend(header);
    }
    header.className = 'site-header';
    let nav = header.querySelector('.nav');
    if (!nav) { nav = document.createElement('div'); header.appendChild(nav); }
    nav.className = 'site-nav site-container';
    nav.innerHTML = '<a class="site-brand" href="/">Ashraf Gamal <span>/ Notes</span></a><nav aria-label="Main navigation"><a href="/#about">ABOUT</a><a href="/#expertise">EXPERTISE</a><a href="/#experience">EXPERIENCE</a><a href="/articles.html">NOTES</a><a class="btn p nav-cta" href="/#connect">CONNECT</a></nav>';
  }
  async function init() {
    if (document.body.classList.contains('redirect-page')) return;
    document.body.classList.add('article-page');
    normalizeHeader();
    const hero = document.querySelector('.hero');
    const content = document.querySelector('article.content,.content article') || document.querySelector('.content');
    const toc = document.querySelector('.toc');
    if (hero) {
      hero.classList.add('site-article-hero');
      hero.classList.remove('wrap');
      const path = location.pathname;
      let notes = [];
      try {
        const response = await fetch('/notes.json', { cache: 'no-cache' });
        if (response.ok) notes = await response.json();
      } catch (_) {}
      const note = notes.find(item => item.url === path || item.url === path.replace(/\/$/,'/'));
      const crumbs = document.createElement('nav');
      crumbs.className = 'breadcrumbs';
      crumbs.setAttribute('aria-label', 'Breadcrumb');
      crumbs.innerHTML = '<a href="/">Home</a><span class="crumb-sep">/</span><a href="/articles.html">Notes</a>' +
        (note ? '<span class="crumb-sep">/</span><span aria-current="page">' + esc(note.topic) + '</span>' : '');
      hero.prepend(crumbs);
      if (note) {
        const topic = document.createElement('span');
        topic.className = 'topic-tag';
        topic.dataset.topic = note.topicKey;
        topic.textContent = note.topic;
        const h1 = hero.querySelector('h1');
        if (h1) hero.insertBefore(topic, h1);
        const meta = hero.querySelector('.meta');
        if (meta) {
          const spans = Array.from(meta.querySelectorAll('span'));
          const date = meta.querySelector('[data-article-date]') || spans.find(span => /^(Updated|Published)\\b/i.test(span.textContent.trim())) || document.createElement('span');
          const datePrefix = /^Published\\b/i.test(date.textContent.trim()) ? 'Published ' : 'Updated ';
          date.dataset.articleDate = 'true'; date.textContent = datePrefix + note.date;
          const reading = meta.querySelector('[data-reading-time]') || spans.find(span => /Approx\\.|min read/i.test(span.textContent)) || document.createElement('span');
          reading.dataset.readingTime = 'true'; reading.textContent = 'Approx. ' + note.readingTime;
          if (!date.parentNode) meta.appendChild(date);
          if (!reading.parentNode) meta.appendChild(reading);
        }
        document.title = document.title || (note.title + ' | Ashraf Gamal');
        appendNavigation(content, note, notes);
      }
    }
    const layout = document.querySelector('.layout');
    if (layout) layout.classList.add('site-container');
    else if (toc && content) {
      const wrapper = document.createElement('div'); wrapper.className = 'layout site-container';
      toc.parentNode.insertBefore(wrapper, toc); wrapper.append(toc, content);
    }
    makeToc(toc, content);
    if (content) { enhanceCode(content); enhanceImages(content); }
    const progress = document.createElement('div');
    progress.className = 'reading-progress'; progress.setAttribute('aria-hidden','true');
    progress.innerHTML = '<span></span>'; document.body.prepend(progress);
    const bar = progress.firstElementChild;
    let pending = false;
    const updateProgress = () => {
      const root = document.documentElement;
      const available = root.scrollHeight - window.innerHeight;
      const value = available > 0 ? Math.min(100, Math.max(0, window.scrollY / available * 100)) : 0;
      bar.style.width = value + '%';
      pending = false;
    };
    window.addEventListener('scroll', () => { if (!pending) { pending = true; window.requestAnimationFrame(updateProgress); } }, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    updateProgress();
    const footer = document.querySelector('footer');
    if (footer) footer.classList.add('site-footer');
    else {
      const foot = document.createElement('footer'); foot.className = 'site-container site-footer';
      foot.innerHTML = '<span>ASHRAF GAMAL · SOC ENGINEER &amp; SOC ANALYST L2</span><a href="#">↑ TOP</a>';
      document.body.appendChild(foot);
    }
    if (!document.querySelector('script[src="/assets/js/site-visits.js"]')) {
      const script = document.createElement('script'); script.src = '/assets/js/site-visits.js'; script.defer = true; document.head.appendChild(script);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();