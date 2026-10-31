(() => {
  'use strict';

  const endpoint = 'https://agamalx0.goatcounter.com/count';
  const totalUrl = 'https://agamalx0.goatcounter.com/counter/TOTAL.json';
  const scriptSelector = 'script[data-goatcounter="https://agamalx0.goatcounter.com/count"]';

  function mountCounter() {
    const footer = document.querySelector('footer');
    if (!footer || document.getElementById('site-visits')) return;

    const counter = document.createElement('span');
    counter.className = 'site-visits';
    counter.id = 'site-visits';
    counter.setAttribute('aria-label', 'Total site visits');
    counter.innerHTML =
      '<span class="site-visits-label">SITE VISITS</span>' +
      '<span class="site-visits-widget" id="site-visits-widget" aria-live="polite">…</span>';

    const footerInner = footer.querySelector('.footerinner');
    if (footerInner) {
      const homeLink = footerInner.querySelector('a');
      if (homeLink) footerInner.insertBefore(counter, homeLink);
      else footerInner.appendChild(counter);
    } else {
      const footerLinks = footer.children.length > 1 ? footer.children[1] : null;
      if (footerLinks) footer.insertBefore(counter, footerLinks);
      else footer.appendChild(counter);
    }
  }

  function showFallback() {
    const widget = document.getElementById('site-visits-widget');
    if (!widget) return;

    fetch(totalUrl, { mode: 'cors', credentials: 'omit', cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('GoatCounter returned HTTP ' + response.status);
        return response.json();
      })
      .then((data) => {
        if (!data || data.count === undefined || data.count === null) {
          throw new Error('GoatCounter response did not contain a count');
        }
        widget.textContent = String(data.count);
        widget.title = 'Total site visits';
      })
      .catch((error) => {
        widget.textContent = '—';
        widget.title = 'Visitor count unavailable. Check the GoatCounter public-counter setting or whether a browser extension blocks GoatCounter.';
        if (window.console && console.warn) console.warn('[site-visits] Counter fallback failed:', error);
      });
  }

  function renderOfficialCounter() {
    const widget = document.getElementById('site-visits-widget');
    if (!widget || widget.dataset.rendered === 'true') return;

    if (!window.goatcounter || typeof window.goatcounter.visit_count !== 'function') {
      showFallback();
      return;
    }

    try {
      widget.dataset.rendered = 'true';
      window.goatcounter.visit_count({
        append: '#site-visits-widget',
        path: 'TOTAL',
        type: 'html',
        no_branding: true,
        attr: {
          width: '92',
          height: '24',
          title: 'Total site visits',
          loading: 'lazy'
        },
        style: [
          'div { box-sizing:border-box !important; width:88px !important; height:24px !important; margin:0 !important; padding:0 !important; border:0 !important; border-radius:0 !important; background:transparent !important; color:#00f59b !important; font-family:monospace !important; font-size:11px !important; line-height:24px !important; overflow:hidden !important; }',
          '#gcvc-for { display:none !important; }',
          '#gcvc-views { color:#00f59b !important; font-family:monospace !important; font-size:11px !important; font-weight:700 !important; line-height:24px !important; }',
          '#gcvc-by { display:none !important; }'
        ].join(' ')
      });
    } catch (error) {
      widget.dataset.rendered = 'false';
      if (window.console && console.warn) console.warn('[site-visits] GoatCounter display failed:', error);
      showFallback();
    }
  }

  function loadGoatCounter() {
    if (window.goatcounter && typeof window.goatcounter.visit_count === 'function') {
      renderOfficialCounter();
      return;
    }

    const existing = document.querySelector(scriptSelector);
    if (existing) {
      existing.addEventListener('load', renderOfficialCounter, { once: true });
      existing.addEventListener('error', showFallback, { once: true });
      if (window.goatcounter && typeof window.goatcounter.visit_count === 'function') renderOfficialCounter();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://gc.zgo.at/count.js';
    script.setAttribute('data-goatcounter', endpoint);
    script.addEventListener('load', renderOfficialCounter, { once: true });
    script.addEventListener('error', showFallback, { once: true });
    document.head.appendChild(script);
  }

  function init() {
    mountCounter();
    loadGoatCounter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
