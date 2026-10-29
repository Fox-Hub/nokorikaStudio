/**
 * 営業日計算（ブラウザ・Node 共用の純粋関数）
 *
 * ルール:
 * - 期間カウント: 開始日・終了日を両方含む
 * - N営業日後: 起算日は含めず、翌営業日から数える（N=0 は起算日）
 * - 日付は YYYY-MM-DD のローカル日付として扱う
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** @param {string} iso */
export function parseISODate(iso) {
  if (!DATE_RE.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

/** @param {Date} date */
export function formatISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** @param {Date} date */
export function addDays(date, n) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
  return next;
}

/**
 * @param {Date} date
 * @param {{
 *   excludeWeekends?: boolean,
 *   excludeHolidays?: boolean,
 *   holidaySet?: Set<string>,
 *   extraOffSet?: Set<string>,
 * }} options
 */
export function isNonBusinessDay(date, options = {}) {
  const {
    excludeWeekends = true,
    excludeHolidays = true,
    holidaySet = new Set(),
    extraOffSet = new Set(),
  } = options;

  const iso = formatISODate(date);
  if (extraOffSet.has(iso)) return true;

  if (excludeWeekends) {
    const day = date.getDay(); // 0=Sun … 6=Sat
    if (day === 0 || day === 6) return true;
  }

  if (excludeHolidays && holidaySet.has(iso)) return true;

  return false;
}

/**
 * 内訳用の分類。計算上の休業判定とは別に、祝日を優先して見せる
 * （土日と重なる祝日は「祝日」として数える）。
 * @returns {'business' | 'weekend' | 'holiday' | 'custom'}
 */
export function classifyDay(date, options = {}) {
  const {
    excludeWeekends = true,
    excludeHolidays = true,
    holidaySet = new Set(),
    extraOffSet = new Set(),
  } = options;

  const iso = formatISODate(date);
  if (extraOffSet.has(iso)) return 'custom';
  if (excludeHolidays && holidaySet.has(iso)) return 'holiday';
  if (excludeWeekends) {
    const day = date.getDay();
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

/**
 * @param {string} startISO
 * @param {string} endISO
 * @param {object} options
 * @returns {{ count: number, start: string, end: string, swapped: boolean, breakdown: object } | { error: string }}
 */
export function countBusinessDays(startISO, endISO, options = {}) {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  if (!start || !end) return { error: 'invalid_date' };

  let a = start;
  let b = end;
  let swapped = false;
  if (a.getTime() > b.getTime()) {
    a = end;
    b = start;
    swapped = true;
  }

  const breakdown = emptyBreakdown();
  let cursor = a;
  while (cursor.getTime() <= b.getTime()) {
    breakdown.calendarDays += 1;
    const kind = classifyDay(cursor, options);
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
    swapped,
    breakdown,
  };
}

/**
 * @param {string} startISO
 * @param {number} n
 * @param {object} options
 * @returns {{ date: string, n: number, breakdown: object } | { error: string }}
 */
export function addBusinessDays(startISO, n, options = {}) {
  const start = parseISODate(startISO);
  if (!start) return { error: 'invalid_date' };
  if (!Number.isInteger(n) || n < 0) return { error: 'invalid_n' };

  if (n === 0) {
    return { date: formatISODate(start), n: 0, breakdown: emptyBreakdown() };
  }

  const breakdown = emptyBreakdown();
  let remaining = n;
  let cursor = start;
  while (remaining > 0) {
    cursor = addDays(cursor, 1);
    breakdown.calendarDays += 1;
    const kind = classifyDay(cursor, options);
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

  return { date: formatISODate(cursor), n, breakdown };
}
