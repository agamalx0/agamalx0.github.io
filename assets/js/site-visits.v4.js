(() => {
  'use strict';

  const COUNTER_URL = 'https://rough-limit-0133.a-gamal-31b.workers.dev/';
  const GOATCOUNTER_ENDPOINT = 'https://agamalx0.goatcounter.com/count';
  const TRACKER_SCRIPT = '/assets/js/goatcounter-count.js?v=20261101';
  const COUNTER_ID = 'site-visits-counter';

  async function updateSiteVisits() {
    const counter = document.getElementById(COUNTER_ID);
    if (!counter) return;

    const widget = counter.closest('.site-visits-widget');
    if (widget) widget.dataset.counterStatus = 'loading';

    try {
      const response = await fetch(COUNTER_URL, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        credentials: 'omit',
        headers: { Accept: 'text/plain' }
      });

      if (!response.ok) {
        throw new Error('Cloudflare Worker returned HTTP ' + response.status);
      }

      const responseText = (await response.text()).trim();
      const count = responseText.replace(/^["']|["']$/g, '');

      if (!/^[0-9][0-9,]*$/.test(count)) {
        throw new Error('Cloudflare Worker returned an unexpected count: ' + responseText.slice(0, 80));
      }

      counter.textContent = count;
      if (widget) {
        widget.dataset.counterStatus = 'loaded';
        widget.title = 'Total site visits';
      }
    } catch (error) {
      counter.textContent = '—';
      if (widget) {
        widget.dataset.counterStatus = 'error';
        widget.title = 'Site visit count is currently unavailable';
      }
      if (window.console && console.error) {
        console.error('[site-visits] Cloudflare Worker counter request failed:', error);
      }
    }
  }

  function loadTrackingScript() {
    const existing = document.querySelector('script[data-goatcounter]');
    if (existing && existing.src.includes('/assets/js/goatcounter-count.js')) return;
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.async = true;
    script.src = TRACKER_SCRIPT;
    script.setAttribute('data-goatcounter', GOATCOUNTER_ENDPOINT);
    script.addEventListener('error', () => {
      if (window.console && console.warn) {
        console.warn('[site-visits] Self-hosted GoatCounter tracking script failed to load.');
      }
    }, { once: true });
    document.head.appendChild(script);
  }

  function init() {
    updateSiteVisits();
    loadTrackingScript();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();