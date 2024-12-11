import { GeoJSONSource, Map } from 'maplibre-gl';
import { type Feature, type LineStringFeature} from '~/types';

export { sortOrder, sortByLine, getCrossIconUrl, upsertMapSource };

function upsertMapSource(map: Map, sourceName: string, features: Feature[]) {
    const source = map.getSource(sourceName) as GeoJSONSource;
    if (source) {
        source.setData({ type: 'FeatureCollection', features });
        return true;
    }
    map.addSource(sourceName, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features }
    });
    return false;
}


// features plotted last are on top
const sortOrder = ["Anneau", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "A", "B", "C", "D"].reverse();

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
