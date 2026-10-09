import type { Snapshot } from '../generator';
import { el, button, errorText } from './dom';

export function codePanel() {
  const root = el('section', 'code-panel'); root.setAttribute('aria-label', 'Generated files');
  const bar = el('div', 'code-bar');
  const select = el('select', 'file-select'); select.setAttribute('aria-label', 'Output file');
  const status = el('span', 'code-status'); status.setAttribute('role', 'status');
  const pre = el('pre'); pre.tabIndex = 0;
  const code = el('code'); pre.append(code);
  let snapshot: Snapshot | null = null;
  let version = 0;
  const current = () => snapshot?.files.find(f => f.path === select.value);
  const copy = button('Copy file', () => { void (async () => {
    const file = current(); const atClick = version;

    if (file?.text === undefined) return;

    try { await navigator.clipboard.writeText(file.text); if (version === atClick) status.textContent = `Copied ${file.path}`; }
    catch { if (version === atClick) { const range = document.createRange(); range.selectNodeContents(code); getSelection()?.removeAllRanges(); getSelection()?.addRange(range); status.textContent = 'Clipboard unavailable. Selected code can be copied manually.'; } }
  })(); }, 'button small');
  const download = button('Download file ↓', () => {
    const file = current();

    if (!file) return;

    try {
      const type = file.text === undefined ? 'application/octet-stream' : 'text/plain;charset=utf-8';
      const url = URL.createObjectURL(new Blob([new Uint8Array(file.bytes).buffer], { type }));
      const link = el('a');
      link.href = url;
      link.download = file.path.slice(file.path.lastIndexOf('/') + 1);
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = file.path.includes('/') ? `Download started. Save it as ${file.path}.` : `Download started for ${file.path}.`;
    } catch (error) { status.textContent = errorText(error); }
  }, 'button primary small');
  const render = () => {
    const file = current(); code.textContent = file?.text ?? (file ? `Binary asset · ${file.bytes.byteLength} bytes\nUse Download file to save ${file.path}.` : 'Code is unavailable until all settings are valid.');
    copy.disabled = file?.text === undefined; download.disabled = !file;
  };

  select.addEventListener('change', () => {
    version++;
    status.textContent = '';
    render();
  });

  const hint = el('p', 'code-hint', 'Save every listed file, including README.md and LICENSE. Keep the names and folder paths shown in the selector.');
  bar.append(select, status, copy, download); root.append(bar, pre, hint);

  return { root, update(next: Snapshot | null) {
    snapshot = next; version++; status.textContent = '';
    const selected = select.value; select.replaceChildren();
    for (const file of next?.files ?? []) { const option = el('option', '', file.path); option.value = file.path; select.append(option); }
    if (next?.files.some(f => f.path === selected)) select.value = selected;
    select.disabled = !next; render();
  } };
}
