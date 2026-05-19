import type { Participant } from '../types';
import { generateParticipantId } from './participantStorage';
import { normalizeChurchName } from './churchIdentity';

// ── 컬럼 alias 매핑 ────────────────────────────────────────────────────────────
// 규칙: 공백 포함 원본 key도 추가하고, 파서 내부에서 h.replace(/\s+/g,'') 버전도 시도함
const ALIASES: Record<string, string> = {
  // ── name ──────────────────────────────────────────────────────────────────
  '이름': 'name', '성명': 'name', '참가자명': 'name',
  '참가자이름': 'name', '참가자 이름': 'name',
  '신청자이름': 'name', '신청자 이름': 'name',

  // ── church ────────────────────────────────────────────────────────────────
  '교회': 'church', '소속교회': 'church', '교회명': 'church',
  '소속 교회': 'church', '출석교회': 'church', '다니는교회': 'church',

  // ── role ──────────────────────────────────────────────────────────────────
  '구분': 'role', '역할': 'role', '참가구분': 'role', '참가 구분': 'role',
  '학생구분': 'role', '참가자구분': 'role', '참가자 구분': 'role',
  '교사학생구분': 'role', '교사/학생구분': 'role',

  // ── grade ─────────────────────────────────────────────────────────────────
  '학년': 'grade', '학년반': 'grade', '학년/반': 'grade',

  // ── gender ────────────────────────────────────────────────────────────────
  '성별': 'gender', '남녀': 'gender',

  // ── phone ─────────────────────────────────────────────────────────────────
  '연락처': 'phone', '전화번호': 'phone', '휴대폰': 'phone', '휴대폰번호': 'phone',
  '본인연락처': 'phone', '본인 연락처': 'phone',
  '개인연락처': 'phone', '개인 연락처': 'phone',
  '핸드폰': 'phone', '핸드폰번호': 'phone',

  // ── parentPhone ───────────────────────────────────────────────────────────
  '보호자 연락처': 'parentPhone', '부모님 연락처': 'parentPhone',
  '보호자연락처': 'parentPhone', '보호자전화': 'parentPhone', '부모연락처': 'parentPhone',
  '부모님연락처': 'parentPhone', '부모전화번호': 'parentPhone',
  '보호자전화번호': 'parentPhone', '학부모연락처': 'parentPhone',

  // ── fee ───────────────────────────────────────────────────────────────────
  '참가비': 'fee', '입금': 'fee', '회비': 'fee', '납부': 'fee',
  '참가비상태': 'fee', '참가비 상태': 'fee',
  '참가비납부': 'fee', '참가비 납부': 'fee',
  '참가비납부여부': 'fee', '참가비 납부 여부': 'fee',   // ← 구글폼 대표 형식
  '입금여부': 'fee', '입금 여부': 'fee',
  '납부여부': 'fee', '납부 여부': 'fee',
  '회비납부': 'fee', '회비납부여부': 'fee',

  // ── group ─────────────────────────────────────────────────────────────────
  '조': 'groupId',

  // ── room ──────────────────────────────────────────────────────────────────
  '방': 'roomId',

  // ── bus ───────────────────────────────────────────────────────────────────
  '차량': 'busId', '버스': 'busId',

  // ── diet ──────────────────────────────────────────────────────────────────
  '식단': 'dietType',
  '식단/알레르기': 'dietType', '식단알레르기': 'dietType',
  '식단/알레르기여부': 'dietType', '식단/알레르기 여부': 'dietType',  // ← 구글폼 대표 형식
  '식단알레르기여부': 'dietType', '알레르기여부': 'dietType',
  '알레르기 여부': 'dietType',

  // ── allergies ─────────────────────────────────────────────────────────────
  '알레르기': 'allergies', '알레르기 상세': 'allergies',
  '알레르기상세': 'allergies', '알레르기내용': 'allergies',
  '알레르기 내용': 'allergies', '알레르기항목': 'allergies',

  // ── notes ─────────────────────────────────────────────────────────────────
  '특이사항': 'notes', '비고': 'notes', '메모': 'notes',
  '특이사항및요청': 'notes', '기타사항': 'notes', '기타': 'notes',

  // ── status ────────────────────────────────────────────────────────────────
  '등록상태': 'status', '등록 상태': 'status',
  '신청상태': 'status', '신청 상태': 'status',
};

// ── 구글폼 질문문 자동 인식: 키워드 기반 fallback ─────────────────────────────
// 우선순위: 더 구체적인 매칭이 위에 와야 함 (보호자 > 연락처, 알레르기 상세 > 알레르기/식단).
// 무시 헤더: 폼에 있지만 이 시스템이 쓰지 않는 항목 (타임스탬프, 보험·휴대폰 동의 등)
const IGNORE_TOKENS = [
  '타임스탬프', 'timestamp', '이메일', 'email',
  '여행자보험', '여행자 보험',
  '핸드폰관리', '핸드폰 관리', '휴대폰관리', '휴대폰 관리',
  '예비등록금관련안내', '예비등록금 관련 안내',
];

function inferField(rawHeader: string): string | '__ignore__' | undefined {
  const h    = rawHeader.trim();
  const norm = h.replace(/[\s.,!?[\]()/·:、]/g, '');
  if (!norm) return undefined;

  // 무시
  for (const tok of IGNORE_TOKENS) {
    if (norm.includes(tok.replace(/\s+/g, ''))) return '__ignore__';
  }

  // 구체 → 일반 순서
  if (norm.includes('보호자') || norm.includes('학부모') || norm.includes('부모')) return 'parentPhone';
  if (norm.includes('알레르기') && (norm.includes('상세') || norm.includes('내용') || norm.includes('항목'))) return 'allergies';
  if (norm.includes('식단') || norm.includes('알레르기')) return 'dietType';
  if (norm.includes('참가비') || norm.includes('회비') || norm.includes('납부') || norm.includes('등록금') || norm.includes('입금')) return 'fee';
  if (norm.includes('이름') || norm.includes('성명') || norm.includes('성함')) return 'name';
  if (norm.includes('교회')) return 'church';
  if (norm.includes('성별') || norm.includes('남녀')) return 'gender';
  if (norm.includes('학년')) return 'grade';
  if (norm.includes('구분') || norm.includes('역할')) return 'role';
  if (norm.includes('연락처') || norm.includes('전화') || norm.includes('휴대폰') || norm.includes('핸드폰')) return 'phone';
  if (norm.includes('특이사항') || norm.includes('비고') || norm.includes('메모') || norm.includes('기타')) return 'notes';
  if (norm.includes('등록상태') || norm.includes('신청상태') || norm.includes('승인')) return 'status';

  return undefined;
}

// ── 따옴표 CSV 한 줄 파싱 ──────────────────────────────────────────────────────
function parseLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }   // "" → escaped quote
        else inQuotes = false;
      } else {
        cur += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { result.push(cur.trim()); cur = ''; }
      else cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

// ── 값 변환 ───────────────────────────────────────────────────────────────────
function mapGender(v: string): 'M' | 'F' {
  const s = v.trim();
  if (['남', '남자', '남성', 'm', 'M', 'male', 'Male'].includes(s)) return 'M';
  if (['여', '여자', '여성', 'f', 'F', 'female', 'Female'].includes(s)) return 'F';
  return 'M';   // 인식 불가 시 기본값
}

function mapRole(v: string): NonNullable<Participant['role']> {
  const s = v.trim();
  if (['교사', '선생님', '교역자', '목사', '전도사', 'teacher'].includes(s)) return '교사';
  if (['학부모', '부모', '부모님', 'parent'].includes(s)) return '학부모';
  if (['찬양팀', '찬양', 'worship'].includes(s)) return '찬양팀';
  if (['자원봉사', '자원봉사자', '봉사자', '봉사', 'volunteer'].includes(s)) return '자원봉사';
  if (['진행위원', '진행팀', '진행', 'staff'].includes(s)) return '진행위원';
  if (['운영진', '스태프', '간사'].includes(s)) return '운영진';
  return '학생';
}

const STUDENT_GRADES = ['초등', '초등4', '초등5', '초등6', '중1', '중2', '중3', '고1', '고2', '고3', '청년', '대학청년', '장년'];

function mapGrade(roleStr: string, gradeStr: string): string {
  if (roleStr === '학생') {
    return STUDENT_GRADES.includes(gradeStr.trim()) ? gradeStr.trim() : '해당없음';
  }
  return roleStr;   // 교사·학부모·운영진은 role명을 grade로 저장
}

// 5단계 라벨 (가등록·1차·2차·미납·면제) + feeAmount 자동 산출
function mapFeeStage(v: string): Participant['feeStage'] | undefined {
  const s = v.trim();
  if (!s) return undefined;
  if (s.includes('가등록') || s.includes('예비등록') || (s.includes('2만') && s.includes('등록'))) return 'pre';
  if (s.includes('1차') || (s.includes('6만') && s.includes('등록'))) return 'first';
  if (s.includes('2차') || (s.includes('7만') && s.includes('등록'))) return 'second';
  if (s.includes('자원봉사') || s.includes('찬양팀') || s.includes('진행팀') || s.includes('진행위원') || s.includes('면제') || s.includes('exempt')) return 'exempt';
  if (s === '미납' || s.includes('아직') || s === 'unpaid' || s === '미입금') return 'unpaid';
  return undefined;
}

const FEE_STAGE_INFO: Record<NonNullable<Participant['feeStage']>, { fee: Participant['fee']; amount: number }> = {
  pre:    { fee: 'partial', amount: 20000 },
  first:  { fee: 'paid',    amount: 60000 },
  second: { fee: 'paid',    amount: 70000 },
  unpaid: { fee: 'unpaid',  amount: 0 },
  exempt: { fee: 'paid',    amount: 0 },
};

function mapFee(v: string): Participant['fee'] {
  const s = v.trim();
  const stage = mapFeeStage(s);
  if (stage) return FEE_STAGE_INFO[stage].fee;
  // 레거시 라벨 호환
  if (['완료', '완납', 'paid', 'O', 'o', '○', '완', 'Y', 'y', '예', '입금완료',
       '납부완료', '납부됨', '전액납부', '완전납부', '확인', '완납됨'].includes(s)) return 'paid';
  if (['부분', '부분납', 'partial', '일부납부', '부분완납'].includes(s)) return 'partial';
  return 'unpaid';
}

function mapStatus(v: string): Participant['status'] {
  const s = v.trim();
  if (['확인완료', '확정', 'confirmed', '확인', '승인'].includes(s)) return 'confirmed';
  if (['취소', 'cancelled', 'cancel'].includes(s)) return 'cancelled';
  return 'pending';
}

function mapDiet(v: string): Participant['dietType'] {
  const s = v.trim();
  if (['채식', 'vegetarian', '비건', 'vegan', '채식주의'].includes(s)) return 'vegetarian';
  if (['알레르기', 'allergy', '알러지', '알레르기있음', '알레르기 있음', '있음'].includes(s)) return 'allergy';
  return 'normal';
}

function mapGroup(v: string): string | undefined {
  const s = v.trim();
  if (!s || s === '미배정') return undefined;
  const m = s.match(/(\d+)/);
  if (m) {
    const n = parseInt(m[1]);
    if (n >= 1 && n <= 6) return `g0${n}`;
  }
  return undefined;
}

const ROOM_MAP: Record<string, string> = {
  '101': 'r01', '101호': 'r01',
  '102': 'r02', '102호': 'r02',
  '201': 'r05', '201호': 'r05',
  '202': 'r06', '202호': 'r06',
};

function mapRoom(v: string): string | undefined {
  const s = v.trim();
  if (!s || s === '미배정') return undefined;
  return ROOM_MAP[s] ?? undefined;
}

function mapBus(v: string): string | undefined {
  const s = v.trim();
  if (!s || s === '미배정') return undefined;
  return ['1호차', '2호차', '개별이동'].includes(s) ? s : (s || undefined);
}

// ── 공개 타입 ─────────────────────────────────────────────────────────────────
export interface ParsedRow {
  data: Participant;    // 에러 행도 부분 Participant로 채워짐
  isDuplicate: boolean;
  hasError: boolean;
  errorMsg?: string;
  rowIndex: number;
}

export interface CsvParseResult {
  rows: ParsedRow[];       // 정상 행 (중복 포함)
  errorRows: ParsedRow[];  // 필수 필드 누락 행
  totalLines: number;      // 헤더 제외 데이터 행 수
  headers: string[];       // 원본 헤더 그대로
  recognizedHeaders: string[];   // 매핑된 표준 필드명 (예: ['name','church',...])
  unrecognizedHeaders: string[]; // 매핑 실패한 원본 헤더
}

// churchNameMap: 교회명 → ID  (예: '가람교회' → 'c01')
export type ChurchNameMap = Record<string, string>;

// ── 메인 파서 ─────────────────────────────────────────────────────────────────
export function parseParticipantsCSV(
  csvText: string,
  existing: Participant[],
  churchNameMap: ChurchNameMap,
): CsvParseResult {
  // BOM 제거 + 줄 분리
  const cleaned = csvText.replace(/^\uFEFF/, '');
  const lines   = cleaned.split(/\r?\n/).filter(l => l.trim() !== '');

  if (lines.length < 2) {
    return {
      rows: [], errorRows: [], totalLines: 0,
      headers: lines[0] ? parseLine(lines[0]).map(h => h.trim()) : [],
      recognizedHeaders: [], unrecognizedHeaders: [],
    };
  }

  const headers = parseLine(lines[0]).map(h => h.trim());

  // 컬럼 인덱스 → 필드명 매핑 (정확 매칭 → 키워드 fallback → 무시)
  const fieldAt: Record<number, string> = {};
  const unrecognizedHeaders: string[] = [];
  headers.forEach((h, i) => {
    const exact = ALIASES[h] ?? ALIASES[h.replace(/\s+/g, '')];
    if (exact) { fieldAt[i] = exact; return; }
    const inferred = inferField(h);
    if (inferred === '__ignore__') return;          // 폼에는 있지만 시스템이 안 쓰는 항목
    if (inferred)                  { fieldAt[i] = inferred; return; }
    if (h)                         unrecognizedHeaders.push(h);
  });
  const recognizedHeaders = Array.from(new Set(Object.values(fieldAt)));

  const rows: ParsedRow[]      = [];
  const errorRows: ParsedRow[] = [];
  const today = new Date().toISOString().slice(0, 10);

  const makeBlank = (): Participant => ({
    id: '', name: '', church: '', grade: '해당없음', gender: 'M',
    phone: '', parentPhone: '', dietType: 'normal',
    registeredAt: today, status: 'pending', fee: 'unpaid', feeAmount: 0,
  });

  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);

    const raw: Record<string, string> = {};
    // 같은 field에 여러 컬럼이 매핑될 수 있음(구글폼 중복 질문). 첫 비어있지 않은 값을 채택.
    Object.entries(fieldAt).forEach(([idxStr, field]) => {
      const v = (vals[parseInt(idxStr)] ?? '').trim();
      if (v && !raw[field]) raw[field] = v;
    });

    // ── 필수 필드 검증 ─────────────────────────────────────────────────────
    if (!raw.name) {
      errorRows.push({ data: makeBlank(), hasError: true, isDuplicate: false, errorMsg: '이름 없음', rowIndex: i });
      continue;
    }
    if (!raw.church) {
      errorRows.push({
        data: { ...makeBlank(), name: raw.name },
        hasError: true, isDuplicate: false, errorMsg: '교회 없음', rowIndex: i,
      });
      continue;
    }

    // ── 값 변환 ───────────────────────────────────────────────────────────
    const role     = mapRole(raw.role ?? '');
    const grade    = mapGrade(role, raw.grade ?? '');
    const churchRaw = raw.church.trim();
    // 이름→ID 변환 시도, 없으면 raw 값 그대로 저장
    const church   = churchNameMap[churchRaw]
      ?? churchNameMap[churchRaw.toLowerCase()]
      ?? churchNameMap[normalizeChurchName(churchRaw)]
      ?? churchRaw;
    const phone    = raw.phone ?? '';

    const feeRaw   = raw.fee ?? '';
    const feeStage = mapFeeStage(feeRaw);
    const fee      = feeStage ? FEE_STAGE_INFO[feeStage].fee : mapFee(feeRaw);
    const feeAmount = feeStage
      ? FEE_STAGE_INFO[feeStage].amount
      : (fee === 'paid' ? 60000 : 0);

    const participant: Participant = {
      id: generateParticipantId(),
      name: raw.name,
      church,
      grade,
      gender: mapGender(raw.gender ?? ''),
      phone,
      parentPhone: raw.parentPhone ?? '',
      dietType: mapDiet(raw.dietType ?? ''),
      allergies: raw.allergies || undefined,
      registeredAt: today,
      status: mapStatus(raw.status ?? ''),
      fee,
      feeAmount,
      feeStage,
      groupId: mapGroup(raw.groupId ?? ''),
      roomId: mapRoom(raw.roomId ?? ''),
      busId: mapBus(raw.busId ?? ''),
      role,
      notes: raw.notes || undefined,
    };

    // ── 중복 판단: 이름 + church + 연락처 모두 일치 ─────────────────────
    const isDuplicate = existing.some(p =>
      p.name  === participant.name &&
      p.church === participant.church &&
      p.phone  === participant.phone
    );

    rows.push({ data: participant, isDuplicate, hasError: false, rowIndex: i });
  }

  return {
    rows, errorRows, totalLines: lines.length - 1,
    headers, recognizedHeaders, unrecognizedHeaders,
  };
}
