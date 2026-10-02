// Test de caractérisation, temporaire (ADR 0009) : il fige les chiffres et libellés affichés avant la
// migration des statuts, pour prouver que la migration ne change rien d'autre que ce qu'on décide.
// À supprimer avant le merge : sur les vraies données, toute PR de contenu le ferait échouer.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { useSectionText } from '../composables/useSectionText';
import { useStats } from '../composables/useStats';
import { regroupIntoSections } from '../domain/sections';
import { isLineStringFeature, type Geojson } from '../types';
import { VOIES_CYCLABLES_DIRECTORY } from './helpers/content';

function loadVoiesByFileName(): Record<string, Geojson> {
  const voiesByFileName: Record<string, Geojson> = {};
  for (const fileName of fs.readdirSync(VOIES_CYCLABLES_DIRECTORY).sort()) {
    if (fileName.endsWith('.json')) {
      voiesByFileName[fileName] = JSON.parse(fs.readFileSync(path.join(VOIES_CYCLABLES_DIRECTORY, fileName), 'utf8'));
    }
  }
  return voiesByFileName;
}

const voiesByFileName = loadVoiesByFileName();
const allVoies = Object.values(voiesByFileName);
const { getStats, getStatsByTypology, getTotalDistance } = useStats();

describe('characterization before status migration', () => {
  it('should_keep_network_stats_when_statuses_are_migrated', () => {
    expect(getStats(allVoies)).toMatchSnapshot();
  });

  it('should_keep_typology_stats_when_statuses_are_migrated', () => {
    expect(getStatsByTypology(allVoies)).toMatchSnapshot();
  });

  it('should_keep_stats_of_each_veloligne_when_statuses_are_migrated', () => {
    const statsByFileName = Object.fromEntries(
      Object.entries(voiesByFileName).map(([fileName, voie]) => [
        fileName,
        { totalDistance: getTotalDistance([voie]), stats: getStats([voie]) },
      ]),
    );
    expect(statsByFileName).toMatchSnapshot();
  });

  it('should_keep_status_text_of_each_section_when_statuses_are_migrated', () => {
    const { getSectionStatus } = useSectionText();
    const lineStrings = allVoies.flatMap((voie) => voie.features.filter(isLineStringFeature));
    const statusTextBySection = Object.fromEntries(
      regroupIntoSections(lineStrings).map((section) => [
        `${section.properties.lines.join('+')} · ${section.properties.name}`,
        getSectionStatus(section.properties),
      ]),
    );
    expect(statusTextBySection).toMatchSnapshot();
  });
});
