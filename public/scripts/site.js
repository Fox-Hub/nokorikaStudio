(function () {
  function applyTitleDesc(lang) {
    var titleEl = document.querySelector('title');
    if (titleEl) {
      var v = lang === 'en' ? titleEl.dataset.en : titleEl.dataset.ja;
      if (v) titleEl.textContent = v;
    }
    var descEl = document.querySelector('meta[name="description"]');
    if (descEl) {
      var d = lang === 'en' ? descEl.dataset.en : descEl.dataset.ja;
      if (d) descEl.setAttribute('content', d);
    }
  }

  function setLang(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang);
    try { localStorage.setItem('lang', lang); } catch (e) {}
    applyTitleDesc(lang);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    var lang = document.documentElement.getAttribute('data-lang') || 'ja';
    applyTitleDesc(lang);

    var themeBtn = document.getElementById('theme-toggle');
    var langBtn = document.getElementById('lang-toggle');

    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme') || 'light';
        setTheme(current === 'dark' ? 'light' : 'dark');
      });
    }

    if (langBtn) {
      langBtn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-lang') || 'ja';
        setLang(current === 'en' ? 'ja' : 'en');
      });
    }
  });
})();
