import { assert, describe, it } from 'vitest';

import {
  convertMapPanelToQuery,
  findLinkAnchor,
  findSectionLink,
  parseMapPanel,
  type DisplayableSection,
  type MapPanel,
} from '../domain/mapPanel';

// Un tronçon partagé par deux Vélolignes et un tronçon d'une seule, comme dans les données réelles.
const SECTIONS: DisplayableSection[] = [
  { name: 'Chemin des Alouettes', lines: ['1', 'B'] },
  { name: 'St Jaumes', lines: ['10'] },
];

const ALL_MAP_PANELS: MapPanel[] = [
  { kind: 'closed' },
  { kind: 'filters' },
  { kind: 'detail', sectionName: 'Chemin des Alouettes', line: '1' },
  { kind: 'detail', sectionName: 'Chemin des Alouettes', line: 'B' },
  { kind: 'detail', sectionName: 'St Jaumes', line: '10' },
];

describe('parseMapPanel', () => {
  it('should_be_closed_when_query_has_no_panel', () => {
    assert.deepEqual(parseMapPanel({}, SECTIONS), { kind: 'closed' });
  });

  it('should_be_filters_when_panel_is_filtres', () => {
    assert.deepEqual(parseMapPanel({ panneau: 'filtres' }, SECTIONS), { kind: 'filters' });
  });

  it('should_be_closed_when_panel_is_unknown', () => {
    assert.deepEqual(parseMapPanel({ panneau: 'legende' }, SECTIONS), { kind: 'closed' });
  });

  // `?panneau=filtres&panneau=filtres` donne un tableau : une URL bricolée, pas un état du site.
  it('should_be_closed_when_panel_is_repeated', () => {
    assert.deepEqual(parseMapPanel({ panneau: ['filtres', 'filtres'] }, SECTIONS), { kind: 'closed' });
  });

  it('should_show_the_first_line_of_the_section_when_detail_has_no_line', () => {
    assert.deepEqual(parseMapPanel({ panneau: 'detail', troncon: 'Chemin des Alouettes' }, SECTIONS), {
      kind: 'detail',
      sectionName: 'Chemin des Alouettes',
      line: '1',
    });
  });

  it('should_show_the_requested_line_when_the_section_is_on_that_line', () => {
    assert.deepEqual(parseMapPanel({ panneau: 'detail', troncon: 'Chemin des Alouettes', ligne: 'B' }, SECTIONS), {
      kind: 'detail',
      sectionName: 'Chemin des Alouettes',
      line: 'B',
    });
  });

  it('should_show_the_first_line_of_the_section_when_the_requested_line_is_not_on_the_section', () => {
    assert.deepEqual(parseMapPanel({ panneau: 'detail', troncon: 'Chemin des Alouettes', ligne: '7' }, SECTIONS), {
      kind: 'detail',
      sectionName: 'Chemin des Alouettes',
      line: '1',
    });
  });

  it('should_be_closed_when_the_section_does_not_exist', () => {
    assert.deepEqual(parseMapPanel({ panneau: 'detail', troncon: 'Rue inconnue' }, SECTIONS), { kind: 'closed' });
  });

  it('should_be_closed_when_detail_has_no_section', () => {
    assert.deepEqual(parseMapPanel({ panneau: 'detail' }, SECTIONS), { kind: 'closed' });
  });
});

describe('convertMapPanelToQuery', () => {
  it('should_set_panel_to_filtres_when_panel_is_filters', () => {
    assert.deepEqual(convertMapPanelToQuery({ kind: 'filters' }, {}), { panneau: 'filtres' });
  });

  it('should_remove_panel_when_panel_is_closed', () => {
    assert.deepEqual(convertMapPanelToQuery({ kind: 'closed' }, { panneau: 'filtres' }), {});
  });

  it('should_keep_other_parameters_when_panel_changes', () => {
    assert.deepEqual(convertMapPanelToQuery({ kind: 'filters' }, { zoom: '12' }), { zoom: '12', panneau: 'filtres' });
  });

  it('should_set_section_and_line_when_panel_is_detail', () => {
    assert.deepEqual(convertMapPanelToQuery({ kind: 'detail', sectionName: 'St Jaumes', line: '10' }, {}), {
      panneau: 'detail',
      troncon: 'St Jaumes',
      ligne: '10',
    });
  });

  it('should_remove_section_and_line_when_panel_leaves_detail', () => {
    const detailQuery = { panneau: 'detail', troncon: 'St Jaumes', ligne: '10' };
    assert.deepEqual(convertMapPanelToQuery({ kind: 'filters' }, detailQuery), { panneau: 'filtres' });
  });

  // Énumération exhaustive des états possibles avec les tronçons de test, plutôt que des entrées générées.
  it('should_give_back_the_same_panel_when_parsing_its_query', () => {
    for (const panel of ALL_MAP_PANELS) {
      assert.deepEqual(parseMapPanel(convertMapPanelToQuery(panel, {}), SECTIONS), panel);
    }
  });
});

describe('findSectionLink', () => {
  const features = [
    { properties: { name: 'Chemin des Alouettes', line: '1', link: '/veloligne-1#traversée-de-clapiers-et-jacou' } },
    { properties: { name: 'Chemin des Alouettes', line: 'B', link: '/veloligne-B#chemin-des-alouettes' } },
  ];

  it('should_give_the_link_of_the_requested_line_when_the_section_is_shared', () => {
    assert.equal(findSectionLink(features, 'Chemin des Alouettes', 'B'), '/veloligne-B#chemin-des-alouettes');
  });

  it('should_give_nothing_when_the_section_is_not_on_the_line', () => {
    assert.equal(findSectionLink(features, 'Chemin des Alouettes', '7'), undefined);
  });
});

describe('findLinkAnchor', () => {
  it('should_give_the_anchor_when_the_link_has_one', () => {
    assert.equal(findLinkAnchor('/veloligne-1#véloligne-1c'), 'véloligne-1c');
  });

  // Certains liens sont saisis encodés : l'ancre doit correspondre à l'id du titre dans la page.
  it('should_decode_the_anchor_when_the_link_is_encoded', () => {
    assert.equal(findLinkAnchor('/veloligne-5#d%C3%A9but-de-dubout'), 'début-de-dubout');
  });

  it('should_give_nothing_when_the_link_has_no_anchor', () => {
    assert.equal(findLinkAnchor('/veloligne-7'), undefined);
  });
});
