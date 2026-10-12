<script module lang="ts">
  export interface PageOrigin {
    x: number;
    y: number;
  }
</script>

<script lang="ts">
  import { onMount, tick } from 'svelte';
  import masthead from './assets/widgets-masthead.svg';
  import mastheadArtwork from './assets/widgets-masthead.svg?raw';

  const id = `page-print-${crypto.randomUUID()}`;
  let active = $state(false);
  let phase = $state<'covering' | 'covered' | 'opening'>('covering');
  let width = $state(0);
  let height = $state(0);
  let modules = $state<{ x: number; y: number; width: number; height: number; delay: number }[]>([]);
  let covers = $state<SVGRectElement[]>([]);
  let windows = $state<SVGRectElement[]>([]);
  let greenType: SVGGElement;
  let paperType: SVGGElement;
  let animations: Animation[] = [];
  let version = 0;
  let skipped = false;

  const portrait = $derived(width < 600);
  const typeWidth = $derived(portrait ? height * 1.4 : Math.max(width * 1.5, height * 2.8));
  const typeHeight = $derived(typeWidth * 240 / 1392);

  export function cancel(): void {
    version++;
    active = false;

    for (const animation of animations) animation.cancel();

    animations = [];
  }

  export function skip(): void {
    if (!active) return;

    skipped = true;
    active = false;

    for (const animation of animations) animation.finish();
  }

  function move(element: SVGElement, frames: Keyframe[], duration: number, delay = 0): Animation {
    const animation = element.animate(frames, {
      duration,
      delay,
      easing: 'cubic-bezier(.65, 0, .35, 1)',
      fill: 'both',
    });
    animations.push(animation);

    return animation;
  }

  async function spread(elements: readonly SVGRectElement[], duration: number): Promise<void> {
    const batch: Animation[] = [];

    for (const [index, cell] of modules.entries()) {
      const element = elements[index];

      if (!element) continue;

      batch.push(move(element, [
        { transform: 'scale(.001)', rx: `${Math.min(cell.width, cell.height) / 2}px` },
        { transform: 'scale(1)', rx: '0px' },
      ], duration, cell.delay));
    }

    await Promise.all(batch.map(animation => animation.finished)).catch(() => {});
  }

  export async function run(update: () => Promise<void>, origin?: PageOrigin): Promise<void> {
    cancel();
    const current = version;
    skipped = false;
    width = innerWidth;
    height = innerHeight;
    const columns = width < 600 ? 3 : 5;
    const rows = width < 600 ? 5 : 3;
    const cellWidth = width / columns;
    const cellHeight = height / rows;
    const x = Math.max(0, Math.min(width, origin?.x ?? width / 2));
    const y = Math.max(0, Math.min(height, origin?.y ?? height / 2));
    const distance = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
    modules = Array.from({ length: columns * rows }, (_, index) => {
      const left = index % columns * cellWidth;
      const top = Math.floor(index / columns) * cellHeight;

      return {
        x: left - 1,
        y: top - 1,
        width: cellWidth + 2,
        height: cellHeight + 2,
        delay: Math.hypot(left + cellWidth / 2 - x, top + cellHeight / 2 - y) / distance * 110,
      };
    });
    phase = 'covering';
    active = true;
    await tick();

    if (current !== version) return;

    // Older webviews still navigate even when they cannot animate the print.
    if (!greenType.animate) {
      cancel();
      await update();

      return;
    }

    try {
      if (!skipped) {
        const drift = Math.min(typeWidth * .055, 130);
        move(greenType, [{ transform: `translateX(${drift}px)` }, { transform: `translateX(${-drift}px)` }], 1100);
        move(paperType, [{ transform: `translateX(${-drift}px)` }, { transform: `translateX(${drift}px)` }], 1100);
        await spread(covers, 300);
      }

      if (current !== version) return;

      phase = 'covered';
      await update();

      if (current !== version) return;

      phase = 'opening';

      if (!skipped) await spread(windows, 410);
    } finally {
      if (current === version) cancel();
    }
  }

  onMount(() => {
    const hide = (): void => {
      if (document.hidden) skip();
    };

    document.addEventListener('visibilitychange', hide);
    window.addEventListener('resize', skip);

    return () => {
      cancel();
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('resize', skip);
    };
  });
</script>

<div class="page-print" data-phase={phase} hidden={!active} aria-hidden="true">
  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <mask id={`${id}-cover`} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height} style="mask-type: luminance">
        {#each modules as cell, index}
          <rect class="print-module" x={cell.x} y={cell.y} width={cell.width} height={cell.height} fill="white" style:transform-origin={`${cell.x + cell.width / 2}px ${cell.y + cell.height / 2}px`} bind:this={covers[index]} />
        {/each}
      </mask>
      <mask id={`${id}-open`} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height} style="mask-type: luminance">
        <rect width={width} height={height} fill="white" />
        {#each modules as cell, index}
          <rect class="print-module" x={cell.x} y={cell.y} width={cell.width} height={cell.height} fill="black" style:transform-origin={`${cell.x + cell.width / 2}px ${cell.y + cell.height / 2}px`} bind:this={windows[index]} />
        {/each}
      </mask>
    </defs>
    <g mask={`url(#${id}-${phase === 'covering' ? 'cover' : 'open'})`}>
      <rect width={width} height={height} fill="var(--ink)" />
      <g transform={portrait ? `translate(${width / 2 - typeHeight - 12} ${height}) rotate(-90)` : `translate(0 ${height / 2 - typeHeight - 12})`}>
        <g bind:this={greenType}>
          <g class="green-lettering" transform={`translate(${-typeWidth * .15} 0) scale(${typeWidth / 1392})`}>
            <!-- Static, repository-owned SVG; direct paths avoid a third full-size mask. -->
            {@html mastheadArtwork}
          </g>
        </g>
      </g>
      <g transform={portrait ? `translate(${width / 2 + 12} ${height}) rotate(-90)` : `translate(0 ${height / 2 + 12})`}>
        <g bind:this={paperType}>
          <image href={masthead} x={-typeWidth * .15} width={typeWidth} height={typeHeight} />
        </g>
      </g>
    </g>
  </svg>
</div>

<style>
  .page-print { position: fixed; inset: 0; z-index: 60; pointer-events: none; }
  svg { display: block; overflow: hidden; }
  .print-module { transform: scale(0); }
  .green-lettering :global(path) { fill: var(--green); }
</style>
