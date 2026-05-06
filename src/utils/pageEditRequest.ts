export function makeEditHash(page: string, edit: string): string {
  return `#/${page}?edit=${encodeURIComponent(edit)}`;
}

export function consumeEditRequest(page: string, edit: string): boolean {
  if (typeof window === 'undefined') return false;

  const raw = window.location.hash.replace(/^#\/?/, '');
  const [hashPage, query = ''] = raw.split('?');
  if (hashPage !== page) return false;

  const params = new URLSearchParams(query);
  if (params.get('edit') !== edit) return false;

  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/${page}`);
  return true;
}
