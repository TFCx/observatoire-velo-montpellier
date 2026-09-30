// Panneau de chantier (barrière jaune et noire) des tronçons en travaux.
// Porté depuis lyon@1f340ad3 (« option de réduire les animations »), helpers/map-utils.ts.
// Fichier sans MapLibre : components/ConstructionIcon.vue, qui dessine le même panneau dans les textes,
// l'importe aussi, et ne doit pas tirer MapLibre dans le bundle des pages sans carte.

export const CONSTRUCTION_ICON_VIEWBOX_SIZE = 24;
export const CONSTRUCTION_ICON_FILL = '#FFCC00';
export const CONSTRUCTION_ICON_STROKE = '#000000';
export const CONSTRUCTION_ICON_STROKE_WIDTH = 2;
export const CONSTRUCTION_ICON_BARRIER = { x: 2, y: 6, width: 20, height: 8, radius: 1 };
export const CONSTRUCTION_ICON_SEGMENTS: [[number, number], [number, number]][] = [
  // Poteaux au-dessus et au-dessous de la barrière
  [
    [17, 3],
    [17, 6],
  ],
  [
    [7, 3],
    [7, 6],
  ],
  [
    [17, 14],
    [17, 21],
  ],
  [
    [7, 14],
    [7, 21],
  ],
  // Bandes obliques
  [
    [10, 14],
    [2.3, 6.3],
  ],
  [
    [14, 6],
    [21.7, 13.7],
  ],
  [
    [8, 6],
    [16, 14],
  ],
];

// Image de la carte (symboles le long du tracé) : 48 px de côté, soit le dessin en 24 × 24 agrandi deux fois.
export function createConstructionIcon(pixelRatio = 1): HTMLCanvasElement {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = size * pixelRatio;
  canvas.height = size * pixelRatio;

  const context = canvas.getContext('2d');
  if (!context) {
    return canvas;
  }
  const scale = (size / CONSTRUCTION_ICON_VIEWBOX_SIZE) * pixelRatio;
  context.scale(scale, scale);
  context.lineWidth = CONSTRUCTION_ICON_STROKE_WIDTH;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.fillStyle = CONSTRUCTION_ICON_FILL;
  context.strokeStyle = CONSTRUCTION_ICON_STROKE;

  const barrier = CONSTRUCTION_ICON_BARRIER;
  context.beginPath();
  context.roundRect(barrier.x, barrier.y, barrier.width, barrier.height, barrier.radius);
  context.fill();
  context.stroke();

  for (const [[startX, startY], [endX, endY]] of CONSTRUCTION_ICON_SEGMENTS) {
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();
  }
  return canvas;
}
