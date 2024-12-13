
import { Map } from 'maplibre-gl';
import { isCompteurFeature, isDangerFeature, isPumpFeature, isPerspectiveFeature, type Feature, isPolygonFeature} from '~/types';
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

export { plotPerspective, plotCompteurs, plotDangers, plotLimits, plotPumps, plotBaseBikeInfrastructure };

function plotPerspective({ map, features }: { map: Map; features: Feature[] }) {
    const perspectives = features.filter(isPerspectiveFeature).map(feature => ({
      ...feature,
      properties: {
        color: getLineColor(feature.properties.line),
        ...feature.properties
      }
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
        'icon-offset': [-25, -25]
      },
      paint: {
        'icon-color': ["to-color", ['at', 0, ['get', 'colors']]]
      }
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

  function plotLimits({ map, features }: { map: Map, features: Feature[] }) {

    const limits = features.filter(isPolygonFeature);
    if(limits.length == 0) {
      return
    }

    const limitsWithId = limits.map((feature, index) => ({ id: index, ...feature }));

    if (limitsWithId.length === 0 && !map.getLayer('limits')) {
      return;
    }

    if (upsertMapSource(map, 'all-limits', limitsWithId)) {
      return;
    }

    drawLimits(map)
  }



    function drawLimits(map: Map) {
        map.addLayer({
        id: 'limits',
        type: 'line',
        source: 'all-limits',
        layout: {
            visibility: "none"
        },
        paint: {
            'line-width': 3.0,
            'line-dasharray': [2.2, 2.2],
            'line-color': '#cc0000',
            'line-opacity': 0.55
        }
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
        'icon-size': 0.5
      }
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
        'icon-offset': [-25, -25]
      },
      paint: {
        'icon-color': '#152B68'
      }
    });
  }

  function plotCompteurs({ map, features }: { map: Map; features: Feature[] }) {
    const compteurs = features.filter(isCompteurFeature);
    if (compteurs.length === 0) {
      return;
    }
    compteurs
      .sort((c1, c2) => (c2.properties.counts.at(-1)?.count ?? 0) - (c1.properties.counts.at(-1)?.count ?? 0))
      .map((c, i) => {
        // top counters are bigger and drawn above others
        const top = 10;
        c.properties.circleSortKey = i < top ? 1 : 0;
        c.properties.circleRadius = i < top ? 10 : 7;
        c.properties.circleStrokeWidth = i < top ? 3 : 0;
        return c;
      });

    map.addSource('compteurs', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: compteurs
      }
    });
    map.addLayer({
      id: 'compteurs',
      source: 'compteurs',
      type: 'circle',
      layout: {
        'circle-sort-key': ['get', 'circleSortKey']
      },
      paint: {
        'circle-color': '#152B68',
        'circle-stroke-color': '#fff',
        'circle-stroke-width': ['get', 'circleStrokeWidth'],
        'circle-radius': ['get', 'circleRadius']
      }
    });
    map.on('mouseenter', 'compteurs', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'compteurs', () => (map.getCanvas().style.cursor = ''));
  }


// plot base bike infrastructure from OSM API
async function plotBaseBikeInfrastructure(map: Map) {

    // Overpass request
    const basehttp = 'https://overpass-api.de/api/interpreter?data=[out:json];'
    const request = 'area["name"="Montpellier"]->.searchArea;(way["highway"~"cycleway|cycleway_lane|cycleway_track"](area.searchArea);way["bicycle"~"designated"](area.searchArea);way["cycleway:left"="track"](area.searchArea);way["cycleway:right"="track"](area.searchArea);way["cycleway:left"="opposite_track"](area.searchArea);way["cycleway:right"="opposite_track"](area.searchArea);way["cycleway:left"="lane"](area.searchArea);way["cycleway:right"="lane"](area.searchArea););out ids geom;>;out skel qt;'

    const apiUrl = basehttp + encodeURI(request)
    const data = await fetchBikeLanesGeojsonData(apiUrl);

    map.addSource('source-base-infrastructure', {
      type: 'geojson',
      data: data
    });

    const lw = 2.2

    map.addLayer({
        id: 'layer-underline-base-infrastructure',
        type: 'line',
        source: 'source-base-infrastructure',
        layout: {
          visibility: "none"
        },
        paint: {
          'line-width': lw,
          'line-color': '#000055',
          'line-opacity': 0.8
        }
      },
      'highlight' // push layer to the background
    );
  }

  async function fetchBikeLanesGeojsonData(apiUrl: string): Promise<any> {
    const response = await fetch(apiUrl);
    const data = await response.json();

    const geojson = {
      type: 'FeatureCollection',
      features: data.elements.map((element: any) => {
        if (!element.geometry) return [];
        const feature = {
          type: 'Feature',
          properties: {
            id: element.id,
            tags: element.tags
          },
          geometry: {
            type: 'LineString',
            coordinates: element.geometry.map((geometry: any) => {
              return [geometry.lon, geometry.lat];
            })
          }
        };
        return feature;
      })
    };

    geojson.features = geojson.features.filter((feature: any) => feature.type);

    return geojson;
  }