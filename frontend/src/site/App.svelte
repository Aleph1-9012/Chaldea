<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import { prefersReducedMotion } from 'svelte/motion';
  import type { Catalog, LoadedWidget, Summary } from '../catalog/contracts';
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
  import PageTransition from './PageTransition.svelte';
  import ModuleLoader from './ModuleLoader.svelte';
  import type { PageOrigin } from './PageTransition.svelte';

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
  let pageTransition = $state<ReturnType<typeof PageTransition>>();
  let widgetReady: Promise<void> = Promise.resolve();
  let pendingWidget: ReturnType<typeof requestWidget> | undefined;
  let navigationVersion = 0;

  const index = $derived(catalog && widget ? [...catalog.widgets].sort((a, b) => presentation(a).title.localeCompare(presentation(b).title)).findIndex(item => item.id === widget?.bundle.id) : 0);

  async function initialize(): Promise<void> {
    catalogRequest?.abort();
    pendingWidget?.controller.abort();
    pendingWidget = undefined;
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
      pendingWidget?.controller.abort();
      navigationVersion++;
      pageTransition?.cancel();
    };
  });

  $effect(() => {
    if (prefersReducedMotion.current) pageTransition?.skip();
  });

  function requestWidget(item: Summary) {
    const controller = new AbortController();
    const ready = loadWidget(item, controller.signal).then(
      loaded => ({ loaded, failure: '' }),
      error => ({ loaded: undefined, failure: errorText(error) }),
    );

    return { item, controller, ready };
  }

  $effect(() => {
    const id = route.widget;
    const available = catalog;
    const prepared = pendingWidget;
    pendingWidget = undefined;
    widget = undefined;
    widgetFailure = '';
    widgetReady = Promise.resolve();

    if (!id || !available) {
      prepared?.controller.abort();

      return;
    }

    const item = available.widgets.find(candidate => candidate.id === id);

    if (!item) {
      prepared?.controller.abort();
      widgetFailure = 'This widget is not in the current catalog.';

      return;
    }

    const request = prepared?.item === item ? prepared : requestWidget(item);

    if (prepared !== request) prepared?.controller.abort();

    widgetReady = request.ready.then(result => {
      if (request.controller.signal.aborted) return;

      widget = result.loaded;
      widgetFailure = result.failure;
    });

    return () => request.controller.abort();
  });

  function pageId(value: ReturnType<typeof readRoute>): string {
    return value.widget ? `widget:${value.widget}` : value.library ? 'library' : 'home';
  }

  function switchRoute(next: ReturnType<typeof readRoute>, scroll: boolean, animate = true, origin?: PageOrigin): void {
    const version = ++navigationVersion;
    const transition = pageTransition;
    const animated = animate && pageId(next) !== pageId(route) && catalog
      && !prefersReducedMotion.current && !document.hidden && transition;

    pendingWidget?.controller.abort();
    const item = animated ? catalog?.widgets.find(candidate => candidate.id === next.widget) : undefined;
    pendingWidget = item ? requestWidget(item) : undefined;

    const update = async (): Promise<void> => {
      if (version !== navigationVersion) return;

      route = next;
      await tick();

      if (animated && next.widget) {
        // Give quick detail loads time to mount without holding slower requests behind ink.
        let timeout: ReturnType<typeof setTimeout> | undefined;

        try {
          await Promise.race([widgetReady, new Promise<void>(resolve => { timeout = setTimeout(resolve, 180); })]);
        } finally {
          clearTimeout(timeout);
        }

        await tick();
      }

      if (scroll && version === navigationVersion) {
        window.scrollTo({ top: 0, behavior: 'instant' });
        main.focus({ preventScroll: true });
      }
    };

    if (!animated) {
      transition?.cancel();
      void update();

      return;
    }

    void animated.run(update, origin);
  }

  function navigate(href: string, replace = false, scroll = true, origin?: PageOrigin): void {
    if (replace) history.replaceState(null, '', href);
    else history.pushState(null, '', href);

    switchRoute(readRoute(), scroll, true, origin);
  }

  function follow(event: MouseEvent): void {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;

    const link = event.target.closest<HTMLAnchorElement>('a[href]');
    const href = link?.getAttribute('href');

    if (!link || !href?.startsWith('?') || link.target || link.hasAttribute('download')) return;

    event.preventDefault();
    const bounds = link.getBoundingClientRect();
    const origin = event.detail > 0
      ? { x: event.clientX, y: event.clientY }
      : { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
    navigate(href, false, true, origin);
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
      {:else}<div class="page-notice widget-loading" role="status"><ModuleLoader /><span class="sr-only">Opening widget…</span></div>{/if}
    {:else if route.library}
      <Library widgets={catalog.widgets} family={route.family} sort={route.sort} query={route.query} {navigate} {footerVisible} />
    {:else}<Home widgets={catalog.widgets} />{/if}
  </main>
  {#if catalog && (!route.widget || widget || widgetFailure)}
    <Footer bind:visible={footerVisible} />
  {/if}
</div>
<PageTransition bind:this={pageTransition} />
