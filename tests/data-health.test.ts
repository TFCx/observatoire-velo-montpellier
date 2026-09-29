// Contrôles de cohérence des données de content/ : ils remplacent l'ancien script
// .github/scripts/check_data_health.js, qui ne pouvait pas importer les enums TypeScript.
import fs from 'node:fs';
import path from 'node:path';
import { assert, describe, it } from 'vitest';

import config from '../config.json';
import { LaneStatus, LaneType } from '../types';
import {
  CONTENT_DIRECTORY,
  VOIES_CYCLABLES_DIRECTORY,
  convertTitleToAnchor,
  readFrontmatterValue,
  readMarkdownFiles,
  readMarkdownTitles,
} from './helpers/content';

// GeoJSON lu tel quel : les champs attendus sont décrits, sans garantie, c'est ce que ces tests vérifient.
type RawFeature = {
  geometry: { type: string };
  properties?: {
    id?: string;
    line?: string | number;
    name?: string;
    status?: string;
    type?: string;
    doneAt?: string;
    link?: string;
    [otherProperty: string]: unknown;
  };
};

type LoadedFeature = {
  fileName: string;
  feature: RawFeature;
};

function listFilesRecursively(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFilesRecursively(entryPath) : [entryPath];
  });
}

function loadVoiesCyclablesFeatures(): LoadedFeature[] {
  return fs
    .readdirSync(VOIES_CYCLABLES_DIRECTORY)
    .filter((fileName) => fileName.endsWith('.json'))
    .flatMap((fileName) => {
      const geojson = JSON.parse(fs.readFileSync(path.join(VOIES_CYCLABLES_DIRECTORY, fileName), 'utf8'));
      return geojson.features.map((feature: RawFeature) => ({ fileName, feature }));
    });
}

// Un lien peut viser la page d'une ligne ("/veloligne-3") ou un titre de cette page ("/veloligne-3#titre").
function loadAllExistingLinks(): Set<string> {
  const existingLinks = new Set<string>();
  for (const { content } of readMarkdownFiles(VOIES_CYCLABLES_DIRECTORY)) {
    const linePageLink = `/${config.slug}-${readFrontmatterValue(content, 'line')}`;
    existingLinks.add(linePageLink);
    for (const title of readMarkdownTitles(content)) {
      existingLinks.add(`${linePageLink}#${convertTitleToAnchor(title)}`);
    }
  }
  return existingLinks;
}

function describeFeature({ fileName, feature }: LoadedFeature): string {
  return `${fileName} : ligne ${feature.properties?.line}, tronçon "${feature.properties?.name}"`;
}

const allFeatures = loadVoiesCyclablesFeatures();
const lineStringFeatures = allFeatures.filter(({ feature }) => feature.geometry.type === 'LineString');
const pointFeatures = allFeatures.filter(({ feature }) => feature.geometry.type === 'Point');

describe('data health', () => {
  it('should_parse_as_valid_json_when_file_is_in_content', () => {
    const invalidJsonFiles = listFilesRecursively(CONTENT_DIRECTORY)
      .filter((filePath) => filePath.endsWith('.json'))
      .filter((filePath) => {
        try {
          JSON.parse(fs.readFileSync(filePath, 'utf8'));
          return false;
        } catch {
          return true;
        }
      })
      .map((filePath) => path.relative(CONTENT_DIRECTORY, filePath));

    assert.deepEqual(invalidJsonFiles, []);
  });

  describe('LineString', () => {
    it('should_have_line_name_and_status_when_feature_is_line_string', () => {
      const requiredProperties = ['line', 'name', 'status'];
      const problems = lineStringFeatures.flatMap((loadedFeature) =>
        requiredProperties
          .filter((property) => loadedFeature.feature.properties?.[property] === undefined)
          .map((property) => `${describeFeature(loadedFeature)} : "${property}" manquant`),
      );

      assert.deepEqual(problems, []);
    });

    it('should_have_known_status_when_feature_is_line_string', () => {
      const knownStatuses: string[] = Object.values(LaneStatus);
      const problems = lineStringFeatures
        .filter(({ feature }) => !knownStatuses.includes(feature.properties?.status ?? ''))
        .map(
          (loadedFeature) =>
            `${describeFeature(loadedFeature)} : statut "${loadedFeature.feature.properties?.status}" inconnu`,
        );

      assert.deepEqual(problems, []);
    });

    it('should_have_known_type_when_feature_is_line_string', () => {
      const knownTypes: string[] = Object.values(LaneType);
      const problems = lineStringFeatures
        .filter(({ feature }) => !knownTypes.includes(feature.properties?.type ?? ''))
        .map(
          (loadedFeature) =>
            `${describeFeature(loadedFeature)} : type "${loadedFeature.feature.properties?.type}" inconnu`,
        );

      assert.deepEqual(problems, []);
    });

    it('should_have_done_at_date_formatted_dd_mm_yyyy_when_line_string_is_done', () => {
      const problems = lineStringFeatures
        .filter(({ feature }) => feature.properties?.status === LaneStatus.Done)
        .filter(({ feature }) => !/^\d{2}\/\d{2}\/\d{4}$/.test(feature.properties?.doneAt ?? ''))
        .map(
          (loadedFeature) =>
            `${describeFeature(loadedFeature)} : doneAt "${loadedFeature.feature.properties?.doneAt}" invalide`,
        );

      assert.deepEqual(problems, []);
    });

    it('should_link_to_existing_title_anchor_when_feature_is_line_string', () => {
      const existingLinks = loadAllExistingLinks();
      const problems = lineStringFeatures
        // Certains liens sont saisis encodés (%C3%A9) : le navigateur les décode, on fait de même.
        .filter(({ feature }) => !existingLinks.has(decodeURIComponent(feature.properties?.link ?? '')))
        .map(
          (loadedFeature) =>
            `${describeFeature(loadedFeature)} : lien "${loadedFeature.feature.properties?.link}" sans titre correspondant`,
        );

      assert.deepEqual(problems, []);
    });

    // Un id sert à déclarer un tronçon partagé entre plusieurs lignes : un id présent une seule fois est une erreur de saisie.
    it('should_appear_at_least_twice_when_line_string_has_id', () => {
      const occurrencesById = new Map<string, number>();
      for (const { feature } of lineStringFeatures) {
        const id = feature.properties?.id;
        if (id !== undefined) {
          occurrencesById.set(id, (occurrencesById.get(id) ?? 0) + 1);
        }
      }
      const idsSeenOnce = [...occurrencesById].filter(([, occurrences]) => occurrences < 2).map(([id]) => id);

      assert.deepEqual(idsSeenOnce, []);
    });

    it('should_be_unique_when_combining_name_and_line', () => {
      const occurrencesByNameAndLine = new Map<string, number>();
      for (const { feature } of lineStringFeatures) {
        const nameAndLine = `ligne ${feature.properties?.line}, tronçon "${feature.properties?.name}"`;
        occurrencesByNameAndLine.set(nameAndLine, (occurrencesByNameAndLine.get(nameAndLine) ?? 0) + 1);
      }
      const duplicatedNamesAndLines = [...occurrencesByNameAndLine]
        .filter(([, occurrences]) => occurrences > 1)
        .map(([nameAndLine]) => nameAndLine);

      assert.deepEqual(duplicatedNamesAndLines, []);
    });
  });

  describe('Point', () => {
    it('should_have_type_line_name_and_image_when_feature_is_point', () => {
      const requiredProperties = ['type', 'line', 'name', 'imgUrl'];
      const problems = pointFeatures.flatMap((loadedFeature) =>
        requiredProperties
          .filter((property) => loadedFeature.feature.properties?.[property] === undefined)
          .map((property) => `${describeFeature(loadedFeature)} : "${property}" manquant`),
      );

      assert.deepEqual(problems, []);
    });

    it('should_have_perspective_type_when_feature_is_point', () => {
      const problems = pointFeatures
        .filter(({ feature }) => feature.properties?.type !== 'perspective')
        .map(
          (loadedFeature) =>
            `${describeFeature(loadedFeature)} : type "${loadedFeature.feature.properties?.type}" au lieu de "perspective"`,
        );

      assert.deepEqual(problems, []);
    });
  });

  // Les images hébergées ailleurs disparaissent sans prévenir (couverture de la Véloligne 10 en 404
  // en septembre 2026) : les pages des Vélolignes n'utilisent que des fichiers de public/.
  describe('Images', () => {
    const PUBLIC_DIRECTORY = path.join(CONTENT_DIRECTORY, '..', 'public');
    const imageReferences = readMarkdownFiles(VOIES_CYCLABLES_DIRECTORY).flatMap(({ fileName, content }) =>
      [...content.matchAll(/^(cover|imageUrl):\s*(\S+)\s*$/gm)].map((imageMatch) => ({
        fileName,
        field: imageMatch[1] ?? '',
        url: imageMatch[2] ?? '',
      })),
    );

    it('should_be_hosted_on_the_site_when_line_page_references_an_image', () => {
      const problems = imageReferences
        .filter(({ url }) => !url.startsWith('/'))
        .map(({ fileName, field, url }) => `${fileName} : ${field} externe ${url}`);

      assert.deepEqual(problems, []);
    });

    it('should_exist_in_public_when_line_page_references_a_site_image', () => {
      const problems = imageReferences
        .filter(({ url }) => url.startsWith('/'))
        .filter(({ url }) => !fs.existsSync(path.join(PUBLIC_DIRECTORY, decodeURIComponent(url))))
        .map(({ fileName, field, url }) => `${fileName} : ${field} ${url} absent de public/`);

      assert.deepEqual(problems, []);
    });
  });
});
