<script lang="ts">
  import ModuleLoader from './ModuleLoader.svelte';

  let { src, alt = '', loading = 'lazy' }: {
    src: string;
    alt?: string;
    loading?: 'eager' | 'lazy';
  } = $props();
  let status = $state<'loading' | 'ready' | 'failed'>('loading');
  let showLoader = $state(false);

  function trackImage(image: HTMLImageElement) {
    status = 'loading';
    showLoader = false;
    const timer = setTimeout(() => { showLoader = true; }, 150);

    function settle(): void {
      status = image.naturalWidth > 0 ? 'ready' : 'failed';
      clearTimeout(timer);
    }

    image.addEventListener('load', settle);
    image.addEventListener('error', settle);

    // A cached image can finish before hydration attaches the load listener.
    if (image.complete) settle();

    return {
      destroy(): void {
        clearTimeout(timer);
        image.removeEventListener('load', settle);
        image.removeEventListener('error', settle);
      },
    };
  }
</script>

{#key src}
  <img class="thumbnail-image" class:ready={status === 'ready'} {src} {alt} {loading} decoding="async" use:trackImage />
  {#if status === 'failed'}<span class="preview-unavailable">Preview unavailable</span>
  {:else if status === 'loading' && showLoader}<ModuleLoader />{/if}
{/key}
