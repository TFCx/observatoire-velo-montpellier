// Règles du bottom sheet de la carte interactive sur les petits écrans (ADR 0011). Seuils repris de
// Cyclopolis : ouvert à mi-hauteur, réglable de 200 px à 90 % de l'écran, fermé lâché sous 150 px.

export type PanelDisplay = 'side-panel' | 'bottom-sheet';

export type BottomSheetRelease = { kind: 'closed' } | { kind: 'open'; height: number };

export type FramingPadding = { top: number; right: number; bottom: number; left: number };

const DEFAULT_HEIGHT_RATIO = 0.5;
const MAXIMUM_HEIGHT_RATIO = 0.9;
const MINIMUM_OPEN_HEIGHT = 200;
const CLOSING_HEIGHT = 150;
const MARGIN_AROUND_SECTION = 60;

export function getDefaultBottomSheetHeight(viewportHeight: number): number {
  return viewportHeight * DEFAULT_HEIGHT_RATIO;
}

export function clampDraggedBottomSheetHeight(height: number, viewportHeight: number): number {
  return Math.min(Math.max(height, 0), viewportHeight * MAXIMUM_HEIGHT_RATIO);
}

// Sur un écran de moins de 222 px de haut, 90 % de l'écran passe sous 200 px : le plafond l'emporte.
export function releaseBottomSheet(height: number, viewportHeight: number): BottomSheetRelease {
  if (height < CLOSING_HEIGHT) {
    return { kind: 'closed' };
  }
  const maximumHeight = viewportHeight * MAXIMUM_HEIGHT_RATIO;
  return { kind: 'open', height: Math.min(Math.max(height, MINIMUM_OPEN_HEIGHT), maximumHeight) };
}

// Le bottom sheet recouvre le bas de la carte, qui va jusqu'en bas de l'écran : le tronçon est cadré
// au-dessus du bottom sheet ouvert à mi-hauteur, pas au-dessus de la hauteur réglée au doigt.
export function computeSectionFramingPadding(display: PanelDisplay, viewportHeight: number): FramingPadding {
  const bottomSheetHeight = display === 'bottom-sheet' ? getDefaultBottomSheetHeight(viewportHeight) : 0;
  return {
    top: MARGIN_AROUND_SECTION,
    right: MARGIN_AROUND_SECTION,
    bottom: MARGIN_AROUND_SECTION + bottomSheetHeight,
    left: MARGIN_AROUND_SECTION,
  };
}
