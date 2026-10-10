<script lang="ts">
  import brand from './assets/logo-ink.svg';
  import paperLogo from './assets/logo-paper.svg';
  import star from './assets/star.svg';
  import { repositoryUrl, docsUrl, changelogUrl, libraryUrl } from './links';

  let { hero = false }: { hero?: boolean } = $props();
</script>

<header class:hero-nav={hero} class:site-header={!hero}>
  <nav class="site-nav" aria-label="Main navigation">
    <a class="brand" href="?" aria-label="Chaldea home">
      {#if hero}<img src={paperLogo} alt="Chaldea" width="142.372" height="37.103" />
      {:else}<img src={brand} alt="Chaldea" width="200" height="40" />{/if}
    </a>
    <div class="nav-links">
      <a href={libraryUrl()}>Library</a>
      <a href={docsUrl}>Docs</a>
      <a href={changelogUrl}>Changelog</a>
    </div>
    <a class="github-link" href={repositoryUrl}>
      <img src={star} alt="" width="14" height="14" /><span>Star on GitHub</span>
    </a>
  </nav>
</header>
