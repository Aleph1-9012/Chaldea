export function reveal(node: HTMLElement) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  node.classList.add('reveal-pending');

  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;

    node.classList.remove('reveal-pending');
    observer.disconnect();
  }, { threshold: 0.06 });

  observer.observe(node);

  return { destroy: () => observer.disconnect() };
}
