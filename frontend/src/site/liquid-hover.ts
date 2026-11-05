import { liquidCrest } from './liquid-crest';

export function liquidHover(node: HTMLElement) {
  if (node.matches(':disabled')) return;

  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover)');
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNamespace, 'svg');
  const clip = document.createElementNS(svgNamespace, 'clipPath');
  const path = document.createElementNS(svgNamespace, 'path');
  const fill = document.createElement('span');
  clip.id = `button-liquid-${crypto.randomUUID()}`;
  clip.setAttribute('clipPathUnits', 'objectBoundingBox');
  clip.append(path);
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.style.pointerEvents = 'none';
  svg.append(clip);
  fill.className = 'detail-folder-fill';
  fill.setAttribute('aria-hidden', 'true');
  fill.inert = true;

  // The decorative copy changes the lettering only where the ink has reached.
  // These controls contain just text, spans and an image, with no nested inputs.
  for (const child of node.childNodes) fill.append(child.cloneNode(true));

  path.setAttribute('d', liquidCrest(0, 0));
  fill.style.clipPath = `url("#${clip.id}")`;
  node.append(svg, fill);

  let progress = 0;
  let target = 0;
  let hovered = false;
  let frame = 0;
  let previousTime = 0;

  function stop(): void {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function paint(): void {
    path.setAttribute('d', liquidCrest(progress, 0));
  }

  function tick(now: number): void {
    frame = 0;
    const step = Math.min(now - previousTime, 64) / 450;
    previousTime = now;
    progress = target > progress ? Math.min(target, progress + step) : Math.max(target, progress - step);
    paint();

    if (progress !== target) frame = requestAnimationFrame(tick);
  }

  function sync(): void {
    target = !document.hidden && (hovered || node.matches(':focus-visible')) ? 1 : 0;

    if (preference.matches || document.hidden) {
      stop();
      progress = target;
      paint();
    } else if (!frame && progress !== target) {
      previousTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
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

  function visibility(): void {
    hovered = !document.hidden && pointer.matches && node.matches(':hover');
    sync();
  }

  node.addEventListener('pointerenter', enter);
  node.addEventListener('pointerleave', leave);
  node.addEventListener('focus', sync);
  node.addEventListener('blur', sync);
  preference.addEventListener('change', sync);
  document.addEventListener('visibilitychange', visibility);
  visibility();

  return {
    destroy(): void {
      stop();
      node.removeEventListener('pointerenter', enter);
      node.removeEventListener('pointerleave', leave);
      node.removeEventListener('focus', sync);
      node.removeEventListener('blur', sync);
      preference.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', visibility);
      fill.remove();
      svg.remove();
    },
  };
}
