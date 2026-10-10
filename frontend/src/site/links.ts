export const repositoryUrl = 'https://github.com/Aleph1-9012/Chaldea';

export const docsUrl = `${repositoryUrl}/tree/main/docs`;

export const changelogUrl = `${repositoryUrl}/commits/main/`;

export type LibrarySort = 'name' | 'family';

export function libraryUrl(family = '', sort: LibrarySort = 'name', query = ''): string {
  const params = new URLSearchParams({ page: 'library' });

  if (family) params.set('family', family);
  if (sort !== 'name') params.set('sort', sort);
  if (query) params.set('q', query);

  return `?${params}`;
}
