import { GeoJSONSource, Map, type ExpressionSpecification } from 'maplibre-gl';
import { LaneTypeE, LaneTypeFamilyE, QualityE, LaneStatusE, type Feature, type LaneFeature, type LineStringFeature, type SectionFeature} from '~/types';
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
const laneTypeColorDict: { [key in LaneTypeE] : string } = {
    [LaneTypeE.Unidirectionnelle]: "#b3c6ff",
    [LaneTypeE.Bidirectionnelle]: "#b3c6ff",
    [LaneTypeE.Bilaterale]: "#b3dbff",
    [LaneTypeE.BandesCyclables]: "#b3c6ff",
    [LaneTypeE.VoieBus]: "#c497f7",
    [LaneTypeE.VoieBusElargie]: "#c497f7",
    [LaneTypeE.Velorue]: "#f797e7",
    [LaneTypeE.VoieVerte]: "#b3ffb6",
    [LaneTypeE.ZoneDeRencontre]: "#97f7d6",
    [LaneTypeE.AirePietonne]: "#ffc399",
    [LaneTypeE.Chaucidou]: "#ffeab3",
    [LaneTypeE.Aucun]: "#ff9999",
    [LaneTypeE.Inconnu]: "#dedede",
}

const laneTypeFamilyColorDict: { [key in LaneTypeFamilyE] : string } = {
    [LaneTypeFamilyE.Dedie]: "#b3c6ff",
    [LaneTypeFamilyE.MixiteMotoriseGood]: "#97f7d6",
    [LaneTypeFamilyE.MixiteMotoriseBad]: "#f797e7",
    [LaneTypeFamilyE.MixitePietonneGood]: "#e6ffb3",
    [LaneTypeFamilyE.MixitePietonneBad]: "#f2cd7c",
    [LaneTypeFamilyE.Inconnu]: "#dedede",
}

const qualityColorDict: { [key in QualityE] : string } = {
    [QualityE.Good]: "#77dd77",
    [QualityE.Fair]: "#F3F32A",
    [QualityE.Bad]: "#ff6961",
}

function getColorOf(key: LaneTypeE | LaneTypeFamilyE | QualityE | LaneStatusE): string {
    if (Object.values(LaneTypeE).includes(key as LaneTypeE)) {
        return laneTypeColorDict[key as LaneTypeE]
    } else if (Object.values(LaneTypeFamilyE).includes(key as LaneTypeFamilyE)) {
        return laneTypeFamilyColorDict[key as LaneTypeFamilyE]
    } else if (Object.values(QualityE).includes(key as QualityE)) {
        return qualityColorDict[key as QualityE]
    } else if (Object.values(LaneStatusE).includes(key as LaneStatusE)) {
        console.assert(key == LaneStatusE.Done)
        return "#000000"
    }
    return "#000000"
}

function compSectionQualityColor(attribute: string): ExpressionSpecification {
    return [
        "case",
            ["==", ['get', attribute], QualityE.Bad], getColorOf(QualityE.Bad),
            ["==", ['get', attribute], QualityE.Fair], getColorOf(QualityE.Fair),
            ["==", ['get', attribute], QualityE.Good], getColorOf(QualityE.Good),
            ["==", ['get', 'status'], LaneStatusE.Done], getColorOf(LaneStatusE.Done),
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
            ["==", ['get', attribute], LaneTypeFamilyE.Dedie], getColorOf(LaneTypeFamilyE.Dedie),
            ["==", ['get', attribute], LaneTypeFamilyE.MixiteMotoriseGood], getColorOf(LaneTypeFamilyE.MixiteMotoriseGood),
            ["==", ['get', attribute], LaneTypeFamilyE.MixiteMotoriseBad], getColorOf(LaneTypeFamilyE.MixiteMotoriseBad),
            ["==", ['get', attribute], LaneTypeFamilyE.MixitePietonneGood], getColorOf(LaneTypeFamilyE.MixitePietonneGood),
            ["==", ['get', attribute], LaneTypeFamilyE.MixitePietonneBad], getColorOf(LaneTypeFamilyE.MixitePietonneBad),
            ["==", ['get', 'status'], LaneStatusE.Done], getColorOf(LaneStatusE.Done),
            ["==", ['get', attribute], LaneTypeFamilyE.Inconnu], getColorOf(LaneTypeFamilyE.Inconnu),
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
        ["==", ['get', attribute], LaneTypeE.Unidirectionnelle], getColorOf(LaneTypeE.Unidirectionnelle),
        ["==", ['get', attribute], LaneTypeE.Bidirectionnelle], getColorOf(LaneTypeE.Bidirectionnelle),
        ["==", ['get', attribute], LaneTypeE.Bilaterale], getColorOf(LaneTypeE.Bilaterale),
        ["==", ['get', attribute], LaneTypeE.BandesCyclables], getColorOf(LaneTypeE.BandesCyclables),
        ["==", ['get', attribute], LaneTypeE.VoieBus], getColorOf(LaneTypeE.VoieBus),
        ["==", ['get', attribute], LaneTypeE.VoieBusElargie], getColorOf(LaneTypeE.VoieBusElargie),
        ["==", ['get', attribute], LaneTypeE.Velorue], getColorOf(LaneTypeE.Velorue),
        ["==", ['get', attribute], LaneTypeE.VoieVerte], getColorOf(LaneTypeE.VoieVerte),
        ["==", ['get', attribute], LaneTypeE.ZoneDeRencontre], getColorOf(LaneTypeE.ZoneDeRencontre),
        ["==", ['get', attribute], LaneTypeE.AirePietonne], getColorOf(LaneTypeE.AirePietonne),
        ["==", ['get', attribute], LaneTypeE.Chaucidou], getColorOf(LaneTypeE.Chaucidou),
        ["==", ['get', attribute], LaneTypeE.Aucun], getColorOf(LaneTypeE.Aucun),
        ["==", ['get', 'status'], LaneStatusE.Done], getColorOf(LaneStatusE.Done),
        ["==", ['get', attribute], LaneTypeE.Inconnu], getColorOf(LaneTypeE.Inconnu),
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
    sections = options.done ? sections : sections.filter(s => s.properties.status !== LaneStatusE.Done)
    sections = options.wip ? sections : sections.filter(s => s.properties.status !== LaneStatusE.Wip)
    sections = options.planned ? sections : sections.filter(s => s.properties.status !== LaneStatusE.Planned)
    sections = options.postponed ? sections : sections.filter(s => s.properties.status !== LaneStatusE.Postponed)
    return sections
}

function filterLanes(lanes: LaneFeature[], options: {done: boolean, wip: boolean, planned: boolean, postponed: boolean}): LaneFeature[] {
    lanes = options.done ? lanes : lanes.filter(s => s.properties.status !== LaneStatusE.Done)
    lanes = options.wip ? lanes : lanes.filter(s => s.properties.status !== LaneStatusE.Wip)
    lanes = options.planned ? lanes : lanes.filter(s => s.properties.status !== LaneStatusE.Planned)
    lanes = options.postponed ? lanes : lanes.filter(s => s.properties.status !== LaneStatusE.Postponed)
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