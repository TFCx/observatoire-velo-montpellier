// Règles du schéma des données (domain/schema.ts) vérifiées sur des tronçons fabriqués ;
// tests/data-health.test.ts applique ce schéma aux vraies données.
import { assert, describe, it } from 'vitest';

import { lineStringFeatureSchema } from '../domain/schema';

// Tronçon à faire et valide, tel qu'un contributeur le saisit ; chaque test n'en change qu'une propriété.
function buildRawSection(propertyOverrides: Record<string, unknown>) {
  return {
    type: 'Feature',
    properties: {
      line: '1',
      name: 'Tronçon de test',
      status: 'todo',
      type: 'bidirectionnelle',
      doneAt: '',
      link: '/veloligne-1',
      ...propertyOverrides,
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [3.877, 43.611],
        [3.878, 43.612],
      ],
    },
  };
}

function readErrorPaths(rawSection: unknown): string[] {
  const result = lineStringFeatureSchema.safeParse(rawSection);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
}

function readErrorMessages(rawSection: unknown): string[] {
  const result = lineStringFeatureSchema.safeParse(rawSection);
  return result.success ? [] : result.error.issues.map((issue) => `${issue.path.join('.')} : ${issue.message}`);
}

describe('lineStringFeatureSchema', () => {
  describe('promisedFor', () => {
    it('should_accept_section_when_promised_for_is_2026', () => {
      assert.deepEqual(readErrorMessages(buildRawSection({ promisedFor: 2026 })), []);
    });

    it('should_accept_section_when_promised_for_is_absent', () => {
      assert.deepEqual(readErrorMessages(buildRawSection({})), []);
    });

    // Un tronçon jamais promis n'a pas de champ promisedFor : null ou "" seraient une deuxième façon de le dire.
    it('should_reject_section_when_promised_for_is_null', () => {
      assert.deepEqual(readErrorPaths(buildRawSection({ promisedFor: null })), ['properties.promisedFor']);
    });

    it('should_reject_section_when_promised_for_is_empty_string', () => {
      assert.deepEqual(readErrorPaths(buildRawSection({ promisedFor: '' })), ['properties.promisedFor']);
    });

    // Le message est lu par les contributeurs quand la CI refuse une saisie : il donne les valeurs admises.
    it('should_list_allowed_years_when_promised_for_is_2032', () => {
      const errorMessages = readErrorMessages(buildRawSection({ promisedFor: 2032 }));

      assert.deepEqual(errorMessages, [
        'properties.promisedFor : année de promesse "2032" inconnue ; valeurs admises : 2026 ; ' +
          "retirer le champ si le tronçon n'a jamais été promis",
      ]);
    });
  });

  describe('status', () => {
    it('should_list_todo_among_allowed_values_when_status_is_former_planned', () => {
      const errorMessages = readErrorMessages(buildRawSection({ status: 'planned' }));

      assert.deepEqual(errorMessages, [
        'properties.status : statut "planned" inconnu ; valeurs admises : done, wip, todo, unknown',
      ]);
    });
  });
});
