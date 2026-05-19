import type { Participant } from '../types';

// 교회·조·방 ID → 표시 문자열 변환용 맵 타입
export interface ExportMaps {
  churchMap: Record<string, string>;   // id → 교회명
  groupMap:  Record<string, string>;   // id → 조명
  roomMap:   Record<string, string>;   // id → 방명
}

// CSV 셀 값 이스케이프: 쉼표·줄바꿈·따옴표 포함 시 따옴표로 감싸기
export function escapeCSVValue(value: string | undefined | null): string {
  const s = value == null ? '' : String(value);
  if (s.includes(',') || s.includes('\n') || s.includes('"') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const FEE_LABEL: Record<Participant['fee'], string> = {
  paid: '완료', partial: '면제', unpaid: '미완료',
};
const STATUS_LABEL: Record<Participant['status'], string> = {
  confirmed: '확인완료', pending: '신청', cancelled: '취소',
};
const DIET_LABEL: Record<Participant['dietType'], string> = {
  normal: '일반식', vegetarian: '채식', allergy: '알레르기',
};

const HEADERS = [
  '이름', '교회', '구분', '학년', '성별',
  '연락처', '보호자 연락처',
  '참가비', '조', '방', '차량',
  '식단', '알레르기', '특이사항', '등록상태',
];

// Participant[] → CSV 텍스트 (UTF-8 BOM 포함)
export function participantsToCSV(list: Participant[], maps: ExportMaps): string {
  const { churchMap, groupMap, roomMap } = maps;

  const rows = list.map(p => {
    const gender = p.gender === 'M' ? '남' : '여';
    const role   = p.role ?? (p.grade === '교사' ? '교사' : '학생');
    const grade  = role === '학생' ? p.grade : role;
    const church = churchMap[p.church] ?? p.church;
    const group  = p.groupId ? (groupMap[p.groupId] ?? p.groupId) : '';
    const room   = p.roomId  ? (roomMap[p.roomId]   ?? p.roomId)  : '';
    const bus    = p.busId   ?? '';

    const cells = [
      p.name,
      church,
      role,
      grade,
      gender,
      p.phone,
      p.parentPhone,
      FEE_LABEL[p.fee],
      group,
      room,
      bus,
      DIET_LABEL[p.dietType],
      p.allergies ?? '',
      p.notes ?? '',
      STATUS_LABEL[p.status],
    ];

    return cells.map(escapeCSVValue).join(',');
  });

  // UTF-8 BOM + 헤더 + 데이터
  return '\uFEFF' + [HEADERS.join(','), ...rows].join('\r\n');
}

// 브라우저 다운로드 트리거
export function downloadCSV(csvText: string, filename: string): void {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 오늘 날짜 기반 파일명
export function buildFilename(prefix = 'eum-camp-participants'): string {
  const d   = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `${prefix}-${ymd}.csv`;
}
