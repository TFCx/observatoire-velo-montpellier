export default class LayerControl {
  _container: HTMLDivElement;
  _onChange: Function;
  _btn_legend: HTMLButtonElement;
  _onClick: Function;


  constructor(onClick: Function, onChange: Function) {
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

    this.createRadioButton('progress', 'de l\'avancement du projet', true);
    this.createRadioButton('quality', 'de la qualité des aménagements', false);
    this.createRadioButton('type', "du type d'aménagement", false);
    this.createRadioButton('finalizedProject', 'du futur réseau', false);

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
