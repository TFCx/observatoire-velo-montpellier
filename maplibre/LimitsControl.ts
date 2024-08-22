export default class LimitsControl {
    _btn: HTMLButtonElement;
    _container: HTMLDivElement;
    _onClick: Function;
    _isToggled: boolean;

    constructor({ onClick }: { onClick: Function }) {
      this._onClick = onClick;
      this._isToggled = false
    }

    onAdd() {
      this._btn = document.createElement('button');
      this._btn.className = 'maplibregl-limits maplibregl-ctrl-icon';
      this._btn.type = 'button';
      this._btn.title = 'Limites';
      this._btn.onclick = () => this._onClick();

      this._container = document.createElement('div');
      this._container.className = 'maplibregl-ctrl-group maplibregl-ctrl';
      this._container.appendChild(this._btn);

      return this._container;
    }

    onRemove() {
      if (this._container && this._container.parentNode) {
        this._container.parentNode.removeChild(this._container);
      }
    }

    toggleBackground() {
      this._isToggled = !this._isToggled
      this._container.className = this._isToggled ?
        'maplibregl-ctrl-group maplibregl-ctrl maplibregl-activated' :
        'maplibregl-ctrl-group maplibregl-ctrl'
    }
  }
