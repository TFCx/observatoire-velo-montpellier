// Temps du mandat 2020-2026, comparé à l'avancement des Vélolignes promises (ADR 0009).
// Les dates sont des jours de calendrier, sans heure ni fuseau : « aujourd'hui » ne doit pas dépendre de
// l'heure de génération du site ou du fuseau du visiteur.

export type CalendarDate = { year: number; month: number; day: number };
export type Duration = { months: number; days: number };

export type MandateTime =
  | { kind: 'running'; elapsedPercent: number; remaining: Duration; remainingDays: number }
  | { kind: 'overdue'; overdueBy: Duration };

// Élection du président de la Métropole par le nouveau conseil.
export const MANDATE_START: CalendarDate = { year: 2020, month: 7, day: 15 };
// Dernier jour du mandat pour les promesses : elles valent jusqu'à la fin de ce jour.
export const MANDATE_DEADLINE: CalendarDate = { year: 2026, month: 12, day: 31 };
const DAY_AFTER_DEADLINE: CalendarDate = { year: 2027, month: 1, day: 1 };

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function toDayNumber({ year, month, day }: CalendarDate): number {
  return Date.UTC(year, month - 1, day) / MILLISECONDS_PER_DAY;
}

function compareDates(first: CalendarDate, second: CalendarDate): number {
  return toDayNumber(first) - toDayNumber(second);
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// Le 31/10 plus un mois donne le 30/11 : le jour est ramené au dernier jour du mois d'arrivée.
function addMonths(date: CalendarDate, months: number): CalendarDate {
  const monthIndex = date.month - 1 + months;
  const year = date.year + Math.floor(monthIndex / 12);
  const month = (monthIndex % 12) + 1;
  return { year, month, day: Math.min(date.day, getDaysInMonth(year, month)) };
}

export function addDuration(date: CalendarDate, duration: Duration): CalendarDate {
  const afterMonths = new Date((toDayNumber(addMonths(date, duration.months)) + duration.days) * MILLISECONDS_PER_DAY);
  return { year: afterMonths.getUTCFullYear(), month: afterMonths.getUTCMonth() + 1, day: afterMonths.getUTCDate() };
}

// Mois entiers puis jours restants, de « from » à « to » (to postérieur ou égal à from).
function getDurationBetween(from: CalendarDate, to: CalendarDate): Duration {
  let months = 0;
  while (compareDates(addMonths(from, months + 1), to) <= 0) {
    months += 1;
  }
  return { months, days: compareDates(to, addMonths(from, months)) };
}

export function getMandateTime(today: CalendarDate): MandateTime {
  if (compareDates(today, MANDATE_DEADLINE) > 0) {
    return { kind: 'overdue', overdueBy: getDurationBetween(MANDATE_DEADLINE, today) };
  }
  const totalDays = compareDates(DAY_AFTER_DEADLINE, MANDATE_START);
  const elapsedDays = Math.max(0, compareDates(today, MANDATE_START));
  return {
    kind: 'running',
    elapsedPercent: (elapsedDays / totalDays) * 100,
    remaining: getDurationBetween(today, DAY_AFTER_DEADLINE),
    remainingDays: compareDates(DAY_AFTER_DEADLINE, today),
  };
}

function pluralizeDays(days: number): string {
  return days === 1 ? '1 jour' : `${days} jours`;
}

export function formatDuration({ months, days }: Duration): string {
  if (months === 0) {
    return pluralizeDays(days);
  }
  if (days === 0) {
    return `${months} mois`;
  }
  return `${months} mois et ${pluralizeDays(days)}`;
}
