import { flushSync } from 'svelte';
import { liquidCrest } from './liquid-crest';

export function folderDuration(time: string): number {
  const value = time.trim();

  // Production CSS can shorten 900ms to .9s; Web Animations expects milliseconds.
  return Number.parseFloat(value) * (value.endsWith('ms') ? 1 : 1000);
}

function labelSize(node: HTMLElement): number {
  const style = getComputedStyle(node);
  const scale = style.scale === 'none' ? 1 : Number.parseFloat(style.scale);

  return Number.parseFloat(style.fontSize) * scale;
}

function visibleScroll(button: HTMLButtonElement, folderHeight: number): number {
  const start = window.scrollY;

  if (button.getAttribute('aria-expanded') !== 'true') return start;

  const top = button.getBoundingClientRect().top;
  const visibleTop = Math.max(16, Math.min(top, window.innerHeight - folderHeight - 16));

  return Math.max(0, start + top - visibleTop);
}

export function folderMotion(section: HTMLElement) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const phone = matchMedia('(max-width: 850px)');
  const heading = section.querySelector<HTMLElement>('.family-directory-heading')!;
  const stack = section.querySelector<HTMLElement>('.family-folders')!;
  const browse = stack.querySelector<HTMLElement>('.folder-browse')!;
  const titles = [
    heading.querySelector<HTMLElement>('.directory-title-large')!,
    heading.querySelector<HTMLElement>('.directory-title-compact')!,
  ];
  const folders = [...section.querySelectorAll<HTMLElement>('.family-folder')].map(node => ({
    node,
    button: node.querySelector<HTMLButtonElement>('.folder-toggle')!,
    label: node.querySelector<HTMLElement>('.folder-toggle > span:nth-child(2)')!,
    labels: [...node.querySelectorAll<HTMLElement>('.folder-toggle > span')],
    surface: node.querySelector<HTMLElement>('.folder-surface')!,
    content: node.querySelector<HTMLElement>('.folder-content')!,
    inner: node.querySelector<HTMLElement>('.folder-content-inner')!,
  }));
  const animations: Animation[] = [];
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNamespace, 'svg');
  const definitions = document.createElementNS(svgNamespace, 'defs');
  const id = `folder-liquid-${crypto.randomUUID()}`;
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.append(definitions);
  section.append(svg);

  const clips = titles.map((node, index) => {
    const clip = document.createElementNS(svgNamespace, 'clipPath');
    const path = document.createElementNS(svgNamespace, 'path');
    clip.id = `${id}-${index}`;
    clip.setAttribute('clipPathUnits', 'objectBoundingBox');
    clip.append(path);
    definitions.append(clip);

    return { node, clip, path };
  });
  let width = section.clientWidth;
  let titleProgress = section.classList.contains('folder-open') ? 1 : 0;
  let titleFrame = 0;
  let scrollFrame = 0;
  let transition: {
    before: ReturnType<typeof measureLayout>;
    after: ReturnType<typeof measureLayout>;
    clock: Animation;
  } | null = null;

  function revealTitle(progress: number): void {
    titleProgress = progress;
    // The large print drains before the smaller print fills. Their lettering
    // stays still and opaque, using the hero count's exact curved crest.
    const fills = [1 - Math.min(1, progress / .6), Math.max(0, (progress - .35) / .65)];

    for (const [index, item] of clips.entries()) {
      item.path.setAttribute('d', liquidCrest(fills[index]!, index));
      item.node.style.clipPath = `url("#${item.clip.id}")`;
    }
  }

  function stopScroll(): void {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
  }

  function stop(): void {
    stopScroll();
    cancelAnimationFrame(titleFrame);
    titleFrame = 0;
    titleProgress = section.classList.contains('folder-open') ? 1 : 0;

    for (const title of titles) title.style.removeProperty('clip-path');

    for (const animation of animations) {
      animation.onfinish = null;
      animation.cancel();
    }

    animations.length = 0;
    transition = null;
    stack.removeAttribute('data-moving');
    stack.style.removeProperty('height');
    browse.style.removeProperty('--folder-top');

    for (const folder of folders) {
      folder.node.removeAttribute('data-resizing');
      folder.node.style.removeProperty('--folder-top');
      folder.node.style.removeProperty('height');
      folder.surface.style.removeProperty('--folder-art-height');
      folder.content.style.removeProperty('height');
    }
  }

  function measureLayout() {
    const stackRect = stack.getBoundingClientRect();

    return {
      headingHeight: heading.getBoundingClientRect().height,
      stackHeight: stackRect.height,
      browseTop: browse.getBoundingClientRect().top - stackRect.top,
      folders: folders.map(folder => {
        const rect = folder.node.getBoundingClientRect();

        return {
          top: rect.top - stackRect.top,
          height: rect.height,
          buttonHeight: folder.button.getBoundingClientRect().height,
          contentHeight: folder.content.getBoundingClientRect().height,
          fullContentHeight: folder.inner.getBoundingClientRect().height,
          labelSize: labelSize(folder.label),
          labels: folder.labels.map(node => {
            const label = node.getBoundingClientRect();

            return { x: label.left - rect.left, centerY: label.top + label.height / 2 - rect.top };
          }),
        };
      }),
    };
  }

  function measure() {
    const layout = measureLayout();

    if (transition) {
      const { before, after, clock } = transition;
      const progress = clock.effect?.getComputedTiming().progress ?? 1;

      // Fixed layers report their full dimensions. Recover the visible geometry
      // from the current timeline before reversing or switching folders.
      for (const [index, folder] of layout.folders.entries()) {
        const start = before.folders[index]!;
        const end = after.folders[index]!;
        folder.height = start.height + (end.height - start.height) * progress;
        folder.buttonHeight = start.buttonHeight + (end.buttonHeight - start.buttonHeight) * progress;
        folder.contentHeight = start.contentHeight + (end.contentHeight - start.contentHeight) * progress;
      }
    }

    return layout;
  }

  function run(update: () => void, button: HTMLButtonElement): void {
    if (!phone.matches || preference.matches || document.hidden) {
      stop();
      flushSync(update);
      titleProgress = section.classList.contains('folder-open') ? 1 : 0;

      if (phone.matches && !document.hidden) {
        const folder = button.closest<HTMLElement>('.family-folder')!;
        window.scrollTo({ top: visibleScroll(button, folder.getBoundingClientRect().height), behavior: 'instant' });
      }

      return;
    }

    const before = measure();
    const titleStart = titleProgress;
    const minimum = section.style.minHeight;
    // Keep the document tall enough while measuring, so the browser cannot clamp
    // the scroll position to the final layout before the animation starts.
    section.style.minHeight = `${section.getBoundingClientRect().height}px`;
    stop();
    flushSync(update);

    const after = measure();
    const titleEnd = section.classList.contains('folder-open') ? 1 : 0;
    const style = getComputedStyle(section);
    const scrollStart = window.scrollY;
    const opened = button.closest<HTMLElement>('.family-folder')!;
    const scrollEnd = visibleScroll(button, opened.getBoundingClientRect().height);
    const options: KeyframeAnimationOptions = {
      duration: folderDuration(style.getPropertyValue('--folder-duration')),
      easing: style.getPropertyValue('--folder-ease').trim(),
      fill: 'both',
    };

    function animate(node: HTMLElement, frames: Keyframe[]): Animation {
      const animation = node.animate(frames, options);
      animations.push(animation);

      return animation;
    }

    const clock = animate(heading, [
      { height: `${before.headingHeight}px` },
      { height: `${after.headingHeight}px` },
    ]);
    transition = { before, after, clock };

    // Reserve the stack's space with one height animation. The folder artwork,
    // controls and text move as fixed layers without relaying out their contents.
    stack.dataset.moving = '';
    stack.style.height = `${after.stackHeight}px`;
    animate(stack, [{ height: `${before.stackHeight}px` }, { height: `${after.stackHeight}px` }]);
    browse.style.setProperty('--folder-top', `${after.browseTop}px`);
    animate(browse, [{ translate: `0 ${before.browseTop - after.browseTop}px` }, { translate: '0 0' }]);

    if (titleStart !== titleEnd) {
      revealTitle(titleStart);

      function reveal(): void {
        const progress = clock.effect?.getComputedTiming().progress ?? 1;
        revealTitle(titleStart + (titleEnd - titleStart) * progress);
        titleFrame = requestAnimationFrame(reveal);
      }

      titleFrame = requestAnimationFrame(reveal);
    }

    for (const [index, folder] of folders.entries()) {
      const start = before.folders[index]!;
      const end = after.folders[index]!;
      const height = Math.max(start.height, end.height);
      folder.node.style.setProperty('--folder-top', `${end.top}px`);
      folder.node.style.height = `${height}px`;
      folder.surface.style.setProperty('--folder-art-height', `${height + 28}px`);

      if (start.top !== end.top) {
        animate(folder.node, [{ translate: `0 ${start.top - end.top}px` }, { translate: '0 0' }]);
      }

      if (start.buttonHeight !== end.buttonHeight || start.contentHeight !== end.contentHeight) {
        folder.node.dataset.resizing = '';
        animate(folder.surface, [
          { clipPath: `inset(0 0 ${height - start.height}px)` },
          { clipPath: `inset(0 0 ${height - end.height}px)` },
        ]);
      }

      if (start.contentHeight !== 0 || end.contentHeight !== 0) {
        const contentHeight = Math.max(start.fullContentHeight, end.fullContentHeight);
        folder.content.style.height = `${contentHeight}px`;
        animate(folder.content, [
          { translate: `0 ${start.buttonHeight - end.buttonHeight}px`, clipPath: `inset(0 0 ${contentHeight - start.contentHeight}px)` },
          { translate: '0 0', clipPath: `inset(0 0 ${contentHeight - end.contentHeight}px)` },
        ]);
      }

      for (const [labelIndex, node] of folder.labels.entries()) {
        const first = start.labels[labelIndex]!;
        const last = end.labels[labelIndex]!;
        const scale = node === folder.label ? start.labelSize / end.labelSize : 1;

        if (first.x !== last.x || first.centerY !== last.centerY || Math.abs(scale - 1) >= .001) {
          animate(node, [
            { translate: `${first.x - last.x}px ${first.centerY - last.centerY}px`, scale: String(scale) },
            { translate: '0 0', scale: '1' },
          ]);
        }
      }
    }

    // The heading and stack reserve their own space, keeping the footer in flow.
    if (minimum) section.style.minHeight = minimum;
    else section.style.removeProperty('min-height');

    clock.onfinish = () => {
      if (scrollFrame) window.scrollTo({ top: scrollEnd, behavior: 'instant' });

      stop();
    };

    if (scrollEnd !== scrollStart) {
      function scroll(): void {
        const progress = clock.effect?.getComputedTiming().progress ?? 1;
        window.scrollTo({ top: scrollStart + (scrollEnd - scrollStart) * progress, behavior: 'instant' });
        scrollFrame = requestAnimationFrame(scroll);
      }

      scrollFrame = requestAnimationFrame(scroll);
    }
  }

  const observer = new ResizeObserver(() => {
    if (section.clientWidth === width) return;

    width = section.clientWidth;
    stop();
  });
  observer.observe(section);
  preference.addEventListener('change', stop);
  document.addEventListener('visibilitychange', stop);
  window.addEventListener('wheel', stopScroll, { passive: true });
  window.addEventListener('touchstart', stopScroll, { passive: true });

  return {
    run,
    destroy(): void {
      stop();
      svg.remove();
      observer.disconnect();
      preference.removeEventListener('change', stop);
      document.removeEventListener('visibilitychange', stop);
      window.removeEventListener('wheel', stopScroll);
      window.removeEventListener('touchstart', stopScroll);
    },
  };
}
