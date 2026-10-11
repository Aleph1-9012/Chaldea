<script lang="ts">
  import type { Snapshot } from '../generator';
  import { errorText } from '../components/dom';
  import { liquidSelection } from './liquid-selection';

  let { snapshot }: { snapshot: Snapshot | null } = $props();
  let selected = $state('Widget.qml');
  let status = $state('');
  let code: HTMLElement;
  const files = $derived(snapshot?.files ?? []);
  const current = $derived(files.find(file => file.path === selected) ?? files[0]);
  const visibleFiles = $derived(files.slice(0, 5));
  const overflowFiles = $derived(files.slice(5));
  const overflowSelected = $derived(overflowFiles.some(file => file.path === current?.path));
  const lines = $derived((current?.text ?? (current ? `Binary asset · ${current.bytes.byteLength} bytes\nSave this file as ${current.path}.` : 'Code is unavailable until all settings are valid.')).split('\n'));

  $effect(() => {
    void snapshot;
    status = '';
  });

  function select(path: string): void {
    selected = path;
    status = '';
  }

  async function copy(): Promise<void> {
    const file = current;
    const atClick = snapshot;

    if (file?.text === undefined) return;

    try {
      await navigator.clipboard.writeText(file.text);

      if (snapshot === atClick && current === file) status = `Copied ${file.path}`;
    } catch {
      if (snapshot !== atClick || current !== file) return;

      const range = document.createRange();
      range.selectNodeContents(code);
      getSelection()?.removeAllRanges();
      getSelection()?.addRange(range);
      status = 'Clipboard unavailable. Code selected for manual copying.';
    }
  }

  function save(): void {
    if (!current) return;

    try {
      const url = URL.createObjectURL(new Blob([new Uint8Array(current.bytes).buffer], { type: current.text === undefined ? 'application/octet-stream' : 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = current.path.split('/').at(-1)!;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status = `Download started. Save as ${current.path}.`;
    } catch (failure) {
      status = errorText(failure);
    }
  }
</script>

<section class="generated-code" aria-label="Generated files">
  <div class="code-toolbar">
    <div class="file-tabs" aria-label="Output files" use:liquidSelection={overflowSelected ? '' : current?.path ?? ''}>
      <svg class="file-pill" data-liquid-pill aria-hidden="true"><path /></svg>
      {#each visibleFiles as file (file.path)}
        <button data-liquid-value={file.path} class:active={current?.path === file.path} aria-pressed={current?.path === file.path} onclick={() => select(file.path)}>{file.path}<span class="file-label-lit" aria-hidden="true">{file.path}</span></button>
      {/each}
      {#if overflowFiles.length}
        <select class="more-files" class:active={overflowSelected} data-liquid-value="" aria-label="More output files" value={overflowSelected ? current?.path : ''} onchange={event => select(event.currentTarget.value)}><option value="" disabled>+{overflowFiles.length}</option>{#each overflowFiles as file (file.path)}<option value={file.path}>{file.path}</option>{/each}</select>
      {/if}
    </div>
    <div class="code-actions"><button class="button" disabled={current?.text === undefined} onclick={copy}>Copy</button><button class="button paper" disabled={!current} onclick={save}>Save file ↓</button></div>
  </div>
  <div class="code-content" role="textbox" aria-readonly="true" aria-multiline="true" tabindex="0" aria-label={current?.path ?? 'Generated code'}><code bind:this={code}>{#each lines as line, index}<span class="code-line" class:comment={line.trimStart().startsWith('//')} class:keyword={line.trimStart().startsWith('import ')} data-line={index + 1}>{line || '\n'}</span>{/each}</code></div>
  <div class="code-foot"><span role="status">{status}</span><span>Changes with the settings</span></div>
</section>
<p class="file-note">Save every listed file, including README.md and LICENSE. Keep the filenames and folder paths shown above.</p>
