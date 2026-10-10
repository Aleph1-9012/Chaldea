import type { Summary } from './contracts';
import { contentUrl } from './load';
import { el } from '../components/dom';

export const allWidgets = 'All widgets';

function card(widget: Summary, index: number, open: (id: string) => void): HTMLAnchorElement {
  const link = el('a', 'widget-card');
  link.href = `?workbench&widget=${widget.id}`;
  link.addEventListener('click', event => {
    // Modified clicks keep the browser's own behavior, such as opening a new tab.
    if (event.ctrlKey || event.metaKey || event.shiftKey) return;

    event.preventDefault();
    open(widget.id);
  });

  const image = el('img');
  image.src = contentUrl(widget.thumbnailUrl);
  image.alt = '';
  image.loading = 'lazy';
  image.width = 640;
  image.height = 400;

  const stage = el('div', 'card-stage');
  stage.append(image, el('span', 'card-index', `${String(index + 1).padStart(2, '0')} / ${widget.category.toUpperCase()}`));

  const title = el('div', 'card-title');
  title.append(el('h2', '', widget.title), el('span', 'card-arrow', '↗'));

  const meta = el('div', 'card-meta');
  meta.append(
    el('span', widget.status === 'draft' ? 'tag draft' : 'tag', widget.status === 'draft' ? 'HTML DRAFT' : 'QML READY'),
    el('span', '', widget.category),
  );

  const body = el('div', 'card-body');
  body.append(title, el('p', '', widget.summary), meta);
  link.append(stage, body);

  return link;
}

// Build the collection page for one category and search query.
export function browseView(widgets: readonly Summary[], category: string, query: string, open: (id: string) => void): HTMLElement[] {
  const introCopy = el('div');
  introCopy.append(
    el('p', 'eyebrow', 'INDEPENDENT COMPONENTS. PERSONAL DESKTOPS.'),
    el('h1', '', 'Your widget\ndesigns, together.'),
    el('p', 'intro-description', 'Open an existing design and try its controls.\nCustomize and export when native QML is available.'),
  );

  const stamp = el('div', 'collection-stamp');
  stamp.innerHTML = '<span class="stamp-symbol" aria-hidden="true">✳</span><span>THE CHALDEA<br>COLLECTION</span><span class="stamp-line"></span><span class="fine">OPEN SOURCE<br>MADE TO BE YOURS</span>';

  const intro = el('section', 'intro');
  intro.append(introCopy, stamp);

  const matches = widgets.filter(w =>
    (category === allWidgets || w.category === category)
    && [w.title, w.summary, w.category, ...w.tags].join(' ').toLowerCase().includes(query.toLowerCase()));

  const heading = el('div', 'collection-heading');
  heading.append(
    el('h2', '', query ? 'Search results' : category),
    el('span', 'fine', `${matches.length} ${matches.length === 1 ? 'widget' : 'widgets'}`),
  );

  const grid = el('div', 'catalog-grid');
  matches.forEach((w, index) => grid.append(card(w, index, open)));

  if (!matches.length) {
    grid.append(el('div', 'empty-state', widgets.length
      ? 'No matching widgets. Try another name or category.'
      : 'No widgets published yet. Existing HTML drafts are available in the local development preview.'));
  }

  const foot = el('footer', 'library-footer');
  foot.append(el('span', '', 'CHOOSE A WIDGET. MAKE IT YOURS.'), el('span', '', 'Quickshell / Qt Quick'));

  return [intro, heading, grid, foot];
}
