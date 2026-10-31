(() => {
  'use strict';

  const endpoint = 'https://agamalx0.goatcounter.com/count';
  const localTracker = '/assets/js/goatcounter-count.js?v=20261031-2046';
  const widgetId = 'site-visits-widget';
  const imageUrl = 'https://agamalx0.goatcounter.com/counter/TOTAL.svg?no_branding=1';

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

  function renderCounter(widget) {
    if (!widget || widget.dataset.counterRendered === 'true') return;

    const image = document.createElement('img');
    image.className = 'site-visits-counter';
    image.alt = 'GoatCounter total site pageviews';
    image.width = 112;
    image.height = 34;
    image.loading = 'eager';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    image.src = imageUrl;

    image.addEventListener('load', () => {
      if (image.naturalWidth > 0) {
        widget.title = 'Total site pageviews';
        widget.dataset.counterStatus = 'loaded';
      } else {
        widget.textContent = '—';
        widget.title = 'GoatCounter returned an unreadable counter image';
        widget.dataset.counterStatus = 'invalid-image';
      }
    }, { once: true });

    image.addEventListener('error', () => {
      widget.textContent = '—';
      widget.title = 'GoatCounter counter image could not be loaded';
      widget.dataset.counterStatus = 'load-error';
    }, { once: true });

    widget.replaceChildren(image);
    widget.dataset.counterRendered = 'true';
  }

  function loadTracker() {
    const existing = document.querySelector('script[data-goatcounter]');
    if (existing && existing.src.includes('/assets/js/goatcounter-count.js')) return;

    if (existing) existing.remove();

    const script = document.createElement('script');
    script.async = true;
    script.src = localTracker;
    script.setAttribute('data-goatcounter', endpoint);
    script.addEventListener('error', () => {
      if (window.console && console.warn) console.warn('[site-visits] Self-hosted GoatCounter tracking script failed to load.');
    }, { once: true });
    document.head.appendChild(script);
  }

  function init() {
    const widget = getWidget();
    if (widget) {
      renderCounter(widget);
      loadTracker();
      return;
    }

    const observer = new MutationObserver(() => {
      const mounted = getWidget();
      if (!mounted) return;
      observer.disconnect();
      renderCounter(mounted);
      loadTracker();
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