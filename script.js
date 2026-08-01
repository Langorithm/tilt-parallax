(() => {
  const stage = document.getElementById('stage');
  const permissionBtn = document.getElementById('permission');

  // The target offset (updated by input) and the current offset (lerped toward
  // target every frame). Range is roughly +/- 60 px at the front plane.
  const state = { tx: 0, ty: 0, targetX: 0, targetY: 0 };
  const RANGE = 60;
  const EASE = 0.09;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function tick() {
    state.tx += (state.targetX - state.tx) * EASE;
    state.ty += (state.targetY - state.ty) * EASE;
    stage.style.setProperty('--tx', state.tx.toFixed(2));
    stage.style.setProperty('--ty', state.ty.toFixed(2));
    requestAnimationFrame(tick);
  }

  function onOrientation(e) {
    // gamma: left/right tilt in degrees, roughly -45..45 in normal handheld use
    // beta:  front/back tilt in degrees; ~45 when the phone is held upright
    if (e.gamma == null || e.beta == null) return;
    const gx = clamp(e.gamma / 35, -1, 1);
    const gy = clamp((e.beta - 45) / 35, -1, 1);
    state.targetX = -gx * RANGE;
    state.targetY = -gy * RANGE;
  }

  function onMouseMove(e) {
    const cx = (e.clientX / window.innerWidth) - 0.5;
    const cy = (e.clientY / window.innerHeight) - 0.5;
    state.targetX = -cx * RANGE * 2;
    state.targetY = -cy * RANGE * 2;
  }

  function startOrientation() {
    window.addEventListener('deviceorientation', onOrientation);
  }

  function startMouse() {
    window.addEventListener('mousemove', onMouseMove, { passive: true });
  }

  async function requestPermissionAndStart() {
    try {
      const state = await DeviceOrientationEvent.requestPermission();
      if (state === 'granted') {
        startOrientation();
        permissionBtn.hidden = true;
      } else {
        permissionBtn.textContent = 'Motion denied';
      }
    } catch (err) {
      permissionBtn.textContent = 'Motion unavailable';
    }
  }

  // Wire up inputs based on capability.
  const needsPermission =
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function';

  const hasOrientation = 'DeviceOrientationEvent' in window;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

  if (needsPermission) {
    // iOS 13+: show the button, wait for tap.
    permissionBtn.hidden = false;
    permissionBtn.addEventListener('click', requestPermissionAndStart);
  } else if (hasOrientation && isCoarsePointer) {
    // Android / any touch device that exposes orientation without permission.
    startOrientation();
  } else {
    // Desktop / laptop: fall back to mouse parallax.
    startMouse();
  }

  if (!reducedMotion) requestAnimationFrame(tick);
})();
