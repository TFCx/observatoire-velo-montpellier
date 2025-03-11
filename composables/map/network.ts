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
const hoverExtension = 3
const fixedHoverWidth = fixedSectionWidth + contourWidth * 2 + hoverExtension * 2

const nbLanes: ExpressionSpecification = ['get', 'nb_lanes']
const laneIndex: ExpressionSpecification = ['get', 'lane_index']
const allLanesWidth: ExpressionSpecification = ["*", laneWidth, nbLanes]
const sectionWidth: ExpressionSpecification = ['*', laneWidth, ['length', ['get', 'lines']]]
const halfLaneWidth: ExpressionSpecification = ["/", laneWidth, 2]
const laneColor: ExpressionSpecification = ["to-color", ['get', 'color']]
const leftmostOffset: ExpressionSpecification = ['+', ['-', 0, ["/", allLanesWidth, 2]], halfLaneWidth]
const offsetLane: ExpressionSpecification = ['+', leftmostOffset, ['*', laneIndex, laneWidth]]
const hoverWidth: ExpressionSpecification = ['+', sectionWidth, contourWidth * 2 + hoverExtension * 2]
const sectionNames: ExpressionSpecification = ['get', 'displayedLinesName']

// ----------------------------
const laneTypeColorDict: { [key in LaneType] : string } = {
    [LaneType.Unidirectionnelle]: "#b3fbff",
    [LaneType.Bidirectionnelle]: "#6983cf",
    [LaneType.Bilaterale]: "#b3fbff",
    [LaneType.BandesCyclables]: "#c1b3ff",
    [LaneType.VoieBus]: "#c497f7",
    [LaneType.VoieBusElargie]: "#c497f7",
    [LaneType.Velorue]: "#f797e7",
    [LaneType.VoieVerte]: "#b3ffb6",
    [LaneType.ZoneDeRencontre]: "#fffbb3",
    [LaneType.AirePietonne]: "#ffc399",
    [LaneType.Chaucidou]: "#ffeab3",
    [LaneType.Aucun]: "#ff9999",
    [LaneType.Inconnu]: "#ffffff",
}

const laneTypeFamilyColorDict: { [key in LaneTypeFamily] : string } = {
    [LaneTypeFamily.Dedie]: "#b3c6ff",
    [LaneTypeFamily.MixiteMotorise]: "#f797e7",
    [LaneTypeFamily.MixitePietonne]: "#e6ffb3",
    [LaneTypeFamily.Inconnu]: "#ffffff",
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
        return "white"
    }
    return "#ff00ff"
}

function compSectionQualityColor(attribute: string): ExpressionSpecification {
    return [
        "case",
            ["!=", ['get', 'status'], LaneStatus.Done], getColorOf(LaneType.Inconnu),
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
            ["!=", ['get', 'status'], LaneStatus.Done], getColorOf(LaneType.Inconnu),
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
        ["!=", ['get', 'status'], LaneStatus.Done], getColorOf(LaneType.Inconnu),
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
        ["==", ['get', 'status'], LaneStatus.Planned], "#ffffff",
        ["==", ['get', 'status'], LaneStatus.Postponed], "#ffffff",
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

const layersBehindDisplayedLayer: { [key in DisplayedLayer] : string[] } = {
    [DisplayedLayer.FinalizedProject]: layersForFinishedNetwork,
    [DisplayedLayer.Progress]: layersForCurrentNetwork,
    [DisplayedLayer.Quality]: layersForQualityNetwork,
    [DisplayedLayer.TypeFamily]: layersForTypeFamilyNetwork,
    [DisplayedLayer.Type]: layersForTypeNetwork,
}

function changeLayer(map: Map, displayedLayer: DisplayedLayer) {

    for(const layers of [layersForFinishedNetwork, layersForCurrentNetwork, layersForQualityNetwork, layersForTypeFamilyNetwork, layersForTypeNetwork]) {
        for(const layerName of layers) {
            map.setLayoutProperty(layerName, "visibility", "none")
        }
    }

    for(const layerName of layersBehindDisplayedLayer[displayedLayer]) {
        map.setLayoutProperty(layerName, "visibility", "visible")
    }
  }

import { upsertMapSource } from './utils';

export { DisplayedLayer, setDisplayedLayer, updateOrCreateSources, drawCurrentNetwork, drawFinishedNetwork, drawQualityNetwork, drawTypeFamilyNetwork, drawTypeNetwork, changeLayer, drawLineNames, drawHoveredEffect, addListnersForHovering };

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

function updateOrCreateSources(map: Map, sections: SectionFeature[], lanes: LaneFeature[]) {

    let b1 = upsertMapSource(map, 'src-lanes', lanes)
    let b2 = upsertMapSource(map, 'src-lanes-done', filterLanes(lanes, {done:true, wip:false, planned:false, postponed:false}))
    let b3 = upsertMapSource(map, 'src-lanes-wip', filterLanes(lanes, {done:false, wip:true, planned:false, postponed:false}))
    let b4 = upsertMapSource(map, 'src-lanes-planned', filterLanes(lanes, {done:false, wip:false, planned:true, postponed:false}))
    let b5 = upsertMapSource(map, 'src-lanes-postponed', filterLanes(lanes, {done:false, wip:false, planned:false, postponed:true}))
    let b6 = upsertMapSource(map, 'src-lanes-not-postponed', filterLanes(lanes, {done:true, wip:true, planned:true, postponed:false}))
    let b7 = upsertMapSource(map, 'src-lanes-done-and-wip', filterLanes(lanes, {done:true, wip:true, planned:false, postponed:false}))

    let b8 = upsertMapSource(map, 'src-sections', sections)
    let b9 = upsertMapSource(map, 'src-sections-done', filterSections(sections, {done:true, wip:false, planned:false, postponed:false}))
    let b10 = upsertMapSource(map, 'src-sections-wip', filterSections(sections, {done:false, wip:true, planned:false, postponed:false}))
    let b11 = upsertMapSource(map, 'src-sections-planned', filterSections(sections, {done:false, wip:false, planned:true, postponed:false}))
    let b12 = upsertMapSource(map, 'src-sections-postponed', filterSections(sections, {done:false, wip:false, planned:false, postponed:true}))
    let b13 = upsertMapSource(map, 'src-sections-not-postponed', filterSections(sections, {done:true, wip:true, planned:true, postponed:false}))
    let b14 = upsertMapSource(map, 'src-sections-done-and-wip', filterSections(sections, {done:true, wip:true, planned:false, postponed:false}))

    // Check only update
    return b1 && b2 && b3 && b4 && b5 && b6 && b7 && b8 && b9 && b10 && b11 && b12 && b13 && b14
}


function drawCurrentNetwork(map: Map) {

    // ------------------------------------------------------------------------
    // Postponed
    // TODO : refaire postponed comme planned
    map.addLayer({
        id: 'layer-current-network-src-lanes-postponed-contour',
        type: 'line',
        source: 'src-lanes-postponed',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-gap-width': sectionWidth,
        'line-width': contourWidth / 2,
        'line-opacity' : 0.75,
        'line-color': laneColor,
        }
    });
    layersForCurrentNetwork.push("layer-current-network-src-lanes-postponed-contour")

    map.addLayer({
        id: `layer-current-network-src-lanes-postponed-background`,
        type: 'line',
        source: 'src-lanes-postponed',
        paint: {
            'line-width': laneWidth,
            'line-color': laneColor,
            'line-opacity' : 0.75,
            'line-offset': offsetLane,
            }
    });
    layersForCurrentNetwork.push("layer-current-network-src-lanes-postponed-background")

    map.addLayer({
        id: `layer-current-network-src-lanes-postponed-background-white-scrim`,
        type: 'line',
        source: 'src-sections-postponed',
        paint: {
            'line-width': ["+", sectionWidth, contourWidth * 2 * 0.5],
            'line-color': "#fff",
            'line-opacity' : 0.75 * 0.5,
            }
    });
    layersForCurrentNetwork.push("layer-current-network-src-lanes-postponed-background-white-scrim")

    map.addLayer({
        id: `layer-current-network-src-lanes-postponed-dashed`,
        type: 'line',
        source: 'src-lanes-postponed',
        paint: {
            'line-width': laneWidth * dashesWidthRatio,
            'line-color': "#fff",
            'line-opacity' : 0.9,
            'line-dasharray': laneDashes,
            'line-offset': offsetLane,
            }
    });
    layersForCurrentNetwork.push("layer-current-network-src-lanes-postponed-dashed")

    let farZoom = 11
    let closeZoom = 14
    map.addLayer({
        id: `layer-current-network-src-lanes-postponed-symbols`,
        type: 'symbol',
        source: `src-sections-postponed`,
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
    layersForCurrentNetwork.push("layer-current-network-src-lanes-postponed-symbols")

    // ------------------------------------------------------------------------
    // Planned
    map.addLayer({
        id: 'layer-current-network-src-lanes-planned-black-contour',
        type: 'line',
        source: 'src-sections-planned',
        paint: {
        'line-gap-width': ["+", sectionWidth, 1.0],
        'line-width': 2.0,
        'line-color': '#000000',
        'line-opacity': 0.5
        }
    });
    layersForCurrentNetwork.push("layer-current-network-src-lanes-planned-black-contour")

    map.addLayer({
        id: 'layer-current-network-src-lanes-planned-contour-expanded',
        type: 'line',
        source: 'src-lanes-planned',
        paint: {
        'line-width': ["+", laneWidth, contourWidth * 2],
        'line-color': laneColor,
        'line-offset': offsetLane,
        }
    });
    layersForCurrentNetwork.push("layer-current-network-src-lanes-planned-contour-expanded")

    map.addLayer({
        id: 'layer-current-network-src-lanes-planned-contour',
        type: 'line',
        source: 'src-lanes-planned',
        paint: {
        'line-width': laneWidth,
        'line-color': laneColor,
        'line-offset': offsetLane,
        }
    });
    layersForCurrentNetwork.push("layer-current-network-src-lanes-planned-contour")

    map.addLayer({
        id: `layer-current-network-src-lanes-planned-background-white-scrim`,
        type: 'line',
        source: 'src-sections-planned',
        layout: { 'line-cap': 'round' },
        paint: {
            'line-width': ["+", sectionWidth, contourWidth * 2],
            'line-color': "#fff",
            'line-opacity' : 0.75 * 0.5,
            }
    });
    layersForCurrentNetwork.push("layer-current-network-src-lanes-planned-background-white-scrim")

    map.addLayer({
        id: `layer-current-network-src-lanes-planned-dashed`,
        type: 'line',
        source: 'src-lanes-planned',
        paint: {
            'line-width': laneWidth * dashesWidthRatio,
            'line-color': "#fff",
            'line-dasharray': laneDashes,
            'line-offset': offsetLane,
            }
    });
    layersForCurrentNetwork.push("layer-current-network-src-lanes-planned-dashed")



    // ------------------------------------------------------------------------
    // Done & WIP
    map.addLayer({
        id: 'layer-current-network-contour',
        type: 'line',
        source: 'src-sections-done-and-wip',
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
        id: `layer-current-network-src-lanes-wip-background`,
        type: 'line',
        source: 'src-lanes-wip',
        paint: {
            'line-width': laneWidth,
            'line-color': "#fff",
            'line-offset': offsetLane,
            }
    });
    layersForCurrentNetwork.push("layer-current-network-src-lanes-wip-background")

    map.addLayer({
        id: `layer-current-network-src-lanes-wip-dashed`,
        type: 'line',
        source: 'src-lanes-wip',
        paint: {
            'line-width': laneWidth,
            'line-color': laneColor,
            'line-dasharray': laneDashWIP,
            'line-offset': offsetLane,
            }
    });
    layersForCurrentNetwork.push("layer-current-network-src-lanes-wip-dashed")

    map.addLayer({
        id: `layer-current-network-src-lanes-wip-as-done`,
        type: 'line',
        source: 'src-lanes-wip',
        paint: {
            'line-width': laneWidth,
            'line-color': laneColor,
            'line-offset': offsetLane,
            }
    });
    animateOpacity(map, 0, 1000*1.50, 'layer-current-network-src-lanes-wip-as-done', 'line-opacity', 0.0, 1.0);
    layersForCurrentNetwork.push("layer-current-network-src-lanes-wip-as-done")

    // ------------------------------------------------------------------------
    // Done
    map.addLayer({
        id: `layer-current-network-src-lanes-done`,
        type: 'line',
        source: 'src-lanes-done',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-width': laneWidth,
        'line-color': laneColor,
        'line-offset': offsetLane,
        }
    });
    layersForCurrentNetwork.push("layer-current-network-src-lanes-done")
}


function drawFinishedNetwork(map: Map) {

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
        id: `layer-finished-network-src-lanes`,
        type: 'line',
        source: 'src-lanes',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-width': laneWidth,
        'line-color': laneColor,
        'line-offset': offsetLane,
        }
    });
    layersForFinishedNetwork.push("layer-finished-network-src-lanes")
}


function drawQualityNetwork(map: Map) {

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
}
function drawTypeFamilyNetwork(map: Map) {

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
}

function drawTypeNetwork(map: Map) {

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
}


function drawHoveredEffect(map: Map) {

    // Fixed width
    map.addLayer({
        id: 'layer-type-hover-highlight-fixed',
        type: 'line',
        source: 'src-sections',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-width': fixedHoverWidth,
        'line-color': '#000000',
        'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.3, 0.0],
        }
    });
    layersForQualityNetwork.push("layer-type-hover-highlight-fixed")
    layersForTypeFamilyNetwork.push("layer-type-hover-highlight-fixed")
    layersForTypeNetwork.push("layer-type-hover-highlight-fixed")

    // Lane dependent width
    map.addLayer({
        id: 'layer-type-hover-highlight-lanes',
        type: 'line',
        source: 'src-sections',
        layout: { 'line-cap': 'round' },
        paint: {
        'line-width': hoverWidth,
        'line-color': '#000000',
        'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.3, 0.0],
        }
    });
    layersForCurrentNetwork.push("layer-type-hover-highlight-lanes")
    layersForFinishedNetwork.push("layer-type-hover-highlight-lanes")
}



function drawLineNames(map: Map) {

    let farZoom = 12
    let middleZoom = 13
    let closeZoom = 14

    // ------------------------------------------------------------------------
    // Nom des lignes
    map.addLayer({
        id: `layer-current-network-src-sections-names`,
        type: 'symbol',
        source: `src-sections`,
        paint: {
            'text-color': "#47034d",
            'text-halo-color': "#FFF",
            'text-halo-width': 3.5,
            'text-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                farZoom, 0.0,
                middleZoom, 0.50,
                closeZoom, 0.75
                ],
        },
        layout: {
        'symbol-placement': 'line',
        'text-field': sectionNames,
        'text-font': ['Open Sans Bold'],
        'text-size': 15
        }
    });
    layersForCurrentNetwork.push("layer-current-network-src-sections-names")
    layersForQualityNetwork.push("layer-current-network-src-sections-names")
    layersForTypeFamilyNetwork.push("layer-current-network-src-sections-names")
    layersForTypeNetwork.push("layer-current-network-src-sections-names")
    layersForFinishedNetwork.push("layer-current-network-src-sections-names")
}


function addListnersForHovering(map: Map) {

    for(const highlightLayer of ["layer-type-hover-highlight-fixed", "layer-type-hover-highlight-lanes"]) {
        // Add MouveMove event listner => maybe a section is hovered
        let hoveredLineId: any = null;
        map.on('mousemove', highlightLayer, (e: any) => {
            map.getCanvas().style.cursor = 'pointer';
            if (e.features.length > 0) {

                if (hoveredLineId !== null) {
                    map.setFeatureState({ source: 'src-sections', id: hoveredLineId }, { hover: false });
                }
                if (e.features[0].id !== undefined) {
                    hoveredLineId = e.features[0].id;
                    if (hoveredLineId !== null) {
                        map.setFeatureState({ source: 'src-sections', id: hoveredLineId }, { hover: true });
                    }
                }
            }
        });

        // Add MouveLeave event listner => all sections are no hovered
        map.on('mouseleave', highlightLayer, () => {
            map.getCanvas().style.cursor = '';
            if (hoveredLineId !== null) {
                map.setFeatureState({ source: 'src-sections', id: hoveredLineId }, { hover: false });
            }
            hoveredLineId = null;
        });
    }
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


