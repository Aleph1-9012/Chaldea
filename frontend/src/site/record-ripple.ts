export function recordRipple(node: HTMLAnchorElement) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const rings = [...node.querySelectorAll<SVGCircleElement>('.record-ripple')];
  let animations: Animation[] = [];
  let hovered = false;
  let targetSpeed = 0;
  let speed = 0;
  let frame = 0;
  let previousTime = 0;

  function stop(): void {
    cancelAnimationFrame(frame);
    frame = 0;
    speed = 0;
    previousTime = 0;
    animations.forEach(animation => animation.pause());
  }

  function tick(time: number): void {
    const elapsed = Math.max(0, Math.min(time - previousTime, 64));
    previousTime = time;
    speed += (targetSpeed - speed) * (1 - Math.exp(-elapsed / 100));

    if (Math.abs(targetSpeed - speed) < .003) speed = targetSpeed;

    animations.forEach(animation => { animation.playbackRate = speed; });

    if (speed === targetSpeed) {
      frame = 0;

      if (speed === 0) animations.forEach(animation => animation.pause());

      return;
    }

    frame = requestAnimationFrame(tick);
  }

  function sync(): void {
    if (reducedMotion.matches) {
      stop();
      animations.forEach(animation => animation.cancel());
      animations = [];
      return;
    }

    if (document.hidden) {
      stop();
      return;
    }

    targetSpeed = hovered || node.matches(':focus-visible') ? 1 : 0;

    if (frame || speed === targetSpeed) return;

    if (speed === 0) {
      animations = rings.flatMap(ring => ring.getAnimations());
      animations.forEach(animation => {
        animation.playbackRate = 0;
        animation.play();
      });
    }

    previousTime = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function enter(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;

    hovered = true;
    sync();
  }

  function leave(): void {
    hovered = false;
    sync();
  }

  node.addEventListener('pointerenter', enter);
  node.addEventListener('pointerleave', leave);
  node.addEventListener('focus', sync);
  node.addEventListener('blur', sync);
  reducedMotion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);

  return {
    destroy(): void {
      stop();
      animations.forEach(animation => animation.cancel());
      node.removeEventListener('pointerenter', enter);
      node.removeEventListener('pointerleave', leave);
      node.removeEventListener('focus', sync);
      node.removeEventListener('blur', sync);
      reducedMotion.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    },
  };
}
