export function pad2(n) {
  return String(n).padStart(2, "0");
}

// clave local YYYY-MM-DD
export function localDayKey(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

export function monthLabel(d) {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function timeLabel(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

// Lunes como primer día (0..6)
export function weekDayMon0(date) {
  const js = date.getDay(); // 0 dom ... 6 sáb
  return (js + 6) % 7; // dom->6, lun->0...
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function buildMonthGrid(monthDate) {
  const first = startOfMonth(monthDate);
  const offset = weekDayMon0(first); // cuántos días “antes” para alinear lunes
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - offset);

  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

/**
 * Returns only the days belonging to `monthDate`'s month + the weekday
 * offset of day 1 (0..6, Monday-start). The caller renders the first
 * day with `grid-column-start: offset + 1` so leading slots stay empty
 * instead of filling with days from the previous month.
 */
export function buildCurrentMonthDays(monthDate) {
  const first = startOfMonth(monthDate);
  const startOffset = weekDayMon0(first);
  const year = first.getFullYear();
  const monthIndex = first.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, monthIndex, d));
  }
  return { days, startOffset };
}
