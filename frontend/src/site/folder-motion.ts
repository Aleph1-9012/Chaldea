import { flushSync } from 'svelte';

export function folderDuration(time: string): number {
  const value = time.trim();

  // Production CSS can shorten 820ms to .82s; Web Animations expects milliseconds.
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
  const title = heading.querySelector<HTMLElement>('.directory-title')!;
  const folders = [...section.querySelectorAll<HTMLElement>('.family-folder')].map(node => ({
    node,
    button: node.querySelector<HTMLButtonElement>('.folder-toggle')!,
    label: node.querySelector<HTMLElement>('.folder-toggle > span:nth-child(2)')!,
    surface: node.querySelector<HTMLElement>('.folder-surface')!,
    content: node.querySelector<HTMLElement>('.folder-content')!,
  }));
  const animations: Animation[] = [];
  let width = section.clientWidth;
  let scrollFrame = 0;

  function sizeTitle(): void {
    const size = Number.parseFloat(getComputedStyle(title).fontSize);
    title.style.setProperty('--title-compact-scale', String(24 / size));
  }

  sizeTitle();

  function stopScroll(): void {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
  }

  function stop(): void {
    stopScroll();

    for (const animation of animations) {
      animation.onfinish = null;
      animation.cancel();
    }

    animations.length = 0;

    for (const folder of folders) folder.surface.style.removeProperty('--folder-art-height');
  }

  function measure() {
    const headingRect = heading.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();

    return {
      headingHeight: headingRect.height,
      titleX: titleRect.left - headingRect.left,
      titleY: titleRect.top - headingRect.top,
      titleScale: getComputedStyle(title).scale,
      folders: folders.map(folder => ({
        height: folder.node.getBoundingClientRect().height,
        buttonHeight: folder.button.getBoundingClientRect().height,
        buttonPadding: getComputedStyle(folder.button).paddingRight,
        contentHeight: folder.content.getBoundingClientRect().height,
        labelSize: labelSize(folder.label),
      })),
    };
  }

  function run(update: () => void, button: HTMLButtonElement): void {
    if (!phone.matches || preference.matches || document.hidden) {
      stop();
      flushSync(update);

      if (phone.matches && !document.hidden) {
        const folder = button.closest<HTMLElement>('.family-folder')!;
        window.scrollTo({ top: visibleScroll(button, folder.getBoundingClientRect().height), behavior: 'instant' });
      }

      return;
    }

    const before = measure();
    const minimum = section.style.minHeight;
    // Keep the document tall enough while measuring, so the browser cannot clamp
    // the scroll position to the final layout before the animation starts.
    section.style.minHeight = `${section.getBoundingClientRect().height}px`;
    stop();
    flushSync(update);

    const after = measure();
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

    if (before.titleScale !== after.titleScale || before.titleX !== after.titleX || before.titleY !== after.titleY) {
      // Keep the full-size type on one layer. Scaling the same two-line layout
      // avoids both a mid-motion pause and a font-size change on completion.
      animate(title, [
        { translate: `${before.titleX - after.titleX}px ${before.titleY - after.titleY}px`, scale: before.titleScale },
        { translate: '0 0', scale: after.titleScale },
      ]);
    }

    for (const [index, folder] of folders.entries()) {
      const start = before.folders[index]!;
      const end = after.folders[index]!;
      // Clip a fixed-size print instead of stretching its grain on each frame.
      folder.surface.style.setProperty('--folder-art-height', `${Math.max(start.height, end.height) + 28}px`);

      if (start.buttonHeight !== end.buttonHeight || start.buttonPadding !== end.buttonPadding) {
        animate(folder.button, [
          { height: `${start.buttonHeight}px`, minHeight: `${start.buttonHeight}px`, paddingRight: start.buttonPadding },
          { height: `${end.buttonHeight}px`, minHeight: `${end.buttonHeight}px`, paddingRight: end.buttonPadding },
        ]);
      }

      if (start.contentHeight !== 0 || end.contentHeight !== 0) {
        animate(folder.content, [{ height: `${start.contentHeight}px` }, { height: `${end.contentHeight}px` }]);
      }

      if (Math.abs(start.labelSize - end.labelSize) >= .01) {
        animate(folder.label, [{ scale: String(start.labelSize / end.labelSize) }, { scale: '1' }]);
      }
    }

    // The animated heights now reserve their own space. Following rows and the
    // footer stay in flow, including during a reversal or a change of folder.
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
    sizeTitle();
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
      title.style.removeProperty('--title-compact-scale');
      observer.disconnect();
      preference.removeEventListener('change', stop);
      document.removeEventListener('visibilitychange', stop);
      window.removeEventListener('wheel', stopScroll);
      window.removeEventListener('touchstart', stopScroll);
    },
  };
}
