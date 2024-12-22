import { GeoJSONSource, Map } from 'maplibre-gl';
import { type Feature, type DisplayedLane, type LineStringFeature} from '~/types';
import { ref } from 'vue';

const { getNbVoiesCyclables } = useConfig();
enum DisplayedLayer {
  Progress = 0,
  Quality = 1,
  Type = 2,
  FinalizedProject = 3,
}

const displayedLayer = ref(DisplayedLayer.Progress);

const scaleDownPostponed = 0.6
const laneWidth = 4
const laneDashPlanned = [1.5, 0.4]
const laneDashPostponed = [laneDashPlanned[0] / scaleDownPostponed, laneDashPlanned[1] / scaleDownPostponed]
const laneDashWIP = [1.0, 1.05]

let layersWithLanes: string[] = []
let layerContour: string[] = []

const setDisplayedLayer = (value: DisplayedLayer) => {
  displayedLayer.value = value;
};

import { upsertMapSource } from './utils';

export { DisplayedLayer, setDisplayedLayer, drawCurrentNetwork, drawFinishedNetwork, drawLanesDone, drawLanesPlanned, drawLanesWIP, drawLanesPostponed, drawLanesAsDone, addListnersForHovering, setLanesColor };

let layersBase: string[] = []

function filterSections(lanes: DisplayedLane[], options: {done: boolean, wip: boolean, planned: boolean, postponed: boolean}): DisplayedLane[] {
    lanes = options.done ? lanes : lanes.filter(s => s.properties.status !== "done")
    lanes = options.wip ? lanes : lanes.filter(s => s.properties.status !== "wip")
    lanes = options.planned ? lanes : lanes.filter(s => s.properties.status !== "planned")
    lanes = options.postponed ? lanes : lanes.filter(s => s.properties.status !== "postponed")
    return lanes
}


function drawCurrentNetwork(map: Map, lanes: DisplayedLane[]) {

    let wasUpdatingAllSection = upsertMapSource(map, 'all-sections', lanes)
    let wasUpdatingAllSectionsDone = upsertMapSource(map, 'all-sections-done', filterSections(lanes, {done:true, wip:false, planned:false, postponed:false}))
    let wasUpdatingAllSectionWIP = upsertMapSource(map, 'all-sections-wip', filterSections(lanes, {done:false, wip:true, planned:false, postponed:false}))
    let wasUpdatingAllSectionPlanned = upsertMapSource(map, 'all-sections-planned', filterSections(lanes, {done:false, wip:false, planned:true, postponed:false}))
    let wasUpdatingAllSectionPostponed = upsertMapSource(map, 'all-sections-postponed', filterSections(lanes, {done:false, wip:false, planned:false, postponed:true}))
    let wasUpdatingAllSectionsNotPostponed = upsertMapSource(map, 'all-sections-not-postponed', filterSections(lanes, {done:true, wip:true, planned:true, postponed:false}))
    let wasUpdatingAllSectionDoneAndWip = upsertMapSource(map, 'all-sections-done-and-wip', filterSections(lanes, {done:true, wip:true, planned:false, postponed:false}))

    if (wasUpdatingAllSectionsDone && wasUpdatingAllSectionWIP && wasUpdatingAllSectionPlanned && wasUpdatingAllSection && wasUpdatingAllSectionsNotPostponed && wasUpdatingAllSectionPostponed && wasUpdatingAllSectionDoneAndWip) {
        return;
    }

    if (upsertMapSource(map, 'source-current-network-all-lanes', lanes)) {
        return;
    }

    // Done
    map.addLayer({
        id: 'layer-current-network-contour',
        type: 'line',
        source: 'all-sections-done-and-wip',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-gap-width': ["*", laneWidth, ['get', 'nb_lanes']],
        'line-width': 1.3,
        'line-color': '#000000',
        }
    });

    map.addLayer({
        id: `layer-current-network-all-lanes-done`,
        type: 'line',
        source: 'all-sections-done',
        paint: {
        'line-width': laneWidth,
        'line-color': ["to-color", ['get', 'color']],
        'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
        }
    });

    // WIP
    map.addLayer({
        id: `layer-current-network-all-lanes-wip-background`,
        type: 'line',
        source: 'all-sections-wip',
        paint: {
            'line-width': laneWidth,
            'line-color': "#fff",
            'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
            }
    });

    map.addLayer({
        id: `layer-current-network-all-lanes-wip-dashed`,
        type: 'line',
        source: 'all-sections-wip',
        paint: {
            'line-width': laneWidth,
            'line-color': ["to-color", ['get', 'color']],
            'line-dasharray': laneDashWIP,
            'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
            }
    });

    map.addLayer({
        id: `layer-current-network-all-lanes-wip-as-done`,
        type: 'line',
        source: 'all-sections-wip',
        paint: {
            'line-width': laneWidth,
            'line-color': ["to-color", ['get', 'color']],
            'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
            }
    });
    animateOpacity(map, 0, 1000*1.50, 'layer-current-network-all-lanes-wip-as-done', 'line-opacity', 0.0, 1.0);

    // Planned
    map.addLayer({
        id: 'layer-current-network-all-lanes-planned-contour',
        type: 'line',
        source: 'all-sections-planned',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-width': 1.3,
        'line-color': ["to-color", ['get', 'color']],
        'line-opacity' : 0.9,
        'line-gap-width': ["*", laneWidth, ['get', 'nb_lanes']],
        }
    });

    map.addLayer({
        id: `layer-current-network-all-lanes-planned-background`,
        type: 'line',
        source: 'all-sections-planned',
        paint: {
            'line-width': laneWidth,
            'line-color': ["to-color", ['get', 'color']],
            'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
            }
    });

    map.addLayer({
        id: `layer-current-network-all-lanes-planned-dashed`,
        type: 'line',
        source: 'all-sections-planned',
        paint: {
            'line-width': laneWidth * 0.95,
            'line-color': "#fff",
            'line-dasharray': laneDashPlanned,
            'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
            }
    });

    // Postponed
    map.addLayer({
        id: 'layer-current-network-all-lanes-postponed-contour',
        type: 'line',
        source: 'all-sections-postponed',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-gap-width': ["*", laneWidth * scaleDownPostponed, ['get', 'nb_lanes']],
        'line-width': 1.3 / 2,
        'line-opacity' : 0.9,
        'line-color': ["to-color", ['get', 'color']],
        }
    });

    map.addLayer({
        id: `layer-current-network-all-lanes-postponed-background`,
        type: 'line',
        source: 'all-sections-postponed',
        paint: {
            'line-width': laneWidth * scaleDownPostponed,
            'line-color': "#fff",
            'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
            }
    });

    map.addLayer({
        id: `layer-current-network-all-lanes-postponed-dashed`,
        type: 'line',
        source: 'all-sections-postponed',
        paint: {
            'line-width': laneWidth * scaleDownPostponed,
            'line-color': ["to-color", ['get', 'color']],
            'line-opacity' : 0.5,
            'line-dasharray': laneDashPostponed,
            'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
            }
    });

    let farZoom = 11
    let closeZoom = 14
    map.addLayer({
        id: `layer-current-network-all-lanes-postponed-symbols`,
        type: 'symbol',
        source: `all-sections-postponed`,
        paint: {
        'icon-color': '#000',
        'icon-halo-width': 2.5,
        'icon-halo-color': "#fff",
        'icon-opacity': 0.30
        },
        layout: {
        'symbol-placement': 'line',
        'symbol-spacing': [
            'interpolate',
            ['linear'],
            ['zoom'],
            farZoom, 1,
            closeZoom, 60
        ],
        'icon-image': "cross-icon",
        'icon-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            farZoom, 1,
            closeZoom, 2
            ],
        }
    });
}


function drawFinishedNetwork(map: Map, lanes: DisplayedLane[]) {

    const sections_sure = lanes.filter(s => s.properties.status !== "postponed")
    const sections_real = sections_sure.filter(s => s.properties.status !== "planned")


    let wasUpdatingAllMultiLane = upsertMapSource(map, 'all-multilanes', lanes)
    let wasUpdatingAllSection = upsertMapSource(map, 'all-sections', lanes)
    let wasUpdatingAllSectionSure = upsertMapSource(map, 'all-sections-sure', sections_sure)
    let wasUpdatingAllSectionReal = upsertMapSource(map, 'all-sections-real', sections_real)
    if (wasUpdatingAllMultiLane && wasUpdatingAllSection && wasUpdatingAllSectionSure && wasUpdatingAllSectionReal) {
        return;
    }

    if (upsertMapSource(map, 'source-finished-network-all-lanes', lanes)) {
        return;
    }

    map.addLayer({
        id: 'layer-finished-network-contour',
        type: 'line',
        source: 'source-finished-network-all-lanes',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-gap-width': ["*", laneWidth, ['get', 'nb_lanes']],
        'line-width': 1.3,
        'line-color': '#000000',
        }
    });

    map.addLayer({
        id: `layer-finished-network-all-lanes`,
        type: 'line',
        source: 'source-finished-network-all-lanes',
        paint: {
        'line-width': laneWidth,
        'line-color': ["to-color", ['get', 'color']],
        'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
        }
    });

    // drawSectionBackground(map);

    // drawSectionContour(map);

    // drawHoveredEffect(map);
}

function drawSectionBackground(map: Map) {
    let scaleUpFactor = 2
    map.addLayer({
        id: 'layer-grey-dashes',
        type: 'line',
        source: 'all-multilanes',
        paint: {
        'line-width': laneWidth,
        'line-color': "#000",
        'line-opacity': 0.25,
        'line-dasharray': [1.0, 0.5]
        }
    });

    map.addLayer({
        id: 'layer-background',
        type: 'line',
        source: 'all-sections',
        paint: {
        'line-opacity': 0.3,
        'line-width': laneWidth,
        'line-color': ["to-color", ['get', 'color']],
        'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
        }
    });
    layersBase.push("layer-background")

    map.addLayer({
        id: 'layer-background-sure',
        type: 'line',
        source: 'all-sections-sure',
        paint: {
        'line-width': laneWidth * scaleUpFactor,
        'line-color': ["to-color", ['get', 'color']],
        'line-opacity': 0.5,
        'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth * scaleUpFactor], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth * scaleUpFactor], 2]],
        }
    });
    layersBase.push("layer-background-sure")

    map.addLayer({
        id: 'layer-background-white',
        type: 'line',
        source: 'all-sections-sure',
        paint: {
        'line-width': laneWidth,
        'line-color': "#ffffff",
        'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]]
        }
    });
    layersBase.push("layer-background-white")

    map.addLayer({
        id: 'layer-background-white-line',
        type: 'line',
        source: 'all-sections',
        paint: {
        'line-width': laneWidth / 2,
        'line-color': "#ffffff",
        'line-opacity': 0.9
        }
    });
    layersBase.push("layer-background-white-line")
}

function drawHoveredEffect(map: Map) {
    map.addLayer({
        id: 'highlight',
        type: 'line',
        source: 'all-sections',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-gap-width': ["case",
                ["==", ['get', 'status'], "postponed"], ["*", 5, ['get', 'nb_lanes']],
                ["*", 9, ['get', 'nb_lanes']]
        ],
        'line-width': laneWidth,
        'line-color': ['case', ['boolean', ['feature-state', 'hover'], false], '#7c838f', '#FFFFFF'],
        "line-opacity": ['case', ['boolean', ['feature-state', 'hover'], false], 0.9, 0.0],
        }
    });
}

function drawSectionContour(map: Map) {
    map.addLayer({
        id: 'layer-contour',
        type: 'line',
        source: 'all-sections-real',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-gap-width': ["*", laneWidth, ['get', 'nb_lanes']],
        'line-width': 1.3,
        'line-color': '#000000',
        }
    });
    layerContour.push("layer-contour")
}

function drawLanesDone(map: Map, lanes: DisplayedLane[]) {

    let lanes_done = lanes.filter(lane => lane.properties.status === "done");
    if (upsertMapSource(map, 'source-all-lanes-done', lanes_done)) {
        return;
    }

    map.addLayer({
        id: `layer-lanes-done`,
        type: 'line',
        source: 'source-all-lanes-done',
        paint: {
        'line-width': laneWidth,
        'line-color': ["to-color", ['get', 'color']],
        'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
        }
    });
    layersWithLanes.push("layer-lanes-done")
}

function drawLanesAsDone(map: Map, lanes: DisplayedLane[]) {

    if (upsertMapSource(map, 'source-all-lanes-asdone', lanes)) {
        return;
    }

    map.addLayer({
        id: `layer-lanes-asdone`,
        type: 'line',
        source: 'source-all-lanes-asdone',
        paint: {
        'line-width': laneWidth,
        'line-color': ["to-color", ['get', 'color']],
        'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
        }
    });
}

function drawLanesWIP(map: Map, lanes: DisplayedLane[]) {

    let lanes_wip = lanes.filter(lane => lane.properties.status === "wip" || lane.properties.status === "tested");
    if (upsertMapSource(map, 'source-all-lanes-wip', lanes_wip)) {
        return;
    }

    map.addLayer({
        id: `layer-lanes-wip`,
        type: 'line',
        source: 'source-all-lanes-wip',
        paint: {
        'line-width': laneWidth,
        'line-color': ["to-color", ['get', 'color']],
        'line-dasharray': laneDashWIP,
        'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
        }
    });
    layersWithLanes.push("layer-lanes-wip")
    map.addLayer({
        id: 'layer-lanes-wip-done',
        type: 'line',
        source: 'source-all-lanes-wip',
        paint: {
        'line-width': laneWidth,
        'line-color': ["to-color", ['get', 'color']],
        'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
        }
    });
    layersWithLanes.push("layer-lanes-wip-done")
    animateOpacity(map, 0, 1000*1.50, 'layer-lanes-wip-done', 'line-opacity', 0.0, 1.0);
}


function drawLanesPlanned(map: Map, lanes: DisplayedLane[]) {

    let lanes_planned = lanes.filter(lane => lane.properties.status === "planned" || lane.properties.status === "postponed");
    if (upsertMapSource(map, 'source-all-lanes-planned', lanes_planned)) {
        return;
    }

    map.addLayer({
        id: `layer-lanes-planned`,
        type: 'line',
        source: 'source-all-lanes-planned',
        paint: {
        'line-width': laneWidth,
        'line-color': ["to-color", ['get', 'color']],
        'line-opacity': 0.50,
        'line-dasharray': laneDashPlanned,
        'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
        }
    });
    layersWithLanes.push("layer-lanes-planned")
    layersBase.push("layer-lanes-planned")
}

function drawLanesPostponed(map: Map, lanes: DisplayedLane[]) {

    let lanes_postponed = lanes.filter(lane => lane.properties.status === "postponed");
    if (upsertMapSource(map, 'source-all-lanes-postponed', lanes_postponed)) {
        return;
    }

    let farZoom = 11
    let closeZoom = 14
    map.addLayer({
        id: `layer-lanes-postponed-symbols`,
        type: 'symbol',
        source: `source-all-lanes-postponed`,
        paint: {
        'icon-color': '#000',
        'icon-halo-width': 2.5,
        'icon-halo-color': "#fff",
        'icon-opacity': 0.30
        },
        layout: {
        'symbol-placement': 'line',
        'symbol-spacing': [
            'interpolate',
            ['linear'],
            ['zoom'],
            farZoom, 1,
            closeZoom, 60
        ],
        'icon-image': "cross-icon",
        'icon-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            farZoom, 1,
            closeZoom, 2
            ],
        }
    });
}


function animateOpacity(map: Map, timestamp: number, animationLength: number, attributeId: string, attributeOpacity: string, min: number, max: number) {

    function subAnimateOpacity(timestamp: number) {
        const opacity010 = Math.abs((((timestamp * 2) * (1 / animationLength)) % 2) - 1)
        const opacity = opacity010 * (max - min) + min
        map.setPaintProperty(attributeId, attributeOpacity, opacity);

        // Request the next frame of the animation.
        requestAnimationFrame(subAnimateOpacity);
    }
    subAnimateOpacity(timestamp)
}


    // function drawLanesVariante(map: Map, lanes: DisplayedLane[]) {

    //   let lanes_variante = lanes.filter(lane => lane.properties.status === "variante");
    //   if (upsertMapSource(map, 'source-all-lanes-variante', lanes_variante)) {
    //     return;
    //   }

    //   map.addLayer({
    //     id: 'layer-lanes-variante',
    //     type: 'line',
    //     source: 'source-all-lanes-variante',
    //     paint: {
    //       'line-width': laneWidth,
    //       'line-color': ["to-color", ['get', 'color']],
    //       'line-dasharray': [2, 2],
    //       'line-opacity': 0.5,
    //       'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
    //     }
    //   });
    //   layersWithLanes.push("layer-lanes-variante")
    // }

    // function drawLanesVariantePostponed(map: Map, lanes: DisplayedLane[]) {

    //   let lanes_variante_postponed = lanes.filter(lane => lane.properties.status === "variante-postponed");
    //   if (upsertMapSource(map, 'source-all-lanes-variante-postponed', lanes_variante_postponed)) {
    //     return;
    //   }

    //   map.addLayer({
    //     id: 'layer-lanes-variante-postponed',
    //     type: 'line',
    //     source: 'source-all-lanes-variante-postponed',
    //     paint: {
    //       'line-width': laneWidth,
    //       'line-color': ["to-color", ['get', 'color']],
    //       'line-dasharray': [2, 2],
    //       'line-opacity': 0.5,
    //       'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
    //     }
    //   });
    //   layersWithLanes.push("layer-lanes-variante-postponed")
    // }

    // function drawLanesUnknown(map: Map, lanes: DisplayedLane[]) {

    //   let lanes_unknown = lanes.filter(lane => lane.properties.status === "unknown");
    //   if (upsertMapSource(map, 'source-all-lanes-unknown', lanes_unknown)) {
    //     return;
    //   }

    //   map.addLayer({
    //     id: 'layer-lanes-unknown',
    //     type: 'line',
    //     source: 'source-all-lanes-unknown',
    //     layout: {
    //       'line-cap': 'round'
    //     },
    //     paint: {
    //       'line-width': [
    //         'interpolate',
    //         ['linear'],
    //         ['zoom'],
    //         11,
    //         4, // width 4 at low zoom
    //         14,
    //         25 // progressively reach width 25 at high zoom
    //       ],
    //       'line-color': ["to-color", ['at', 0, ['get', 'colors']]],
    //       'line-opacity': [
    //         'interpolate',
    //         ['linear'],
    //         ['zoom'],
    //         11,
    //         0.5, // opacity 0.4 at low zoom
    //         14,
    //         0.35 // opacity 0.35 at high zoom
    //       ]
    //     }
    //   });
    //   layersWithLanes.push("layer-lanes-unknown")
    // }

function addListnersForHovering(map: Map) {

    // Add MouveMove event listner => maybe a section is hovered
    let hoveredLineId: any = null;
    map.on('mousemove', 'highlight', (e: any) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features.length > 0) {
        if (hoveredLineId !== null) {
            map.setFeatureState({ source: 'all-sections', id: hoveredLineId }, { hover: false });
        }
        if (e.features[0].id !== undefined) {
            hoveredLineId = e.features[0].id;
            if (hoveredLineId !== null) {
            map.setFeatureState({ source: 'all-sections', id: hoveredLineId }, { hover: true });
            }
        }
        }
    });

    // Add MouveLeave event listner => all sections are no hovered
    map.on('mouseleave', 'highlight', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredLineId !== null) {
        map.setFeatureState({ source: 'all-sections', id: hoveredLineId }, { hover: false });
        }
        hoveredLineId = null;
    });
}








// function drawLanesVariante(map: Map, lanes: DisplayedLane[]) {

//   let lanes_variante = lanes.filter(lane => lane.properties.status === "variante");
//   if (upsertMapSource(map, 'source-all-lanes-variante', lanes_variante)) {
//     return;
//   }

//   map.addLayer({
//     id: 'layer-lanes-variante',
//     type: 'line',
//     source: 'source-all-lanes-variante',
//     paint: {
//       'line-width': laneWidth,
//       'line-color': ["to-color", ['get', 'color']],
//       'line-dasharray': [2, 2],
//       'line-opacity': 0.5,
//       'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
//     }
//   });
//   layersWithLanes.push("layer-lanes-variante")
// }

// function drawLanesVariantePostponed(map: Map, lanes: DisplayedLane[]) {

//   let lanes_variante_postponed = lanes.filter(lane => lane.properties.status === "variante-postponed");
//   if (upsertMapSource(map, 'source-all-lanes-variante-postponed', lanes_variante_postponed)) {
//     return;
//   }

//   map.addLayer({
//     id: 'layer-lanes-variante-postponed',
//     type: 'line',
//     source: 'source-all-lanes-variante-postponed',
//     paint: {
//       'line-width': laneWidth,
//       'line-color': ["to-color", ['get', 'color']],
//       'line-dasharray': [2, 2],
//       'line-opacity': 0.5,
//       'line-offset': ['-', ['*', ['get', 'lane_index'], laneWidth], ['/', ['*', ['-', ['get', 'nb_lanes'], 1], laneWidth], 2]],
//     }
//   });
//   layersWithLanes.push("layer-lanes-variante-postponed")
// }

// function drawLanesUnknown(map: Map, lanes: DisplayedLane[]) {

//   let lanes_unknown = lanes.filter(lane => lane.properties.status === "unknown");
//   if (upsertMapSource(map, 'source-all-lanes-unknown', lanes_unknown)) {
//     return;
//   }

//   map.addLayer({
//     id: 'layer-lanes-unknown',
//     type: 'line',
//     source: 'source-all-lanes-unknown',
//     layout: {
//       'line-cap': 'round'
//     },
//     paint: {
//       'line-width': [
//         'interpolate',
//         ['linear'],
//         ['zoom'],
//         11,
//         4, // width 4 at low zoom
//         14,
//         25 // progressively reach width 25 at high zoom
//       ],
//       'line-color': ["to-color", ['at', 0, ['get', 'colors']]],
//       'line-opacity': [
//         'interpolate',
//         ['linear'],
//         ['zoom'],
//         11,
//         0.5, // opacity 0.4 at low zoom
//         14,
//         0.35 // opacity 0.35 at high zoom
//       ]
//     }
//   });
//   layersWithLanes.push("layer-lanes-unknown")
// }

function setLanesColor(map: Map, displayedLayer: DisplayedLayer) {
    // layerContour.forEach(l => {
    //   if(displayedLayer !== DisplayedLayer.Progress) {
    //     map.setPaintProperty(l, "line-opacity", 0.1);
    //   } else {
    //     map.setPaintProperty(l, "line-opacity", 1.0);
    //   }
    // })

    for(let layerName of layersBase) {
        map.setLayoutProperty(layerName, 'visibility', "visible")
    }
    map.setLayoutProperty('layer-lanes-asdone', 'visibility', (displayedLayer === DisplayedLayer.FinalizedProject) ? "visible" : "none")

    layersWithLanes.forEach(l => {

        if (displayedLayer == DisplayedLayer.Quality) {
        for(let layerName of layersBase) {
            map.setLayoutProperty(layerName, 'visibility', "none")
        }
        map.setPaintProperty(l, "line-color", ["case",
            ["==", ['get', 'quality'], "bad"], "#ff6961",
            ["==", ['get', 'quality'], "fair"], "#F3F32A",
            ["==", ['get', 'quality'], "good"], "#77dd77",
            ["==", ['get', 'status'], "done"], "#000000",
            "white"
        ]);
        // } else if (displayedLayer == DisplayedLayer.Progress) {
        //   map.setPaintProperty(l, "line-color", ["case",
        //     ["==", ['get', 'status'], "done"], "#92c5de",
        //     ["==", ['get', 'status'], "wip"], "#92c5de",
        //     ["==", ['get', 'status'], "planned"], "#f4a582",
        //     ["==", ['get', 'status'], "postponed"], "#d6604d",
        //     "white"
        //   ]);
        } else if (displayedLayer == DisplayedLayer.Progress) {
        map.setPaintProperty(l, "line-color", ["to-color", ['get', 'color']]);
        } else if (displayedLayer == DisplayedLayer.Type) {
        map.setPaintProperty(l, "line-color", ["case",
            ["==", ['get', 'type'], "bidirectionnelle"], "#b3c6ff", // bleu
            ["==", ['get', 'type'], "bilaterale"], "#b3fbff", // cyan
            ["==", ['get', 'type'], "bandes-cyclables"], "#c1b3ff", // bleu-violet
            ["==", ['get', 'type'], "voie-bus"], "#fbb3ff", // violet
            ["==", ['get', 'type'], "voie-bus-elargie"], "#e1b3ff", // violet
            ["==", ['get', 'type'], "velorue"], "#fffbb3", // jaune
            ["==", ['get', 'type'], "voie-verte"], "#b3ffb6", // vert
            ["==", ['get', 'type'], "zone-de-rencontre"], "#daffb3", // vert clair
            ["==", ['get', 'type'], "chaucidou"], "#ffeab3", // orange
            ["==", ['get', 'type'], "heterogene"], "#797979", // gris foncé
            ["==", ['get', 'type'], "aucun"], "#ff9999", // rouge
            ["==", ['get', 'status'], "done"], "#000000", // black
            ["==", ['get', 'type'], "inconnu"], "#dedede", // gris
            "white"
        ]);
        }
    });
}