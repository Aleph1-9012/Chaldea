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

  let { widget, index }: { widget: LoadedWidget; index: number } = $props();

  const definition = $derived(widget.bundle.definition);
  const native = $derived(definition.exports.some(file => file.kind === 'template'));
  const display = $derived(presentation(definition));
  let proposed = $state<SettingValues>({});
  let snapshot = $state.raw<Snapshot | null>(null);
  let failure = $state('');
  let fieldError = $state<FieldError>();
  let host: HTMLDivElement;
  let playbackHost = $state<HTMLDivElement>();
  let interactionHost = $state<HTMLDivElement>();
  let preview: Preview | undefined;
  let commandStatus = $state('');
  let usageOpen = $state(false);
  const hasShell = $derived(definition.exports.some(file => file.path === 'shell.qml'));
  const command = 'qs -p /path/to/your-folder/shell.qml';

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

    preview = mountPreview(host, widget, initial, interactions);
    commit(initial);

    return () => preview?.destroy();
  });

  async function copyCommand(): Promise<void> {
    try {
      await navigator.clipboard.writeText(command);
      commandStatus = 'Command copied.';
    } catch {
      commandStatus = 'Select the command and copy it manually.';
    }
  }
</script>

<article>
  <div class="detail-slab">
    <header class="detail-heading grain">
      <div><p class="breadcrumb">Library / {familyLabel(definition.category)} / {padded(index + 1)}</p><h1>{display.title}</h1></div>
      <div class="detail-facts"><a href={libraryUrl(definition.category)}>← Back to {familyLabel(definition.category)}</a><p>{definition.exports.length} files · {definition.license}{definition.status === 'draft' ? ' · draft' : ''}</p><span>{definition.title}</span></div>
    </header>
    <div class="detail-workbench" class:art-workbench={definition.category === 'Interactive art'} class:preview-only={!definition.settings.length && definition.category !== 'Interactive art'}>
      <section class="preview-stage" aria-label="Live widget preview">
        <header><span>Live preview</span><small>Browser demo</small></header>
        <div class="preview-viewport"><div class="preview-host" bind:this={host}></div></div>
      </section>
      {#if definition.settings.length || definition.category === 'Interactive art'}
        <section class="customize-panel" aria-label="Customize widget">
          <header><h2>Customize</h2><button class="reset" onclick={() => commit(defaults(definition))}>Reset</button></header>
          {#if definition.category === 'Interactive art'}<div class="art-playback" bind:this={playbackHost}></div>{/if}
          <div class:customize-scroll={definition.category === 'Interactive art'}>
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
  <section class="installation" aria-labelledby="installation-title">
    <div>
      <h2 id="installation-title">{native ? 'Run it locally' : 'About this preview'}</h2>
      {#if native}
        <ol><li>Copy or save each file into one folder, keeping any subfolders.</li><li>{hasShell ? 'Run the included shell.' : 'Follow the installation notes to load the component in your shell.'}</li></ol>
        {#if hasShell}<div class="run-command"><code>{command}</code><button onclick={copyCommand}>Copy</button></div><p class="command-status" role="status">{commandStatus}</p>{/if}
        <p class="native-baseline">{widget.bundle.nativeBaseline}</p>
      {:else}<p>{definition.summary}</p>{/if}
    </div>
    <div class="installation-notes"><button class="text-link" aria-expanded={usageOpen} aria-controls="usage-notes" onclick={() => { usageOpen = !usageOpen; }}>Read installation notes {usageOpen ? '↑' : '↓'}</button></div>
    <div id="usage-notes" class="usage-notes" hidden={!usageOpen}><pre>{widget.bundle.usage || 'This draft has no native installation yet.'}</pre><p>Revision {widget.bundle.revision.slice(0, 12)} · Settings stay in this tab.</p></div>
  </section>
</article>
