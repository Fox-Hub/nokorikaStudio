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

    var cards = rail.querySelectorAll('[data-rail-card]');

    if (dots.length) {
      dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () {
          var card = cards[i];
          if (card) {
            rail.scrollTo({ left: card.offsetLeft - 24, behavior: 'smooth' });
          }
        });
      });

      if ('IntersectionObserver' in window) {
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
    }

    // 矢印ボタン（前へ／次へ）: カード1枚分ずつスクロール
    var prevBtn = document.querySelector('[data-rail-prev]');
    var nextBtn = document.querySelector('[data-rail-next]');
    function step() {
      var first = cards[0];
      return first ? first.getBoundingClientRect().width + 20 : rail.clientWidth * 0.8;
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        rail.scrollBy({ left: -step(), behavior: 'smooth' });
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        rail.scrollBy({ left: step(), behavior: 'smooth' });
      });
    }

    // マウスホイール（縦スクロール）を横スクロールに変換する。
    // トラックパッドの横スワイプは元々ブラウザが処理するため、
    // ここでは主に「普通のマウスホイールしか無い」環境を助ける。
    rail.addEventListener(
      'wheel',
      function (e) {
        if (rail.scrollWidth <= rail.clientWidth) return; // スクロールの余地が無ければ何もしない
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // 既に横方向の入力ならブラウザに任せる
        e.preventDefault();
        rail.scrollLeft += e.deltaY;
      },
      { passive: false }
    );

    // クリック（タップ）＆ドラッグでのスクロールに対応
    var isDown = false;
    var startX = 0;
    var startScroll = 0;
    var moved = false;

    function onPointerDown(e) {
      isDown = true;
      moved = false;
      rail.classList.add('is-dragging');
      startX = e.pageX ?? e.touches?.[0]?.pageX ?? 0;
      startScroll = rail.scrollLeft;
    }
    function onPointerMove(e) {
      if (!isDown) return;
      var x = e.pageX ?? e.touches?.[0]?.pageX ?? 0;
      var delta = x - startX;
      if (Math.abs(delta) > 4) moved = true;
      rail.scrollLeft = startScroll - delta;
      if (e.cancelable) e.preventDefault();
    }
    function onPointerUp() {
      isDown = false;
      rail.classList.remove('is-dragging');
    }

    rail.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    // ドラッグ操作の直後だけ、内部リンクの誤クリックを防ぐ
    rail.addEventListener(
      'click',
      function (e) {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true
    );
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
