// Applies the saved colour theme and text size before the first paint, so a
// dark-mode visitor never sees a flash of the light page. Kept as a file
// rather than an inline script so the site can forbid inline scripts in its
// security policy.
try {
  var prefs = JSON.parse(localStorage.getItem('exitpath:prefs') || '{}')
  if (prefs.theme === 'light' || prefs.theme === 'dark') document.documentElement.dataset.theme = prefs.theme
  if (prefs.textSize === 'large') document.documentElement.dataset.text = 'large'
} catch {
  // Storage is unavailable: follow the system setting.
}
