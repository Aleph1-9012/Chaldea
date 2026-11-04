import type { Summary } from '../catalog/contracts';
import { presentation } from './catalog';
import { libraryUrl, repositoryUrl } from './links';

export const siteUrl = 'https://chaldea.vercel.app/';

export const homeTitle = 'Chaldea | Quickshell widget library';

export const homeDescription = 'Preview and customize open-source Quickshell widgets for your Linux desktop. Download QML for notes, media players, glyphs, interactive art, and sliders.';

type MetadataRoute = { library: boolean; widget: string };

export function pageMetadata(route: MetadataRoute, widgets: readonly Summary[]) {
  if (route.widget) {
    const widget = widgets.find(item => item.id === route.widget);
    const url = new URL(`?${new URLSearchParams({ widget: route.widget })}`, siteUrl).href;

    if (!widget) {
      return { title: 'Widget unavailable | Chaldea', description: 'This widget is not in the current Chaldea catalog.', url, robots: 'noindex, follow' };
    }

    return {
      title: `${presentation(widget).title} | ${widget.category} widget for Quickshell | Chaldea`,
      description: `${widget.summary} Preview and customize this Quickshell widget.${widget.status === 'published' ? ' Download its QML files.' : ''}`,
      url,
      robots: widget.status === 'published' ? 'index, follow' : 'noindex, follow',
    };
  }

  if (route.library) {
    return {
      title: 'Quickshell widget library | Chaldea',
      description: homeDescription,
      url: new URL(libraryUrl(), siteUrl).href,
      robots: 'index, follow',
    };
  }

  return { title: homeTitle, description: homeDescription, url: siteUrl, robots: 'index, follow' };
}

export const websiteData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${siteUrl}#website`,
  name: 'Chaldea',
  url: siteUrl,
  description: homeDescription,
  inLanguage: 'en',
  sameAs: repositoryUrl,
};
