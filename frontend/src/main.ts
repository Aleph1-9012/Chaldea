import { mount } from 'svelte';
import App from './site/App.svelte';
import './site/site.css';

// Keep old preview bookmarks usable in the single Svelte application.
const url = new URL(location.href);

if (url.searchParams.has('workbench')) {
  url.searchParams.delete('workbench');

  if (!url.searchParams.get('widget')) url.searchParams.set('page', 'library');

  history.replaceState(history.state, '', url);
}

const root = document.querySelector<HTMLElement>('#app')!;
mount(App, { target: root });
