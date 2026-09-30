import type { Map, MapMouseEvent } from 'maplibre-gl';
import { Popup } from 'maplibre-gl';
import { createApp, defineComponent, h, Suspense, ref, type Component } from 'vue';
import { isDangerFeature, isPerspectiveFeature } from '~/types';
import type { Feature, LaneFeature, SectionFeature } from '~/types';

import {
  updateOrCreateSources,
  drawCurrentNetwork,
  drawFinishedNetwork,
  drawQualityNetwork,
  drawTypeNetwork,
  drawTypeFamilyNetwork,
  drawHoveredEffect,
  changeLayer,
  drawLineNames,
  addListnersForHovering,
} from './map/network';
import { plotPerspective, plotDangers, plotLimits, plotPumps } from './map/features';

// Tooltips
import PerspectiveTooltip from '~/components/tooltips/PerspectiveTooltip.vue';
import DangerTooltip from '~/components/tooltips/DangerTooltip.vue';
import LineTooltip from '~/components/tooltips/LineTooltip.vue';
import LineHoverTooltip from '~/components/tooltips/LineHoverTooltip.vue';
import { getCrossIconUrl, fitBounds } from './map/utils';

enum DisplayedLayer {
  Progress = 0,
  Quality = 1,
  TypeFamily = 2,
  FinalizedProject = 3,
  Type = 4,
}

const displayedLayer = ref(DisplayedLayer.Progress);

const setDisplayedLayer = (value: DisplayedLayer) => {
  displayedLayer.value = value;
};

export { DisplayedLayer, setDisplayedLayer };

// En dessous, les lignes se superposent trop pour qu'un tooltip de survol soit lisible. 10 et non 11
// (seuil de Cyclopolis Lyon) : la carte interactive s'ouvre vers le zoom 10,5, cadrée sur tout le
// réseau, et le survol doit y être actif dès l'ouverture.
const MINIMUM_ZOOM_FOR_HOVER_TOOLTIP = 10;

// Tronçons dessinés sous un point de la carte (le dernier est celui du dessus).
function querySectionFeaturesAt(map: Map, point: MapMouseEvent['point']) {
  return map.queryRenderedFeatures(point, {
    filter: [
      'all',
      ['==', ['geometry-type'], 'LineString'],
      ['!=', ['get', 'source'], 'openmaptiles'], // Exclude base map features
      ['has', 'status'], // All sections in geojson LineStrings have a status
    ],
  });
}

function mountTooltip(popup: Popup, elementId: string, component: Component, props: Record<string, unknown>) {
  nextTick(() => {
    createApp({
      render: () =>
        h(Suspense, null, {
          default: h(component, props),
          fallback: 'Chargement...',
        }),
    }).mount(`#${elementId}`);
    // MapLibre a placé le popup (au-dessus ou au-dessous du point) avant que le contenu n'existe :
    // reposer le même point le fait replacer selon la taille réelle du contenu.
    popup.setLngLat(popup.getLngLat());
  });
}

const displayLimits = ref(false);

function toggleLimits() {
  displayLimits.value = !displayLimits.value;
}

function toggleLimitsVisibility(map: Map, displayLimits: boolean) {
  map.setLayoutProperty('limits', 'visibility', displayLimits ? 'visible' : 'none');
}

export const useMap = () => {
  let hoverPopup: Popup | null = null;
  let hoveredSectionName: string | null = null;
  // Tronçon dont le tooltip du clic est ouvert : pas de tooltip de survol par-dessus.
  let clickedSectionName: string | null = null;

  function plotEverything(map: Map, sections: SectionFeature[], features: Feature[]) {
    const lanes = separateSectionsIntoLanes(sections);

    plotNetwork(map, sections, lanes);

    plotFeatures(map, features);
  }

  function plotNetwork(map: Map, sections: SectionFeature[], lanes: LaneFeature[]) {
    const lanesWithId = lanes.map((feature, index) => ({ id: index, ...feature }));

    if (lanesWithId.length === 0 && !map.getLayer('highlight')) {
      return;
    }

    const onlyUpdate = updateOrCreateSources(map, sections, lanesWithId);

    if (onlyUpdate) {
      return;
    }

    drawHoveredEffect(map);

    drawFinishedNetwork(map);

    drawCurrentNetwork(map);

    drawQualityNetwork(map);

    drawTypeFamilyNetwork(map);

    drawTypeNetwork(map);

    drawLineNames(map);

    addListnersForHovering(map);
  }

  function plotFeatures(map: Map, updated_features: Feature[]) {
    plotPerspective({ map, features: updated_features });
    plotPumps({ map, features: updated_features });
    plotDangers({ map, features: updated_features });
    plotLimits({ map, features: updated_features });

    changeLayer(map, displayedLayer.value);

    watch(displayLimits, (displayLimits) => toggleLimitsVisibility(map, displayLimits));
    watch(displayedLayer, (displayedLayer) => changeLayer(map, displayedLayer));
  }

  function separateSectionsIntoLanes(features: SectionFeature[]): LaneFeature[] {
    const lanes: LaneFeature[] = [];
    features.forEach((f) => {
      f.properties.lines.forEach((lineNo, index) => {
        const lane: LaneFeature = {
          type: f.type,
          properties: {
            line: lineNo,
            name: f.properties.name,
            lane_index: index,
            nb_lanes: f.properties.lines.length,
            color: getLineColor(lineNo),
            status: f.properties.status,
            quality: f.properties.quality,
            qualityB: f.properties.qualityB,
            type: f.properties.type,
            typeB: f.properties.typeB,
            typeFamily: f.properties.typeFamily,
            typeFamilyB: f.properties.typeFamilyB,
            doneAt: f.properties.doneAt,
          },
          geometry: f.geometry,
        };

        lanes.push(lane);
      });
    });
    return lanes;
  }

  const { getLineColor } = useColors();

  function ensure<T>(argument: T | undefined | null, message: string = 'This value was promised to be there.'): T {
    if (argument === undefined || argument === null) {
      throw new TypeError(message);
    }

    return argument;
  }

  function handleMapClick({
    map,
    sections,
    features,
    clickEvent,
  }: {
    map: Map;
    sections: SectionFeature[];
    features: Feature[];
    clickEvent: MapMouseEvent;
  }) {
    // Élément de la couche sous le clic ; getTooltipProps n'est appelé que si isClicked l'a trouvé.
    function queryClickedFeature(layerId: string) {
      return ensure(map.queryRenderedFeatures(clickEvent.point, { layers: [layerId] })[0]);
    }

    const layers = [
      {
        id: 'dangers',
        isClicked: () => {
          if (!map.getLayer('dangers')) {
            return false;
          }
          const mapFeature = map.queryRenderedFeatures(clickEvent.point, { layers: ['dangers'] });
          return mapFeature.length > 0;
        },
        getTooltipProps: () => {
          const mapFeature = queryClickedFeature('dangers');
          const feature = features
            .filter(isDangerFeature)
            .find((f) => f.properties.name === mapFeature.properties.name);
          return { feature };
        },
        component: DangerTooltip,
      },
      {
        id: 'perspectives',
        isClicked: () => {
          if (!map.getLayer('perspectives')) {
            return false;
          }
          const mapFeature = map.queryRenderedFeatures(clickEvent.point, { layers: ['perspectives'] });
          return mapFeature.length > 0;
        },
        getTooltipProps: () => {
          const mapFeature = queryClickedFeature('perspectives');
          const feature = features
            .filter(isPerspectiveFeature)
            .find(
              (f) =>
                f.properties.line === mapFeature.properties.line &&
                f.properties.imgUrl === mapFeature.properties.imgUrl,
            );
          return { feature };
        },
        component: PerspectiveTooltip,
      },
      {
        id: 'linestring', // not really a layer id. gather all linestrings.
        isClicked: () => querySectionFeaturesAt(map, clickEvent.point).length > 0,
        getTooltipProps: () => {
          const mapFeatures = querySectionFeaturesAt(map, clickEvent.point);

          const mapFeature = ensure(mapFeatures[mapFeatures.length - 1]);

          const name = mapFeature.properties.name;

          const section = ensure(sections.find((f) => f.properties.name === name));

          const lines = section.properties.lines;

          return { feature: section, lines: lines };
        },
        component: LineTooltip,
      },
    ];

    const clickedLayer = layers.find((layer) => layer.isClicked());
    if (!clickedLayer) {
      return;
    }
    removeHoverTooltip();

    // Dimensions minimales pour la même raison que le tooltip de survol (voir handleMapHover) : sans
    // elles, près du haut de la carte, le tooltip grandit au-dessus et passe sous l'en-tête du site.
    // maxWidth : MapLibre limite sinon le cadre à 240 px et le contenu plus large en déborde ; la
    // largeur est bornée par le composant du tooltip.
    const clickPopup = new Popup({ closeButton: false, closeOnClick: true, maxWidth: 'none' })
      .setLngLat(clickEvent.lngLat)
      .setHTML(`<div id="${clickedLayer.id}-tooltip-content" style="min-height: 250px; min-width: 240px"></div>`)
      .addTo(map);

    const props = clickedLayer.getTooltipProps();
    if (clickedLayer.id === 'linestring' && props.feature) {
      clickedSectionName = props.feature.properties.name;
      clickPopup.on('close', () => {
        clickedSectionName = null;
      });
    }
    // @ts-expect-error -- les tooltips ont des props différentes : leur union n'est pas un composant
    // valide pour defineComponent, alors que chaque paire composant/props l'est.
    const component = defineComponent(clickedLayer.component);
    mountTooltip(clickPopup, `${clickedLayer.id}-tooltip-content`, component, props);
  }

  function removeHoverTooltip() {
    hoverPopup?.remove();
    hoverPopup = null;
    hoveredSectionName = null;
  }

  // Tooltip compact au survol d'un tronçon ; le clic garde le tooltip complet. Il suit la souris le
  // long d'un même tronçon et n'est pas affiché par-dessus le tooltip du clic sur ce tronçon.
  function handleMapHover({
    map,
    sections,
    hoverEvent,
  }: {
    map: Map;
    sections: SectionFeature[];
    hoverEvent: MapMouseEvent;
  }) {
    if (map.getZoom() < MINIMUM_ZOOM_FOR_HOVER_TOOLTIP) {
      removeHoverTooltip();
      return;
    }
    const mapFeatures = querySectionFeaturesAt(map, hoverEvent.point);
    const hoveredName = mapFeatures[mapFeatures.length - 1]?.properties.name;
    const section = sections.find((s) => s.properties.name === hoveredName);
    if (!section || section.properties.name === clickedSectionName) {
      removeHoverTooltip();
      return;
    }
    if (section.properties.name === hoveredSectionName && hoverPopup) {
      hoverPopup.setLngLat(hoverEvent.lngLat);
      return;
    }

    removeHoverTooltip();
    hoveredSectionName = section.properties.name;
    // MapLibre place le tooltip au-dessus ou au-dessous du point selon sa taille au moment de
    // l'ajout, avant que Vue n'y monte le contenu : sans ces dimensions minimales, un tooltip vide
    // est placé au-dessus d'un tronçon proche du haut, puis grandit hors de la carte.
    hoverPopup = new Popup({ closeButton: false, closeOnClick: false, offset: 12, maxWidth: 'none' })
      .setLngLat(hoverEvent.lngLat)
      .setHTML('<div id="line-hover-tooltip-content" style="min-height: 130px; min-width: 120px"></div>')
      .addTo(map);
    mountTooltip(hoverPopup, 'line-hover-tooltip-content', LineHoverTooltip, {
      feature: section,
      lines: section.properties.lines,
    });
  }

  async function loadImages({ map }: { map: Map }) {
    const camera = await map.loadImage('/icons/camera.png');
    map.addImage('camera-icon', camera.data, { sdf: true });

    const pump = await map.loadImage('/icons/pump.png');
    map.addImage('pump-icon', pump.data, { sdf: true });

    const danger = await map.loadImage('/icons/danger.png');
    map.addImage('danger-icon', danger.data, { sdf: false });

    const crossIconUrl = getCrossIconUrl();
    const cross = await map.loadImage(crossIconUrl);
    map.addImage('cross-icon', cross.data, { sdf: true });
  }

  return {
    loadImages,
    updateOrCreateSources,
    separateSectionsIntoLanes,
    plotEverything,
    fitBounds,
    toggleLimits,
    handleMapClick,
    handleMapHover,
    removeHoverTooltip,
  };
};
