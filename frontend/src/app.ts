import { allWidgets, browseView } from './catalog/browse';
import type { Catalog, Summary } from './catalog/contracts';
import { detailView } from './catalog/detail';
import { loadCatalog, loadWidget } from './catalog/load';
import { el, button, errorText } from './components/dom';
import type { Preview } from './preview/frame';

const shell = `<header class="topbar"><a class="brand" href="?" aria-label="Chaldea home"><span class="brand-mark" aria-hidden="true">✳</span>Chaldea<span class="brand-divider">/</span><span class="brand-sub">WIDGET LIBRARY</span></a><div class="topbar-right"><span class="status-dot"></span> Built for Quickshell <span class="version">v0.1</span></div></header><div class="layout"><aside class="sidebar"><div><p class="eyebrow">YOUR NEXT SHELL STARTS HERE</p><label class="search-box"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="Find a widget…" aria-label="Search widgets"><kbd>/</kbd></label><p class="nav-label">COLLECTION</p><nav id="categories" aria-label="Widget categories"></nav></div><div class="sidebar-bottom"><span class="tiny-mark" aria-hidden="true">＋</span><p>A few good pieces.<br>A shell of your own.</p><p class="fine">Original widgets · 0BSD<br>Application · Apache 2.0</p><p class="fine muted">Settings stay in this tab.<br>No account needed.</p></div></aside><main id="main" tabindex="-1"></main></div>`;

// Connect the catalog, the selected view, and the address bar.
export async function start(root: HTMLElement): Promise<void> {
  root.innerHTML = shell;

  const main = root.querySelector<HTMLElement>('main')!;
  const categories = root.querySelector<HTMLElement>('#categories')!;
  const search = root.querySelector<HTMLInputElement>('#search')!;
  let catalog: Catalog;
  let category = allWidgets;
  let currentPreview: Preview | undefined;
  let activeRequest: AbortController | undefined;
  let request = 0;

  // Only one preview runs at a time, and a newer request supersedes a pending load.
  const dispose = () => {
    currentPreview?.destroy();
    currentPreview = undefined;
    activeRequest?.abort();
    request++;
  };

  const navigate = (id?: string) => {
    const url = new URL(location.href);
    url.search = '';

    if (id) url.searchParams.set('widget', id);

    history.pushState({}, '', url);
    route();
    main.focus({ preventScroll: true });
  };

  const notice = (title: string, message: string, retry: () => void) => {
    main.replaceChildren(el('p', 'eyebrow', 'CHALDEA / LIBRARY'), el('h1', '', title), el('p', 'notice', message), button('Try again', retry));
  };

  const renderNavigation = () => {
    categories.replaceChildren();

    for (const name of [allWidgets, ...new Set(catalog.widgets.map(w => w.category))]) {
      const items = catalog.widgets.filter(w => name === allWidgets || w.category === name);
      const item = button('', () => {
        category = name;
        navigate();
      }, 'nav-item');
      item.setAttribute('aria-current', name === category ? 'page' : 'false');
      item.append(el('span', '', name), el('span', 'nav-count', String(items.length).padStart(2, '0')));
      categories.append(item);
    }
  };

  const browse = () => {
    dispose();
    renderNavigation();
    document.title = 'Chaldea · Quickshell widget library';
    main.replaceChildren(...browseView(catalog.widgets, category, search.value, navigate));
  };

  const detail = async (item: Summary) => {
    dispose();
    renderNavigation();

    const ticket = request;
    activeRequest = new AbortController();
    main.replaceChildren(el('p', 'loading', 'Opening widget…'));

    try {
      const widget = await loadWidget(item, activeRequest.signal);

      if (ticket !== request) return;

      document.title = `${widget.bundle.definition.title} · Chaldea`;

      const view = detailView(widget, () => navigate());
      main.replaceChildren(...view.nodes);
      currentPreview = view.start();
    } catch (failure) {
      if (ticket !== request) return;

      notice('Widget unavailable', errorText(failure), () => { void detail(item); });
      main.prepend(button('← All widgets', () => navigate(), 'back-button'));
    }
  };

  function route() {
    const selected = new URL(location.href).searchParams.get('widget');

    if (!selected) {
      browse();

      return;
    }

    const item = catalog.widgets.find(w => w.id === selected);

    if (item) {
      void detail(item);

      return;
    }

    dispose();
    notice('Widget not found', 'This widget is not in the current catalog.', () => navigate());
  }

  const initialize = async () => {
    main.replaceChildren(el('p', 'loading', 'Loading the collection…'));

    try {
      catalog = await loadCatalog();
      route();
    } catch (failure) {
      notice('The collection could not load', errorText(failure), () => { void initialize(); });
    }
  };

  root.querySelector('.brand')!.addEventListener('click', event => {
    event.preventDefault();
    search.value = '';
    category = allWidgets;
    navigate();
  });

  search.addEventListener('input', () => {
    if (!catalog) return;

    if (new URL(location.href).searchParams.has('widget')) navigate();
    else browse();
  });

  window.addEventListener('popstate', () => {
    if (catalog) route();
  });

  window.addEventListener('keydown', event => {
    if (event.key !== '/' || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

    event.preventDefault();
    search.focus();
  });

  window.addEventListener('pagehide', dispose);
  await initialize();
}
