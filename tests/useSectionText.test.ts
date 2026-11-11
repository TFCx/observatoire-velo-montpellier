import { assert, describe, it } from 'vitest';

import { useSectionText } from '../composables/useSectionText';
import { regroupIntoSections } from '../domain/sections';
import { LaneStatus, LaneType, Quality } from '../types';
import { buildSection } from './useStats.fixtures';

const { getSectionStatus } = useSectionText();

// Texte tel que l'affiche le tooltip de survol : libellé puis date.
function readStatusText(options: Parameters<typeof buildSection>[0]): string {
  const [section] = regroupIntoSections([buildSection(options)]);
  const statusText = getSectionStatus(section!.properties);
  return [statusText.label, statusText.date].filter(Boolean).join(' ');
}

function readDoneStatusText(doneAt: string, promisedFor?: 2026): string {
  return readStatusText({
    line: 1,
    status: LaneStatus.Done,
    promisedFor,
    type: LaneType.Bidirectionnelle,
    quality: Quality.Good,
    doneAt,
  });
}

describe('getSectionStatus', () => {
  it('should_say_promised_for_end_of_2026_when_todo_section_is_promised', () => {
    const statusText = readStatusText({
      line: 1,
      status: LaneStatus.Todo,
      promisedFor: 2026,
      type: LaneType.Bidirectionnelle,
    });

    assert.equal(statusText, 'promis pour fin 2026');
  });

  it('should_say_without_deadline_when_todo_section_was_never_promised', () => {
    const statusText = readStatusText({ line: 1, status: LaneStatus.Todo, type: LaneType.Bidirectionnelle });

    assert.equal(statusText, 'sans échéance');
  });

  it('should_say_late_when_promised_section_is_done_after_2026', () => {
    assert.equal(readDoneStatusText('15/03/2027', 2026), 'réalisé le 15/03/2027, avec retard');
  });

  // Limite de l'échéance : une comparaison stricte inversée, ou une date lue en mois/jour, se trompe ici.
  it('should_not_say_late_when_promised_section_is_done_on_31_12_2026', () => {
    assert.equal(readDoneStatusText('31/12/2026', 2026), 'réalisé le 31/12/2026');
  });

  it('should_not_say_late_when_unpromised_section_is_done_after_2026', () => {
    assert.equal(readDoneStatusText('15/03/2027'), 'réalisé le 15/03/2027');
  });
});
