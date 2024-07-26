export default class LayerControl {
  _container: HTMLDivElement;
  _onChange: Function;
  _initialLayer: number;

  constructor(onChange: Function, initialLayer: number = 0) {
    this._onChange = onChange;
    this._initialLayer = initialLayer
  }

  onAdd() {
    this._container = document.createElement('div');
    this._container.className = 'maplibregl-ctrl-group maplibregl-ctrl layercontrol';

    // Créer des boutons radio

    let title = document.createElement("LayerControlTitle")
    title.appendChild(document.createTextNode("Visualisation"))
    title.className = "layercontrol-title"
    this._container.appendChild(title);
    this.createRadioButton('network', 'du réseau', this._initialLayer == 0);
    this.createRadioButton('quality', 'de la qualité des aménagements', this._initialLayer == 1);
    this.createRadioButton('type', 'du type des aménagements', this._initialLayer == 2);

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
