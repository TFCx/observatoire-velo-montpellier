export default class ComboboxControl {
  _select: HTMLSelectElement;
  _container: HTMLDivElement;
  _onChange: Function;

  constructor({ onChange }: { onChange: Function }) {
    this._onChange = onChange;
  }

  onAdd() {
    this._select = document.createElement('select');
    this._select.className = '';
    this._select.title = 'Options';
    this._select.onchange = (event) => this._onChange(event);

    // Ajouter des options à la combobox
    const option1 = document.createElement('option');
    option1.value = 'network';
    option1.text = 'Réseau';
    this._select.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = 'quality';
    option2.text = 'Qualité des aménagements';
    this._select.appendChild(option2);

    const option3 = document.createElement('option');
    option3.value = 'type';
    option3.text = 'Type d\'aménagements';
    this._select.appendChild(option3);

    this._container = document.createElement('div');
    this._container.className = 'maplibregl-ctrl-group maplibregl-ctrl';
    this._container.appendChild(this._select);

    return this._container;
  }

  onRemove() {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
  }
}
