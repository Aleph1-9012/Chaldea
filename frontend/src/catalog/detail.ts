import type { LoadedWidget, Settings } from './contracts';
import { codePanel } from '../components/code-panel';
import { interactionControls } from '../components/interaction-controls';
import { el, button, errorText } from '../components/dom';
import { controls } from '../customizer/controls';
import { defaults, validateSettings } from '../customizer/settings';
import { generate } from '../generator';
import { mountPreview } from '../preview/frame';
import type { Preview } from '../preview/frame';

export interface DetailView {
  nodes: HTMLElement[];
  start(): Preview;
}

// Build one widget's page. Call `start` once the nodes are in the document.
export function detailView(widget: LoadedWidget, back: () => void): DetailView {
  const d = widget.bundle.definition;
  const native = d.exports.some(f => f.kind === 'template');

  const copy = el('div');
  copy.append(el('p', 'eyebrow', `${d.category.toUpperCase()} / ${d.license}`), el('h1', '', d.title), el('p', '', d.summary));

  const heading = el('header', 'detail-heading');
  heading.append(copy, el('span', d.status === 'draft' ? 'tag draft' : 'tag', d.status === 'draft' ? 'HTML DRAFT' : 'QML READY'));

  const previewHost = el('div', 'preview-host');
  const stage = el('section', 'preview-section');
  stage.setAttribute('aria-label', 'Widget preview');
  stage.append(previewHost);

  if (d.category !== 'Glyphs' && d.category !== 'Interactive art') {
    const stageHeader = el('div', 'stage-header');
    stageHeader.append(el('span', '', 'LIVE PREVIEW'), el('span', '', 'HTML demonstration'));

    const stageFooter = el('div', 'stage-footer');
    stageFooter.append(el('span', '', 'Use the controls inside the preview'), el('span', '', 'INTERACTIVE'));

    stage.prepend(stageHeader);
    stage.append(stageFooter);
  }

  const error = el('p', 'generation-error');
  error.setAttribute('role', 'alert');
  error.hidden = true;

  const panel = codePanel(d.id);
  const controlHost = el('div');
  const initial = defaults(d);
  let proposed: Settings = { ...initial };
  let preview: Preview | undefined;
  const interactive = d.category === 'Interactive art' ? interactionControls((key, value) => preview?.action(key, value)) : undefined;
  let fields: ReturnType<typeof controls>;

  // Settings, generated files, and the preview always change together.
  const update = () => {
    try {
      if (native) {
        const snapshot = generate(d, widget.bundle.templates, proposed, widget.assets);
        panel.update(snapshot);
        preview?.update(snapshot.settings);
      } else {
        preview?.update(validateSettings(d, proposed));
      }

      error.hidden = true;
      fields.setError();
    } catch (failure) {
      panel.update(null);
      fields.setError(failure);
      error.hidden = false;
      error.textContent = `${errorText(failure)} Output is unavailable until corrected.`;
    }
  };

  const renderControls = () => {
    fields = controls(d, initial, (key, value) => {
      proposed = { ...proposed, [key]: value };
      update();
    });
    controlHost.replaceChildren(fields.root);
  };

  const reset = button('Reset', () => {
    proposed = { ...initial };
    renderControls();
    update();
  }, 'reset-button');

  const customizerHeader = el('div', 'customizer-heading');
  customizerHeader.append(el('h2', '', 'Make it yours'), reset);
  renderControls();

  const customizer = el('section', 'customizer');
  customizer.setAttribute('aria-label', 'Customize widget');
  customizer.append(customizerHeader, controlHost, error);

  if (interactive) customizer.append(interactive.root);

  customizer.append(el('p', 'customizer-note', 'Your settings stay in memory. Reloading restores the defaults.'));

  const workbench = el('div', 'workbench');
  workbench.append(stage);

  if (d.settings.length || interactive) workbench.append(customizer);

  if (((!native && d.category !== 'Glyphs') || !d.settings.length) && !interactive) workbench.classList.add('preview-only');

  const sectionTitle = el('div', 'output-heading');
  sectionTitle.append(
    el('h2', '', native ? 'Take it with you' : 'Preview status'),
    el('span', 'fine', native ? `${d.exports.length} FILES / ${d.license}` : 'NATIVE IMPLEMENTATION PENDING'),
  );

  const output = native
    ? panel.root
    : el('p', 'draft-notice', 'This existing HTML design is interactive. Native QML export is not available yet.');

  const usage = el('details', 'usage');
  usage.append(
    el('summary', '', 'Installation & source notes'),
    el('pre', 'usage-text', widget.bundle.usage || 'This draft has no native installation yet.'),
  );

  const revision = el('p', 'revision', `${native ? `${widget.bundle.nativeBaseline} · ` : ''}Revision ${widget.bundle.revision.slice(0, 12)}`);

  return {
    nodes: [button('← All widgets', back, 'back-button'), heading, workbench, sectionTitle, output, usage, revision],
    start() {
      preview = mountPreview(previewHost, widget, initial, interactive);
      update();

      return preview;
    },
  };
}
