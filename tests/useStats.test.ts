import { assert, describe, it } from 'vitest';

import { useStats } from '../composables/useStats';
import { LaneStatus, LaneType, Quality } from '../types';
import { buildSection, buildVoie } from './useStats.fixtures';

const { getAllUniqLineStrings, getStatsByTypology } = useStats();

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
      const sharedSectionOnLine1 = buildSection({ id: 'commun', line: 1, status: LaneStatus.Done, type: LaneType.Bidirectionnelle });
      const sharedSectionOnLine2 = buildSection({ id: 'commun', line: 2, status: LaneStatus.Done, type: LaneType.Bidirectionnelle });

      const uniqLineStrings = getAllUniqLineStrings([buildVoie(sharedSectionOnLine1), buildVoie(sharedSectionOnLine2)]);

      assert.deepEqual(uniqLineStrings, [sharedSectionOnLine1]);
    });
  });

  describe('getStatsByTypology', () => {
    it('should_count_shared_section_once_when_several_lines_share_its_id', () => {
      const voies = [
        buildVoie(
          buildSection({ id: 'commun', line: 1, status: LaneStatus.Done, type: LaneType.Bidirectionnelle }),
          buildSection({ line: 1, status: LaneStatus.Planned, type: LaneType.Bidirectionnelle })
        ),
        buildVoie(buildSection({ id: 'commun', line: 2, status: LaneStatus.Done, type: LaneType.Bidirectionnelle }))
      ];

      assert.deepEqual(getDoneAndWipStats(voies), [{ name: DEDICATED_FAMILY_NAME, percent: 50 }]);
    });

    it('should_return_100_percent_todo_when_all_sections_are_planned', () => {
      const voies = [
        buildVoie(
          buildSection({ line: 1, status: LaneStatus.Planned, type: LaneType.Bidirectionnelle }),
          buildSection({ line: 1, status: LaneStatus.Planned, type: LaneType.VoieVerte })
        )
      ];

      assert.equal(getTodoPercent(voies), 100);
    });

    it('should_count_postponed_section_as_todo_when_computing_todo_percent', () => {
      const voies = [
        buildVoie(
          buildSection({ line: 1, status: LaneStatus.Postponed, type: LaneType.Bidirectionnelle }),
          buildSection({ line: 1, status: LaneStatus.Done, type: LaneType.Bidirectionnelle })
        )
      ];

      assert.equal(getTodoPercent(voies), 50);
    });

    it('should_return_family_at_100_percent_when_all_sections_are_done_and_dedicated', () => {
      const voies = [
        buildVoie(
          buildSection({ line: 1, status: LaneStatus.Done, type: LaneType.Bidirectionnelle }),
          buildSection({ line: 1, status: LaneStatus.Done, type: LaneType.Unidirectionnelle })
        )
      ];

      assert.deepEqual(getDoneAndWipStats(voies), [{ name: DEDICATED_FAMILY_NAME, percent: 100 }]);
    });

    it('should_count_wip_section_as_done_when_computing_family_percent', () => {
      const voies = [
        buildVoie(
          buildSection({ line: 1, status: LaneStatus.Wip, type: LaneType.Bidirectionnelle }),
          buildSection({ line: 1, status: LaneStatus.Planned, type: LaneType.Bidirectionnelle })
        )
      ];

      assert.deepEqual(getDoneAndWipStats(voies), [{ name: DEDICATED_FAMILY_NAME, percent: 50 }]);
    });

    it('should_exclude_section_from_percents_when_status_is_variante', () => {
      const voies = [
        buildVoie(
          buildSection({ line: 1, status: LaneStatus.Variante, type: LaneType.Bidirectionnelle }),
          buildSection({ line: 1, status: LaneStatus.Planned, type: LaneType.Bidirectionnelle })
        )
      ];

      assert.equal(getTodoPercent(voies), 100);
    });

    it('should_exclude_done_section_from_percents_when_type_is_unknown', () => {
      const voies = [
        buildVoie(
          buildSection({ line: 1, status: LaneStatus.Done, type: LaneType.Inconnu }),
          buildSection({ line: 1, status: LaneStatus.Planned, type: LaneType.Bidirectionnelle })
        )
      ];

      assert.equal(getTodoPercent(voies), 100);
    });

    it('should_return_zero_todo_percent_when_no_measurable_section', () => {
      const voies = [
        buildVoie(
          buildSection({ line: 1, status: LaneStatus.Variante, type: LaneType.Bidirectionnelle }),
          buildSection({ line: 2, status: LaneStatus.Variante, type: LaneType.VoieVerte })
        )
      ];

      assert.equal(getTodoPercent(voies), 0);
    });

    it('should_sort_families_by_descending_percent_when_several_families', () => {
      const voies = [
        buildVoie(
          buildSection({ line: 1, status: LaneStatus.Done, type: LaneType.VoieVerte }),
          buildSection({ line: 1, status: LaneStatus.Done, type: LaneType.Bidirectionnelle }),
          buildSection({ line: 1, status: LaneStatus.Done, type: LaneType.Bilaterale })
        )
      ];

      assert.deepEqual(getDoneAndWipStats(voies), [
        { name: DEDICATED_FAMILY_NAME, percent: 67 },
        { name: PEDESTRIAN_MIX_FAMILY_NAME, percent: 33 }
      ]);
    });

    it('should_split_family_percent_by_quality_when_sections_have_quality', () => {
      const voies = [
        buildVoie(
          buildSection({ line: 1, status: LaneStatus.Done, type: LaneType.Bidirectionnelle, quality: Quality.Good }),
          buildSection({ line: 1, status: LaneStatus.Done, type: LaneType.Bidirectionnelle, quality: Quality.Bad })
        )
      ];

      assert.deepEqual(getDoneAndWipStats(voies), [
        { name: DEDICATED_FAMILY_NAME, percent: 100, good: 50, bad: 50 }
      ]);
    });
  });
});
