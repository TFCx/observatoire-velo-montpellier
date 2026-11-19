// État du panneau latéral de la carte interactive, gardé dans l'URL (ADR 0010). L'URL est lue ici
// une seule fois : le reste du code ne manipule que MapPanel.

// Forme des paramètres d'URL de vue-router (LocationQuery), sans en dépendre dans domain/.
export type QueryValue = string | null | (string | null)[] | undefined;
export type Query = Record<string, QueryValue>;

export type MapPanel = { kind: 'closed' } | { kind: 'filters' };

const PANEL_PARAMETER = 'panneau';
const FILTERS_PANEL_VALUE = 'filtres';

export function parseMapPanel(query: Query): MapPanel {
  return query[PANEL_PARAMETER] === FILTERS_PANEL_VALUE ? { kind: 'filters' } : { kind: 'closed' };
}

// Les autres paramètres de l'URL sont gardés : le panneau ne décide que des siens.
export function convertMapPanelToQuery(panel: MapPanel, query: Query): Query {
  const { [PANEL_PARAMETER]: _previousPanel, ...otherParameters } = query;
  switch (panel.kind) {
    case 'closed':
      return otherParameters;
    case 'filters':
      return { ...otherParameters, [PANEL_PARAMETER]: FILTERS_PANEL_VALUE };
  }
}
