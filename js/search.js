(function () {
  var toggle = document.getElementById('search-toggle');
  var overlay = document.getElementById('search-popover');
  var anchor = toggle ? toggle.closest('.search-anchor') : null;
  var input = document.getElementById('site-search');
  if (!toggle || !overlay || !anchor || !input) return;
  var clearBtn = document.getElementById('search-clear');
  var closePopoverBtn = document.getElementById('search-close');
  var resultsBox = document.getElementById('search-results');
  var statusEl = document.getElementById('search-status');
  var timer = null;
  var indexReady = false;
  var indexLoading = false;
  var docs = null;
  var selected = -1;
  var currentHits = [];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function countOccurrences(haystack, needle) {
    if (!needle) return 0;
    var count = 0, pos = 0;
    while ((pos = haystack.indexOf(needle, pos)) !== -1) {
      count++;
      pos += needle.length;
    }
    return count;
  }

  function searchable(d) {
    if (!d.sl) {
      var extra = d.s === 'practice' ? ' лр' : (d.s === 'control' ? ' кр' : (d.s === 'extra' ? ' материалы' : ' лекция'));
      d.sl = (d.t + ' ' + d.n + extra + ' №' + d.n).toLowerCase();
    }
    return d.sl;
  }

  function targetOf(d) {
    if (d.s === 'theory') return 'theory-reader.html#lec-' + d.i;
    if (d.s === 'practice') return 'practice-reader.html#lec-' + d.i;
    if (d.s === 'extra') return 'extra-reader.html#doc-' + d.i;
    return 'control-reader.html#exam';
  }

  function sectionLabel(s) {
    if (s === 'theory') return 'Теория';
    if (s === 'practice') return 'Лабораторные';
    if (s === 'extra') return 'Материалы';
    return 'Контроль';
  }

  function sectionClass(s) {
    if (s === 'theory') return 'badge-theory';
    if (s === 'practice') return 'badge-practice';
    if (s === 'extra') return 'badge-extra';
    return 'badge-control';
  }

  function loadIndex(done) {
    if (indexReady) { done(true); return; }
    if (indexLoading) {
      var iv = setInterval(function () {
        if (indexReady) { clearInterval(iv); done(true); }
      }, 50);
      return;
    }
    indexLoading = true;
    var s = document.createElement('script');
    s.src = 'js/search-index.js';
    s.onload = function () {
      indexReady = true;
      indexLoading = false;
      docs = window.SEARCH_INDEX || [];
      done(true);
    };
    s.onerror = function () {
      indexLoading = false;
      statusEl.textContent = 'Не удалось загрузить поисковый индекс.';
      done(false);
    };
    document.head.appendChild(s);
  }

  function positionPopover() {
    var r = toggle.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var width = Math.min(420, vw - 16);
    var left = r.right - width;
    if (left < 8) left = 8;
    if (left + width > vw - 8) left = vw - width - 8;
    overlay.style.left = left + 'px';
    overlay.style.width = width + 'px';
    overlay.style.top = (r.bottom + 10) + 'px';
  }

  function openSearch() {
    overlay.hidden = false;
    positionPopover();
    toggle.setAttribute('aria-expanded', 'true');
    input.setAttribute('aria-expanded', 'true');
    loadIndex(function () {});
    setTimeout(function () { input.focus(); }, 30);
  }

  function closeSearch() {
    overlay.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-expanded', 'false');
    toggle.focus();
  }

  function highlightTitle(d, words) {
    var escapedWords = words.map(function (w) { return escapeRegExp(esc(w)); });
    return esc(d.t).replace(new RegExp('(' + escapedWords.join('|') + ')', 'gi'), '<mark>$1</mark>');
  }

  function runSearch() {
    var q = input.value.trim();
    selected = -1;
    currentHits = [];
    if (q.length < 1) {
      resultsBox.hidden = true;
      resultsBox.innerHTML = '';
      statusEl.textContent = '';
      clearBtn.hidden = !q;
      return;
    }
    clearBtn.hidden = false;
    loadIndex(function (ok) {
      if (!ok) return;
      var words = q.toLowerCase().split(/\s+/).filter(Boolean);
      var phrase = words.join(' ');
      var hits = [];
      for (var i = 0; i < docs.length; i++) {
        var d = docs[i];
        var sl = searchable(d);
        var all = true;
        for (var w = 0; w < words.length; w++) {
          if (sl.indexOf(words[w]) === -1) { all = false; break; }
        }
        if (!all) continue;
        var count = countOccurrences(sl, phrase) * 10;
        for (var w2 = 0; w2 < words.length; w2++) {
          count += countOccurrences(sl, words[w2]);
        }
        hits.push({ d: d, score: count });
      }
      hits.sort(function (a, b) { return b.score - a.score; });
      currentHits = hits.slice(0, 24);
      renderHits(q, words);
    });
  }

  function renderHits(q, words) {
    if (!currentHits.length) {
      resultsBox.hidden = true;
      resultsBox.innerHTML = '';
      statusEl.textContent = 'Ничего не найдено по запросу «' + q + '»';
      return;
    }
    statusEl.textContent = 'Найдено: ' + currentHits.length + (currentHits.length >= 24 ? ' (показаны первые 24)' : '');
    resultsBox.innerHTML = currentHits.map(function (hit, i) {
      var d = hit.d;
      return '<button type="button" class="search-result" role="option" id="search-result-' + i + '" data-href="' + esc(targetOf(d)) + '" aria-selected="false">'
        + '<span class="search-result__badge ' + sectionClass(d.s) + '">' + sectionLabel(d.s) + '</span>'
        + '<span class="search-result__body">'
        + '<span class="search-result__title">' + highlightTitle(d, words) + '</span>'
        + '</span></button>';
    }).join('');
    resultsBox.hidden = false;
    Array.prototype.forEach.call(resultsBox.querySelectorAll('.search-result'), function (el, i) {
      el.addEventListener('click', function () {
        window.location.href = el.getAttribute('data-href');
      });
      el.addEventListener('mousemove', function () {
        setSelected(i);
      });
    });
  }

  function setSelected(i) {
    selected = i;
    var items = resultsBox.querySelectorAll('.search-result');
    Array.prototype.forEach.call(items, function (el, j) {
      el.classList.toggle('is-active', i === j);
      el.setAttribute('aria-selected', i === j ? 'true' : 'false');
    });
    if (i >= 0 && items[i]) items[i].scrollIntoView({ block: 'nearest' });
  }

  toggle.addEventListener('click', function () {
    if (overlay.hidden) openSearch(); else closeSearch();
  });

  window.addEventListener('resize', function () {
    if (!overlay.hidden) positionPopover();
  });

  document.addEventListener('click', function (e) {
    if (!overlay.hidden && !anchor.contains(e.target)) closeSearch();
  });

  document.addEventListener('keydown', function (e) {
    if (overlay.hidden) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
    }
  });

  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(runSearch, 120);
  });

  input.addEventListener('focus', function () {
    if (indexReady) return;
    loadIndex(function () {});
  });

  input.addEventListener('keydown', function (e) {
    var items = resultsBox.querySelectorAll('.search-result');
    if (e.key === 'ArrowDown' && items.length) {
      e.preventDefault();
      setSelected(selected < items.length - 1 ? selected + 1 : 0);
    } else if (e.key === 'ArrowUp' && items.length) {
      e.preventDefault();
      setSelected(selected > 0 ? selected - 1 : items.length - 1);
    } else if (e.key === 'Enter') {
      var target = selected >= 0 && items[selected] ? items[selected] : items[0];
      if (target) {
        e.preventDefault();
        window.location.href = target.getAttribute('data-href');
      }
    }
  });

  clearBtn.addEventListener('click', function () {
    input.value = '';
    resultsBox.hidden = true;
    resultsBox.innerHTML = '';
    statusEl.textContent = '';
    clearBtn.hidden = true;
    input.focus();
  });

  if (closePopoverBtn) closePopoverBtn.addEventListener('click', function () {
    closeSearch();
  });
})();
