(() => {
  const stage = document.getElementById('stage');
  const permissionBtn = document.getElementById('permission');
  const status = document.getElementById('status');

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

  // Calibrate to whatever angle the phone is at on the first reading — hold
  // it however feels natural, and that becomes "neutral".
  let refBeta = null, refGamma = null;
  let receivedAny = false;

  function onOrientation(e) {
    if (e.gamma == null || e.beta == null) return;
    receivedAny = true;
    if (refBeta === null) {
      refBeta = e.beta;
      refGamma = e.gamma;
      setStatus('');
    }
    const gx = clamp((e.gamma - refGamma) / 25, -1, 1);
    const gy = clamp((e.beta  - refBeta)  / 25, -1, 1);
    state.targetX = -gx * RANGE;
    state.targetY = -gy * RANGE;
  }

  function onMouseMove(e) {
    const cx = (e.clientX / window.innerWidth) - 0.5;
    const cy = (e.clientY / window.innerHeight) - 0.5;
    state.targetX = -cx * RANGE * 2;
    state.targetY = -cy * RANGE * 2;
  }

  function setStatus(text) {
    if (!status) return;
    status.textContent = text;
    status.hidden = !text;
  }

  function startOrientation() {
    window.addEventListener('deviceorientation', onOrientation);
    // If no orientation event arrives within a couple of seconds, tell the
    // user — better than a silently broken page.
    setTimeout(() => {
      if (!receivedAny) {
        setStatus("This browser isn't sending orientation events. Try Chrome, and make sure sensor access is on for this site.");
      }
    }, 2500);
  }

  function startMouse() {
    window.addEventListener('mousemove', onMouseMove, { passive: true });
  }

  async function requestPermissionAndStart() {
    try {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res === 'granted') {
        startOrientation();
        permissionBtn.hidden = true;
      } else {
        permissionBtn.textContent = 'Motion denied';
      }
    } catch (err) {
      permissionBtn.textContent = 'Motion unavailable';
    }
  }

  // On Android, deviceorientation events sometimes require a user gesture
  // before they'll start firing. Show the same tap-to-start button for all
  // touch devices to make the behavior consistent.
  function startFromTap() {
    startOrientation();
    permissionBtn.hidden = true;
  }

  const needsPermission =
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function';
  const hasOrientation = 'DeviceOrientationEvent' in window;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

  if (needsPermission) {
    permissionBtn.hidden = false;
    permissionBtn.addEventListener('click', requestPermissionAndStart);
  } else if (hasOrientation && isCoarsePointer) {
    permissionBtn.hidden = false;
    permissionBtn.addEventListener('click', startFromTap);
  } else {
    startMouse();
  }

  if (!reducedMotion) requestAnimationFrame(tick);
})();
