import { assert, describe, it } from 'vitest';

import { useStats } from '../composables/useStats';
import { LaneStatus, LaneType, Quality } from '../types';
import { buildSection, buildVoie } from './useStats.fixtures';

const { getAllUniqLineStrings, getStatsByTypology, getPromiseProgress } = useStats();

const DEDICATED_FAMILY_NAME = 'Aménagements cyclables dédiés';
const PEDESTRIAN_MIX_FAMILY_NAME = 'En mixité piétonne';

function getDoneAndWipStats(voies: ReturnType<typeof buildVoie>[]) {
  return getStatsByTypology(voies).doneAndWip;
}

function getTodoPercent(voies: ReturnType<typeof buildVoie>[]) {
  return getStatsByTypology(voies).todo.percent;
}

describe('useStats', () => {
  describe('getAllUniqLineStrings', () => {
    it('should_keep_only_first_feature_when_features_share_same_id', () => {
      const sharedSectionOnLine1 = buildSection({
        id: 'commun',
        line: 1,
        status: LaneStatus.Done,
        type: LaneType.Bidirectionnelle,
      });
      const sharedSectionOnLine2 = buildSection({
        id: 'commun',
        line: 2,
        status: LaneStatus.Done,
        type: LaneType.Bidirectionnelle,
      });

      const uniqLineStrings = getAllUniqLineStrings([buildVoie(sharedSectionOnLine1), buildVoie(sharedSectionOnLine2)]);

      assert.deepEqual(uniqLineStrings, [sharedSectionOnLine1]);
    });
  });

  describe('getStatsByTypology', () => {
    it('should_count_shared_section_once_when_several_lines_share_its_id', () => {
      const voies = [
        buildVoie(
          buildSection({ id: 'commun', line: 1, status: LaneStatus.Done, type: LaneType.Bidirectionnelle }),
          buildSection({ line: 1, status: LaneStatus.Todo, promisedFor: 2026, type: LaneType.Bidirectionnelle }),
        ),
        buildVoie(buildSection({ id: 'commun', line: 2, status: LaneStatus.Done, type: LaneType.Bidirectionnelle })),
      ];

      assert.deepEqual(getDoneAndWipStats(voies), [{ name: DEDICATED_FAMILY_NAME, percent: 50 }]);
    });

    it('should_return_100_percent_todo_when_all_sections_are_promised_todo', () => {
      const voies = [
        buildVoie(
          buildSection({ line: 1, status: LaneStatus.Todo, promisedFor: 2026, type: LaneType.Bidirectionnelle }),
          buildSection({ line: 1, status: LaneStatus.Todo, promisedFor: 2026, type: LaneType.VoieVerte }),
        ),
      ];

      assert.equal(getTodoPercent(voies), 100);
    });

    it('should_count_unpromised_section_as_todo_when_computing_todo_percent', () => {
      const voies = [
        buildVoie(
          buildSection({ line: 1, status: LaneStatus.Todo, type: LaneType.Bidirectionnelle }),
          buildSection({ line: 1, status: LaneStatus.Done, type: LaneType.Bidirectionnelle }),
        ),
      ];

      assert.equal(getTodoPercent(voies), 50);
    });

    it('should_return_family_at_100_percent_when_all_sections_are_done_and_dedicated', () => {
      const voies = [
        buildVoie(
          buildSection({ line: 1, status: LaneStatus.Done, type: LaneType.Bidirectionnelle }),
          buildSection({ line: 1, status: LaneStatus.Done, type: LaneType.Unidirectionnelle }),
        ),
      ];

      assert.deepEqual(getDoneAndWipStats(voies), [{ name: DEDICATED_FAMILY_NAME, percent: 100 }]);
    });

    it('should_count_wip_section_as_done_when_computing_family_percent', () => {
      const voies = [
        buildVoie(
          buildSection({ line: 1, status: LaneStatus.Wip, type: LaneType.Bidirectionnelle }),
          buildSection({ line: 1, status: LaneStatus.Todo, promisedFor: 2026, type: LaneType.Bidirectionnelle }),
        ),
      ];

      assert.deepEqual(getDoneAndWipStats(voies), [{ name: DEDICATED_FAMILY_NAME, percent: 50 }]);
    });

    it('should_exclude_section_from_percents_when_status_is_unknown', () => {
      const voies = [
        buildVoie(
          buildSection({ line: 1, status: LaneStatus.Unknown, type: LaneType.Bidirectionnelle }),
          buildSection({ line: 1, status: LaneStatus.Todo, promisedFor: 2026, type: LaneType.Bidirectionnelle }),
        ),
      ];

      assert.equal(getTodoPercent(voies), 100);
    });

    it('should_exclude_done_section_from_percents_when_type_is_unknown', () => {
      const voies = [
        buildVoie(
          buildSection({ line: 1, status: LaneStatus.Done, type: LaneType.Inconnu }),
          buildSection({ line: 1, status: LaneStatus.Todo, promisedFor: 2026, type: LaneType.Bidirectionnelle }),
        ),
      ];

      assert.equal(getTodoPercent(voies), 100);
    });

    it('should_return_zero_todo_percent_when_no_measurable_section', () => {
      const voies = [
        buildVoie(
          buildSection({ line: 1, status: LaneStatus.Unknown, type: LaneType.Bidirectionnelle }),
          buildSection({ line: 2, status: LaneStatus.Unknown, type: LaneType.VoieVerte }),
        ),
      ];

      assert.equal(getTodoPercent(voies), 0);
    });

    it('should_sort_families_by_descending_percent_when_several_families', () => {
      const voies = [
        buildVoie(
          buildSection({ line: 1, status: LaneStatus.Done, type: LaneType.VoieVerte }),
          buildSection({ line: 1, status: LaneStatus.Done, type: LaneType.Bidirectionnelle }),
          buildSection({ line: 1, status: LaneStatus.Done, type: LaneType.Bilaterale }),
        ),
      ];

      assert.deepEqual(getDoneAndWipStats(voies), [
        { name: DEDICATED_FAMILY_NAME, percent: 67 },
        { name: PEDESTRIAN_MIX_FAMILY_NAME, percent: 33 },
      ]);
    });

    it('should_split_family_percent_by_quality_when_sections_have_quality', () => {
      const voies = [
        buildVoie(
          buildSection({ line: 1, status: LaneStatus.Done, type: LaneType.Bidirectionnelle, quality: Quality.Good }),
          buildSection({ line: 1, status: LaneStatus.Done, type: LaneType.Bidirectionnelle, quality: Quality.Bad }),
        ),
      ];

      assert.deepEqual(getDoneAndWipStats(voies), [{ name: DEDICATED_FAMILY_NAME, percent: 100, good: 50, bad: 50 }]);
    });
  });

  // Ce qui avait été promis pour 2026 et restait à construire : la mesure du bilan du mandat (ADR 0009).
  describe('getPromiseProgress', () => {
    function readPercents(voies: ReturnType<typeof buildVoie>[]) {
      const { done, wip, todo } = getPromiseProgress(voies);
      return { done: done.percent, wip: wip.percent, todo: todo.percent };
    }

    it('should_exclude_section_when_done_before_mandate', () => {
      const voies = [
        buildVoie(
          buildSection({
            line: 1,
            status: LaneStatus.Done,
            promisedFor: 2026,
            type: LaneType.VoieVerte,
            doneAt: '01/06/2019',
          }),
          buildSection({ line: 1, status: LaneStatus.Todo, promisedFor: 2026, type: LaneType.Bidirectionnelle }),
        ),
      ];

      assert.deepEqual(readPercents(voies), { done: 0, wip: 0, todo: 100 });
    });

    it('should_exclude_section_when_never_promised', () => {
      const voies = [
        buildVoie(
          buildSection({ line: 1, status: LaneStatus.Done, type: LaneType.VoieVerte, doneAt: '31/08/2024' }),
          buildSection({ line: 1, status: LaneStatus.Todo, type: LaneType.VoieVerte }),
          buildSection({ line: 1, status: LaneStatus.Todo, promisedFor: 2026, type: LaneType.Bidirectionnelle }),
        ),
      ];

      assert.deepEqual(readPercents(voies), { done: 0, wip: 0, todo: 100 });
    });

    it('should_split_promised_distance_by_progress_when_sections_are_done_wip_and_todo', () => {
      const voies = [
        buildVoie(
          buildSection({
            line: 1,
            status: LaneStatus.Done,
            promisedFor: 2026,
            type: LaneType.VoieVerte,
            doneAt: '01/09/2023',
          }),
          buildSection({ line: 1, status: LaneStatus.Wip, promisedFor: 2026, type: LaneType.VoieVerte }),
          buildSection({ line: 1, status: LaneStatus.Todo, promisedFor: 2026, type: LaneType.VoieVerte }),
          buildSection({ line: 1, status: LaneStatus.Todo, promisedFor: 2026, type: LaneType.Bidirectionnelle }),
        ),
      ];

      assert.deepEqual(readPercents(voies), { done: 25, wip: 25, todo: 50 });
    });

    it('should_count_shared_section_once_when_lines_share_an_id', () => {
      const voies = [
        buildVoie(
          buildSection({
            id: 'commun',
            line: 1,
            status: LaneStatus.Done,
            promisedFor: 2026,
            type: LaneType.VoieVerte,
            doneAt: '01/09/2023',
          }),
          buildSection({ line: 1, status: LaneStatus.Todo, promisedFor: 2026, type: LaneType.VoieVerte }),
        ),
        buildVoie(
          buildSection({
            id: 'commun',
            line: 2,
            status: LaneStatus.Done,
            promisedFor: 2026,
            type: LaneType.VoieVerte,
            doneAt: '01/09/2023',
          }),
        ),
      ];

      assert.deepEqual(readPercents(voies), { done: 50, wip: 0, todo: 50 });
    });

    it('should_count_promised_section_as_todo_when_status_is_unknown', () => {
      const voies = [
        buildVoie(
          buildSection({ line: 1, status: LaneStatus.Unknown, promisedFor: 2026, type: LaneType.VoieVerte }),
          buildSection({ line: 1, status: LaneStatus.Wip, promisedFor: 2026, type: LaneType.VoieVerte }),
        ),
      ];

      assert.deepEqual(readPercents(voies), { done: 0, wip: 50, todo: 50 });
    });
  });
});
