<script lang="ts">
  import type { Summary } from '../catalog/contracts';
  import { familyLabel, padded, presentation } from './catalog';
  import { libraryUrl } from './links';
  import Numeral from './Numeral.svelte';

  let { family, widgets, index, total, compact = false }: {
    family: string;
    widgets: readonly Summary[];
    index: number;
    total: number;
    compact?: boolean;
  } = $props();

  const descriptions = new Map([
    ['Glyphs', 'Animated lettering that reacts as you type.'],
    ['Interactive art', 'Interactive pieces. Push, pull, and play.'],
    ['Quick notes', 'Write, edit, and switch between your notes.'],
    ['Player', 'Media controls for whatever is playing.'],
    ['Sliders', 'Fine controls. Set the level.'],
  ]);
  const glyphPreviews = ['glyphs-glyph-bay-typing', 'glyphs-oblique-ligatures', 'lockscreen-reactive-lockscreen-studies-sh-6c6cb4', 'lockscreen-reactive-lockscreen-studies-st-69ba9c'];
  const entries = $derived(widgets.filter(widget => widget.category === family).sort((a, b) => presentation(a).title.localeCompare(presentation(b).title)));
  const previews = $derived(family === 'Glyphs' ? glyphPreviews.flatMap(id => {
    const widget = entries.find(entry => entry.id === id);

    return widget ? [widget] : [];
  }) : entries.slice(0, 4));
</script>

<div class="family-preview" class:compact>
  <header class="family-preview-heading">
    {#if !compact}<p class="family-position">{padded(index + 1)} / {padded(total)}</p><h3>{familyLabel(family)}</h3>{/if}
    <p class="family-description">{descriptions.get(family) ?? `Explore ${familyLabel(family)} widgets for Quickshell.`}</p>
    <Numeral value={entries.length} variant="menu" />
  </header>
  {#if !compact}
    <div class="family-samples">
      <p class="family-eyebrow">A look inside</p>
      <div class="family-thumbnails" style:--preview-count={Math.max(1, previews.length)}>
        {#each previews as widget (widget.id)}
          <a href={`?widget=${widget.id}`} aria-label={`Preview ${presentation(widget).title}`}>
            <img src={`${import.meta.env.BASE_URL}${widget.thumbnailUrl}`} alt={presentation(widget).title} loading="lazy" decoding="async" />
          </a>
        {/each}
      </div>
    </div>
  {/if}
  <div class="family-inventory">
    <p class="family-eyebrow">In this family{#if !compact} · {padded(entries.length)}{/if}</p>
    <ol style:--family-rows={Math.ceil(entries.length / (compact ? 2 : 3))}>
      {#each entries as widget, widgetIndex (widget.id)}
        <li><a href={`?widget=${widget.id}`}><span>{padded(widgetIndex + 1)}</span><span>{presentation(widget).title}</span></a></li>
      {/each}
    </ol>
  </div>
  <a class="family-open" href={libraryUrl(family)}><span>Open {familyLabel(family)}</span><span aria-hidden="true">→</span></a>
</div>
