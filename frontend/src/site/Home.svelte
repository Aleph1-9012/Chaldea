<script lang="ts">
  import type { Summary } from '../catalog/contracts';
  import Navigation from './Navigation.svelte';
  import Numeral from './Numeral.svelte';
  import Menu from './Menu.svelte';
  import masthead from './assets/widgets-masthead.svg';
  import arrow from './assets/arrow-right.svg';
  import paperArrow from './assets/home-v2/arrow-paper.svg';
  import inkArrow from './assets/home-v2/arrow-ink.svg';
  import { docsUrl, libraryUrl } from './links';
  import { heroLiquid } from './hero-liquid';

  let { widgets }: { widgets: readonly Summary[] } = $props();
</script>

<section class="hero" aria-label="Chaldea widget library">
  <div class="hero-slab grain">
    <div class="hero-count" data-liquid-pending use:heroLiquid>
      <p>Widgets in the library<span class="hero-count-arrow"> ↓</span></p>
      <Numeral value={widgets.length} variant="hero" />
    </div>
    <h1 class="masthead" data-liquid-pending use:heroLiquid={'masthead'}><span class="sr-only">Chaldea: Quickshell widget library</span><img src={masthead} alt="" width="1392" height="240" /></h1>
    <Navigation hero />
    <div class="hero-top">
      <div>
        <p class="hero-total">{widgets.length} widgets</p>
        <p class="hero-small"><span class="hero-desktop-copy">Open-source Quickshell widgets.<br />Preview, customize, download QML.</span><span class="hero-phone-copy">Open source.<br />Tunable live.</span></p>
      </div>
      <div class="hero-intro">
        <h2>Quickshell<br />Widget library</h2>
        <p class="hero-small">Glyphs. Art.<br />Notes. Player. Sliders.</p>
      </div>
    </div>
    <div class="hero-bottom">
      <div class="hero-actions">
        <p class="hero-tree">├── QML, COPIED<br />├── FILES, WITH README + LICENCE<br />└── 0BSD WIDGETS</p>
        <div class="hero-buttons">
          <a class="primary-link" href={libraryUrl()}>Browse the library <img class="hero-desktop-arrow" src={arrow} alt="" width="16" height="16" /><img class="hero-phone-arrow" src={paperArrow} alt="" width="13.5312" height="13.5312" /></a>
          <a class="underlined-link" href={docsUrl}>Read the docs<img class="hero-phone-arrow" src={inkArrow} alt="" width="13.5312" height="13.5312" /></a>
        </div>
      </div>
      <a class="hero-signoff" href="#families"><span>For Quickshell</span><small>↓ Scroll</small></a>
    </div>
    <div class="registration" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
  </div>
</section>
<Menu {widgets} />
