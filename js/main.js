
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('main-nav');
  var headerNav = document.querySelector('.header__nav');

  if (!toggle || !nav || !headerNav) return;

  toggle.addEventListener('click', function () {
    var opened = headerNav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', opened ? 'true' : 'false');
    toggle.setAttribute('aria-label', opened ? 'Закрыть меню' : 'Открыть меню');
  });

  nav.addEventListener('click', function (event) {
    if (event.target.closest('.nav__link')) {
      headerNav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Открыть меню');
    }
  });

  var mq = window.matchMedia('(min-width: 769px)');
  var reset = function () {
    if (mq.matches) {
      headerNav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  };
  mq.addEventListener ? mq.addEventListener('change', reset) : mq.addListener(reset);
})();

(function () {
  var KEY = 'eumk-theme';
  var btn = document.getElementById('theme-toggle');
  var root = document.body;
  if (!btn) return;

  var ico = btn.querySelector('.tool-btn__ico');
  var busy = false;

  function apply(theme) {
    var dark = theme === 'dark';
    root.classList.toggle('theme-dark', dark);
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    btn.setAttribute('title', dark ? 'Светлая тема' : 'Тёмная тема');
    if (ico) {
      ico.classList.toggle('tool-btn__ico--moon', !dark);
      ico.classList.toggle('tool-btn__ico--sun', dark);
    }

    return dark ? '#0d1122' : '#d7e0f7';
  }

  var saved;
  try { saved = localStorage.getItem(KEY); } catch (e) { saved = null; }
  if (!saved) {
    saved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  apply(saved);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateSwitch(next) {

    if (reduce || root.classList.contains('a11y')) { apply(next); return; }

    busy = true;

    root.classList.add('theme-anim');

    var r = btn.getBoundingClientRect();
    var flash = document.createElement('div');
    flash.className = 'theme-flash';
    flash.style.setProperty('--theme-x', (r.left + r.width / 2) + 'px');
    flash.style.setProperty('--theme-y', (r.top + r.height / 2) + 'px');
    document.body.appendChild(flash);

    apply(next);

    if (ico) {
      ico.classList.remove('is-switching');
      void ico.offsetWidth;
      ico.classList.add('is-switching');
    }

    var clean = function () {
      if (flash.parentNode) flash.parentNode.removeChild(flash);
      if (ico) ico.classList.remove('is-switching');
      root.classList.remove('theme-anim');
      busy = false;
    };
    window.setTimeout(clean, 700);
  }

  btn.addEventListener('click', function () {
    if (busy) return;
    var next = root.classList.contains('theme-dark') ? 'light' : 'dark';
    try { localStorage.setItem(KEY, next); } catch (e) {}
    animateSwitch(next);
  });
})();

(function () {
  var KEY = 'eumk-a11y';
  var btn = document.getElementById('a11y-toggle');
  var root = document.body;
  if (!btn) return;

  var txt = btn.querySelector('.tool-btn__txt');

  function apply(on) {
    root.classList.toggle('a11y', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('title', on ? 'Обычная версия' : 'Версия для слабовидящих');
    if (txt) txt.textContent = on ? 'Обычная версия' : 'Для слабовидящих';
  }

  var saved;
  try { saved = localStorage.getItem(KEY) === '1'; } catch (e) { saved = false; }
  apply(saved);

  btn.addEventListener('click', function () {
    var on = !root.classList.contains('a11y');
    apply(on);
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
  });
})();

(function () {
  var buttons = document.querySelectorAll('.section-btn');
  if (!buttons.length) return;

  var list = Array.prototype.slice.call(buttons);
  var sectionsWrap = document.querySelector('.sections');

  function layout() {
    var activeIndex = -1;
    list.forEach(function (btn, i) {
      if (btn.classList.contains('is-open')) activeIndex = i;
    });

    var anyOpen = activeIndex !== -1;
    if (sectionsWrap) sectionsWrap.classList.toggle('has-open', anyOpen);

    list.forEach(function (btn, i) {
      var section = btn.closest('.section');
      if (!section) return;
      section.classList.toggle('is-open', i === activeIndex);
      section.classList.toggle('is-after', anyOpen && i > activeIndex);
    });
  }

  function measure(box) {
    var inner = box.querySelector('.section-docs__inner');
    if (!inner) return 0;

    var cs = window.getComputedStyle(box);
    var pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    var border = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    var innerCs = window.getComputedStyle(inner);
    var innerPad = parseFloat(innerCs.paddingTop) + parseFloat(innerCs.paddingBottom);

    var contentH = inner.scrollHeight;
    return Math.ceil(contentH + pad + border + 1);
  }

  function close(btn) {
    var box = document.getElementById(btn.getAttribute('aria-controls'));
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    if (box) {

      box.style.maxHeight = measure(box) + 'px';
      void box.offsetHeight;
      box.classList.remove('is-open');
      box.style.maxHeight = '0px';
    }
  }

  function open(btn) {
    var box = document.getElementById(btn.getAttribute('aria-controls'));
    btn.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    if (box) {

      box.style.maxHeight = '0px';
      void box.offsetHeight;

      box.classList.add('is-open');
      box.style.maxHeight = measure(box) + 'px';
    }
  }

  list.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var isOpen = btn.classList.contains('is-open');

      list.forEach(function (other) {
        if (other !== btn) close(other);
      });

      if (isOpen) {
        close(btn);
      } else {
        open(btn);
      }

      layout();
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    var had = false;
    list.forEach(function (btn) {
      if (btn.classList.contains('is-open')) { close(btn); had = true; }
    });
    if (had) layout();
  });
})();
