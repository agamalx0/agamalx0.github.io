(() => {
  const root = document.documentElement;
  const key = 'theme';
  let stored = null;
  try { stored = localStorage.getItem(key); } catch (_) {}
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const applyTheme = (theme) => {
    root.classList.toggle('dark', theme === 'dark');
    const button = document.getElementById('theme-toggle');
    if (button) {
      button.textContent = theme === 'dark' ? 'MODE: DARK' : 'MODE: LIGHT';
      button.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
      button.setAttribute('aria-pressed', String(theme === 'dark'));
    }
    try { localStorage.setItem(key, theme); } catch (_) {}
  };
  applyTheme(stored || (root.classList.contains('dark') || prefersDark ? 'dark' : 'light'));
  let button = document.getElementById('theme-toggle');
  const nav = document.querySelector('.topbar .nav');
  if (!button && nav) {
    button = document.createElement('button');
    button.type = 'button';
    button.id = 'theme-toggle';
    button.className = 'theme-toggle';
    button.textContent = 'MODE: DARK';
    const back = nav.querySelector('.back');
    if (back) back.insertAdjacentElement('afterend', button);
    else nav.appendChild(button);
  }
  if (button) {
    button.addEventListener('click', () => applyTheme(root.classList.contains('dark') ? 'light' : 'dark'));
    applyTheme(root.classList.contains('dark') ? 'dark' : 'light');
  }
    // Interactive cursor spotlight
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
})();