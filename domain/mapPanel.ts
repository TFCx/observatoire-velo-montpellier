// État du panneau latéral de la carte interactive, gardé dans l'URL (ADR 0010). L'URL est lue ici
// une seule fois : le reste du code ne manipule que MapPanel.

// Forme des paramètres d'URL de vue-router (LocationQuery), sans en dépendre dans domain/.
export type QueryValue = string | null | (string | null)[] | undefined;
export type Query = Record<string, QueryValue>;

// line est toujours l'une des Vélolignes du tronçon : parseMapPanel l'a vérifié.
export type MapPanel = { kind: 'closed' } | { kind: 'filters' } | { kind: 'detail'; sectionName: string; line: string };

// Ce que la carte sait d'un tronçon affiché (SectionFeature), ses Vélolignes triées.
export type DisplayableSection = { name: string; lines: string[] };

const PANEL_PARAMETER = 'panneau';
const SECTION_PARAMETER = 'troncon';
const LINE_PARAMETER = 'ligne';
const FILTERS_PANEL_VALUE = 'filtres';
const DETAIL_PANEL_VALUE = 'detail';

// Un paramètre répété donne un tableau : une URL bricolée, traitée comme un paramètre absent.
function readSingleValue(query: Query, parameter: string): string | undefined {
  const value = query[parameter];
  return typeof value === 'string' ? value : undefined;
}

function parseDetailPanel(query: Query, sections: readonly DisplayableSection[]): MapPanel {
  const sectionName = readSingleValue(query, SECTION_PARAMETER);
  const section = sections.find((candidate) => candidate.name === sectionName);
  const firstLine = section?.lines[0];
  if (!section || firstLine === undefined) {
    return { kind: 'closed' };
  }
  const requestedLine = readSingleValue(query, LINE_PARAMETER);
  const line = requestedLine !== undefined && section.lines.includes(requestedLine) ? requestedLine : firstLine;
  return { kind: 'detail', sectionName: section.name, line };
}

export function parseMapPanel(query: Query, sections: readonly DisplayableSection[]): MapPanel {
  switch (readSingleValue(query, PANEL_PARAMETER)) {
    case FILTERS_PANEL_VALUE:
      return { kind: 'filters' };
    case DETAIL_PANEL_VALUE:
      return parseDetailPanel(query, sections);
    default:
      return { kind: 'closed' };
  }
}

// Les autres paramètres de l'URL sont gardés : le panneau ne décide que des siens.
export function convertMapPanelToQuery(panel: MapPanel, query: Query): Query {
  const {
    [PANEL_PARAMETER]: _previousPanel,
    [SECTION_PARAMETER]: _previousSection,
    [LINE_PARAMETER]: _previousLine,
    ...otherParameters
  } = query;
  switch (panel.kind) {
    case 'closed':
      return otherParameters;
    case 'filters':
      return { ...otherParameters, [PANEL_PARAMETER]: FILTERS_PANEL_VALUE };
    case 'detail':
      return {
        ...otherParameters,
        [PANEL_PARAMETER]: DETAIL_PANEL_VALUE,
        [SECTION_PARAMETER]: panel.sectionName,
        [LINE_PARAMETER]: panel.line,
      };
  }
}

// Un tronçon partagé a un lien par Véloligne, chacun vers la page de sa Véloligne.
export function findSectionLink(
  features: ReadonlyArray<{ properties: { name: string; line: string; link?: string } }>,
  sectionName: string,
  line: string,
): string | undefined {
  return features.find((feature) => feature.properties.name === sectionName && feature.properties.line === line)
    ?.properties.link;
}

// Certains liens sont saisis encodés (%C3%A9) : l'ancre décodée est l'id du titre dans la page.
export function findLinkAnchor(link: string): string | undefined {
  const hashIndex = link.indexOf('#');
  return hashIndex === -1 ? undefined : decodeURIComponent(link.slice(hashIndex + 1));
}
