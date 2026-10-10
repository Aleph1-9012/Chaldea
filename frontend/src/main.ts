const root = document.querySelector<HTMLElement>('#app')!;

if (import.meta.env.DEV && new URLSearchParams(location.search).has('workbench')) {
  await import('./styles/app.css');
  const { start } = await import('./app');
  await start(root);
} else {
  const { mount } = await import('svelte');
  const { default: App } = await import('./site/App.svelte');
  await import('./site/site.css');
  mount(App, { target: root });
}
