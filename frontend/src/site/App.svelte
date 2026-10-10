<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import { prefersReducedMotion } from 'svelte/motion';
  import type { Catalog, LoadedWidget } from '../catalog/contracts';
  import { loadCatalog, loadWidget } from '../catalog/load';
  import { errorText } from '../components/dom';
  import { presentation } from './catalog';
  import { libraryUrl } from './links';
  import type { LibrarySort } from './links';
  import Home from './Home.svelte';
  import Navigation from './Navigation.svelte';
  import Library from './Library.svelte';
  import Detail from './Detail.svelte';
  import Footer from './Footer.svelte';

  function readRoute() {
    const params = new URLSearchParams(location.search);
    const sort: LibrarySort = params.get('sort') === 'family' ? 'family' : 'name';

    return {
      library: params.get('page') === 'library',
      widget: params.get('widget') ?? '',
      family: params.get('family') ?? '',
      query: params.get('q') ?? '',
      sort,
    };
  }

  let route = $state(readRoute());
  let catalog = $state.raw<Catalog>();
  let widget = $state.raw<LoadedWidget>();
  let catalogFailure = $state('');
  let widgetFailure = $state('');
  let footerVisible = $state(false);
  let main: HTMLElement;
  let catalogRequest: AbortController;
  let pageTransition: ViewTransition | undefined;
  let navigationVersion = 0;

  const index = $derived(catalog && widget ? [...catalog.widgets].sort((a, b) => presentation(a).title.localeCompare(presentation(b).title)).findIndex(item => item.id === widget?.bundle.id) : 0);

  async function initialize(): Promise<void> {
    catalogRequest?.abort();
    const request = new AbortController();
    catalogRequest = request;
    catalog = undefined;
    catalogFailure = '';

    try {
      const loaded = await loadCatalog(request.signal);

      if (!request.signal.aborted) catalog = loaded;
    } catch (error) {
      if (!request.signal.aborted) catalogFailure = errorText(error);
    }
  }

  onMount(() => {
    void initialize();

    return () => {
      catalogRequest?.abort();
      navigationVersion++;
      pageTransition?.skipTransition();
      document.documentElement.classList.remove('library-switching');
    };
  });

  $effect(() => {
    if (prefersReducedMotion.current) pageTransition?.skipTransition();
  });

  $effect(() => {
    const id = route.widget;
    const available = catalog;
    widget = undefined;
    widgetFailure = '';

    if (!id || !available) return;

    const item = available.widgets.find(candidate => candidate.id === id);

    if (!item) {
      widgetFailure = 'This widget is not in the current catalog.';

      return;
    }

    const request = new AbortController();
    void loadWidget(item, request.signal).then(loaded => {
      if (!request.signal.aborted) widget = loaded;
    }).catch(error => {
      if (!request.signal.aborted) widgetFailure = errorText(error);
    });

    return () => request.abort();
  });

  function switchRoute(next: ReturnType<typeof readRoute>, scroll: boolean, animate = true): void {
    const version = ++navigationVersion;
    const enteringLibrary = next.library && !next.widget && (!route.library || Boolean(route.widget));
    pageTransition?.skipTransition();
    pageTransition = undefined;
    document.documentElement.classList.remove('library-switching');

    const update = async (): Promise<void> => {
      // A skipped transition can still call its update after another navigation.
      if (version !== navigationVersion) return;

      route = next;
      await tick();

      if (scroll && version === navigationVersion) {
        window.scrollTo({ top: 0, behavior: 'instant' });
        main.focus({ preventScroll: true });
      }
    };

    if (!animate || !enteringLibrary || !catalog || prefersReducedMotion.current || !document.startViewTransition) {
      void update();

      return;
    }

    document.documentElement.classList.add('library-switching');
    const transition = document.startViewTransition(update);
    pageTransition = transition;

    const finish = (): void => {
      if (pageTransition !== transition) return;

      pageTransition = undefined;
      document.documentElement.classList.remove('library-switching');
    };

    // Captures may be skipped, but the navigation callback still runs.
    void transition.ready.catch(() => {});
    void transition.finished.then(finish, finish);
  }

  function navigate(href: string, replace = false, scroll = true): void {
    if (replace) history.replaceState(null, '', href);
    else history.pushState(null, '', href);

    switchRoute(readRoute(), scroll);
  }

  function follow(event: MouseEvent): void {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;

    const link = event.target.closest<HTMLAnchorElement>('a[href]');
    const href = link?.getAttribute('href');

    if (!href?.startsWith('?') || link?.target || link?.hasAttribute('download')) return;

    event.preventDefault();
    navigate(href);
  }
</script>

<svelte:head><title>{widget ? `${presentation(widget.bundle.definition).title} · Chaldea` : route.library ? 'Library · Chaldea' : 'Chaldea · Quickshell widget library'}</title></svelte:head>
<svelte:document onclick={follow} />
<svelte:window onpopstate={() => switchRoute(readRoute(), false, false)} />

<div id="top">
  {#if route.library || route.widget || !catalog}<Navigation />{/if}
  <main id="main" tabindex="-1" bind:this={main}>
    {#if catalogFailure}
      <div class="page-notice" role="alert"><h1>The library could not load.</h1><p>{catalogFailure}</p><button class="primary-link" onclick={initialize}>Try again</button></div>
    {:else if !catalog}
      <div class="page-notice" role="status">Opening the library…</div>
    {:else if route.widget}
      {#if widgetFailure}
        <div class="page-notice" role="alert"><h1>Widget unavailable</h1><p>{widgetFailure}</p><button class="primary-link" onclick={initialize}>Try again</button><a class="text-link" href={libraryUrl()}>Back to the library</a></div>
      {:else if widget}
        {#key widget.bundle.id}<div in:fade={{ duration: prefersReducedMotion.current ? 0 : 180 }}><Detail {widget} {index} /></div>{/key}
      {:else}<div class="page-notice" role="status">Opening widget…</div>{/if}
    {:else if route.library}
      <Library widgets={catalog.widgets} family={route.family} sort={route.sort} query={route.query} {navigate} {footerVisible} />
    {:else}<Home widgets={catalog.widgets} />{/if}
  </main>
  {#if catalog && (!route.widget || widget || widgetFailure)}
    <Footer bind:visible={footerVisible} />
  {/if}
</div>
