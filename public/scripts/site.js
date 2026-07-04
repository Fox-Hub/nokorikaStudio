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
    updateDaysCounter(lang);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
  }

  function setupReveal() {
    var targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach(function (el) { observer.observe(el); });
  }

  function setupScreenshotRail() {
    var rail = document.querySelector('[data-screenshot-rail]');
    if (!rail) return;
    var dots = rail.parentElement.querySelectorAll('[data-rail-dot]');
    if (!dots.length) return;

    var cards = rail.querySelectorAll('[data-rail-card]');

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        var card = cards[i];
        if (card) {
          rail.scrollTo({ left: card.offsetLeft - 24, behavior: 'smooth' });
        }
      });
    });

    if (!('IntersectionObserver' in window)) return;
    var railObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var idx = Array.prototype.indexOf.call(cards, entry.target);
          if (idx === -1) return;
          if (entry.isIntersecting) {
            dots.forEach(function (d) { d.classList.remove('is-active'); });
            dots[idx]?.classList.add('is-active');
          }
        });
      },
      { root: rail, threshold: 0.6 }
    );
    cards.forEach(function (c) { railObserver.observe(c); });
  }

  function setupScrollProgress() {
    var fill = document.querySelector('.scroll-progress-fill');
    if (!fill) return;
    function update() {
      var doc = document.documentElement;
      var scrollTop = doc.scrollTop || document.body.scrollTop;
      var scrollHeight = (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight;
      var pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      fill.style.width = pct + '%';
    }
    document.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  function setupTilt() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia && window.matchMedia('(hover: none)').matches) return; // タッチ端末では無効化

    var targets = document.querySelectorAll('[data-tilt]');
    targets.forEach(function (el) {
      var maxTilt = 6;
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        var rotateX = (-y * maxTilt).toFixed(2);
        var rotateY = (x * maxTilt).toFixed(2);
        el.style.transform = 'perspective(700px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale(1.015)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)';
      });
    });
  }

  function updateDaysCounter(lang) {
    var el = document.getElementById('days-counter');
    if (!el) return;
    var startAttr = el.getAttribute('data-start');
    if (!startAttr) return;
    var start = new Date(startAttr + 'T00:00:00');
    var now = new Date();
    var diffDays = Math.max(1, Math.floor((now - start) / 86400000) + 1);
    var currentLang = lang || document.documentElement.getAttribute('data-lang') || 'ja';
    el.textContent = currentLang === 'en'
      ? 'Day ' + diffDays + ' of development'
      : '開発 ' + diffDays + '日目';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var lang = document.documentElement.getAttribute('data-lang') || 'ja';
    applyTitleDesc(lang);
    updateDaysCounter(lang);

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

    setupReveal();
    setupScreenshotRail();
    setupScrollProgress();
    setupTilt();
  });
})();
