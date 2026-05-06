export interface ChurchLike {
  id: string;
  name: string;
}

export function normalizeChurchName(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

export function dedupeChurches<T extends ChurchLike>(churches: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  churches.forEach(church => {
    const key = normalizeChurchName(church.name || church.id);
    if (seen.has(key)) return;
    seen.add(key);
    result.push(church);
  });

  return result;
}

export function resolveChurchId(value: string, churches: ChurchLike[]): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const exactId = churches.find(church => church.id === trimmed);
  const displayName = exactId?.name ?? trimmed;
  const normalizedDisplayName = normalizeChurchName(displayName);

  return churches.find(church => normalizeChurchName(church.name) === normalizedDisplayName)?.id
    ?? exactId?.id
    ?? trimmed;
}

export function buildChurchNameToIdMap(churches: ChurchLike[]): Record<string, string> {
  return Object.fromEntries(
    churches.flatMap(church => [
      [church.name, church.id],
      [church.name.toLowerCase(), church.id],
      [normalizeChurchName(church.name), church.id],
    ]),
  );
}

export function canonicalizeChurchValue<T extends { church: string }>(
  item: T,
  churches: ChurchLike[],
): T {
  const church = resolveChurchId(item.church, churches);
  return church === item.church ? item : { ...item, church };
}
