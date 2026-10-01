export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag); node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
export function button(text: string, onClick: () => void, className = 'button'): HTMLButtonElement {
  const node = el('button', className, text); node.type = 'button'; node.addEventListener('click', onClick); return node;
}
export function errorText(error: unknown): string { return error instanceof Error ? error.message : 'Something went wrong.'; }
