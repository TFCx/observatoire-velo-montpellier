import { GeoJSONSource, Map, type ExpressionSpecification } from 'maplibre-gl';
import { type Feature, type LaneFeature, type LineStringFeature, type SectionFeature} from '~/types';
import { ref } from 'vue';

const { getNbVoiesCyclables } = useConfig();
enum DisplayedLayer {
  Progress = 0,
  Quality = 1,
  Type = 2,
  FinalizedProject = 3,
}

const displayedLayer = ref(DisplayedLayer.Progress);


const scaleDownPostponed = 0.70
const laneWidth = 4
const laneDashPlanned = [1.7, 0.5]
const laneDashPostponed = [laneDashPlanned[0] / scaleDownPostponed, laneDashPlanned[1] / scaleDownPostponed]
const laneDashWIP = [1.0, 1.05]

const nbLanes: ExpressionSpecification = ['get', 'nb_lanes']
const laneIndex: ExpressionSpecification = ['get', 'lane_index']
const allLanesWidth: ExpressionSpecification = ["*", laneWidth, nbLanes]
const sectionWidth: ExpressionSpecification = ['*', laneWidth, ['length', ['get', 'lines']]]
const halfLaneWidth: ExpressionSpecification = ["/", laneWidth, 2]
const laneColor: ExpressionSpecification = ["to-color", ['get', 'color']]
const leftmostOffset: ExpressionSpecification = ['+', ['-', 0, ["/", allLanesWidth, 2]], halfLaneWidth]
const offsetLane: ExpressionSpecification = ['+', leftmostOffset, ['*', laneIndex, laneWidth]]


let layersWithLanes: string[] = []
let layerContour: string[] = []

const setDisplayedLayer = (value: DisplayedLayer) => {
  displayedLayer.value = value;
};

import { upsertMapSource } from './utils';

export { DisplayedLayer, setDisplayedLayer, drawCurrentNetwork, drawFinishedNetwork, addListnersForHovering };

let layersBase: string[] = []

function filterSections(sections: SectionFeature[], options: {done: boolean, wip: boolean, planned: boolean, postponed: boolean}): SectionFeature[] {
    sections = options.done ? sections : sections.filter(s => s.properties.status !== "done")
    sections = options.wip ? sections : sections.filter(s => s.properties.status !== "wip")
    sections = options.planned ? sections : sections.filter(s => s.properties.status !== "planned")
    sections = options.postponed ? sections : sections.filter(s => s.properties.status !== "postponed")
    return sections
}

function filterLanes(lanes: LaneFeature[], options: {done: boolean, wip: boolean, planned: boolean, postponed: boolean}): LaneFeature[] {
    lanes = options.done ? lanes : lanes.filter(s => s.properties.status !== "done")
    lanes = options.wip ? lanes : lanes.filter(s => s.properties.status !== "wip")
    lanes = options.planned ? lanes : lanes.filter(s => s.properties.status !== "planned")
    lanes = options.postponed ? lanes : lanes.filter(s => s.properties.status !== "postponed")
    return lanes
}


function drawCurrentNetwork(map: Map, sections: SectionFeature[], lanes: LaneFeature[]) {

    let wasUpdatingAllSection = upsertMapSource(map, 'all-sections', sections)
    let wasOnlyUpdatingAllLanesDone = upsertMapSource(map, 'all-lanes-done', filterLanes(lanes, {done:true, wip:false, planned:false, postponed:false}))
    let wasOnlyUpdatingAllLanesWIP = upsertMapSource(map, 'all-lanes-wip', filterLanes(lanes, {done:false, wip:true, planned:false, postponed:false}))
    let wasOnlyUpdatingAllLanesPlanned = upsertMapSource(map, 'all-lanes-planned', filterLanes(lanes, {done:false, wip:false, planned:true, postponed:false}))
    let wasOnlyUpdatingAllLanesPostponed = upsertMapSource(map, 'all-lanes-postponed', filterLanes(lanes, {done:false, wip:false, planned:false, postponed:true}))
    let wasOnlyUpdatingAllLanesNotPostponed = upsertMapSource(map, 'all-lanes-not-postponed', filterLanes(lanes, {done:true, wip:true, planned:true, postponed:false}))
    let wasOnlyUpdatingAllLanesDoneAndWip = upsertMapSource(map, 'all-lanes-done-and-wip', filterLanes(lanes, {done:true, wip:true, planned:false, postponed:false}))

    let wasOnlyUpdatingAllSectionsDone = upsertMapSource(map, 'all-sections-done', filterSections(sections, {done:true, wip:false, planned:false, postponed:false}))
    let wasOnlyUpdatingAllSectionsWIP = upsertMapSource(map, 'all-sections-wip', filterSections(sections, {done:false, wip:true, planned:false, postponed:false}))
    let wasOnlyUpdatingAllSectionsPlanned = upsertMapSource(map, 'all-sections-planned', filterSections(sections, {done:false, wip:false, planned:true, postponed:false}))
    let wasOnlyUpdatingAllSectionsPostponed = upsertMapSource(map, 'all-sections-postponed', filterSections(sections, {done:false, wip:false, planned:false, postponed:true}))
    let wasOnlyUpdatingAllSectionsNotPostponed = upsertMapSource(map, 'all-sections-not-postponed', filterSections(sections, {done:true, wip:true, planned:true, postponed:false}))
    let wasOnlyUpdatingAllSectionsDoneAndWip = upsertMapSource(map, 'all-sections-done-and-wip', filterSections(sections, {done:true, wip:true, planned:false, postponed:false}))

    if (wasOnlyUpdatingAllLanesDone && wasOnlyUpdatingAllLanesWIP && wasOnlyUpdatingAllLanesPlanned && wasUpdatingAllSection && wasOnlyUpdatingAllLanesNotPostponed && wasOnlyUpdatingAllLanesPostponed && wasOnlyUpdatingAllLanesDoneAndWip) {
        return;
    }

    if (wasOnlyUpdatingAllSectionsDone && wasOnlyUpdatingAllSectionsWIP && wasOnlyUpdatingAllSectionsPlanned && wasOnlyUpdatingAllSectionsPostponed && wasOnlyUpdatingAllSectionsNotPostponed && wasOnlyUpdatingAllSectionsDoneAndWip) {
        return;
    }

    if (upsertMapSource(map, 'source-current-network-all-lanes', lanes)) {
        return;
    }

    // ------------------------------------------------------------------------
    // Postponed
    map.addLayer({
        id: 'layer-current-network-all-lanes-postponed-contour',
        type: 'line',
        source: 'all-lanes-postponed',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-gap-width': ["*", sectionWidth, scaleDownPostponed],
        'line-width': 1.3 / 2,
        'line-opacity' : 0.75,
        'line-color': laneColor,
        }
    });

    map.addLayer({
        id: `layer-current-network-all-lanes-postponed-background`,
        type: 'line',
        source: 'all-lanes-postponed',
        paint: {
            'line-width': laneWidth * scaleDownPostponed,
            'line-color': laneColor,
            'line-opacity' : 0.75,
            'line-offset': offsetLane,
            }
    });

    map.addLayer({
        id: `layer-current-network-all-lanes-postponed-background-white-scrim`,
        type: 'line',
        source: 'all-sections-postponed',
        paint: {
            'line-width': ["+", ["*", sectionWidth, scaleDownPostponed], 1.3 * 2 * 0.5],
            'line-color': "#fff",
            'line-opacity' : 0.75 * 0.5,
            }
    });

    map.addLayer({
        id: `layer-current-network-all-lanes-postponed-dashed`,
        type: 'line',
        source: 'all-lanes-postponed',
        paint: {
            'line-width': laneWidth * scaleDownPostponed,
            'line-color': "#fff",
            'line-opacity' : 0.9,
            'line-dasharray': laneDashPostponed,
            'line-offset': offsetLane,
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

    // ------------------------------------------------------------------------
    // Planned
    map.addLayer({
        id: 'layer-current-network-all-lanes-planned-contour-expanded',
        type: 'line',
        source: 'all-lanes-planned',
        paint: {
        'line-width': ["+", laneWidth, 1.3 * 2],
        'line-color': laneColor,
        'line-offset': offsetLane,
        }
    });

    map.addLayer({
        id: 'layer-current-network-all-lanes-planned-contour',
        type: 'line',
        source: 'all-lanes-planned',
        paint: {
        'line-width': laneWidth,
        'line-color': laneColor,
        'line-offset': offsetLane,
        }
    });

    map.addLayer({
        id: `layer-current-network-all-lanes-planned-background-white-scrim`,
        type: 'line',
        source: 'all-sections-planned',
        layout: { 'line-cap': 'round' },
        paint: {
            'line-width': ["+", sectionWidth, 1.3 * 2],
            'line-color': "#fff",
            'line-opacity' : 0.75 * 0.5,
            }
    });

    map.addLayer({
        id: `layer-current-network-all-lanes-planned-dashed`,
        type: 'line',
        source: 'all-lanes-planned',
        paint: {
            'line-width': laneWidth * 0.9,
            'line-color': "#fff",
            'line-dasharray': laneDashPlanned,
            'line-offset': offsetLane,
            }
    });



    // ------------------------------------------------------------------------
    // Done & WIP
    map.addLayer({
        id: 'layer-current-network-contour',
        type: 'line',
        source: 'all-sections-done-and-wip',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-gap-width': sectionWidth,
        'line-width': 1.3,
        'line-color': '#000000',
        }
    });

    // ------------------------------------------------------------------------
    // WIP
    map.addLayer({
        id: `layer-current-network-all-lanes-wip-background`,
        type: 'line',
        source: 'all-lanes-wip',
        paint: {
            'line-width': laneWidth,
            'line-color': "#fff",
            'line-offset': offsetLane,
            }
    });

    map.addLayer({
        id: `layer-current-network-all-lanes-wip-dashed`,
        type: 'line',
        source: 'all-lanes-wip',
        paint: {
            'line-width': laneWidth,
            'line-color': laneColor,
            'line-dasharray': laneDashWIP,
            'line-offset': offsetLane,
            }
    });

    map.addLayer({
        id: `layer-current-network-all-lanes-wip-as-done`,
        type: 'line',
        source: 'all-lanes-wip',
        paint: {
            'line-width': laneWidth,
            'line-color': laneColor,
            'line-offset': offsetLane,
            }
    });
    animateOpacity(map, 0, 1000*1.50, 'layer-current-network-all-lanes-wip-as-done', 'line-opacity', 0.0, 1.0);

    // ------------------------------------------------------------------------
    // Done
    map.addLayer({
        id: `layer-current-network-all-lanes-done`,
        type: 'line',
        source: 'all-lanes-done',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-width': laneWidth,
        'line-color': laneColor,
        'line-offset': offsetLane,
        }
    });
}


function drawFinishedNetwork(map: Map, sections: SectionFeature[], lanes: LaneFeature[]) {
    let wasOnlyUpdatingLanes = upsertMapSource(map, 'src-lanes', lanes)
    let wasOnlyUpdatingSections = upsertMapSource(map, 'src-sections', sections)
    if (wasOnlyUpdatingLanes && wasOnlyUpdatingSections) {
        return;
    }

    map.addLayer({
        id: 'layer-finished-network-contour',
        type: 'line',
        source: 'src-sections',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-gap-width': sectionWidth,
        'line-width': 1.3,
        'line-color': '#000000',
        }
    });

    map.addLayer({
        id: `layer-finished-network-all-lanes`,
        type: 'line',
        source: 'src-lanes',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-width': laneWidth,
        'line-color': laneColor,
        'line-offset': offsetLane,
        }
    });

    //drawHoveredEffect(map);
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