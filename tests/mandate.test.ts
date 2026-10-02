import { assert, describe, it } from 'vitest';

import { addDuration, formatDuration, getMandateTime, type CalendarDate, type MandateTime } from '../domain/mandate';

function date(day: number, month: number, year: number): CalendarDate {
  return { year, month, day };
}

function readRunning(mandateTime: MandateTime) {
  assert.equal(mandateTime.kind, 'running');
  return mandateTime as Extract<MandateTime, { kind: 'running' }>;
}

// Tous les jours du début du mandat à fin 2027 : assez peu pour tous les tester, plutôt qu'en tirer au hasard.
function listEveryDayFromMandateStartToEndOf2027(): CalendarDate[] {
  const days: CalendarDate[] = [];
  for (let time = Date.UTC(2020, 6, 15); time <= Date.UTC(2027, 11, 31); time += 24 * 60 * 60 * 1000) {
    const day = new Date(time);
    days.push({ year: day.getUTCFullYear(), month: day.getUTCMonth() + 1, day: day.getUTCDate() });
  }
  return days;
}

describe('getMandateTime', () => {
  it('should_be_0_percent_elapsed_when_today_is_15_07_2020', () => {
    assert.equal(readRunning(getMandateTime(date(15, 7, 2020))).elapsedPercent, 0);
  });

  it('should_leave_2_months_and_30_days_when_today_is_02_10_2026', () => {
    assert.deepEqual(readRunning(getMandateTime(date(2, 10, 2026))).remaining, { months: 2, days: 30 });
  });

  // Le 31/12/2026 est encore un jour du mandat : la promesse vaut jusqu'à la fin de ce jour (ADR 0009).
  it('should_leave_1_day_when_today_is_31_12_2026', () => {
    assert.deepEqual(readRunning(getMandateTime(date(31, 12, 2026))).remaining, { months: 0, days: 1 });
  });

  it('should_leave_2_months_and_1_day_when_today_is_31_10_2026', () => {
    assert.deepEqual(readRunning(getMandateTime(date(31, 10, 2026))).remaining, { months: 2, days: 1 });
  });

  // Fin de mois : sans report au dernier jour du mois, 31/12 + 2 mois déborde au 03/03 et le compte est faux.
  it('should_be_overdue_by_2_months_and_15_days_when_today_is_15_03_2027', () => {
    assert.deepEqual(getMandateTime(date(15, 3, 2027)), { kind: 'overdue', overdueBy: { months: 2, days: 15 } });
  });

  it('should_be_overdue_by_1_day_when_today_is_01_01_2027', () => {
    assert.deepEqual(getMandateTime(date(1, 1, 2027)), { kind: 'overdue', overdueBy: { months: 0, days: 1 } });
  });

  describe('every day from mandate start to end of 2027', () => {
    const everyDay = listEveryDayFromMandateStartToEndOf2027();

    it('should_increase_elapsed_percent_when_day_advances', () => {
      let previousElapsedPercent = -1;
      for (const today of everyDay) {
        const mandateTime = getMandateTime(today);
        const elapsedPercent = mandateTime.kind === 'running' ? mandateTime.elapsedPercent : 100;
        assert.isAtLeast(elapsedPercent, previousElapsedPercent, JSON.stringify(today));
        assert.isAtMost(elapsedPercent, 100, JSON.stringify(today));
        previousElapsedPercent = elapsedPercent;
      }
    });

    // Aller-retour : aujourd'hui + temps restant tombe sur le lendemain de l'échéance, quel que soit le jour.
    // Il vérifie que mois et jours restants s'accordent ; il ne juge pas addMonths, qu'il réutilise.
    it('should_land_on_day_after_deadline_when_remaining_time_is_added_to_today', () => {
      for (const today of everyDay) {
        const mandateTime = getMandateTime(today);
        if (mandateTime.kind === 'running') {
          assert.deepEqual(addDuration(today, mandateTime.remaining), date(1, 1, 2027), JSON.stringify(today));
        }
      }
    });

    it('should_decrease_remaining_days_by_one_when_day_advances', () => {
      let previousRemainingDays: number | undefined;
      for (const today of everyDay) {
        const mandateTime = getMandateTime(today);
        if (mandateTime.kind !== 'running') {
          break;
        }
        if (previousRemainingDays !== undefined) {
          assert.equal(mandateTime.remainingDays, previousRemainingDays - 1, JSON.stringify(today));
        }
        previousRemainingDays = mandateTime.remainingDays;
      }
    });
  });

  it('should_stay_at_100_percent_elapsed_when_deadline_is_passed', () => {
    assert.equal(getMandateTime(date(15, 3, 2027)).kind, 'overdue');
  });
});

describe('formatDuration', () => {
  it('should_omit_months_when_less_than_a_month_is_left', () => {
    assert.equal(formatDuration({ months: 0, days: 12 }), '12 jours');
  });

  it('should_use_singular_when_one_month_and_one_day_are_left', () => {
    assert.equal(formatDuration({ months: 1, days: 1 }), '1 mois et 1 jour');
  });

  it('should_omit_days_when_a_whole_number_of_months_is_left', () => {
    assert.equal(formatDuration({ months: 2, days: 0 }), '2 mois');
  });
});
