import type { Map } from 'maplibre-gl';
import { isDangerFeature, isPumpFeature, isPerspectiveFeature, type Feature, isPolygonFeature } from '~/types';
import { ref } from 'vue';

import { upsertMapSource } from './utils';

enum DisplayedLayer {
  Progress = 0,
  Quality = 1,
  Type = 2,
  FinalizedProject = 3,
}

const displayedLayer = ref(DisplayedLayer.Progress);

const setDisplayedLayer = (value: DisplayedLayer) => {
  displayedLayer.value = value;
};

export { DisplayedLayer, setDisplayedLayer };

const { getLineColor } = useColors();

export { plotPerspective, plotDangers, plotLimits, plotPumps };

function plotPerspective({ map, features }: { map: Map; features: Feature[] }) {
  const perspectives = features.filter(isPerspectiveFeature).map((feature) => ({
    ...feature,
    properties: {
      color: getLineColor(feature.properties.line),
      ...feature.properties,
    },
  }));
  if (perspectives.length === 0) {
    return;
  }

  if (upsertMapSource(map, 'perspectives', perspectives)) {
    return;
  }

  map.addLayer({
    id: 'perspectives',
    source: 'perspectives',
    type: 'symbol',
    layout: {
      'icon-image': 'camera-icon',
      'icon-size': 0.5,
      'icon-offset': [-25, -25],
    },
    paint: {
      'icon-color': ['to-color', ['at', 0, ['get', 'colors']]],
    },
  });

  // on n'affiche les perspectives qu'à partir d'un certain zoom.
  // ceci pour éviter de surcharger la map.
  map.setLayoutProperty('perspectives', 'visibility', 'none');
  map.on('zoom', () => {
    const zoomLevel = map.getZoom();
    if (zoomLevel > 14) {
      map.setLayoutProperty('perspectives', 'visibility', 'visible');
    } else {
      map.setLayoutProperty('perspectives', 'visibility', 'none');
    }
  });

  // la souris devient un pointer au survol
  map.on('mouseenter', 'perspectives', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'perspectives', () => {
    map.getCanvas().style.cursor = '';
  });
}

function plotLimits({ map, features }: { map: Map; features: Feature[] }) {
  const limits = features.filter(isPolygonFeature);
  if (limits.length == 0) {
    return;
  }

  const limitsWithId = limits.map((feature, index) => ({ id: index, ...feature }));

  if (limitsWithId.length === 0 && !map.getLayer('limits')) {
    return;
  }

  if (upsertMapSource(map, 'all-limits', limitsWithId)) {
    return;
  }

  drawLimits(map);
}

function drawLimits(map: Map) {
  map.addLayer({
    id: 'limits',
    type: 'line',
    source: 'all-limits',
    layout: {
      visibility: 'none',
    },
    paint: {
      'line-width': 3.0,
      'line-dasharray': [2.2, 2.2],
      'line-color': '#cc0000',
      'line-opacity': 0.55,
    },
  });
}

function plotDangers({ map, features }: { map: Map; features: Feature[] }) {
  const dangers = features.filter(isDangerFeature);
  if (dangers.length === 0) {
    return;
  }

  if (upsertMapSource(map, 'dangers', dangers)) {
    return;
  }

  map.addLayer({
    id: 'dangers',
    source: 'dangers',
    type: 'symbol',
    layout: {
      'icon-image': 'danger-icon',
      'icon-size': 0.5,
    },
  });
  map.setLayoutProperty('perspectives', 'visibility', 'none');
  map.on('zoom', () => {
    const zoomLevel = map.getZoom();
    if (zoomLevel > 14) {
      map.setLayoutProperty('dangers', 'visibility', 'visible');
    } else {
      map.setLayoutProperty('dangers', 'visibility', 'none');
    }
  });
}

function plotPumps({ map, features }: { map: Map; features: Feature[] }) {
  const pumps = features.filter(isPumpFeature);
  if (pumps.length === 0) {
    return;
  }
  if (upsertMapSource(map, 'pumps', pumps)) {
    return;
  }
  map.addLayer({
    id: 'pumps',
    source: 'pumps',
    type: 'symbol',
    layout: {
      'icon-image': 'pump-icon',
      'icon-size': 0.5,
      'icon-offset': [-25, -25],
    },
    paint: {
      'icon-color': '#152B68',
    },
  });
}
