(() => {
  const root = document.documentElement;
  const key = 'ag-portfolio-theme';
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
})();