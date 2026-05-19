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

// 손상된 church 값(폼 라벨이 통째로 들어간 경우 등)을 감지.
// 30자 초과 또는 콤마/줄바꿈 포함 시 garbage로 간주.
export function isCorruptChurchValue(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length > 30) return true;
  if (/[,\n\r;]/.test(trimmed)) return true;
  return false;
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

// UI 표시용: 손상된 값은 안내 문구로 대체
// churchMap 매칭이 corrupt 체크보다 우선 — ID가 길어도 등록된 entry면 정상 표시
export function displayChurchName(value: string, churchMap: Record<string, string>): string {
  if (!value) return '미입력';
  if (churchMap[value]) return churchMap[value];
  if (isCorruptChurchValue(value)) return '(확인 필요)';
  return value;
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
