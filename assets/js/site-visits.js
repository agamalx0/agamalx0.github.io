(() => {
  'use strict';

  const endpoint = 'https://agamalx0.goatcounter.com/count';
  const totalUrl = 'https://agamalx0.goatcounter.com/counter/TOTAL.json';
  const scriptSelector = 'script[data-goatcounter="' + endpoint + '"]';

  function addStyles() {
    if (document.getElementById('site-visits-styles')) return;
    const style = document.createElement('style');
    style.id = 'site-visits-styles';
    style.textContent = [
      '.site-visits{display:inline-flex;align-items:center;gap:9px;white-space:nowrap;align-self:center;font:10px/1.6 "JetBrains Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:#737985}',
      '.site-visits:before{content:"//";color:#059669}',
      '.site-visits-label{color:#737985}',
      '.site-visits-widget{display:inline-block;min-width:2ch;color:#059669;font:700 11px/1.4 "JetBrains Mono",monospace;font-variant-numeric:tabular-nums}',
      '.dark .site-visits:before,.dark .site-visits-widget{color:#00f59b}'
    ].join('');
    document.head.appendChild(style);
  }

  function mountCounter() {
    const footer = document.querySelector('footer');
    if (!footer) return null;

    let counter = document.getElementById('site-visits');
    if (!counter) {
      counter = document.createElement('span');
      counter.className = 'site-visits';
      counter.id = 'site-visits';
      counter.setAttribute('aria-label', 'Total site visits');
      counter.innerHTML = '<span class="site-visits-label">SITE VISITS</span><span class="site-visits-widget" id="site-visits-widget" aria-live="polite">…</span>';

      const footerInner = footer.querySelector('.footerinner');
      if (footerInner) {
        const link = footerInner.querySelector('a');
        if (link) footerInner.insertBefore(counter, link);
        else footerInner.appendChild(counter);
      } else {
        const footerLinks = footer.children.length > 1 ? footer.children[1] : null;
        if (footerLinks) footer.insertBefore(counter, footerLinks);
        else footer.appendChild(counter);
      }
    }

    let widget = document.getElementById('site-visits-widget');
    if (!widget) {
      widget = document.createElement('span');
      widget.className = 'site-visits-widget';
      widget.id = 'site-visits-widget';
      widget.setAttribute('aria-live', 'polite');
      widget.textContent = '…';
      counter.appendChild(widget);
    }

    addStyles();
    return widget;
  }

  function updateCounter(widget) {
    if (!widget || widget.dataset.loading === 'true') return;
    widget.dataset.loading = 'true';

    fetch(totalUrl, { credentials: 'omit', cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('GoatCounter returned HTTP ' + response.status);
        return response.json();
      })
      .then((data) => {
        if (!data || data.count === undefined || data.count === null) {
          throw new Error('GoatCounter response did not contain a count');
        }
        widget.textContent = String(data.count);
        widget.title = 'Total site pageviews';
      })
      .catch((error) => {
        widget.textContent = '—';
        widget.title = 'Visitor count unavailable';
        if (window.console && console.warn) console.warn('[site-visits] Could not load the public counter:', error);
      })
      .finally(() => {
        widget.dataset.loading = 'false';
      });
  }

  function loadTrackingScript() {
    if (document.querySelector(scriptSelector)) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://gc.zgo.at/count.js';
    script.setAttribute('data-goatcounter', endpoint);
    script.addEventListener('error', () => {
      if (window.console && console.warn) console.warn('[site-visits] GoatCounter tracking script was blocked or failed to load.');
    }, { once: true });
    document.head.appendChild(script);
  }

  function init() {
    loadTrackingScript();

    const widget = mountCounter();
    if (widget) {
      updateCounter(widget);
      return;
    }

    const observer = new MutationObserver(() => {
      const mountedWidget = mountCounter();
      if (mountedWidget) {
        observer.disconnect();
        updateCounter(mountedWidget);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 10000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
