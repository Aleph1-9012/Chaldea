const svgNamespace = 'http://www.w3.org/2000/svg';

function liquidCrest(progress: number, index: number): string {
  const rise = progress * progress * (3 - 2 * progress);
  const level = 1.12 - rise * 1.24;
  const amplitude = Math.sin(progress * Math.PI) * .072;
  const phase = progress * Math.PI * 3 + index * 1.35;
  const frequency = Math.PI * 2;
  const height = (x: number) => level + amplitude * (Math.sin(x * frequency + phase) + .22 * Math.sin(x * frequency * 2 - phase));
  const slope = (x: number) => amplitude * frequency * (Math.cos(x * frequency + phase) + .44 * Math.cos(x * frequency * 2 - phase));
  const segments = [`M -.08 ${height(-.08)}`];

  // Cubic tangents keep the moving crest curved at every responsive size.
  for (let segment = 0; segment < 6; segment++) {
    const left = -.08 + segment * 1.16 / 6;
    const right = -.08 + (segment + 1) * 1.16 / 6;
    const handle = (right - left) / 3;
    segments.push(`C ${left + handle} ${height(left) + slope(left) * handle} ${right - handle} ${height(right) - slope(right) * handle} ${right} ${height(right)}`);
  }

  return `${segments.join(' ')} L 1.08 1.12 L -.08 1.12 Z`;
}

export function heroLiquid(node: HTMLElement, target: 'digits' | 'masthead' = 'digits') {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');

  const elements = target === 'masthead' ? [node] : [...node.querySelectorAll<HTMLElement>('.numeral-hero > span')];

  if (preference.matches || document.hidden || !elements.length) {
    node.removeAttribute('data-liquid-pending');

    return;
  }

  const svg = document.createElementNS(svgNamespace, 'svg');
  const definitions = document.createElementNS(svgNamespace, 'defs');
  const id = `hero-liquid-${crypto.randomUUID()}`;
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.append(definitions);
  node.append(svg);

  const paths = elements.map((element, index) => {
    const clip = document.createElementNS(svgNamespace, 'clipPath');
    const path = document.createElementNS(svgNamespace, 'path');
    clip.id = `${id}-${index}`;
    clip.setAttribute('clipPathUnits', 'objectBoundingBox');
    path.setAttribute('d', liquidCrest(0, index));

    // Mirror only the clip so the masthead fills downward without moving its artwork.
    if (target === 'masthead') path.setAttribute('transform', 'translate(0 1) scale(1 -1)');

    clip.append(path);
    definitions.append(clip);
    element.style.clipPath = `url("#${clip.id}")`;

    return path;
  });

  // Replace the first-paint CSS clip only after every liquid clip is installed.
  node.removeAttribute('data-liquid-pending');

  const started = performance.now();
  let frame = 0;
  let finished = false;

  function finish(): void {
    if (finished) return;

    finished = true;
    cancelAnimationFrame(frame);

    for (const element of elements) {
      element.style.removeProperty('clip-path');
    }

    svg.remove();
    preference.removeEventListener('change', finish);
    document.removeEventListener('visibilitychange', finish);
  }

  function tick(now: number): void {
    let complete = true;

    for (const [index, path] of paths.entries()) {
      const progress = Math.max(0, Math.min(1, (now - started - 120 - index * 120) / 1320));
      path.setAttribute('d', liquidCrest(progress, index));

      if (progress < 1) complete = false;
    }

    if (complete) finish();
    else frame = requestAnimationFrame(tick);
  }

  preference.addEventListener('change', finish);
  document.addEventListener('visibilitychange', finish);
  frame = requestAnimationFrame(tick);

  return { destroy: finish };
}
