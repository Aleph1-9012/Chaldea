<script lang="ts">
  import { onMount } from 'svelte';
  import type { LoadedWidget, Settings as SettingValues } from '../catalog/contracts';
  import type { Preview } from '../preview/frame';
  import { mountPreview } from '../preview/frame';
  import { interactionControls } from '../components/interaction-controls';
  import { defaults, FieldError, validateSettings } from '../customizer/settings';
  import { generate } from '../generator';
  import type { Snapshot } from '../generator';
  import { errorText } from '../components/dom';
  import { familyLabel, presentation, padded } from './catalog';
  import { libraryUrl } from './links';
  import Settings from './Settings.svelte';
  import Code from './Code.svelte';
  import ModuleLoader from './ModuleLoader.svelte';

  let { widget, index }: { widget: LoadedWidget; index: number } = $props();

  const definition = $derived(widget.bundle.definition);
  const native = $derived(definition.exports.some(file => file.kind === 'template'));
  const display = $derived(presentation(definition));
  const fillPreview = $derived(definition.category === 'Interactive art' || definition.category === 'Glyphs');
  let proposed = $state<SettingValues>({});
  let snapshot = $state.raw<Snapshot | null>(null);
  let failure = $state('');
  let fieldError = $state<FieldError>();
  let host: HTMLDivElement;
  let playbackHost = $state<HTMLDivElement>();
  let interactionHost = $state<HTMLDivElement>();
  let preview: Preview | undefined;
  let previewLoading = $state(true);

  function commit(values: SettingValues): void {
    proposed = values;

    try {
      const next = native ? generate(definition, widget.bundle.templates, values, widget.assets) : null;
      const settings = next?.settings ?? validateSettings(definition, values);
      snapshot = next;
      preview?.update(settings);
      failure = '';
      fieldError = undefined;
    } catch (error) {
      snapshot = null;
      fieldError = error instanceof FieldError ? error : undefined;
      failure = `${errorText(error)} Output is unavailable until corrected.`;
    }
  }

  onMount(() => {
    const initial = defaults(definition);
    const interactions = definition.category === 'Interactive art' ? interactionControls((key, value) => preview?.action(key, value)) : undefined;

    if (interactions) {
      playbackHost?.append(interactions.pause);
      interactionHost?.append(interactions.root);
    }

    preview = mountPreview(host, widget, initial, interactions, () => { previewLoading = false; });
    commit(initial);

    return () => preview?.destroy();
  });
</script>

<article class="widget-detail">
  <div class="detail-slab">
    <header class="detail-heading grain">
      <div><p class="breadcrumb">Library / {familyLabel(definition.category)} / {padded(index + 1)}</p><h1>{display.title}</h1></div>
      <div class="detail-facts"><a href={libraryUrl(definition.category)}>← Back to {familyLabel(definition.category)}</a><p>{definition.exports.length} files · {definition.license}{definition.status === 'draft' ? ' · draft' : ''}</p><span>{definition.title}</span></div>
    </header>
    <div class="detail-workbench" class:art-workbench={definition.category === 'Interactive art'} class:fill-workbench={fillPreview} class:slider-workbench={definition.category === 'Sliders'} class:preview-only={!definition.settings.length && definition.category !== 'Interactive art'}>
      <section class="preview-stage" aria-label="Live widget preview">
        <header><span>Live preview</span><small>Browser demo</small></header>
        <div class="preview-viewport" class:loading={previewLoading} style:background-color={definition.id === 'interactive-art-sea-turtle' ? proposed.background === 'White' ? '#fff' : '#fefbf4' : undefined}>
          <div class="preview-host" aria-busy={previewLoading} bind:this={host}></div>
          {#if previewLoading}
            <div class="preview-loading" role="status"><ModuleLoader /><span class="sr-only">Loading live preview…</span></div>
          {/if}
        </div>
      </section>
      {#if definition.settings.length || definition.category === 'Interactive art'}
        <section class="customize-panel" aria-label="Customize widget">
          <header><h2>Customize</h2><button class="reset" onclick={() => commit(defaults(definition))}>Reset</button></header>
          {#if definition.category === 'Interactive art'}<div class="art-playback" bind:this={playbackHost}></div>{/if}
          <div class="customize-content">
            {#if definition.category === 'Interactive art'}<div class="art-interactions" bind:this={interactionHost}></div>{/if}
            <Settings {definition} values={proposed} error={fieldError} change={(key, value) => commit({ ...proposed, [key]: value })} />
            {#if failure}<p class="generation-error" role="alert">{failure}</p>{/if}
          </div>
        </section>
      {/if}
    </div>
  </div>
  {#if native}
    <div class="detail-output"><Code {snapshot} /></div>
  {:else}
    <p class="draft-notice">This design is available as a browser preview. Native QML export is not available yet.</p>
  {/if}
</article>
