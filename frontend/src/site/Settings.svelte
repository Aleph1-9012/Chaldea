<script lang="ts">
  import type { Definition, Settings } from '../catalog/contracts';
  import { FieldError } from '../customizer/settings';
  import { fade } from 'svelte/transition';
  import { prefersReducedMotion } from 'svelte/motion';

  let { definition, values, error, change }: {
    definition: Definition;
    values: Settings;
    error: FieldError | undefined;
    change: (key: string, value: string | number | boolean) => void;
  } = $props();

  let activeGroup = $state('');
  const groups = $derived([...new Set(definition.settings.map(setting => setting.group ?? 'Settings'))]);
  const selected = $derived(groups.includes(activeGroup) ? activeGroup : groups[0]);
  const visible = $derived(definition.settings.filter(setting => (setting.group ?? 'Settings') === selected
    && !(definition.id === 'quick-notes-refined' && setting.type === 'color' && values.palette !== 'Custom')));

  function moveTab(event: KeyboardEvent, index: number): void {
    let next = index;

    if (event.key === 'ArrowRight') next = (index + 1) % groups.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + groups.length) % groups.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = groups.length - 1;
    else return;

    event.preventDefault();
    activeGroup = groups[next]!;
    document.getElementById(`settings-tab-${next}`)?.focus();
  }
</script>

{#if groups.length > 1}
  <div class="settings-tabs" role="tablist" aria-label="Settings groups">
    {#each groups as group, index}
      <button role="tab" id={`settings-tab-${index}`} aria-selected={selected === group} aria-controls="settings-fields" tabindex={selected === group ? 0 : -1} onclick={() => { activeGroup = group; }} onkeydown={event => moveTab(event, index)}>{group}</button>
    {/each}
  </div>
{/if}
<div class="settings-fields" id="settings-fields" role={groups.length > 1 ? 'tabpanel' : undefined} aria-labelledby={groups.length > 1 ? `settings-tab-${groups.indexOf(selected ?? '')}` : undefined}>
  {#key selected}
    <div class="fields-list" in:fade={{ duration: prefersReducedMotion.current ? 0 : 180 }}>
      {#each visible as setting (setting.key)}
        {@const id = `setting-${setting.key}`}
        {@const invalid = error?.key === setting.key}
        <div class="setting-field" class:boolean-field={setting.type === 'boolean'} class:number-field={setting.type === 'number'}>
          <label for={id}>{setting.label}</label>
          {#if setting.type === 'enum'}
            <div class="select-wrap"><select {id} value={String(values[setting.key])} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined} onchange={event => change(setting.key, event.currentTarget.value)}>
              {#each setting.choices as choice}<option value={choice}>{choice}</option>{/each}
            </select><span aria-hidden="true">↓</span></div>
          {:else if setting.type === 'number'}
            <input class="setting-number" type="number" aria-label={`${setting.label} value`} value={Number(values[setting.key])} min={setting.min} max={setting.max} step={setting.step} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined} oninput={event => change(setting.key, event.currentTarget.valueAsNumber)} />
            <input {id} type="range" value={Number(values[setting.key])} min={setting.min} max={setting.max} step={setting.step} style:--progress={`${Math.max(0, Math.min(100, (Number(values[setting.key]) - setting.min) / (setting.max - setting.min) * 100))}%`} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined} oninput={event => change(setting.key, event.currentTarget.valueAsNumber)} />
            <div class="range-ends" aria-hidden="true"><span>{setting.min}</span><span>{setting.max}</span></div>
          {:else if setting.type === 'boolean'}
            <input {id} class="setting-switch" type="checkbox" role="switch" checked={Boolean(values[setting.key])} oninput={event => change(setting.key, event.currentTarget.checked)} />
          {:else if setting.type === 'color'}
            <div class="color-field"><input {id} type="color" value={String(values[setting.key])} oninput={event => change(setting.key, event.currentTarget.value)} /><input type="text" aria-label={`${setting.label} hex`} value={String(values[setting.key])} maxlength="7" aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined} oninput={event => change(setting.key, event.currentTarget.value)} /></div>
          {:else}
            <input {id} type="text" value={String(values[setting.key])} maxlength={setting.maxLength} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined} oninput={event => change(setting.key, event.currentTarget.value)} />
          {/if}
          {#if invalid}<p class="field-error" id={`${id}-error`}>{error?.message}</p>{/if}
        </div>
      {/each}
    </div>
  {/key}
</div>
