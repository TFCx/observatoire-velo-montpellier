import { GeoJSONSource, Map, type ExpressionSpecification } from 'maplibre-gl';
import { LaneType, LaneTypeFamily, Quality, LaneStatus, type Feature, type LaneFeature, type LineStringFeature, type SectionFeature} from '~/types';
import { ref } from 'vue';

const { getNbVoiesCyclables } = useConfig();
enum DisplayedLayer {
  Progress = 0,
  Quality = 1,
  TypeFamily = 2,
  FinalizedProject = 3,
  Type = 4,
}

const displayedLayer = ref(DisplayedLayer.Progress);


const contourWidth = 1.5
const blackContourWidth = contourWidth - 0.5
const dashesWidthRatio = 0.75
const laneWidth = 4
const fixedSectionWidth = laneWidth + 0.5
const laneDashes = [1.5, 0.7]
const laneDashWIP = [1.0, 1.05]

const nbLanes: ExpressionSpecification = ['get', 'nb_lanes']
const laneIndex: ExpressionSpecification = ['get', 'lane_index']
const allLanesWidth: ExpressionSpecification = ["*", laneWidth, nbLanes]
const sectionWidth: ExpressionSpecification = ['*', laneWidth, ['length', ['get', 'lines']]]
const halfLaneWidth: ExpressionSpecification = ["/", laneWidth, 2]
const laneColor: ExpressionSpecification = ["to-color", ['get', 'color']]
const leftmostOffset: ExpressionSpecification = ['+', ['-', 0, ["/", allLanesWidth, 2]], halfLaneWidth]
const offsetLane: ExpressionSpecification = ['+', leftmostOffset, ['*', laneIndex, laneWidth]]

// ----------------------------
const laneTypeColorDict: { [key in LaneType] : string } = {
    [LaneType.Unidirectionnelle]: "#b3c6ff",
    [LaneType.Bidirectionnelle]: "#b3c6ff",
    [LaneType.Bilaterale]: "#b3dbff",
    [LaneType.BandesCyclables]: "#b3c6ff",
    [LaneType.VoieBus]: "#c497f7",
    [LaneType.VoieBusElargie]: "#c497f7",
    [LaneType.Velorue]: "#f797e7",
    [LaneType.VoieVerte]: "#b3ffb6",
    [LaneType.ZoneDeRencontre]: "#97f7d6",
    [LaneType.AirePietonne]: "#ffc399",
    [LaneType.Chaucidou]: "#ffeab3",
    [LaneType.Aucun]: "#ff9999",
    [LaneType.Inconnu]: "#dedede",
}

const laneTypeFamilyColorDict: { [key in LaneTypeFamily] : string } = {
    [LaneTypeFamily.Dedie]: "#b3c6ff",
    [LaneTypeFamily.MixiteMotorise]: "#f797e7",
    [LaneTypeFamily.MixitePietonne]: "#e6ffb3",
    [LaneTypeFamily.Inconnu]: "#dedede",
}

const qualityColorDict: { [key in Quality] : string } = {
    [Quality.Good]: "#77dd77",
    [Quality.Fair]: "#F3F32A",
    [Quality.Bad]: "#ff6961",
}

function getColorOf(key: LaneType | LaneTypeFamily | Quality | LaneStatus): string {
    if (Object.values(LaneType).includes(key as LaneType)) {
        return laneTypeColorDict[key as LaneType]
    } else if (Object.values(LaneTypeFamily).includes(key as LaneTypeFamily)) {
        return laneTypeFamilyColorDict[key as LaneTypeFamily]
    } else if (Object.values(Quality).includes(key as Quality)) {
        return qualityColorDict[key as Quality]
    } else if (Object.values(LaneStatus).includes(key as LaneStatus)) {
        console.assert(key == LaneStatus.Done)
        return "#000000"
    }
    return "#000000"
}

function compSectionQualityColor(attribute: string): ExpressionSpecification {
    return [
        "case",
            ["==", ['get', attribute], Quality.Bad], getColorOf(Quality.Bad),
            ["==", ['get', attribute], Quality.Fair], getColorOf(Quality.Fair),
            ["==", ['get', attribute], Quality.Good], getColorOf(Quality.Good),
            ["==", ['get', 'status'], LaneStatus.Done], getColorOf(LaneStatus.Done),
            "white"
    ]
}
const sectionQualityColor: ExpressionSpecification = compSectionQualityColor('quality')
const sectionQualityColor2ndHalf: ExpressionSpecification = [
    "case",
        ["!", ['has', 'qualityB']], sectionQualityColor,
        compSectionQualityColor('qualityB')
    ]
function compSectionTypeFamilyColor(attribute: string): ExpressionSpecification {
    return [
        "case",
            ["==", ['get', attribute], LaneTypeFamily.Dedie], getColorOf(LaneTypeFamily.Dedie),
            ["==", ['get', attribute], LaneTypeFamily.MixiteMotorise], getColorOf(LaneTypeFamily.MixiteMotorise),
            ["==", ['get', attribute], LaneTypeFamily.MixitePietonne], getColorOf(LaneTypeFamily.MixitePietonne),
            ["==", ['get', 'status'], LaneStatus.Done], getColorOf(LaneStatus.Done),
            ["==", ['get', attribute], LaneTypeFamily.Inconnu], getColorOf(LaneTypeFamily.Inconnu),
            "white"
    ]
}
const sectionTypeFamilyColor: ExpressionSpecification = compSectionTypeFamilyColor('typeFamily')
const sectionTypeFamilyColor2ndHalf: ExpressionSpecification = [
    "case",
        ["!", ['has', 'typeFamilyB']], sectionTypeFamilyColor,
        compSectionTypeFamilyColor('typeFamilyB')
    ]
function compSectionTypeColor(attribute: string): ExpressionSpecification {
    return [
        "case",
        ["==", ['get', attribute], LaneType.Unidirectionnelle], getColorOf(LaneType.Unidirectionnelle),
        ["==", ['get', attribute], LaneType.Bidirectionnelle], getColorOf(LaneType.Bidirectionnelle),
        ["==", ['get', attribute], LaneType.Bilaterale], getColorOf(LaneType.Bilaterale),
        ["==", ['get', attribute], LaneType.BandesCyclables], getColorOf(LaneType.BandesCyclables),
        ["==", ['get', attribute], LaneType.VoieBus], getColorOf(LaneType.VoieBus),
        ["==", ['get', attribute], LaneType.VoieBusElargie], getColorOf(LaneType.VoieBusElargie),
        ["==", ['get', attribute], LaneType.Velorue], getColorOf(LaneType.Velorue),
        ["==", ['get', attribute], LaneType.VoieVerte], getColorOf(LaneType.VoieVerte),
        ["==", ['get', attribute], LaneType.ZoneDeRencontre], getColorOf(LaneType.ZoneDeRencontre),
        ["==", ['get', attribute], LaneType.AirePietonne], getColorOf(LaneType.AirePietonne),
        ["==", ['get', attribute], LaneType.Chaucidou], getColorOf(LaneType.Chaucidou),
        ["==", ['get', attribute], LaneType.Aucun], getColorOf(LaneType.Aucun),
        ["==", ['get', 'status'], LaneStatus.Done], getColorOf(LaneStatus.Done),
        ["==", ['get', attribute], LaneType.Inconnu], getColorOf(LaneType.Inconnu),
        "black"
    ]
}
const sectionTypeColor: ExpressionSpecification = compSectionTypeColor('type')
const sectionTypeColor2ndHalf: ExpressionSpecification = [
    "case",
        ["!", ['has', 'typeB']], sectionTypeColor,
        compSectionTypeColor('typeB')
    ]

// ----------------------------

let layersForFinishedNetwork: string[] = []
let layersForCurrentNetwork: string[] = []
let layersForQualityNetwork: string[] = []
let layersForTypeFamilyNetwork: string[] = []
let layersForTypeNetwork: string[] = []


const setDisplayedLayer = (value: DisplayedLayer) => {
  displayedLayer.value = value;
};

function changeLayer(map: Map, displayedLayer: DisplayedLayer) {
    for(const layerName of layersForFinishedNetwork) {
        map.setLayoutProperty(layerName, "visibility", (displayedLayer == DisplayedLayer.FinalizedProject) ? "visible" : "none")
    }
    for(const layerName of layersForCurrentNetwork) {
        map.setLayoutProperty(layerName, "visibility", (displayedLayer == DisplayedLayer.Progress) ? "visible" : "none")
    }
    for(const layerName of layersForQualityNetwork) {
        map.setLayoutProperty(layerName, "visibility", (displayedLayer == DisplayedLayer.Quality) ? "visible" : "none")
    }
    for(const layerName of layersForTypeFamilyNetwork) {
        map.setLayoutProperty(layerName, "visibility", (displayedLayer == DisplayedLayer.TypeFamily) ? "visible" : "none")
    }
    for(const layerName of layersForTypeNetwork) {
        map.setLayoutProperty(layerName, "visibility", (displayedLayer == DisplayedLayer.Type) ? "visible" : "none")
    }
  }

import { upsertMapSource } from './utils';

export { DisplayedLayer, setDisplayedLayer, drawCurrentNetwork, drawFinishedNetwork, drawQualityNetwork, drawTypeFamilyNetwork, drawTypeNetwork, changeLayer, addListnersForHovering };

let layersBase: string[] = []

function filterSections(sections: SectionFeature[], options: {done: boolean, wip: boolean, planned: boolean, postponed: boolean}): SectionFeature[] {
    sections = options.done ? sections : sections.filter(s => s.properties.status !== LaneStatus.Done)
    sections = options.wip ? sections : sections.filter(s => s.properties.status !== LaneStatus.Wip)
    sections = options.planned ? sections : sections.filter(s => s.properties.status !== LaneStatus.Planned)
    sections = options.postponed ? sections : sections.filter(s => s.properties.status !== LaneStatus.Postponed)
    return sections
}

function filterLanes(lanes: LaneFeature[], options: {done: boolean, wip: boolean, planned: boolean, postponed: boolean}): LaneFeature[] {
    lanes = options.done ? lanes : lanes.filter(s => s.properties.status !== LaneStatus.Done)
    lanes = options.wip ? lanes : lanes.filter(s => s.properties.status !== LaneStatus.Wip)
    lanes = options.planned ? lanes : lanes.filter(s => s.properties.status !== LaneStatus.Planned)
    lanes = options.postponed ? lanes : lanes.filter(s => s.properties.status !== LaneStatus.Postponed)
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

    // if (wasOnlyUpdatingAllLanesDone && wasOnlyUpdatingAllLanesWIP && wasOnlyUpdatingAllLanesPlanned && wasUpdatingAllSection && wasOnlyUpdatingAllLanesNotPostponed && wasOnlyUpdatingAllLanesPostponed && wasOnlyUpdatingAllLanesDoneAndWip) {
    //     return;
    // }

    // if (wasOnlyUpdatingAllSectionsDone && wasOnlyUpdatingAllSectionsWIP && wasOnlyUpdatingAllSectionsPlanned && wasOnlyUpdatingAllSectionsPostponed && wasOnlyUpdatingAllSectionsNotPostponed && wasOnlyUpdatingAllSectionsDoneAndWip) {
    //     return;
    // }

    // if (upsertMapSource(map, 'source-current-network-all-lanes', lanes)) {
    //     return;
    // }

    // ------------------------------------------------------------------------
    // Postponed
    // TODO : refaire postponed comme planned
    map.addLayer({
        id: 'layer-current-network-all-lanes-postponed-contour',
        type: 'line',
        source: 'all-lanes-postponed',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-gap-width': sectionWidth,
        'line-width': contourWidth / 2,
        'line-opacity' : 0.75,
        'line-color': laneColor,
        }
    });
    layersForCurrentNetwork.push("layer-current-network-all-lanes-postponed-contour")

    map.addLayer({
        id: `layer-current-network-all-lanes-postponed-background`,
        type: 'line',
        source: 'all-lanes-postponed',
        paint: {
            'line-width': laneWidth,
            'line-color': laneColor,
            'line-opacity' : 0.75,
            'line-offset': offsetLane,
            }
    });
    layersForCurrentNetwork.push("layer-current-network-all-lanes-postponed-background")

    map.addLayer({
        id: `layer-current-network-all-lanes-postponed-background-white-scrim`,
        type: 'line',
        source: 'all-sections-postponed',
        paint: {
            'line-width': ["+", sectionWidth, contourWidth * 2 * 0.5],
            'line-color': "#fff",
            'line-opacity' : 0.75 * 0.5,
            }
    });
    layersForCurrentNetwork.push("layer-current-network-all-lanes-postponed-background-white-scrim")

    map.addLayer({
        id: `layer-current-network-all-lanes-postponed-dashed`,
        type: 'line',
        source: 'all-lanes-postponed',
        paint: {
            'line-width': laneWidth * dashesWidthRatio,
            'line-color': "#fff",
            'line-opacity' : 0.9,
            'line-dasharray': laneDashes,
            'line-offset': offsetLane,
            }
    });
    layersForCurrentNetwork.push("layer-current-network-all-lanes-postponed-dashed")

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
        'icon-opacity': 0.20
        },
        layout: {
        'symbol-placement': 'line',
        'symbol-spacing': [
            'interpolate',
            ['linear'],
            ['zoom'],
            farZoom, 30,
            closeZoom, 60
        ],
        'icon-image': "cross-icon",
        'icon-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            farZoom, 1.5,
            closeZoom, 2.5
            ],
        }
    });
    layersForCurrentNetwork.push("layer-current-network-all-lanes-postponed-symbols")

    // ------------------------------------------------------------------------
    // Planned
    map.addLayer({
        id: 'layer-current-network-all-lanes-planned-black-contour',
        type: 'line',
        source: 'all-sections-planned',
        paint: {
        'line-gap-width': ["+", sectionWidth, 1.0],
        'line-width': 2.0,
        'line-color': '#000000',
        'line-opacity': 0.5
        }
    });
    layersForCurrentNetwork.push("layer-current-network-all-lanes-planned-black-contour")

    map.addLayer({
        id: 'layer-current-network-all-lanes-planned-contour-expanded',
        type: 'line',
        source: 'all-lanes-planned',
        paint: {
        'line-width': ["+", laneWidth, contourWidth * 2],
        'line-color': laneColor,
        'line-offset': offsetLane,
        }
    });
    layersForCurrentNetwork.push("layer-current-network-all-lanes-planned-contour-expanded")

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
    layersForCurrentNetwork.push("layer-current-network-all-lanes-planned-contour")

    map.addLayer({
        id: `layer-current-network-all-lanes-planned-background-white-scrim`,
        type: 'line',
        source: 'all-sections-planned',
        layout: { 'line-cap': 'round' },
        paint: {
            'line-width': ["+", sectionWidth, contourWidth * 2],
            'line-color': "#fff",
            'line-opacity' : 0.75 * 0.5,
            }
    });
    layersForCurrentNetwork.push("layer-current-network-all-lanes-planned-background-white-scrim")

    map.addLayer({
        id: `layer-current-network-all-lanes-planned-dashed`,
        type: 'line',
        source: 'all-lanes-planned',
        paint: {
            'line-width': laneWidth * dashesWidthRatio,
            'line-color': "#fff",
            'line-dasharray': laneDashes,
            'line-offset': offsetLane,
            }
    });
    layersForCurrentNetwork.push("layer-current-network-all-lanes-planned-dashed")



    // ------------------------------------------------------------------------
    // Done & WIP
    map.addLayer({
        id: 'layer-current-network-contour',
        type: 'line',
        source: 'all-sections-done-and-wip',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-gap-width': sectionWidth,
        'line-width': blackContourWidth,
        'line-color': '#000000',
        }
    });
    layersForCurrentNetwork.push("layer-current-network-contour")

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
    layersForCurrentNetwork.push("layer-current-network-all-lanes-wip-background")

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
    layersForCurrentNetwork.push("layer-current-network-all-lanes-wip-dashed")

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
    layersForCurrentNetwork.push("layer-current-network-all-lanes-wip-as-done")

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
    layersForCurrentNetwork.push("layer-current-network-all-lanes-done")
}


function drawFinishedNetwork(map: Map, sections: SectionFeature[], lanes: LaneFeature[]) {
    let wasOnlyUpdatingLanes = upsertMapSource(map, 'src-lanes', lanes)
    let wasOnlyUpdatingSections = upsertMapSource(map, 'src-sections', sections)
    // if (wasOnlyUpdatingLanes && wasOnlyUpdatingSections) {
    //     return;
    // }

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
    layersForFinishedNetwork.push("layer-finished-network-contour")

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
    layersForFinishedNetwork.push("layer-finished-network-all-lanes")

    //drawHoveredEffect(map);
}


function drawQualityNetwork(map: Map, sections: SectionFeature[], lanes: LaneFeature[]) {
    let wasOnlyUpdatingLanes = upsertMapSource(map, 'src-lanes', lanes)
    let wasOnlyUpdatingSections = upsertMapSource(map, 'src-sections', sections)
    // if (wasOnlyUpdatingLanes && wasOnlyUpdatingSections) {
    //     return;
    // }

    map.addLayer({
        id: 'layer-quality-network-contour',
        type: 'line',
        source: 'src-sections',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-gap-width': fixedSectionWidth,
        'line-width': 1.3,
        'line-color': '#000000',
        }
    });
    layersForQualityNetwork.push("layer-quality-network-contour")

    map.addLayer({
        id: `layer-quality-network-section-sideA`,
        type: 'line',
        source: 'src-sections',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-width': fixedSectionWidth / 2,
        'line-color': sectionQualityColor,
        'line-offset': fixedSectionWidth / 4,
        }
    });
    layersForQualityNetwork.push("layer-quality-network-section-sideA")

    map.addLayer({
        id: `layer-quality-network-section-sideB`,
        type: 'line',
        source: 'src-sections',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-width': fixedSectionWidth / 2,
        'line-color': sectionQualityColor2ndHalf,
        'line-offset': -fixedSectionWidth / 4,
        }
    });
    layersForQualityNetwork.push("layer-quality-network-section-sideB")

    //drawHoveredEffect(map);
}
function drawTypeFamilyNetwork(map: Map, sections: SectionFeature[], lanes: LaneFeature[]) {
    let wasOnlyUpdatingLanes = upsertMapSource(map, 'src-lanes', lanes)
    let wasOnlyUpdatingSections = upsertMapSource(map, 'src-sections', sections)
    // if (wasOnlyUpdatingLanes && wasOnlyUpdatingSections) {
    //     return;
    // }

    map.addLayer({
        id: 'layer-type-family-network-contour',
        type: 'line',
        source: 'src-sections',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-gap-width': fixedSectionWidth,
        'line-width': 1.3,
        'line-color': '#000000',
        }
    });
    layersForTypeFamilyNetwork.push("layer-type-family-network-contour")

    map.addLayer({
        id: `layer-type-family-network-section-sideA`,
        type: 'line',
        source: 'src-sections',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-width': fixedSectionWidth / 2,
        'line-color': sectionTypeFamilyColor,
        'line-offset': fixedSectionWidth / 4,
        }
    });
    layersForTypeFamilyNetwork.push("layer-type-family-network-section-sideA")

    map.addLayer({
        id: `layer-type-family-network-section-sideB`,
        type: 'line',
        source: 'src-sections',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-width': fixedSectionWidth / 2,
        'line-color': sectionTypeFamilyColor2ndHalf,
        'line-offset': -fixedSectionWidth / 4,
        }
    });
    layersForTypeFamilyNetwork.push("layer-type-family-network-section-sideB")

    //drawHoveredEffect(map);
}

function drawTypeNetwork(map: Map, sections: SectionFeature[], lanes: LaneFeature[]) {
    let wasOnlyUpdatingLanes = upsertMapSource(map, 'src-lanes', lanes)
    let wasOnlyUpdatingSections = upsertMapSource(map, 'src-sections', sections)
    // if (wasOnlyUpdatingLanes && wasOnlyUpdatingSections) {
    //     return;
    // }

    map.addLayer({
        id: 'layer-type-network-contour',
        type: 'line',
        source: 'src-sections',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-gap-width': fixedSectionWidth,
        'line-width': 1.3,
        'line-color': '#000000',
        }
    });
    layersForTypeNetwork.push("layer-type-network-contour")

    map.addLayer({
        id: `layer-type-network-section-sideA`,
        type: 'line',
        source: 'src-sections',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-width': fixedSectionWidth / 2,
        'line-color': sectionTypeColor,
        'line-offset': fixedSectionWidth / 4,
        }
    });
    layersForTypeNetwork.push("layer-type-network-section-sideA")

    map.addLayer({
        id: `layer-type-network-section-sideB`,
        type: 'line',
        source: 'src-sections',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-width': fixedSectionWidth / 2,
        'line-color': sectionTypeColor2ndHalf,
        'line-offset': -fixedSectionWidth / 4,
        }
    });
    layersForTypeNetwork.push("layer-type-network-section-sideB")

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