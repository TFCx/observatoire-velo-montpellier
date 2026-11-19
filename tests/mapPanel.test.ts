import { assert, describe, it } from 'vitest';

import { convertMapPanelToQuery, parseMapPanel, type MapPanel } from '../domain/mapPanel';

const ALL_MAP_PANELS: MapPanel[] = [{ kind: 'closed' }, { kind: 'filters' }];

describe('parseMapPanel', () => {
  it('should_be_closed_when_query_has_no_panel', () => {
    assert.deepEqual(parseMapPanel({}), { kind: 'closed' });
  });

  it('should_be_filters_when_panel_is_filtres', () => {
    assert.deepEqual(parseMapPanel({ panneau: 'filtres' }), { kind: 'filters' });
  });

  it('should_be_closed_when_panel_is_unknown', () => {
    assert.deepEqual(parseMapPanel({ panneau: 'legende' }), { kind: 'closed' });
  });

  // `?panneau=filtres&panneau=filtres` donne un tableau : une URL bricolée, pas un état du site.
  it('should_be_closed_when_panel_is_repeated', () => {
    assert.deepEqual(parseMapPanel({ panneau: ['filtres', 'filtres'] }), { kind: 'closed' });
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

  // Énumération exhaustive plutôt que des entrées générées : il n'y a que deux états.
  it('should_give_back_the_same_panel_when_parsing_its_query', () => {
    for (const panel of ALL_MAP_PANELS) {
      assert.deepEqual(parseMapPanel(convertMapPanelToQuery(panel, {})), panel);
    }
  });
});
