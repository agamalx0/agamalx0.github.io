(() => {
  'use strict';
  // Dark presentation is owned by site.css; preserve the optional spotlight only.
  const finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (finePointer && !reducedMotion && document.body) {
    let spotlight = document.getElementById('spotlight');
    if (!spotlight) {
      spotlight = document.createElement('div');
      spotlight.id = 'spotlight';
      spotlight.setAttribute('aria-hidden', 'true');
      document.body.prepend(spotlight);
    }
    let pointerX = 0;
    let pointerY = 0;
    let framePending = false;
    const paintSpotlight = () => {
      spotlight.style.setProperty('--mouse-x', pointerX + 'px');
      spotlight.style.setProperty('--mouse-y', pointerY + 'px');
      spotlight.classList.add('is-visible');
      framePending = false;
    };
    window.addEventListener('mousemove', (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!framePending) {
        framePending = true;
        window.requestAnimationFrame(paintSpotlight);
      }
    }, { passive: true });
    window.addEventListener('mouseout', (event) => {
      if (!event.relatedTarget && !event.toElement) spotlight.classList.remove('is-visible');
    }, { passive: true });
    window.addEventListener('blur', () => spotlight.classList.remove('is-visible'));
  }
    // Visitor counter is managed centrally by the Spectrum article loader.
})();
