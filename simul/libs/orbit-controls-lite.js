(function () {
  if (!window.THREE || window.THREE.OrbitControls) return;

  const THREE = window.THREE;

  THREE.OrbitControls = function OrbitControls(camera, domElement) {
    this.object = camera;
    this.domElement = domElement || document;
    this.target = new THREE.Vector3();
    this.enableDamping = false;
    this.dampingFactor = 0.05;
    this.autoRotate = false;
    this.screenSpacePanning = false;
    this.maxPolarAngle = Math.PI;
    this.minDistance = 0;
    this.maxDistance = Infinity;

    const spherical = new THREE.Spherical();
    const offset = new THREE.Vector3();
    const delta = new THREE.Vector2();
    const last = new THREE.Vector2();
    let dragging = false;
    let pointerId = null;

    const syncFromCamera = () => {
      offset.copy(this.object.position).sub(this.target);
      spherical.setFromVector3(offset);
    };

    const applyCamera = () => {
      spherical.phi = Math.max(0.01, Math.min(this.maxPolarAngle || Math.PI, spherical.phi));
      spherical.radius = Math.max(this.minDistance || 0, Math.min(this.maxDistance || Infinity, spherical.radius));
      offset.setFromSpherical(spherical);
      this.object.position.copy(this.target).add(offset);
      this.object.lookAt(this.target);
    };

    this.update = function update() {
      syncFromCamera();
      applyCamera();
    };

    const onPointerDown = (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      dragging = true;
      pointerId = event.pointerId;
      last.set(event.clientX, event.clientY);
      this.domElement.setPointerCapture?.(pointerId);
      event.preventDefault();
    };

    const onPointerMove = (event) => {
      if (!dragging || (pointerId !== null && event.pointerId !== pointerId)) return;
      syncFromCamera();
      delta.set(event.clientX - last.x, event.clientY - last.y);
      last.set(event.clientX, event.clientY);
      spherical.theta -= delta.x * 0.006;
      spherical.phi -= delta.y * 0.006;
      applyCamera();
      event.preventDefault();
    };

    const onPointerUp = (event) => {
      if (pointerId !== null && event.pointerId !== pointerId) return;
      dragging = false;
      this.domElement.releasePointerCapture?.(pointerId);
      pointerId = null;
    };

    const onWheel = (event) => {
      syncFromCamera();
      spherical.radius *= event.deltaY > 0 ? 1.08 : 0.92;
      applyCamera();
      event.preventDefault();
    };

    this.domElement.addEventListener('pointerdown', onPointerDown, { passive: false });
    this.domElement.addEventListener('pointermove', onPointerMove, { passive: false });
    this.domElement.addEventListener('pointerup', onPointerUp, { passive: true });
    this.domElement.addEventListener('pointercancel', onPointerUp, { passive: true });
    this.domElement.addEventListener('wheel', onWheel, { passive: false });

    syncFromCamera();
    applyCamera();
  };
})();
