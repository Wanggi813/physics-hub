/*!
 * OrbitControls (UMD/IIFE) — r160 compatible
 * Minimal, self-contained implementation for THREE.js (MIT)
 * 
 * Notes:
 * - Designed to work with THREE exposed on window.THREE
 * - Implements rotate / dolly(zoom) / pan with damping, similar API to r160
 * - Methods: constructor(camera, domElement), update(), dispose(), saveState(), reset()
 * - Options commonly used: enableDamping, dampingFactor, enableZoom, zoomSpeed,
 *   enableRotate, rotateSpeed, enablePan, panSpeed, screenSpacePanning,
 *   minDistance, maxDistance, minPolarAngle, maxPolarAngle, minAzimuthAngle, maxAzimuthAngle,
 *   enableKeys (Arrow/WASD), keyPanSpeed, autoRotate, autoRotateSpeed
 * 
 * This is a lightweight re-implementation compatible with typical r160 usage.
 * It is not a verbatim copy of three/examples/jsm/controls/OrbitControls.js.
 * 
 * Copyright (c) 2025
 * Released under the MIT license.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['three'], function (THREE) { return factory(THREE || root.THREE); });
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('three'));
  } else {
    root.THREE = root.THREE || {};
    root.THREE.OrbitControls = factory(root.THREE);
  }
})(this, function (THREE) {
  if (!THREE) throw new Error('OrbitControls: THREE not found on global or import.');

  const PI = Math.PI;
  const _v2 = new THREE.Vector2();
  const _v3 = new THREE.Vector3();
  const _xAxis = new THREE.Vector3(1,0,0);
  const _yAxis = new THREE.Vector3(0,1,0);
  const _zero = new THREE.Vector3();

  const STATE = {
    NONE: -1,
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
    TOUCH_ROTATE: 3,
    TOUCH_DOLLY_PAN: 4,
  };

  function clamp(value, min, max){ return Math.max(min, Math.min(max, value)); }

  class OrbitControls {

    constructor(camera, domElement){
      if (!camera || !domElement) throw new Error('OrbitControls(camera, domElement) required.');
      this.object = camera;
      this.domElement = domElement;

      // API options (r160-like)
      this.enabled = true;

      this.target = new THREE.Vector3();

      this.minDistance = 0;
      this.maxDistance = Infinity;

      this.minZoom = 0;
      this.maxZoom = Infinity;

      this.minPolarAngle = 0;                 // radians
      this.maxPolarAngle = PI;                // radians

      this.minAzimuthAngle = -Infinity;       // radians
      this.maxAzimuthAngle =  Infinity;       // radians

      this.enableDamping = false;
      this.dampingFactor = 0.05;

      this.enableZoom = true;
      this.zoomSpeed = 1.0;

      this.enableRotate = true;
      this.rotateSpeed = 1.0;

      this.enablePan = true;
      this.panSpeed = 1.0;
      this.screenSpacePanning = true; // if false, pan orthogonal to world up
      this.keyPanSpeed = 7.0; // pixels moved per arrow key push

      this.autoRotate = false;
      this.autoRotateSpeed = 2.0; // 30 seconds per round when 2.0

      this.enableKeys = true;
      this.keys = { LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', DOWN: 'ArrowDown' };

      this.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
      this.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

      // Internals
      this._state = STATE.NONE;

      this._spherical = new THREE.Spherical();
      this._sphericalDelta = new THREE.Spherical();
      this._scale = 1;
      this._panOffset = new THREE.Vector3();

      this._zoomChanged = false;

      // damping accumulators
      this._rotateDelta = new THREE.Vector2(0,0);
      this._panDelta = new THREE.Vector2(0,0);

      // initial state save
      this._target0 = this.target.clone();
      this._position0 = this.object.position.clone();
      this._zoom0 = this.object.zoom;

      // event bindings
      this._onContextMenu = e => e.preventDefault();
      this._onPointerDown = this._handlePointerDown.bind(this);
      this._onPointerMove = this._handlePointerMove.bind(this);
      this._onPointerUp   = this._handlePointerUp.bind(this);
      this._onWheel       = this._handleMouseWheel.bind(this);
      this._onKeyDown     = this._handleKeyDown.bind(this);
      this._onTouchStart  = this._handleTouchStart.bind(this);
      this._onTouchMove   = this._handleTouchMove.bind(this);
      this._onTouchEnd    = this._handleTouchEnd.bind(this);

      domElement.addEventListener('contextmenu', this._onContextMenu);
      domElement.addEventListener('pointerdown', this._onPointerDown);
      domElement.addEventListener('wheel', this._onWheel, { passive:false });

      window.addEventListener('pointermove', this._onPointerMove);
      window.addEventListener('pointerup', this._onPointerUp);

      domElement.addEventListener('touchstart', this._onTouchStart, { passive:false });
      domElement.addEventListener('touchmove', this._onTouchMove, { passive:false });
      domElement.addEventListener('touchend', this._onTouchEnd);

      window.addEventListener('keydown', this._onKeyDown);

      // set spherical from initial
      this._updateSphericalFromObject();
      this.update();
    }

    // Public API
    saveState(){
      this._target0.copy(this.target);
      this._position0.copy(this.object.position);
      this._zoom0 = this.object.zoom;
    }

    reset(){
      this.target.copy(this._target0);
      this.object.position.copy(this._position0);
      this.object.zoom = this._zoom0;
      this.object.updateProjectionMatrix();

      this._updateSphericalFromObject();
      this._sphericalDelta.set(0,0,0);
      this._panOffset.set(0,0,0);
      this._scale = 1;
      this._zoomChanged = true;
      this.update();
    }

    dispose(){
      const el = this.domElement;
      el.removeEventListener('contextmenu', this._onContextMenu);
      el.removeEventListener('pointerdown', this._onPointerDown);
      el.removeEventListener('wheel', this._onWheel);

      window.removeEventListener('pointermove', this._onPointerMove);
      window.removeEventListener('pointerup', this._onPointerUp);

      el.removeEventListener('touchstart', this._onTouchStart);
      el.removeEventListener('touchmove', this._onTouchMove);
      el.removeEventListener('touchend', this._onTouchEnd);

      window.removeEventListener('keydown', this._onKeyDown);
    }

    getPolarAngle(){ return this._spherical.phi; }
    getAzimuthalAngle(){ return this._spherical.theta; }

    // Core update
    update(){
      const offset = _v3.copy(this.object.position).sub(this.target);

      // rotate to Y-up space
      this._spherical.setFromVector3(offset);

      if (this.autoRotate && this._state === STATE.NONE && this.enableRotate){
        this._rotateLeft(this._getAutoRotationAngle());
      }

      this._spherical.theta += this._sphericalDelta.theta;
      this._spherical.phi   += this._sphericalDelta.phi;

      // clamp azimuth
      let minAz = this.minAzimuthAngle, maxAz = this.maxAzimuthAngle;
      if (isFinite(minAz) && isFinite(maxAz)){
        if (minAz < -PI) minAz += 2*PI; else if (minAz > PI) minAz -= 2*PI;
        if (maxAz < -PI) maxAz += 2*PI; else if (maxAz > PI) maxAz -= 2*PI;
        if (minAz <= maxAz){
          this._spherical.theta = clamp(this._spherical.theta, minAz, maxAz);
        } else {
          this._spherical.theta = (this._spherical.theta > (minAz + maxAz)/2) ?
            clamp(this._spherical.theta, minAz,  PI) :
            clamp(this._spherical.theta, -PI,     maxAz);
        }
      }

      // clamp polar
      this._spherical.phi = clamp(this._spherical.phi, this.minPolarAngle, this.maxPolarAngle);

      // apply zoom scale
      this._spherical.radius *= this._scale;

      // clamp distance
      this._spherical.radius = clamp(this._spherical.radius, this.minDistance, this.maxDistance);

      // pan
      this.target.add(this._panOffset);

      // to Cartesian
      offset.setFromSpherical(this._spherical);

      // set position
      this.object.position.copy(this.target).add(offset);
      this.object.lookAt(this.target);

      if (this.enableDamping){
        this._sphericalDelta.theta *= (1 - this.dampingFactor);
        this._sphericalDelta.phi   *= (1 - this.dampingFactor);
        this._panOffset.multiplyScalar(1 - this.dampingFactor);
      } else {
        this._sphericalDelta.set(0,0,0);
        this._panOffset.set(0,0,0);
      }

      this._scale = 1;

      // signal
      return true;
    }

    // Internals ---------------------------------------------------------

    _updateSphericalFromObject(){
      const offset = _v3.copy(this.object.position).sub(this.target);
      this._spherical.setFromVector3(offset);
    }

    _getAutoRotationAngle(){
      return (2 * PI) / 60 / 60 * this.autoRotateSpeed;
    }

    _rotateLeft(angle){ this._sphericalDelta.theta -= angle; }
    _rotateUp(angle){   this._sphericalDelta.phi   -= angle; }

    _panLeft(distance, objectMatrix){
      _v3.setFromMatrixColumn(objectMatrix, 0); // X column
      _v3.multiplyScalar(-distance);
      this._panOffset.add(_v3);
    }

    _panUp(distance, objectMatrix){
      if (this.screenSpacePanning){
        // screen-space: use Y column
        _v3.setFromMatrixColumn(objectMatrix, 1);
      } else {
        // world-space: use world up
        _v3.copy(this.object.up);
      }
      _v3.multiplyScalar(distance);
      this._panOffset.add(_v3);
    }

    _pan(deltaX, deltaY){
      // perspective only (most common)
      const element = this.domElement;
      if (this.object.isPerspectiveCamera){
        const position = this.object.position;
        _v3.copy(position).sub(this.target);
        let targetDistance = _v3.length();

        // half of the fov is center to top
        targetDistance *= Math.tan( (this.object.fov / 2) * Math.PI / 180.0 );

        this._panLeft( 2 * deltaX * targetDistance / element.clientHeight, this.object.matrix );
        this._panUp(   2 * deltaY * targetDistance / element.clientHeight, this.object.matrix );
      } else if (this.object.isOrthographicCamera){
        // orthographic
        this._panLeft( deltaX * (this.object.right - this.object.left) / this.object.zoom / element.clientWidth, this.object.matrix );
        this._panUp(   deltaY * (this.object.top   - this.object.bottom)/ this.object.zoom / element.clientHeight, this.object.matrix );
      } else {
        // camera neither orthographic nor perspective
        this._panLeft(deltaX, this.object.matrix);
        this._panUp(deltaY, this.object.matrix);
      }
    }

    _dollyIn(dollyScale){
      if (this.object.isPerspectiveCamera){
        this._scale /= dollyScale;
      } else if (this.object.isOrthographicCamera){
        this.object.zoom = clamp(this.object.zoom * dollyScale, this.minZoom, this.maxZoom);
        this.object.updateProjectionMatrix();
        this._zoomChanged = true;
      } else {
        this._scale /= dollyScale;
      }
    }

    _dollyOut(dollyScale){
      if (this.object.isPerspectiveCamera){
        this._scale *= dollyScale;
      } else if (this.object.isOrthographicCamera){
        this.object.zoom = clamp(this.object.zoom / dollyScale, this.minZoom, this.maxZoom);
        this.object.updateProjectionMatrix();
        this._zoomChanged = true;
      } else {
        this._scale *= dollyScale;
      }
    }

    // Event handlers ----------------------------------------------------

    _handlePointerDown(event){
      if (!this.enabled) return;
      if (event.pointerType === 'touch') return; // handled by touchstart
      this.domElement.setPointerCapture(event.pointerId);

      switch (event.button){
        case 0: // left
          if (this.enableRotate){
            this._state = STATE.ROTATE;
            _v2.set(event.clientX, event.clientY);
          }
          break;
        case 1: // middle
          if (this.enableZoom){
            this._state = STATE.DOLLY;
            _v2.set(event.clientX, event.clientY);
          }
          break;
        case 2: // right
          if (this.enablePan){
            this._state = STATE.PAN;
            _v2.set(event.clientX, event.clientY);
          }
          break;
      }
    }

    _handlePointerMove(event){
      if (!this.enabled) return;
      if (event.pointerType === 'touch') return; // handled by touchmove
      if (this._state === STATE.NONE) return;

      const dx = event.clientX - _v2.x;
      const dy = event.clientY - _v2.y;
      _v2.set(event.clientX, event.clientY);

      switch (this._state){
        case STATE.ROTATE:
          if (!this.enableRotate) return;
          const rotX = (2 * PI * dx / this.domElement.clientHeight) * this.rotateSpeed;
          const rotY = (2 * PI * dy / this.domElement.clientHeight) * this.rotateSpeed;
          this._rotateLeft(rotX);
          this._rotateUp(rotY);
          break;

        case STATE.DOLLY:
          if (!this.enableZoom) return;
          const dolly = Math.pow(0.95, this.zoomSpeed * (dy>0? 1 : -1) * Math.max(Math.abs(dx), Math.abs(dy)) / 10 );
          if (dy > 0) this._dollyIn(dolly); else this._dollyOut(dolly);
          break;

        case STATE.PAN:
          if (!this.enablePan) return;
          this._pan(dx * this.panSpeed, dy * this.panSpeed);
          break;
      }
      this.update();
    }

    _handlePointerUp(event){
      if (!this.enabled) return;
      this._state = STATE.NONE;
      try{ this.domElement.releasePointerCapture(event.pointerId); } catch(e){}
    }

    _handleMouseWheel(event){
      if (!this.enabled || !this.enableZoom) return;
      event.preventDefault();

      if (event.deltaY < 0){
        this._dollyOut(Math.pow(0.95, this.zoomSpeed));
      } else if (event.deltaY > 0){
        this._dollyIn(Math.pow(0.95, this.zoomSpeed));
      }
      this.update();
    }

    _handleKeyDown(event){
      if (!this.enabled || !this.enableKeys) return;

      let needsUpdate = false;
      const panStep = this.keyPanSpeed;

      switch (event.key){
        case this.keys.UP:    this._pan(0, -panStep); needsUpdate = true; break;
        case this.keys.DOWN:  this._pan(0, +panStep); needsUpdate = true; break;
        case this.keys.LEFT:  this._pan(+panStep, 0); needsUpdate = true; break;
        case this.keys.RIGHT: this._pan(-panStep, 0); needsUpdate = true; break;
        default: break;
      }
      if (needsUpdate) this.update();
    }

    // Touch -------------------------------------------------------------

    _handleTouchStart(e){
      if (!this.enabled) return;
      if (e.touches.length === 1){
        if (!this.enableRotate) return;
        this._state = STATE.TOUCH_ROTATE;
        _v2.set(e.touches[0].clientX, e.touches[0].clientY);
      } else if (e.touches.length >= 2){
        if (!this.enableZoom && !this.enablePan) return;
        this._state = STATE.TOUCH_DOLLY_PAN;
        this._touchStart = [
          new THREE.Vector2(e.touches[0].clientX, e.touches[0].clientY),
          new THREE.Vector2(e.touches[1].clientX, e.touches[1].clientY)
        ];
        this._touchStartDist = this._touchStart[0].distanceTo(this._touchStart[1]);
      }
    }

    _handleTouchMove(e){
      if (!this.enabled) return;
      if (this._state === STATE.TOUCH_ROTATE && e.touches.length === 1){
        const nx = e.touches[0].clientX;
        const ny = e.touches[0].clientY;
        const dx = nx - _v2.x, dy = ny - _v2.y;
        _v2.set(nx, ny);
        const rotX = (2 * PI * dx / this.domElement.clientHeight) * this.rotateSpeed;
        const rotY = (2 * PI * dy / this.domElement.clientHeight) * this.rotateSpeed;
        this._rotateLeft(rotX);
        this._rotateUp(rotY);
        this.update();
      } else if (this._state === STATE.TOUCH_DOLLY_PAN && e.touches.length >= 2){
        const p0 = new THREE.Vector2(e.touches[0].clientX, e.touches[0].clientY);
        const p1 = new THREE.Vector2(e.touches[1].clientX, e.touches[1].clientY);

        // dolly
        const dist = p0.distanceTo(p1);
        const scale = dist / (this._touchStartDist || dist);
        if (this.enableZoom){
          if (scale > 1) this._dollyOut(Math.pow(0.95, this.zoomSpeed));
          else if (scale < 1) this._dollyIn(Math.pow(0.95, this.zoomSpeed));
        }
        this._touchStartDist = dist;

        // pan (average movement)
        const mid = p0.clone().add(p1).multiplyScalar(0.5);
        const mid0 = this._touchStart[0].clone().add(this._touchStart[1]).multiplyScalar(0.5);
        const pdx = mid.x - mid0.x, pdy = mid.y - mid0.y;
        if (this.enablePan){
          this._pan(pdx * this.panSpeed, pdy * this.panSpeed);
        }
        this._touchStart = [p0, p1];
        this.update();
      }
      e.preventDefault();
    }

    _handleTouchEnd(e){
      this._state = STATE.NONE;
    }
  }

  // expose constants (for compatibility)
  OrbitControls.prototype = Object.assign(OrbitControls.prototype, {});
  OrbitControls.prototype.constructor = OrbitControls;

  // mirror three/examples/ style for external usage
  function OrbitControls(camera, domElement){ return new OrbitControls.classRef(camera, domElement); }
  OrbitControls.classRef = OrbitControls;

  // Export as THREE.OrbitControls
  THREE.OrbitControls = OrbitControls.classRef;
  return THREE.OrbitControls;
});
