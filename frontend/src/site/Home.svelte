<script lang="ts">
  import type { Summary } from '../catalog/contracts';
  import Navigation from './Navigation.svelte';
  import Numeral from './Numeral.svelte';
  import Menu from './Menu.svelte';
  import masthead from './assets/widgets-masthead.svg';
  import arrow from './assets/arrow-right.svg';
  import { docsUrl, libraryUrl } from './links';

  let { widgets }: { widgets: readonly Summary[] } = $props();
</script>

<section class="hero" aria-label="Chaldea widget library">
  <div class="hero-slab grain">
    <div class="hero-count">
      <p>Widgets in the library ↓</p>
      <Numeral value={widgets.length} variant="hero" />
    </div>
    <h1 class="masthead"><span class="sr-only">Widgets</span><img src={masthead} alt="" width="1392" height="240" /></h1>
    <Navigation hero />
    <div class="hero-top">
      <div>
        <p class="hero-total">{widgets.length} widgets</p>
        <p class="hero-small">Open source.<br />Tunable live.</p>
      </div>
      <div class="hero-intro">
        <h2>Quickshell<br />Widget library</h2>
        <p class="hero-small">Glyphs. Art. Lockscreens.<br />Notes. Player.</p>
      </div>
    </div>
    <div class="hero-bottom">
      <div class="hero-actions">
        <p class="hero-tree">├── QML, COPIED<br />├── FILES, WITH README + LICENCE<br />└── 0BSD WIDGETS</p>
        <div class="hero-buttons">
          <a class="primary-link" href={libraryUrl()}>Browse the library <img src={arrow} alt="" width="16" height="16" /></a>
          <a class="underlined-link" href={docsUrl}>Read the docs</a>
        </div>
      </div>
      <a class="hero-signoff" href="#families"><span>For Quickshell</span><small>↓ Scroll</small></a>
    </div>
    <div class="registration" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
  </div>
</section>
<Menu {widgets} />
