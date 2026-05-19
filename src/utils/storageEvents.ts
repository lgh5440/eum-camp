export const SHARED_STORAGE_EVENT = 'eum-camp:shared-storage-change';

export function publishStorageChange(key: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SHARED_STORAGE_EVENT, { detail: { key } }));
}

export function listenStorageChange(key: string, callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const onCustom = (event: Event) => {
    const detail = (event as CustomEvent<{ key?: string }>).detail;
    if (!detail?.key || detail.key === key) callback();
  };

  const onNative = (event: StorageEvent) => {
    if (!event.key || event.key === key) callback();
  };

  window.addEventListener(SHARED_STORAGE_EVENT, onCustom);
  window.addEventListener('storage', onNative);
  return () => {
    window.removeEventListener(SHARED_STORAGE_EVENT, onCustom);
    window.removeEventListener('storage', onNative);
  };
}
