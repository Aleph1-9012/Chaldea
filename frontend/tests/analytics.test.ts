import { expect, test } from 'bun:test';
import { analyticsPath, createPageTracker, sanitizePageview } from '../src/site/analytics';

const widgets = [{ id: 'player-matrix' }, { id: 'quick-notes-refined' }];

test('analytics distinguishes pages without including search, filters, or arbitrary widget input', () => {
  expect(analyticsPath({ library: false, widget: '' }, widgets)).toBe('/');

  const filtered = { library: true, widget: '', family: 'Player', query: 'private text', sort: 'family' };
  expect(analyticsPath(filtered, widgets)).toBe('/library');
  expect(analyticsPath({ ...filtered, widget: 'player-matrix' }, widgets)).toBe('/widgets/player-matrix');
  expect(analyticsPath({ library: false, widget: 'quick-notes-refined' }, widgets)).toBe('/widgets/quick-notes-refined');
  expect(analyticsPath({ library: false, widget: 'private text?token=secret' }, widgets)).toBe('/widgets/not-found');
});

test('pageviews omit URL queries and fragments and reject custom events', () => {
  expect(sanitizePageview({ type: 'pageview', url: 'https://chaldea.vercel.app/?q=private&token=secret#notes' }))
    .toEqual({ type: 'pageview', url: 'https://chaldea.vercel.app/' });
  expect(sanitizePageview({ type: 'pageview', url: 'https://chaldea.vercel.app/widgets/player-matrix?q=private#code' }))
    .toEqual({ type: 'pageview', url: 'https://chaldea.vercel.app/widgets/player-matrix' });
  expect(sanitizePageview({ type: 'event', url: 'https://chaldea.vercel.app/' })).toBeNull();
});

test('filters do not add pageviews but returning to a page does', () => {
  const views: string[] = [];
  const record = createPageTracker(({ path }) => {
    if (path) views.push(path);
  });

  for (const path of ['/', '/', '/library', '/library', '/widgets/player-matrix', '/widgets/player-matrix', '/library', '/']) {
    record(path);
  }

  expect(views).toEqual(['/', '/library', '/widgets/player-matrix', '/library', '/']);
});
