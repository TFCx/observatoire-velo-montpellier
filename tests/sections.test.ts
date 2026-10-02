import { assert, describe, it } from 'vitest';

import { computeTypeFamily, getDisplayedQualities, regroupIntoSections } from '../domain/sections';
import { LaneStatus, LaneType, LaneTypeFamily, Quality } from '../types';
import { buildSection } from './useStats.fixtures';

function buildSharedSectionOnLines(id: string, ...lines: string[]) {
  return lines.map((line) => buildSection({ id, line, status: LaneStatus.Done, type: LaneType.Bidirectionnelle }));
}

describe('regroupIntoSections', () => {
  it('should_list_every_line_when_features_share_same_id', () => {
    const sections = regroupIntoSections(buildSharedSectionOnLines('commun', '2', '1'));

    assert.deepEqual(sections[0]?.properties.lines, ['1', '2']);
  });

  it('should_keep_a_single_section_when_features_share_same_id', () => {
    const sections = regroupIntoSections(buildSharedSectionOnLines('commun', '1', '2'));

    assert.equal(sections.length, 1);
  });

  it('should_keep_separate_sections_when_features_have_no_id', () => {
    const firstWithoutId = buildSection({ line: '1', status: LaneStatus.Done, type: LaneType.Bidirectionnelle });
    const secondWithoutId = buildSection({ line: '2', status: LaneStatus.Done, type: LaneType.Bidirectionnelle });

    const sections = regroupIntoSections([firstWithoutId, secondWithoutId]);

    assert.equal(sections.length, 2);
  });

  // Étiquette affichée sur la carte à côté du tronçon (composables/map/network.ts).
  it('should_display_lines_in_parentheses_when_section_is_shared', () => {
    const sections = regroupIntoSections(buildSharedSectionOnLines('commun', '1', '2'));

    assert.equal(sections[0]?.properties.displayedLinesName, '(1,2)');
  });

  it('should_use_unknown_quality_when_quality_is_empty', () => {
    const section = buildSection({ line: '1', status: LaneStatus.Todo, type: LaneType.Inconnu, quality: '' });

    const sections = regroupIntoSections([section]);

    assert.equal(sections[0]?.properties.quality, Quality.Inconnu);
  });
});

describe('computeTypeFamily', () => {
  it('should_classify_as_pedestrian_mix_when_type_is_voie_verte', () => {
    assert.equal(computeTypeFamily(LaneType.VoieVerte), LaneTypeFamily.MixitePietonne);
  });
});

describe('getDisplayedQualities', () => {
  function buildTerminatedSection(quality: Quality, qualityB?: Quality) {
    const [section] = regroupIntoSections([
      buildSection({ line: '1', status: LaneStatus.Done, type: LaneType.Bidirectionnelle, quality }),
    ]);
    const regrouped = section!;
    regrouped.properties.qualityB = qualityB;
    return regrouped;
  }

  it('should_show_no_quality_when_section_is_not_done', () => {
    const [plannedSection] = regroupIntoSections([
      buildSection({ line: '1', status: LaneStatus.Todo, type: LaneType.Inconnu, quality: '' }),
    ]);

    assert.deepEqual(getDisplayedQualities(plannedSection!), []);
  });

  it('should_show_one_quality_when_both_sides_are_equal', () => {
    assert.deepEqual(getDisplayedQualities(buildTerminatedSection(Quality.Good, Quality.Good)), [Quality.Good]);
  });

  it('should_show_both_qualities_when_sides_differ', () => {
    assert.deepEqual(getDisplayedQualities(buildTerminatedSection(Quality.Bad, Quality.Good)), [
      Quality.Bad,
      Quality.Good,
    ]);
  });
});
