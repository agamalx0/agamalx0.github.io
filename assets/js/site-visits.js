(() => {
  const endpoint = 'https://agamalx0.goatcounter.com/count';
  const totalsUrl = 'https://agamalx0.goatcounter.com/counter/TOTAL.json';

  function mountCounter() {
    const footer = document.querySelector('footer');
    if (!footer || document.getElementById('site-visits')) return;

    const counter = document.createElement('span');
    counter.className = 'site-visits';
    counter.id = 'site-visits';
    counter.setAttribute('aria-label', 'Total site visits');
    counter.innerHTML = '<span class="site-visits-label">SITE VISITS</span><strong class="site-visits-count" aria-live="polite">…</strong>';

    const footerInner = footer.querySelector('.footerinner');
    if (footerInner) {
      const homeLink = footerInner.querySelector('a');
      if (homeLink) footerInner.insertBefore(counter, homeLink);
      else footerInner.appendChild(counter);
    } else {
      // The homepage uses a Tailwind footer instead of the article footer structure.
      const footerLinks = footer.children.length > 1 ? footer.children[1] : null;
      if (footerLinks) footer.insertBefore(counter, footerLinks);
      else footer.appendChild(counter);
    }
  }

  function loadGoatCounter() {
    if (document.querySelector('script[data-goatcounter="https://agamalx0.goatcounter.com/count"]') ||
        document.querySelector('script[src*="gc.zgo.at/count.js"]')) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://gc.zgo.at/count.js';
    script.setAttribute('data-goatcounter', endpoint);
    document.head.appendChild(script);
  }

  function loadTotal() {
    const count = document.querySelector('#site-visits .site-visits-count');
    if (!count) return;

    fetch(totalsUrl, { mode: 'cors', credentials: 'omit' })
      .then((response) => {
        if (!response.ok) throw new Error('Visitor count unavailable');
        return response.json();
      })
      .then((data) => {
        count.textContent = data && data.count ? data.count : '—';
      })
      .catch(() => {
        count.textContent = '—';
        count.title = 'Visitor count unavailable. Check GoatCounter settings or browser content blocking.';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mountCounter();
      loadGoatCounter();
      loadTotal();
    }, { once: true });
  } else {
    mountCounter();
    loadGoatCounter();
    loadTotal();
  }
})();
