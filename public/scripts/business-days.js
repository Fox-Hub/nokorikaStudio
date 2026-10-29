/**
 * 営業日計算ツール UI
 * 祝日リストはページ内 #bd-holidays (application/json) から読み込む。
 * 計算ルールは src/lib/businessDays.js と同一。
 */
(function () {
  'use strict';

  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  function parseISODate(iso) {
    if (!DATE_RE.test(iso)) return null;
    var parts = iso.split('-').map(Number);
    var y = parts[0];
    var m = parts[1];
    var d = parts[2];
    var dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return dt;
  }

  function formatISODate(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function addDays(date, n) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
  }

  function isNonBusinessDay(date, options) {
    var iso = formatISODate(date);
    if (options.extraOffSet.has(iso)) return true;
    if (options.excludeWeekends) {
      var day = date.getDay();
      if (day === 0 || day === 6) return true;
    }
    if (options.excludeHolidays && options.holidaySet.has(iso)) return true;
    return false;
  }

  function classifyDay(date, options) {
    var iso = formatISODate(date);
    if (options.extraOffSet.has(iso)) return 'custom';
    if (options.excludeHolidays && options.holidaySet.has(iso)) return 'holiday';
    if (options.excludeWeekends) {
      var day = date.getDay();
      if (day === 0 || day === 6) return 'weekend';
    }
    return 'business';
  }

  function emptyBreakdown() {
    return {
      calendarDays: 0,
      businessDays: 0,
      weekendDays: 0,
      holidayDays: 0,
      customOffDays: 0,
      holidays: [],
    };
  }

  function countBusinessDays(startISO, endISO, options) {
    var start = parseISODate(startISO);
    var end = parseISODate(endISO);
    if (!start || !end) return { error: 'invalid_date' };

    var a = start;
    var b = end;
    var swapped = false;
    if (a.getTime() > b.getTime()) {
      a = end;
      b = start;
      swapped = true;
    }

    var breakdown = emptyBreakdown();
    var cursor = a;
    while (cursor.getTime() <= b.getTime()) {
      breakdown.calendarDays += 1;
      var kind = classifyDay(cursor, options);
      if (kind === 'business') breakdown.businessDays += 1;
      else if (kind === 'weekend') breakdown.weekendDays += 1;
      else if (kind === 'holiday') {
        breakdown.holidayDays += 1;
        breakdown.holidays.push(formatISODate(cursor));
      } else if (kind === 'custom') breakdown.customOffDays += 1;
      cursor = addDays(cursor, 1);
    }

    return {
      count: breakdown.businessDays,
      start: formatISODate(a),
      end: formatISODate(b),
      swapped: swapped,
      breakdown: breakdown,
    };
  }

  function addBusinessDays(startISO, n, options) {
    var start = parseISODate(startISO);
    if (!start) return { error: 'invalid_date' };
    if (!Number.isInteger(n) || n < 0) return { error: 'invalid_n' };
    if (n === 0) return { date: formatISODate(start), n: 0, breakdown: emptyBreakdown() };

    var breakdown = emptyBreakdown();
    var remaining = n;
    var cursor = start;
    while (remaining > 0) {
      cursor = addDays(cursor, 1);
      breakdown.calendarDays += 1;
      var kind = classifyDay(cursor, options);
      if (kind === 'weekend') breakdown.weekendDays += 1;
      else if (kind === 'holiday') {
        breakdown.holidayDays += 1;
        breakdown.holidays.push(formatISODate(cursor));
      } else if (kind === 'custom') breakdown.customOffDays += 1;

      if (!isNonBusinessDay(cursor, options)) {
        remaining -= 1;
        breakdown.businessDays += 1;
      }
    }
    return { date: formatISODate(cursor), n: n, breakdown: breakdown };
  }

  function todayISO() {
    return formatISODate(new Date());
  }

  function loadHolidays() {
    var el = document.getElementById('bd-holidays');
    if (!el) return new Set();
    try {
      var list = JSON.parse(el.textContent || '[]');
      return new Set(Array.isArray(list) ? list : []);
    } catch (e) {
      return new Set();
    }
  }

  function t(ja, en) {
    var lang = document.documentElement.getAttribute('data-lang') || 'ja';
    return lang === 'en' ? en : ja;
  }

  function init() {
    var root = document.getElementById('bd-tool');
    if (!root) return;

    var holidaySet = loadHolidays();
    var extraOff = new Set();

    var modeRadios = root.querySelectorAll('input[name="bd-mode"]');
    var startInput = root.querySelector('#bd-start');
    var endInput = root.querySelector('#bd-end');
    var nInput = root.querySelector('#bd-n');
    var weekendsCb = root.querySelector('#bd-weekends');
    var holidaysCb = root.querySelector('#bd-holidays-opt');
    var extraInput = root.querySelector('#bd-extra-date');
    var extraAdd = root.querySelector('#bd-extra-add');
    var extraList = root.querySelector('#bd-extra-list');
    var extraCountEl = root.querySelector('#bd-extra-count');
    var extraDetails = root.querySelector('#bd-extra-details');
    var resultEl = root.querySelector('#bd-result');
    var noteEl = root.querySelector('#bd-result-note');
    var breakdownEl = root.querySelector('#bd-breakdown');
    var breakdownListEl = root.querySelector('#bd-breakdown-list');
    var breakdownHolidaysEl = root.querySelector('#bd-breakdown-holidays');
    var coverageWarnEl = root.querySelector('#bd-coverage-warn');
    var copyBtn = root.querySelector('#bd-copy');
    var rangeFields = root.querySelector('[data-bd-range]');
    var nFields = root.querySelector('[data-bd-n]');
    var presetsRange = root.querySelector('[data-bd-presets-range]');
    var presetsAfter = root.querySelector('[data-bd-presets-after]');
    var startLabel = root.querySelector('#bd-start-label');
    var holidayYearStart = parseInt(root.dataset.holidayStart || '2024', 10);
    var holidayYearEnd = parseInt(root.dataset.holidayEnd || '2029', 10);

    if (startInput && !startInput.value) startInput.value = todayISO();
    if (endInput && !endInput.value) {
      var end = addDays(new Date(), 14);
      endInput.value = formatISODate(end);
    }
    if (nInput && !nInput.value) nInput.value = '5';

    function currentMode() {
      var checked = root.querySelector('input[name="bd-mode"]:checked');
      return checked ? checked.value : 'range';
    }

    function endOfMonth(date) {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }

    function endOfQuarter(date) {
      var q = Math.floor(date.getMonth() / 3);
      return new Date(date.getFullYear(), q * 3 + 3, 0);
    }

    function applyPreset(name) {
      var today = new Date();
      var todayStr = formatISODate(today);

      if (name === 'range-2w') {
        if (startInput) startInput.value = todayStr;
        if (endInput) endInput.value = formatISODate(addDays(today, 14));
      } else if (name === 'range-month') {
        if (startInput) startInput.value = todayStr;
        if (endInput) endInput.value = formatISODate(endOfMonth(today));
      } else if (name === 'range-quarter') {
        if (startInput) startInput.value = todayStr;
        if (endInput) endInput.value = formatISODate(endOfQuarter(today));
      } else if (name === 'after-5' || name === 'after-10' || name === 'after-20') {
        if (startInput) startInput.value = todayStr;
        if (nInput) nInput.value = name.split('-')[1];
      }

      calculate();
    }

    function yearOf(iso) {
      if (!iso || iso.length < 4) return null;
      var y = parseInt(iso.slice(0, 4), 10);
      return Number.isFinite(y) ? y : null;
    }

    function outsideHolidayCoverage(dates) {
      if (!(holidaysCb && holidaysCb.checked)) return false;
      for (var i = 0; i < dates.length; i += 1) {
        var y = yearOf(dates[i]);
        if (y == null) continue;
        if (y < holidayYearStart || y > holidayYearEnd) return true;
      }
      return false;
    }

    function setCoverageWarn(dates) {
      if (!coverageWarnEl) return;
      if (!outsideHolidayCoverage(dates)) {
        coverageWarnEl.hidden = true;
        coverageWarnEl.textContent = '';
        return;
      }
      coverageWarnEl.hidden = false;
      coverageWarnEl.textContent = t(
        '入力日が祝日データの対応年（' +
          holidayYearStart +
          '–' +
          holidayYearEnd +
          '）外です。この期間は土日と任意休業日のみで計算しています。',
        'A date is outside holiday coverage (' +
          holidayYearStart +
          '–' +
          holidayYearEnd +
          '). Weekends and custom off days are still applied; holidays may be incomplete.'
      );
    }

    function updateStartLabel(mode) {
      if (!startLabel) return;
      var ja = mode === 'after' ? startLabel.dataset.afterJa : startLabel.dataset.rangeJa;
      var en = mode === 'after' ? startLabel.dataset.afterEn : startLabel.dataset.rangeEn;
      startLabel.innerHTML =
        '<span class="i18n" data-lang="ja">' +
        (ja || '開始日') +
        '</span><span class="i18n" data-lang="en">' +
        (en || 'Start date') +
        '</span>';
    }

    function syncModeUI() {
      var mode = currentMode();
      root.setAttribute('data-mode', mode);
      if (rangeFields) rangeFields.hidden = mode !== 'range';
      if (nFields) nFields.hidden = mode !== 'after';
      if (presetsRange) presetsRange.hidden = mode !== 'range';
      if (presetsAfter) presetsAfter.hidden = mode !== 'after';
      updateStartLabel(mode);
      calculate();
    }

    function options() {
      return {
        excludeWeekends: !!(weekendsCb && weekendsCb.checked),
        excludeHolidays: !!(holidaysCb && holidaysCb.checked),
        holidaySet: holidaySet,
        extraOffSet: extraOff,
      };
    }

    function updateExtraCount() {
      if (!extraCountEl) return;
      var n = extraOff.size;
      if (n === 0) {
        extraCountEl.hidden = true;
        extraCountEl.textContent = '';
        return;
      }
      extraCountEl.hidden = false;
      extraCountEl.textContent = t(n + '件', String(n));
    }

    function renderExtra() {
      if (!extraList) return;
      extraList.innerHTML = '';
      updateExtraCount();
      var sorted = Array.from(extraOff).sort();
      if (!sorted.length) {
        var empty = document.createElement('li');
        empty.className = 'bd-extra-empty';
        empty.textContent = t('任意の休業日はまだありません', 'No custom off days yet');
        extraList.appendChild(empty);
        return;
      }
      sorted.forEach(function (iso) {
        var li = document.createElement('li');
        var label = document.createElement('span');
        label.className = 'mono';
        label.textContent = iso;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bd-chip-remove';
        btn.setAttribute('aria-label', t(iso + ' を削除', 'Remove ' + iso));
        btn.textContent = '×';
        btn.addEventListener('click', function () {
          extraOff.delete(iso);
          renderExtra();
          calculate();
        });
        li.appendChild(label);
        li.appendChild(btn);
        extraList.appendChild(li);
      });
    }

    function clearBreakdown() {
      if (breakdownEl) breakdownEl.hidden = true;
      if (breakdownListEl) breakdownListEl.innerHTML = '';
      if (breakdownHolidaysEl) {
        breakdownHolidaysEl.hidden = true;
        breakdownHolidaysEl.textContent = '';
      }
    }

    function addBreakdownItem(label, value) {
      if (!breakdownListEl || value <= 0) return;
      var li = document.createElement('li');
      var name = document.createElement('span');
      name.textContent = label;
      var val = document.createElement('span');
      val.className = 'mono';
      val.textContent = String(value);
      li.appendChild(name);
      li.appendChild(val);
      breakdownListEl.appendChild(li);
    }

    function renderBreakdown(breakdown, mode) {
      if (!breakdownEl || !breakdownListEl || !breakdown) {
        clearBreakdown();
        return;
      }

      breakdownListEl.innerHTML = '';

      if (mode === 'range') {
        addBreakdownItem(t('カレンダー日数', 'Calendar days'), breakdown.calendarDays);
        addBreakdownItem(t('営業日', 'Business days'), breakdown.businessDays);
        addBreakdownItem(t('土日', 'Weekends'), breakdown.weekendDays);
        addBreakdownItem(t('祝日', 'Holidays'), breakdown.holidayDays);
        addBreakdownItem(t('任意休業日', 'Custom off days'), breakdown.customOffDays);
      } else {
        addBreakdownItem(t('経過カレンダー日数', 'Calendar days spanned'), breakdown.calendarDays);
        addBreakdownItem(t('数えた営業日', 'Business days counted'), breakdown.businessDays);
        addBreakdownItem(t('スキップした土日', 'Weekends skipped'), breakdown.weekendDays);
        addBreakdownItem(t('スキップした祝日', 'Holidays skipped'), breakdown.holidayDays);
        addBreakdownItem(t('スキップした任意休業日', 'Custom days skipped'), breakdown.customOffDays);
      }

      if (breakdownHolidaysEl) {
        if (breakdown.holidays && breakdown.holidays.length) {
          var shown = breakdown.holidays.slice(0, 8);
          var more = breakdown.holidays.length - shown.length;
          var text = t('祝日: ', 'Holidays: ') + shown.join(', ');
          if (more > 0) text += t(' ほか' + more + '日', ' +' + more + ' more');
          breakdownHolidaysEl.textContent = text;
          breakdownHolidaysEl.hidden = false;
        } else {
          breakdownHolidaysEl.hidden = true;
          breakdownHolidaysEl.textContent = '';
        }
      }

      breakdownEl.hidden = breakdownListEl.children.length === 0;
    }

    function formatBreakdownCopy(breakdown, mode) {
      if (!breakdown) return '';
      if (mode === 'range') {
        return t(
          '内訳: 暦日' +
            breakdown.calendarDays +
            ' / 営業日' +
            breakdown.businessDays +
            ' / 土日' +
            breakdown.weekendDays +
            ' / 祝日' +
            breakdown.holidayDays +
            (breakdown.customOffDays ? ' / 任意' + breakdown.customOffDays : ''),
          'Breakdown: calendar ' +
            breakdown.calendarDays +
            ' / business ' +
            breakdown.businessDays +
            ' / weekends ' +
            breakdown.weekendDays +
            ' / holidays ' +
            breakdown.holidayDays +
            (breakdown.customOffDays ? ' / custom ' + breakdown.customOffDays : '')
        );
      }
      return t(
        '内訳: 経過' +
          breakdown.calendarDays +
          '日 / 土日' +
          breakdown.weekendDays +
          ' / 祝日' +
          breakdown.holidayDays +
          (breakdown.customOffDays ? ' / 任意' + breakdown.customOffDays : ''),
        'Breakdown: spanned ' +
          breakdown.calendarDays +
          'd / weekends ' +
          breakdown.weekendDays +
          ' / holidays ' +
          breakdown.holidayDays +
          (breakdown.customOffDays ? ' / custom ' + breakdown.customOffDays : '')
      );
    }

    function setResult(text, note, copyText, coverageDates, breakdown, mode) {
      if (resultEl) resultEl.textContent = text;
      if (noteEl) {
        noteEl.textContent = note || '';
        noteEl.hidden = !note;
      }
      if (copyBtn) {
        copyBtn.disabled = !copyText;
        copyBtn.dataset.copy = copyText || '';
      }
      if (breakdown) renderBreakdown(breakdown, mode || 'range');
      else clearBreakdown();
      setCoverageWarn(coverageDates || []);
    }

    function calculate() {
      var opts = options();
      var mode = currentMode();

      if (mode === 'range') {
        var start = startInput ? startInput.value : '';
        var end = endInput ? endInput.value : '';
        if (!start || !end) {
          setResult(t('開始日と終了日を入力してください', 'Enter start and end dates'), '', '', []);
          return;
        }
        var res = countBusinessDays(start, end, opts);
        if (res.error) {
          setResult(t('日付が正しくありません', 'Invalid date'), '', '', [start, end]);
          return;
        }
        var main = t(
          res.count + ' 営業日',
          res.count + (res.count === 1 ? ' business day' : ' business days')
        );
        var note = t(
          '期間の営業日数: ' + res.start + ' 〜 ' + res.end + '（両端含む）',
          'Business days in range: ' + res.start + ' – ' + res.end + ' (inclusive)'
        );
        if (res.swapped) {
          note += t(
            ' ※開始と終了を入れ替えて計算しました',
            ' ※ Start and end were swapped'
          );
        }
        var copy = t(
          res.count + '営業日（' + res.start + '〜' + res.end + '）\n' + formatBreakdownCopy(res.breakdown, 'range'),
          res.count + ' business days (' + res.start + ' – ' + res.end + ')\n' + formatBreakdownCopy(res.breakdown, 'range')
        );
        setResult(main, note, copy, [res.start, res.end], res.breakdown, 'range');
        return;
      }

      var base = startInput ? startInput.value : '';
      var n = nInput ? parseInt(nInput.value, 10) : NaN;
      if (!base) {
        setResult(t('起算日を入力してください', 'Enter a start date'), '', '', []);
        return;
      }
      if (!Number.isInteger(n) || n < 0) {
        setResult(t('N は 0 以上の整数で入力してください', 'Enter a whole number N ≥ 0'), '', '', [base]);
        return;
      }
      var after = addBusinessDays(base, n, opts);
      if (after.error) {
        setResult(t('入力を確認してください', 'Check your inputs'), '', '', [base]);
        return;
      }
      var mainAfter = after.date;
      var noteAfter =
        n === 0
          ? t('N=0 のため起算日そのものです', 'N=0 returns the start date itself')
          : t(
              'N営業日後: ' + base + ' から ' + n + ' 営業日後（起算日は含みません）',
              'N business days later: ' + n + ' after ' + base + ' (start excluded)'
            );
      var copyAfter =
        t(
          base + ' の ' + n + ' 営業日後は ' + after.date,
          n + ' business day(s) after ' + base + ' = ' + after.date
        ) +
        (n > 0 ? '\n' + formatBreakdownCopy(after.breakdown, 'after') : '');
      setResult(mainAfter, noteAfter, copyAfter, [base, after.date], n > 0 ? after.breakdown : null, 'after');
    }

    modeRadios.forEach(function (r) {
      r.addEventListener('change', syncModeUI);
    });
    [startInput, endInput, nInput, weekendsCb, holidaysCb].forEach(function (el) {
      if (!el) return;
      el.addEventListener('input', calculate);
      el.addEventListener('change', calculate);
    });

    root.querySelectorAll('[data-preset]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyPreset(btn.getAttribute('data-preset'));
      });
    });

    if (extraAdd && extraInput) {
      extraAdd.addEventListener('click', function () {
        var iso = extraInput.value;
        if (!parseISODate(iso)) return;
        extraOff.add(iso);
        extraInput.value = '';
        if (extraDetails) extraDetails.open = true;
        renderExtra();
        calculate();
      });
    }

    function restoreCopyLabel() {
      if (!copyBtn) return;
      copyBtn.innerHTML =
        '<span class="i18n" data-lang="ja">' +
        (copyBtn.dataset.labelJa || '結果をコピー') +
        '</span><span class="i18n" data-lang="en">' +
        (copyBtn.dataset.labelEn || 'Copy result') +
        '</span>';
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = copyBtn.dataset.copy || '';
        if (!text || !navigator.clipboard) return;
        navigator.clipboard.writeText(text).then(function () {
          copyBtn.innerHTML =
            '<span class="i18n" data-lang="ja">' +
            (copyBtn.dataset.copiedJa || 'コピーしました') +
            '</span><span class="i18n" data-lang="en">' +
            (copyBtn.dataset.copiedEn || 'Copied') +
            '</span>';
          setTimeout(restoreCopyLabel, 1500);
        });
      });
    }

    var langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
      langToggle.addEventListener('click', function () {
        setTimeout(function () {
          updateStartLabel(currentMode());
          renderExtra();
          calculate();
        }, 0);
      });
    }

    renderExtra();
    syncModeUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
