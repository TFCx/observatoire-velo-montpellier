import type { GeoJSONSource, Map } from 'maplibre-gl';
import { LngLatBounds } from 'maplibre-gl';
import {
  isLineStringFeature,
  isPointFeature,
  type Feature,
  type LineStringFeature,
  type SectionFeature,
} from '~/types';

export { sortOrder, sortByLine, getCrossIconUrl, upsertMapSource, fitBounds, fitSectionBounds };

function upsertMapSource(map: Map, sourceName: string, features: Feature[]) {
  const source = map.getSource(sourceName) as GeoJSONSource;
  if (source) {
    source.setData({ type: 'FeatureCollection', features });
    return true;
  }
  map.addSource(sourceName, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features },
    promoteId: 'name',
  });
  return false;
}

// features plotted last are on top
const sortOrder = ['Anneau', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'A', 'B', 'C', 'D'].reverse();

function sortByLine(featureA: LineStringFeature, featureB: LineStringFeature) {
  const lineA = featureA.properties.line;
  const lineB = featureB.properties.line;
  return sortOrder.indexOf(lineA) - sortOrder.indexOf(lineB);
}

function getCrossIconUrl(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 8; // Set the desired width of your icon
  canvas.height = 8; // Set the desired height of your icon
  const context = canvas.getContext('2d');
  if (!context) {
    return '';
  }

  // Draw the first diagonal line of the "X"
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(canvas.width, canvas.height);
  context.lineWidth = 3;
  context.stroke();

  // Draw the second diagonal line of the "X"
  context.beginPath();
  context.moveTo(0, canvas.height);
  context.lineTo(canvas.width, 0);
  context.lineWidth = 3;
  context.stroke();

  return canvas.toDataURL();
}

function fitBounds({ map, features }: { map: Map; features: Feature[] }) {
  const allLineStringsCoordinates = features
    .filter(isLineStringFeature)
    .map((feature) => feature.geometry.coordinates)
    .flat();

  const allPointsCoordinates = features.filter(isPointFeature).map((feature) => feature.geometry.coordinates);

  if (allPointsCoordinates.length === 0 && allLineStringsCoordinates.length === 0) {
    return;
  }

  if (features.length === 1 && allPointsCoordinates.length === 1) {
    map.flyTo({ center: allPointsCoordinates[0] });
  } else {
    const bounds = new LngLatBounds(allLineStringsCoordinates[0], allLineStringsCoordinates[0]);
    for (const coord of [...allLineStringsCoordinates, ...allPointsCoordinates]) {
      bounds.extend(coord);
    }
    map.fitBounds(bounds, { padding: 20 });
  }
}

// Cadrage sur le tronçon du panneau de détail (ADR 0010) : au zoom d'ensemble, un tronçon ne fait que
// quelques pixels. Le zoom maximal garde autour d'un tronçon très court les rues qui le situent.
const MAXIMUM_ZOOM_ON_SECTION = 15;
const PADDING_AROUND_SECTION = 60;

function fitSectionBounds(map: Map, section: SectionFeature) {
  const [firstCoordinate, ...otherCoordinates] = section.geometry.coordinates;
  if (!firstCoordinate) {
    return;
  }
  const bounds = new LngLatBounds(firstCoordinate, firstCoordinate);
  for (const coordinate of otherCoordinates) {
    bounds.extend(coordinate);
  }
  map.fitBounds(bounds, { padding: PADDING_AROUND_SECTION, maxZoom: MAXIMUM_ZOOM_ON_SECTION });
}
