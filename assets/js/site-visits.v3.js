(() => {
  'use strict';

  const endpoint = 'https://agamalx0.goatcounter.com/count';
  const localTracker = '/assets/js/goatcounter-count.js?v=20261101';
  const statsUrl = '/assets/data/site-stats.json';
  const widgetId = 'site-visits-widget';

  function getWidget() {
    let widget = document.getElementById(widgetId);
    if (widget) return widget;

    const footer = document.querySelector('footer');
    if (!footer) return null;

    let counter = document.getElementById('site-visits');
    if (!counter) {
      counter = document.createElement('span');
      counter.id = 'site-visits';
      counter.className = 'site-visits';
      counter.setAttribute('aria-label', 'Total site visits');
      counter.innerHTML = '<span class="site-visits-label">SITE VISITS</span><span class="site-visits-widget" id="site-visits-widget" aria-live="polite">…</span>';
      footer.appendChild(counter);
    }
    return document.getElementById(widgetId);
  }

  async function loadSnapshot(widget) {
    if (!widget) return;
    const number = document.createElement('span');
    number.className = 'site-visits-number';
    number.textContent = '…';
    widget.replaceChildren(number);

    try {
      const response = await fetch(statsUrl + '?v=20261101', {
        cache: 'no-store',
        credentials: 'same-origin'
      });
      if (!response.ok) throw new Error('Site stats returned HTTP ' + response.status);
      const data = await response.json();
      const count = String(data.count ?? '').trim();
      if (!/^[0-9][0-9,]*$/.test(count)) throw new Error('Invalid site visit count');
      number.textContent = count;
      widget.title = data.updated_at
        ? 'GoatCounter total pageviews; snapshot updated ' + new Date(data.updated_at).toLocaleString()
        : 'GoatCounter total pageviews';
      widget.dataset.counterStatus = 'loaded';
      widget.dataset.counterSource = 'same-origin-snapshot';
    } catch (error) {
      number.textContent = '—';
      widget.title = 'Cached visitor count unavailable';
      widget.dataset.counterStatus = 'snapshot-error';
      if (window.console && console.warn) console.warn('[site-visits] Could not load the same-origin count snapshot:', error);
    }
  }

  function loadTrackingScript() {
    const existing = document.querySelector('script[data-goatcounter]');
    if (existing && existing.src.includes('/assets/js/goatcounter-count.js')) return;
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.async = true;
    script.src = localTracker;
    script.setAttribute('data-goatcounter', endpoint);
    script.addEventListener('error', () => {
      if (window.console && console.warn) console.warn('[site-visits] GoatCounter tracking script was blocked or failed to load.');
    }, { once: true });
    document.head.appendChild(script);
  }

  function init() {
    const widget = getWidget();
    if (widget) {
      loadSnapshot(widget);
      loadTrackingScript();
      return;
    }

    const observer = new MutationObserver(() => {
      const mounted = getWidget();
      if (!mounted) return;
      observer.disconnect();
      loadSnapshot(mounted);
      loadTrackingScript();
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