export function libraryExpansion(grid: HTMLElement, initialFamily: string) {
  let previousFamily = initialFamily;

  return {
    update(family: string): void {
      const fromFamily = previousFamily;
      previousFamily = family;

      if (!fromFamily || family || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      // Keep the existing CSS slides, but coordinate them when a shelf expands to All.
      for (const animation of grid.getAnimations({ subtree: true })) {
        if (!(animation instanceof CSSTransition) || !(animation.effect instanceof KeyframeEffect)) continue;

        const target = animation.effect.target;

        if (!(target instanceof HTMLElement) || !(target.classList.contains('masonry-item') || target.classList.contains('card-plate'))) continue;

        const card = target.closest<HTMLElement>('.masonry-item');

        if (!card) continue;

        const entering = card.dataset.family !== fromFamily;

        if (animation.transitionProperty === 'transform' || animation.transitionProperty === 'width' || animation.transitionProperty === 'aspect-ratio') {
          animation.effect.updateTiming({
            duration: entering ? 650 : 800,
            delay: entering ? 120 : 0,
            easing: entering ? 'cubic-bezier(.22, 1, .36, 1)' : 'cubic-bezier(.45, 0, .2, 1)',
          });
        } else if (animation.transitionProperty === 'opacity' && entering) {
          animation.effect.updateTiming({ duration: 320, delay: 140, easing: 'ease-out' });
        }
      }
    },
  };
}
