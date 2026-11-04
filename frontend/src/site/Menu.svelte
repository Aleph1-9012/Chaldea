<script lang="ts">
  import { onMount } from 'svelte';
  import type { Summary } from '../catalog/contracts';
  import { families, familyLabel, padded } from './catalog';
  import { libraryUrl } from './links';
  import FamilyPreview from './FamilyPreview.svelte';
  import { folderMotion } from './folder-motion';

  let { widgets }: { widgets: readonly Summary[] } = $props();
  let selected = $state('Glyphs');
  let opened = $state('');
  let section: HTMLElement;
  let motion: ReturnType<typeof folderMotion>;
  const order = ['Glyphs', 'Interactive art', 'Quick notes', 'Player', 'Sliders'];
  const categories = $derived(families(widgets).sort((a, b) => {
    const first = order.indexOf(a);
    const second = order.indexOf(b);

    return (first < 0 ? order.length : first) - (second < 0 ? order.length : second);
  }));
  const current = $derived(categories.includes(selected) ? selected : categories[0] ?? '');

  onMount(() => {
    motion = folderMotion(section);

    return () => motion.destroy();
  });

  function toggle(family: string, button: HTMLButtonElement): void {
    motion.run(() => {
      opened = opened === family ? '' : family;
    }, button);
  }
</script>

<section class="menu-section" id="families" aria-label="Explore widget families" class:folder-open={Boolean(opened)} bind:this={section}>
  <div class="family-directory">
    <header class="family-directory-heading">
      <h2 class="directory-title" aria-label="Pick a family">
        <span class="directory-title-large" aria-hidden="true"><span>Pick a</span>{' '}<span>family</span></span>
        <span class="directory-title-compact" aria-hidden="true"><span>Pick a</span>{' '}<span>family</span></span>
      </h2>
      <p>{padded(categories.length)} families, {widgets.length} widgets. <span class="directory-instruction">Hover a name to preview it; tap or click to open it.</span><span class="folder-instruction">Tap a folder to open it.</span></p>
    </header>
    <nav class="family-directory-rows" class:many-families={categories.length > 8} class:split-families={categories.length > 10} aria-label="Explore families">
      {#each categories as family, index}
        <a href={libraryUrl(family)} class:selected={current === family} class:folder-paper={index % 2 === 1 && index < categories.length - 1} class:folder-dark={index > 0 && index % 2 === 0} onpointerenter={() => { selected = family; }} onfocus={() => { selected = family; }}>
          <span class="directory-index">{padded(index + 1)}</span><span>{familyLabel(family)}</span><span class="directory-arrow" aria-hidden="true">→</span>
        </a>
      {/each}
    </nav>
    <a class="menu-browse" href={libraryUrl()}><span>Browse all widgets</span><span>{widgets.length} →</span></a>
  </div>
  {#if current}
    <div class="menu-featured grain" aria-label={`${familyLabel(current)} family preview`}>
      <FamilyPreview family={current} {widgets} index={categories.indexOf(current)} total={categories.length} />
    </div>
  {/if}
  <div class="family-folders">
    {#each categories as family, index}
      <div class="family-folder" class:expanded={opened === family} class:folder-paper={index % 2 === 1 && index < categories.length - 1} class:folder-dark={index > 0 && index % 2 === 0}>
        <span class="folder-surface" aria-hidden="true"></span>
        <button class="folder-toggle" type="button" aria-expanded={opened === family} aria-controls={`folder-${index}`} onclick={(event) => toggle(family, event.currentTarget)}>
          <span class="folder-index">{padded(index + 1)}</span><span>{familyLabel(family)}</span><span class="folder-arrow" aria-hidden="true">↓</span>
        </button>
        <div class="folder-content" id={`folder-${index}`} inert={opened !== family} aria-hidden={opened !== family}>
          <div class="folder-content-inner">
            <FamilyPreview {family} {widgets} {index} total={categories.length} compact />
          </div>
        </div>
      </div>
    {/each}
    <a class="menu-browse folder-browse" href={libraryUrl()}><span>Browse all widgets</span><span>{widgets.length} →</span></a>
  </div>
</section>
