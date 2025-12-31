// libs/jsm/controls/OrbitControls.js
// ✅ ES Module 전용 OrbitControls
// ✅ three.module.js와 호환
// ❌ window.THREE 사용 안 함 (중복 선언 원인 제거)

import {
  EventDispatcher,
  MOUSE,
  Quaternion,
  Spherical,
  TOUCH,
  Vector3
} from '../../three.module.js';

const _changeEvent = { type: 'change' };
const _startEvent  = { type: 'start' };
const _endEvent    = { type: 'end' };

const _EPS = 1e-6;

const _spherical = new Spherical();
const _sphericalDelta = new Spherical();

const _scale = new Vector3(1,1,1);
const _panOffset = new Vector3();

const _quat = new Quaternion().setFromUnitVectors(
  new Vector3(0, 1, 0),
  new Vector3(0, 0, 1)
);
const _quatInverse = _quat.clone().invert();

const _lastPosition = new Vector3();
const _lastQuaternion = new Quaternion();

class OrbitControls extends EventDispatcher {

  constructor(camera, domElement) {
    super();

    this.object = camera;
    this.domElement = domElement ?? document;

    this.enabled = true;
    this.target = new Vector3();

    this.enableDamping = true;
    this.dampingFactor = 0.08;

    this.enableRotate = true;
    this.rotateSpeed = 0.8;

    this.enableZoom = true;
    this.zoomSpeed = 1.0;

    this.enablePan = true;
    this.panSpeed = 0.6;

    this.minDistance = 2;
    this.maxDistance = 50;

    this.mouseButtons = {
      LEFT: MOUSE.ROTATE,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.PAN
    };

    this.touches = {
      ONE: TOUCH.ROTATE,
      TWO: TOUCH.DOLLY_PAN
    };

    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();

    this.domElement.addEventListener('contextmenu', e => e.preventDefault());
    this.domElement.addEventListener('wheel', this._onWheel.bind(this), { passive:false });

    this.update();
  }

  update() {
    const position = this.object.position;
    const offset = position.clone().sub(this.target);

    offset.applyQuaternion(_quat);
    _spherical.setFromVector3(offset);

    _spherical.theta += _sphericalDelta.theta;
    _spherical.phi   += _sphericalDelta.phi;

    _spherical.makeSafe();
    _spherical.radius *= _scale.x;
    _spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, _spherical.radius));

    this.target.add(_panOffset);

    offset.setFromSpherical(_spherical);
    offset.applyQuaternion(_quatInverse);

    position.copy(this.target).add(offset);
    this.object.lookAt(this.target);

    if (this.enableDamping) {
      _sphericalDelta.theta *= (1 - this.dampingFactor);
      _sphericalDelta.phi   *= (1 - this.dampingFactor);
      _panOffset.multiplyScalar(1 - this.dampingFactor);
    } else {
      _sphericalDelta.set(0,0,0);
      _panOffset.set(0,0,0);
    }

    if (
      _lastPosition.distanceToSquared(position) > _EPS ||
      8 * (1 - _lastQuaternion.dot(this.object.quaternion)) > _EPS
    ) {
      this.dispatchEvent(_changeEvent);
      _lastPosition.copy(position);
      _lastQuaternion.copy(this.object.quaternion);
    }
  }

  _onWheel(event) {
    if (!this.enabled || !this.enableZoom) return;
    event.preventDefault();

    const scale = event.deltaY < 0 ? 0.95 : 1.05;
    _scale.multiplyScalar(scale);

    this.update();
    this.dispatchEvent(_endEvent);
  }

  reset() {
    this.target.copy(this.target0);
    this.object.position.copy(this.position0);
    this.update();
    this.dispatchEvent(_changeEvent);
  }
}

export { OrbitControls };
