import { inject, pageview, type BeforeSendEvent } from '@vercel/analytics';
import type { Summary } from '../catalog/contracts';

interface AnalyticsRoute {
  library: boolean;
  widget: string;
}

export function analyticsPath(route: AnalyticsRoute, widgets: readonly Pick<Summary, 'id'>[]): string {
  if (route.widget) {
    return widgets.some(widget => widget.id === route.widget)
      ? `/widgets/${encodeURIComponent(route.widget)}`
      : '/widgets/not-found';
  }

  return route.library ? '/library' : '/';
}

export function sanitizePageview(event: BeforeSendEvent): BeforeSendEvent | null {
  if (event.type !== 'pageview') return null;

  const url = new URL(event.url);
  url.search = '';
  url.hash = '';

  return { ...event, url: url.href };
}

export function createPageTracker(send: typeof pageview): (path: string) => void {
  let previous = '';

  return path => {
    if (path === previous) return;

    previous = path;
    send({ path });
  };
}

export function startAnalytics(): (path: string) => void {
  inject({
    mode: 'production',
    framework: 'svelte',
    disableAutoTrack: true,
    beforeSend: sanitizePageview,
  }, import.meta.env.VITE_VERCEL_OBSERVABILITY_CLIENT_CONFIG);

  return createPageTracker(pageview);
}
