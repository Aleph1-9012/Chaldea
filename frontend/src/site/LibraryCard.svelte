<script lang="ts">
  import { onMount } from 'svelte';
  import type { Summary } from '../catalog/contracts';
  import { contentUrl } from '../catalog/load';
  import { presentation, familyLabel, padded } from './catalog';
  import ModuleLoader from './ModuleLoader.svelte';

  let { widget, index, ratio }: { widget: Summary; index: number; ratio: number } = $props();
  let ready = $state(false);
  let failed = $state(false);
  let showLoader = $state(false);
  const display = $derived(presentation(widget));

  onMount(() => {
    const timer = setTimeout(() => { showLoader = true; }, 150);

    return () => clearTimeout(timer);
  });
</script>

<a class="library-card" href={`?widget=${widget.id}`} title={widget.summary} aria-describedby={`summary-${widget.id}`}>
  <div class="card-plate" style:aspect-ratio={ratio} class:ready>
    <img src={contentUrl(widget.thumbnailUrl)} alt="" loading={index < 8 ? 'eager' : 'lazy'} decoding="async" onload={() => { ready = true; }} onerror={() => { failed = true; }} />
    {#if failed}<span class="preview-unavailable">Preview unavailable</span>
    {:else if !ready && showLoader}<ModuleLoader />{/if}
    <span class="open-tab">Open <span>↗</span></span>
  </div>
  <div class="card-caption">
    <h2>{display.title}</h2><span class="card-number"><span>{padded(index + 1)}</span><i aria-hidden="true">↗</i></span>
    <p>{familyLabel(widget.category)}{widget.status === 'draft' ? ' · draft' : ''}</p>
    <span class="sr-only" id={`summary-${widget.id}`}>{widget.summary}</span>
  </div>
</a>
