import type { Catalog, Summary } from './catalog/contracts';
import { contentUrl, loadCatalog, loadWidget } from './catalog/load';
import { el, button, errorText } from './components/dom';
import { codePanel } from './components/code-panel';
import { controls } from './customizer/controls';
import { defaults, validateSettings } from './customizer/settings';
import { generate } from './generator';
import { mountPreview } from './preview/frame';
import type { Preview } from './preview/frame';

export async function start(root: HTMLElement): Promise<void> {
  root.innerHTML = `<header class="topbar"><a class="brand" href="?" aria-label="XLR8 home"><span class="brand-mark" aria-hidden="true">✳</span>XLR8<span class="brand-divider">/</span><span class="brand-sub">WIDGET LIBRARY</span></a><div class="topbar-right"><span class="status-dot"></span> Built for Quickshell <span class="version">v0.1</span></div></header><div class="layout"><aside class="sidebar"><div><p class="eyebrow">YOUR NEXT SHELL STARTS HERE</p><label class="search-box"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="Find a widget…" aria-label="Search widgets"><kbd>/</kbd></label><p class="nav-label">COLLECTION</p><nav id="categories" aria-label="Widget categories"></nav></div><div class="sidebar-bottom"><span class="tiny-mark" aria-hidden="true">＋</span><p>A few good pieces.<br>A shell of your own.</p><p class="fine">Original widgets · 0BSD<br>Application · Apache 2.0</p><p class="fine muted">Settings stay in this tab.<br>No account needed.</p></div></aside><main id="main" tabindex="-1"></main></div>`;
  const main = root.querySelector<HTMLElement>('main')!;
  const categories = root.querySelector<HTMLElement>('#categories')!;
  const search = root.querySelector<HTMLInputElement>('#search')!;
  let catalog: Catalog;
  let category = 'All widgets';
  let currentPreview: Preview | undefined;
  let activeRequest: AbortController | undefined;
  let request = 0;
  const dispose = () => { currentPreview?.destroy(); currentPreview = undefined; activeRequest?.abort(); request++; };
  const navigate = (id?: string) => {
    const url = new URL(location.href); url.search = ''; if (id) url.searchParams.set('widget', id);
    history.pushState({}, '', url); route(); main.focus({ preventScroll: true });
  };
  root.querySelector('.brand')!.addEventListener('click', event => { event.preventDefault(); search.value = ''; category = 'All widgets'; navigate(); });
  const notice = (title: string, message: string, retry: () => void) => {
    main.replaceChildren(el('p', 'eyebrow', 'XLR8 / LIBRARY'), el('h1', '', title), el('p', 'notice', message), button('Try again', retry));
  };
  const renderNavigation = () => {
    categories.replaceChildren();
    for (const name of ['All widgets', ...new Set(catalog.widgets.map(w => w.category))]) {
      const items = catalog.widgets.filter(w => name === 'All widgets' || w.category === name);
      const item = button('', () => { category = name; navigate(); }, 'nav-item');
      item.setAttribute('aria-current', name === category ? 'page' : 'false');
      item.append(el('span', '', name), el('span', 'nav-count', String(items.length).padStart(2, '0'))); categories.append(item);
    }
  };
  const card = (widget: Summary, index: number) => {
    const link = el('a', 'widget-card'); link.href = `?widget=${widget.id}`;
    link.addEventListener('click', event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey) { event.preventDefault(); navigate(widget.id); } });
    const image = el('img'); image.src = contentUrl(widget.thumbnailUrl); image.alt = ''; image.loading = 'lazy'; image.width = 640; image.height = 400;
    const stage = el('div', 'card-stage'); stage.append(image, el('span', 'card-index', `${String(index + 1).padStart(2, '0')} / ${widget.category.toUpperCase()}`));
    const body = el('div', 'card-body');
    const title = el('div', 'card-title'); title.append(el('h2', '', widget.title), el('span', 'card-arrow', '↗'));
    const meta = el('div', 'card-meta'); meta.append(el('span', widget.status === 'draft' ? 'tag draft' : 'tag', widget.status === 'draft' ? 'HTML DRAFT' : 'QML READY'), el('span', '', widget.category));
    body.append(title, el('p', '', widget.summary), meta); link.append(stage, body); return link;
  };
  const browse = () => {
    dispose(); renderNavigation(); document.title = 'XLR8 · Quickshell widget library';
    const intro = el('section', 'intro');
    const introCopy = el('div'); introCopy.append(el('p', 'eyebrow', 'INDEPENDENT COMPONENTS. PERSONAL DESKTOPS.'), el('h1', '', 'Your widget\ndesigns, together.'), el('p', 'intro-description', 'Open an existing design and try its controls.\nCustomize and export when native QML is available.'));
    const stamp = el('div', 'collection-stamp'); stamp.innerHTML = '<span class="stamp-symbol" aria-hidden="true">✳</span><span>THE XLR8<br>COLLECTION</span><span class="stamp-line"></span><span class="fine">OPEN SOURCE<br>MADE TO BE YOURS</span>';
    intro.append(introCopy, stamp);
    const matches = catalog.widgets.filter(w => (category === 'All widgets' || w.category === category) && [w.title, w.summary, w.category, ...w.tags].join(' ').toLowerCase().includes(search.value.toLowerCase()));
    const heading = el('div', 'collection-heading'); heading.append(el('h2', '', search.value ? 'Search results' : category), el('span', 'fine', `${matches.length} ${matches.length === 1 ? 'widget' : 'widgets'}`));
    const grid = el('div', 'catalog-grid'); matches.forEach((w, index) => grid.append(card(w, index)));
    if (!matches.length) grid.append(el('div', 'empty-state', catalog.widgets.length ? 'No matching widgets. Try another name or category.' : 'No widgets published yet. Existing HTML drafts are available in the local development preview.'));
    const foot = el('footer', 'library-footer'); foot.append(el('span', '', 'CHOOSE A WIDGET. MAKE IT YOURS.'), el('span', '', 'Quickshell / Qt Quick'));
    main.replaceChildren(intro, heading, grid, foot);
  };
  const detail = async (item: Summary) => {
    dispose(); renderNavigation(); const ticket = request;
    activeRequest = new AbortController();
    main.replaceChildren(el('p', 'loading', 'Opening widget…'));
    try {
      const widget = await loadWidget(item, activeRequest.signal);
      if (ticket !== request) return;
      const d = widget.bundle.definition;
      document.title = `${d.title} · XLR8`;
      const back = button('← All widgets', () => navigate(), 'back-button');
      const heading = el('header', 'detail-heading');
      const copy = el('div'); copy.append(el('p', 'eyebrow', `${d.category.toUpperCase()} / ${d.license}`), el('h1', '', d.title), el('p', '', d.summary));
      heading.append(copy, el('span', d.status === 'draft' ? 'tag draft' : 'tag', d.status === 'draft' ? 'HTML DRAFT' : 'QML READY'));
      const workbench = el('div', 'workbench');
      const stage = el('section', 'preview-section'); stage.setAttribute('aria-label', 'Widget preview');
      const stageHeader = el('div', 'stage-header'); stageHeader.append(el('span', '', 'LIVE PREVIEW'), el('span', '', 'HTML demonstration'));
      const previewHost = el('div', 'preview-host');
      const stageFooter = el('div', 'stage-footer'); stageFooter.append(el('span', '', 'Use the controls inside the preview'), el('span', '', 'INTERACTIVE'));
      stage.append(stageHeader, previewHost, stageFooter);
      const customizer = el('section', 'customizer'); customizer.setAttribute('aria-label', 'Customize widget');
      const customizerHeader = el('div', 'customizer-heading'); customizerHeader.append(el('h2', '', 'Make it yours'));
      const controlHost = el('div'); const error = el('p', 'generation-error'); error.setAttribute('role', 'alert'); error.hidden = true;
      const native = d.exports.some(f => f.kind === 'template');
      const panel = codePanel(d.id);
      const initial = defaults(d); let proposed: Record<string, unknown> = { ...initial };
      let fields: ReturnType<typeof controls>;
      const update = () => {
        try {
          if (native) { const snapshot = generate(d, widget.bundle.templates, proposed, widget.assets); panel.update(snapshot); currentPreview?.update(snapshot.settings); }
          else { currentPreview?.update(validateSettings(d, proposed)); }
          error.hidden = true; fields.setError();
        } catch (failure) { panel.update(null); fields.setError(failure); error.hidden = false; error.textContent = `${errorText(failure)} Output is unavailable until corrected.`; }
      };
      const renderControls = () => {
        fields = controls(d, initial, (key, value) => { proposed = { ...proposed, [key]: value }; update(); }); controlHost.replaceChildren(fields.root);
      };
      customizerHeader.append(button('Reset', () => { proposed = { ...initial }; renderControls(); update(); }, 'reset-button'));
      renderControls();
      customizer.append(customizerHeader, controlHost, error, el('p', 'customizer-note', 'Your settings stay in memory. Reloading restores the defaults.'));
      workbench.append(stage);
      if (d.settings.length) workbench.append(customizer);
      if (!native || !d.settings.length) workbench.classList.add('preview-only');
      const sectionTitle = el('div', 'output-heading'); sectionTitle.append(el('h2', '', native ? 'Take it with you' : 'Preview status'), el('span', 'fine', native ? `${d.exports.length} FILES / ${d.license}` : 'NATIVE IMPLEMENTATION PENDING'));
      const draftNotice = el('p', 'draft-notice', 'This existing HTML design is interactive. Native QML export is not available yet.');
      const usage = el('details', 'usage'); const summary = el('summary', '', 'Installation & source notes');
      const usageText = el('pre', 'usage-text', widget.bundle.usage || 'This draft has no native installation yet.'); usage.append(summary, usageText);
      const revision = el('p', 'revision', `${native ? `${widget.bundle.nativeBaseline} · ` : ''}Revision ${widget.bundle.revision.slice(0, 12)}`);
      main.replaceChildren(back, heading, workbench, sectionTitle, native ? panel.root : draftNotice, usage, revision);
      currentPreview = mountPreview(previewHost, widget, initial); update();
    } catch (failure) {
      if (ticket !== request) return;
      notice('Widget unavailable', errorText(failure), () => { void detail(item); });
      main.prepend(button('← All widgets', () => navigate(), 'back-button'));
    }
  };
  function route() {
    const selected = new URL(location.href).searchParams.get('widget');
    if (!selected) { browse(); return; }
    const item = catalog.widgets.find(w => w.id === selected);
    if (item) void detail(item);
    else { dispose(); notice('Widget not found', 'This widget is not in the current catalog.', () => navigate()); }
  }
  const initialize = async () => {
    main.replaceChildren(el('p', 'loading', 'Loading the collection…'));
    try { catalog = await loadCatalog(); route(); }
    catch (failure) { notice('The collection could not load', errorText(failure), () => { void initialize(); }); }
  };
  search.addEventListener('input', () => { if (catalog) { if (new URL(location.href).searchParams.has('widget')) navigate(); else browse(); } });
  window.addEventListener('popstate', () => { if (catalog) route(); });
  window.addEventListener('keydown', event => { if (event.key === '/' && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) { event.preventDefault(); search.focus(); } });
  window.addEventListener('pagehide', dispose);
  await initialize();
}
