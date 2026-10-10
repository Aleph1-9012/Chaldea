<script lang="ts">
  import { fade } from 'svelte/transition';
  import { prefersReducedMotion } from 'svelte/motion';
  import type { Summary } from '../catalog/contracts';
  import { families, familyLabel, familyRatio, presentation, padded } from './catalog';
  import { libraryUrl } from './links';
  import type { LibrarySort } from './links';
  import { masonry, rows } from './masonry';
  import { libraryExpansion } from './library-expansion';
  import Numeral from './Numeral.svelte';
  import LibraryCard from './LibraryCard.svelte';

  const sortOptions = [{ value: 'name', label: 'A–Z' }, { value: 'family', label: 'Family' }] as const;

  let { widgets, family, sort, query, navigate, footerVisible }: {
    widgets: readonly Summary[];
    family: string;
    sort: LibrarySort;
    query: string;
    footerVisible: boolean;
    navigate: (href: string, replace?: boolean, scroll?: boolean) => void;
  } = $props();

  let width = $state(0);
  let scrollY = $state(0);
  const showBackToTop = $derived(scrollY > 320);
  let search: HTMLInputElement;
  let heading: HTMLHeadingElement;
  const categories = $derived(families(widgets));
  const alphabetical = $derived([...widgets].sort((a, b) => presentation(a).title.localeCompare(presentation(b).title)));
  const indices = $derived(new Map(alphabetical.map((widget, index) => [widget.id, index])));

  const ordered = $derived.by(() => {
    const found = [...alphabetical];

    if (sort === 'family') found.sort((a, b) => categories.indexOf(a.category) - categories.indexOf(b.category));

    return found;
  });

  const matches = $derived(ordered.filter(widget => (!family || widget.category === family)
    && [widget.title, widget.summary, widget.category, ...widget.tags].join(' ').toLowerCase().includes(query.trim().toLowerCase())));
  const uniformCards = $derived(Boolean(family || query.trim() || sort === 'family'));
  const layout = $derived.by(() => {
    const cards = matches.map(widget => ({ id: widget.id, ratio: uniformCards ? familyRatio(widget.category) : presentation(widget).ratio }));

    return uniformCards ? rows(cards, width, family && familyRatio(family) >= 1.5 ? 480 : 320) : masonry(cards, width);
  });
  const positions = $derived(new Map(layout.cards.map(card => [card.id, card])));
  const allPositions = $derived(new Map(masonry(ordered.map(widget => ({ id: widget.id, ratio: presentation(widget).ratio })), width).cards.map(card => [card.id, card])));

  function shortcut(event: KeyboardEvent): void {
    if (event.key !== '/' || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;

    event.preventDefault();
    search.focus();
  }

  function backToTop(): void {
    heading.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: prefersReducedMotion.current ? 'instant' : 'smooth' });
  }
</script>

<svelte:window onkeydown={shortcut} bind:scrollY />
<section class="library" aria-labelledby="library-title">
  <header class="library-heading">
    <div><h1 id="library-title" tabindex="-1" bind:this={heading}>Library</h1><Numeral value={matches.length} /></div>
    <p>Browse by name or family, then open any widget to try it live.</p>
  </header>
  <div class="filter-bar grain">
    <div class="family-filters" aria-label="Filter by family">
      <button class:active={!family} aria-pressed={!family} onclick={() => navigate(libraryUrl('', sort, query), false, false)}>All <span>{padded(widgets.length)}</span></button>
      {#each categories as category}
        <button class:active={family === category} aria-pressed={family === category} onclick={() => navigate(libraryUrl(category, sort, query), false, false)}>{familyLabel(category)} <span>{padded(widgets.filter(widget => widget.category === category).length)}</span></button>
      {/each}
    </div>
    <div class="sort-controls" aria-label="Sort widgets"><span>Sort</span>
      {#each sortOptions as option}
        <button class:active={sort === option.value} aria-pressed={sort === option.value} onclick={() => navigate(libraryUrl(family, option.value, query), false, false)}>{option.label}</button>
      {/each}
    </div>
    <label class="library-search"><span aria-hidden="true"></span><input bind:this={search} type="search" value={query} placeholder="Find a widget" aria-label="Find a widget" oninput={event => navigate(libraryUrl(family, sort, event.currentTarget.value), true, false)} /></label>
  </div>
  <p class="sr-only" role="status">{matches.length} {matches.length === 1 ? 'widget' : 'widgets'} shown</p>
  <div class="masonry" bind:clientWidth={width} style:height={`${layout.height}px`} use:libraryExpansion={family}>
    {#if width > 0}
      {#each ordered as widget (widget.id)}
        {@const visible = positions.has(widget.id)}
        {@const position = positions.get(widget.id) ?? allPositions.get(widget.id)!}
        <!-- Park hidden cards below their All positions so returning cards slide in too. -->
        <div class="masonry-item" data-family={widget.category} class:filtered-out={!visible} inert={!visible} aria-hidden={!visible} style:width={`${position.width}px`} style:transform={`translate(${position.x}px, ${position.y + (visible ? 0 : 64)}px)`} in:fade={{ duration: prefersReducedMotion.current ? 0 : 220 }}>
          <LibraryCard {widget} index={indices.get(widget.id) ?? 0} ratio={uniformCards && visible ? familyRatio(widget.category) : presentation(widget).ratio} />
        </div>
      {/each}
    {/if}
  </div>
  {#if !matches.length}
    <div class="empty-state"><h2>{widgets.length ? 'No widgets found.' : 'The library is being prepared.'}</h2><p>{widgets.length ? 'Try another name or family.' : 'No widgets have been published yet.'}</p>{#if widgets.length}<a class="primary-link" href={libraryUrl()}>Show all widgets ↗</a>{/if}</div>
  {/if}
  <button class="library-back-to-top" class:visible={showBackToTop} class:over-footer={footerVisible} type="button" inert={!showBackToTop} aria-hidden={!showBackToTop} onclick={backToTop}>
    <span>Back to top</span>
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 19V5m-6 6 6-6 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
  </button>
</section>
