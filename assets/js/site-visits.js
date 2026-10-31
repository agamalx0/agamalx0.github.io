(() => {
  'use strict';

  const endpoint = 'https://agamalx0.goatcounter.com/count';
  const localTracker = '/assets/js/goatcounter-count.js';
  const widgetId = 'site-visits-widget';
  const svgStyle = [
    '#gcvc-border{fill:transparent;stroke:transparent}',
    '#gcvc{font-family:"JetBrains Mono",monospace;fill:#2dff8f}',
    '#gcvc-for,#gcvc-by{display:none}',
    '#gcvc-views{font-size:34px;fill:#2dff8f}'
  ].join('');

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

  function renderDirectImage(widget) {
    if (!widget || widget.dataset.counterRendered === 'true') return;
    const image = document.createElement('img');
    image.className = 'site-visits-counter';
    image.alt = 'Total site pageviews';
    image.width = 86;
    image.height = 34;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.src = 'https://agamalx0.goatcounter.com/counter/TOTAL.svg?no_branding=1&style=' + encodeURIComponent(svgStyle);
    image.addEventListener('error', () => {
      widget.textContent = '—';
      widget.title = 'Visitor count unavailable';
    }, { once: true });
    widget.replaceChildren(image);
    widget.dataset.counterRendered = 'true';
    widget.title = 'Total site pageviews';
  }

  function renderWithGoatCounter(widget) {
    if (!widget || widget.dataset.counterRendered === 'true') return;
    const gc = window.goatcounter;
    if (!gc || typeof gc.visit_count !== 'function') {
      renderDirectImage(widget);
      return;
    }

    try {
      widget.replaceChildren();
      gc.visit_count({
        append: '#' + widgetId,
        path: 'TOTAL',
        type: 'svg',
        no_branding: true,
        style: svgStyle,
        attr: {
          width: '86',
          height: '34',
          alt: 'Total site pageviews',
          class: 'site-visits-counter',
          loading: 'lazy'
        }
      });
      widget.dataset.counterRendered = 'true';
      widget.title = 'Total site pageviews';
    } catch (error) {
      if (window.console && console.warn) console.warn('[site-visits] GoatCounter visitor embed failed:', error);
      renderDirectImage(widget);
    }
  }

  function loadTracker(widget) {
    if (window.goatcounter && typeof window.goatcounter.visit_count === 'function') {
      renderWithGoatCounter(widget);
      return;
    }

    let script = document.querySelector('script[data-goatcounter]');
    if (script && !script.src.includes('/assets/js/goatcounter-count.js')) {
      script.remove();
      script = null;
    }

    if (!script) {
      script = document.createElement('script');
      script.async = true;
      script.src = localTracker;
      script.setAttribute('data-goatcounter', endpoint);
      script.addEventListener('load', () => renderWithGoatCounter(widget), { once: true });
      script.addEventListener('error', () => {
        if (window.console && console.warn) console.warn('[site-visits] Self-hosted GoatCounter script failed to load.');
        renderDirectImage(widget);
      }, { once: true });
      document.head.appendChild(script);
      return;
    }

    if (window.goatcounter && typeof window.goatcounter.visit_count === 'function') {
      renderWithGoatCounter(widget);
    } else {
      script.addEventListener('load', () => renderWithGoatCounter(widget), { once: true });
      script.addEventListener('error', () => renderDirectImage(widget), { once: true });
    }
  }

  function init() {
    const widget = getWidget();
    if (widget) {
      loadTracker(widget);
      return;
    }

    const observer = new MutationObserver(() => {
      const mounted = getWidget();
      if (!mounted) return;
      observer.disconnect();
      loadTracker(mounted);
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