import { DisplayedLayer } from "~/composables/map/network";

export default class LayerControl {
  _defaultLayer: DisplayedLayer;
  _displayLayerType: boolean;
  _container: HTMLDivElement;
  _onChange: Function;
  _btn_legend: HTMLButtonElement;
  _onClick: Function;


  constructor(defaultLayer: DisplayedLayer, displayLayerType: boolean, onClick: Function, onChange: Function) {
    this._defaultLayer = defaultLayer
    this._displayLayerType = displayLayerType
    this._onChange = onChange;
    this._onClick = onClick;
  }

  onAdd() {
    this._container = document.createElement('div');
    this._container.className = 'maplibregl-ctrl-group maplibregl-ctrl layercontrol';

    let title = document.createElement("LayerControlTitle")
    title.className = "layercontrol-title"
    title.appendChild(document.createTextNode("Visualisation"))
    this._container.appendChild(title);

    this._btn_legend = document.createElement('button');
    this._btn_legend.className = 'maplibregl-info maplibregl-ctrl-icon button-corner-top-right';
    this._btn_legend.type = 'button';
    this._btn_legend.title = 'Légende';
    this._btn_legend.onclick = () => this._onClick();
    title.appendChild(this._btn_legend);

    this.createRadioButton('progress', 'de l\'avancement du projet', this._defaultLayer == DisplayedLayer.Progress);
    this.createRadioButton('quality', 'de la qualité des aménagements', this._defaultLayer == DisplayedLayer.Quality);
    this.createRadioButton('typeFamily', "du type d'aménagement", this._defaultLayer == DisplayedLayer.TypeFamily);
    this.createRadioButton('finalizedProject', 'du futur réseau', this._defaultLayer == DisplayedLayer.FinalizedProject);

    if(this._displayLayerType) {
      this.createRadioButton('type', "du type précis d'aménagement", this._defaultLayer == DisplayedLayer.Type);
    }

    return this._container;
  }

  createRadioButton(value: string, label: string, tryCheck: boolean = false) {
    let radioButtonContainer = document.createElement('div');

    const radioButton = document.createElement('input');
    const radioLabel = document.createElement('label');

    radioButton.type = 'radio';
    radioButton.name = 'map-radio-options';
    radioButton.value = value;
    radioButton.id = value;
    radioButton.onclick = () => {
      this._onChange(value);
    }

    radioLabel.htmlFor = value;
    radioLabel.textContent = label;

    radioButtonContainer.appendChild(radioButton);
    radioButtonContainer.appendChild(document.createTextNode(" "));
    radioButtonContainer.appendChild(radioLabel);
    radioButton.checked = tryCheck

    this._container.appendChild(radioButtonContainer);
  }

  onRemove() {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
  }
}
