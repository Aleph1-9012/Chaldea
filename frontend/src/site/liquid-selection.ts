interface MotionValue {
  value: number;
  velocity: number;
}

function advance(motion: MotionValue, target: number, elapsed: number, rate: number): void {
  const offset = motion.value - target;
  const decay = Math.exp(-rate * elapsed);
  const travel = (motion.velocity + rate * offset) * elapsed;
  motion.value = target + (offset + travel) * decay;
  motion.velocity = (motion.velocity - rate * travel) * decay;
}

export function liquidSelection(node: HTMLElement, initialFamily: string) {
  const svg = node.querySelector<SVGSVGElement>('.family-pill')!;
  const path = svg.querySelector('path')!;
  const buttons = [...node.querySelectorAll<HTMLButtonElement>('button[data-family]')];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const center: MotionValue = { value: 0, velocity: 0 };
  const width: MotionValue = { value: 0, velocity: 0 };
  let boxes = buttons.map(button => ({ button, left: 0, width: 0 }));
  let family = initialFamily;
  let targetCenter = 0;
  let targetWidth = 0;
  let height = 40;
  let extent = 0;
  let frame = 0;
  let previousTime = 0;
  let initialized = false;

  function stop(): void {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function paint(): void {
    const stretch = Math.min(44, Math.abs(center.velocity) * .035);
    const energy = stretch / 44;
    const movingRight = center.velocity >= 0;
    const left = Math.max(0, center.value - width.value / 2 - stretch * (movingRight ? 1 : .5));
    const right = Math.min(extent, center.value + width.value / 2 + stretch * (movingRight ? .5 : 1));
    const length = Math.max(0, right - left);
    const radius = Math.min(height / 2, length / 2, 8 + energy * 12);
    const waist = energy * 6;

    path.setAttribute('d', [
      `M ${left + radius} 0`,
      `C ${left + length * .36} ${waist} ${right - length * .36} ${waist} ${right - radius} 0`,
      `Q ${right} 0 ${right} ${radius}`,
      `V ${height - radius} Q ${right} ${height} ${right - radius} ${height}`,
      `C ${right - length * .36} ${height - waist} ${left + length * .36} ${height - waist} ${left + radius} ${height}`,
      `Q ${left} ${height} ${left} ${height - radius}`,
      `V ${radius} Q ${left} 0 ${left + radius} 0 Z`,
    ].join(' '));
    node.style.setProperty('--liquid-left', `${left}px`);
    node.style.setProperty('--liquid-right', `${right}px`);
  }

  function snap(): void {
    stop();
    center.value = targetCenter;
    center.velocity = 0;
    width.value = targetWidth;
    width.velocity = 0;
    paint();
  }

  function tick(now: number): void {
    frame = 0;
    const elapsed = Math.max(0, Math.min((now - previousTime) / 1000, .064));
    previousTime = now;
    advance(center, targetCenter, elapsed, 18);
    advance(width, targetWidth, elapsed, 22);

    if (Math.abs(center.value - targetCenter) < .08 && Math.abs(center.velocity) < .8
      && Math.abs(width.value - targetWidth) < .08 && Math.abs(width.velocity) < .8) {
      snap();

      return;
    }

    paint();
    frame = requestAnimationFrame(tick);
  }

  function select(animate: boolean): void {
    const selected = boxes.find(box => box.button.dataset.family === family);

    if (!selected) {
      stop();
      initialized = false;
      delete node.dataset.liquidReady;

      return;
    }

    targetCenter = selected.left + selected.width / 2;
    targetWidth = selected.width;

    if (!animate || !initialized || preference.matches || document.hidden) snap();
    else if (!frame && (center.value !== targetCenter || width.value !== targetWidth)) {
      previousTime = performance.now();
      frame = requestAnimationFrame(tick);
    }

    initialized = true;
    node.dataset.liquidReady = 'true';
  }

  function measure(): void {
    const bounds = node.getBoundingClientRect();
    height = node.clientHeight;
    boxes = buttons.map(button => {
      const rect = button.getBoundingClientRect();

      return { button, left: rect.left - bounds.left + node.scrollLeft, width: rect.width };
    });
    extent = Math.max(0, ...boxes.map(box => box.left + box.width));
    svg.style.width = `${Math.max(node.clientWidth, extent)}px`;
    svg.style.height = `${height}px`;

    for (const box of boxes) box.button.style.setProperty('--family-left', `${box.left}px`);

    select(false);
  }

  function settle(): void {
    select(false);
  }

  const observer = new ResizeObserver(measure);
  observer.observe(node);

  for (const button of buttons) observer.observe(button);

  preference.addEventListener('change', settle);
  document.addEventListener('visibilitychange', settle);
  measure();

  return {
    update(nextFamily: string): void {
      family = nextFamily;
      select(true);
    },
    destroy(): void {
      stop();
      observer.disconnect();
      preference.removeEventListener('change', settle);
      document.removeEventListener('visibilitychange', settle);
    },
  };
}
