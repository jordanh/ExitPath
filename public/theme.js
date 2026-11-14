// Applies the saved colour theme before the first paint, so a dark-mode
// visitor never sees a flash of the light page. Kept as a file rather than an
// inline script so the site can forbid inline scripts in its security policy.
try {
  var theme = JSON.parse(localStorage.getItem('exitpath:prefs') || '{}').theme
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme
} catch {
  // Storage is unavailable: follow the system setting.
}
