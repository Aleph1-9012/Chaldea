export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;

  if (text !== undefined) node.textContent = text;

  return node;
}

export function errorText(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'Something went wrong.';
}
