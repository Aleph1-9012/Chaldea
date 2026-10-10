<script lang="ts">
  import type { Summary } from '../catalog/contracts';
  import Numeral from './Numeral.svelte';
  import { familyLabel, families, padded } from './catalog';
  import { libraryUrl } from './links';
  import { reveal } from './reveal';
  import { recordRipple } from './record-ripple';
  import modules from './poster-modules.json';
  import glyph from './assets/modular-g.svg';
  import logo from './assets/logo-exlibris.svg';

  let { widgets }: { widgets: readonly Summary[] } = $props();

  const ringRadii = Array.from({ length: 15 }, (_, index) => 20 + index * 13);

  // Bar offsets and widths within Figma's 198px print area, node 517:1566.
  const barcode = [
    [0, 4.5], [8, 3], [14.5, 6], [24, 1.5], [32, 3], [38.5, 1.5],
    [48, 3], [54.5, 4.5], [62.5, 3], [70.5, 1.5], [80, 1.5], [86.5, 1.5],
    [94.5, 1.5], [99.5, 3], [110.5, 1.5], [117, 4.5], [125, 3], [131.5, 1.5],
    [139.5, 3], [146, 6], [155.5, 3], [162, 4.5], [171.5, 1.5], [176.5, 3],
  ] as const;

  const knownFamilies = new Set(['Glyphs', 'Interactive art', 'Lockscreens', 'Quick notes', 'Player']);

  function count(category: string): string {
    return padded(widgets.filter(widget => widget.category === category).length);
  }
</script>

<section class="menu-section" id="families" aria-label="Explore widget families" use:reveal>
  <div class="poster-wall">
    <a class="poster poster-glyphs" href={libraryUrl('Glyphs')}>
      <h2>Glyphs</h2><p>{count('Glyphs')} widgets<br />Type that unlocks</p>
      <img class="glyph-art" src={glyph} alt="" width="172.5" height="230" /><span class="poster-arrow">↗</span>
    </a>
    <div class="poster poster-exlibris">
      <h2>Ex libris</h2><img src={logo} alt="Chaldea" width="244" height="63.5879" />
      <p>{widgets.length} widgets · 0BSD</p>
    </div>
    <a class="poster poster-lockscreens" href={libraryUrl('Lockscreens')}>
      <span class="lock-count">{count('Lockscreens')}</span><p>AFK<br />Editorial<br />Phase<br />Print<br />Reactive</p>
      <h2>Lockscreens</h2><span class="poster-arrow">↗</span>
    </a>
    <a class="poster poster-art" href={libraryUrl('Interactive art')}>
      <h2>Art</h2><p>{count('Interactive art')} interactive pieces<br />Push them around</p>
      <div class="module-field" aria-hidden="true">
        {#each modules as module}<i class:green={module.green} style:left={`${module.x}px`} style:top={`${module.y}px`}></i>{/each}
      </div><span class="poster-arrow">↗</span>
    </a>
    <a class="poster poster-notes" href={libraryUrl('Quick notes')}>
      <h2>Notes</h2><p>{count('Quick notes')} widgets<br />Write, edit, switch</p>
      <div class="note-lines" aria-hidden="true"><span>01// Before I leave</span><span>02// Useful commands</span><span>03// Shopping</span><span>04// —</span></div>
      <span class="poster-arrow">↗</span>
    </a>
    <a class="poster poster-quickshell" href="https://quickshell.org/" aria-label="Visit the official Quickshell website">
      <div class="quickshell-label">
        <header class="quickshell-title"><h2>Quickshell</h2><p>Widget library</p></header>
        <div class="quickshell-rule" aria-hidden="true"></div>
        <div class="barcode" aria-hidden="true">{#each barcode as [offset, width]}<i style:left={`${offset / 198 * 100}%`} style:width={`${width / 198 * 100}%`}></i>{/each}</div>
        <p class="barcode-caption">{widgets.length} 0BSD 0300 0611</p>
        <div class="poster-chips"><span>QML</span><span>Readme</span><span>Licence</span></div>
        <div class="quickshell-version"><span>QS 0.3.0 / QT 6.11.2</span><p>Try · Tune · Take</p></div>
      </div>
      <span class="poster-arrow" aria-hidden="true">↗</span>
    </a>
    <a class="poster poster-count" href={libraryUrl()}>
      <p>In the library</p><Numeral value={widgets.length} variant="menu" /><span class="poster-arrow">↗</span>
    </a>
    <a class="poster poster-player" href={libraryUrl('Player')} use:recordRipple>
      <div class="record-rings" aria-hidden="true">
        <svg width="430" height="430" viewBox="-215 -215 430 430" fill="none">
          {#each ringRadii as radius}
            <circle class="record-ripple" r="215" vector-effect="non-scaling-stroke" style:--rest-scale={radius / 215} style:--ripple-delay={`${-(radius - 14) / 201 * 12}s`} />
          {/each}
          <circle class="record-rim" r="215" />
          <circle class="record-center" r="14" />
        </svg>
      </div>
      <h2>Player</h2><p>{count('Player')} decks<br />Now playing</p><span class="poster-arrow">↗</span>
    </a>
    <a class="poster poster-take" href={libraryUrl()}>
      <h2>Try &gt; Tune &gt; Take.</h2><p>Pick a poster to open its shelf in the library</p><span class="poster-arrow">↗</span>
    </a>
  </div>
  {#each families(widgets) as family}
    {#if !knownFamilies.has(family)}<a class="extra-family" href={libraryUrl(family)}>{familyLabel(family)} <span>{count(family)} ↗</span></a>{/if}
  {/each}
  <div class="menu-divider" aria-hidden="true"></div>
</section>
