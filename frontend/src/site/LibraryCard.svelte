<script lang="ts">
  import type { Summary } from '../catalog/contracts';
  import { contentUrl } from '../catalog/load';
  import { presentation, familyLabel, padded } from './catalog';
  import Thumbnail from './Thumbnail.svelte';

  let { widget, index, ratio }: { widget: Summary; index: number; ratio: number } = $props();
  const display = $derived(presentation(widget));
</script>

<a class="library-card" href={`?widget=${widget.id}`} title={widget.summary} aria-describedby={`summary-${widget.id}`}>
  <div class="card-plate" style:aspect-ratio={ratio}>
    <Thumbnail src={contentUrl(widget.thumbnailUrl)} loading={index < 8 ? 'eager' : 'lazy'} />
    <span class="open-tab">Open <span>↗</span></span>
  </div>
  <div class="card-caption">
    <h2>{display.title}</h2><span class="card-number"><span>{padded(index + 1)}</span><i aria-hidden="true">↗</i></span>
    <p>{familyLabel(widget.category)}{widget.status === 'draft' ? ' · draft' : ''}</p>
    <span class="sr-only" id={`summary-${widget.id}`}>{widget.summary}</span>
  </div>
</a>
