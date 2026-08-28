import type { Participant, Church, Group, Room, Schedule, ChecklistItem, Notice, SafetyItem } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  이 파일의 모든 데이터는 「가상 시연 데이터 (50명 규모 시연용)」입니다.
//
//   - 교회명·인명·전화번호는 실제와 무관한 가공 정보입니다.
//   - 첫 사용자가 빈 화면을 보지 않도록 채워둔 폴백·스크린샷용 데이터.
//   - 구성: 학생 25명 + 교사 8명 + 진행팀 17명(목사·전도사·강사·찬양팀·도우미·의료) = 총 50명
//   - 실제 운영 시작 시 EventSettings·「교회별 신청 현황」·참가자 페이지에서
//     모두 삭제하고 본인 행사 데이터로 교체하세요.
//   - 코드 레벨에서 즉시 비우려면 아래 churches/participants/groups/rooms
//     배열을 `[]` 로 설정하면 됩니다.
// ─────────────────────────────────────────────────────────────────────────────

export const RETREAT_INFO = {
  title: '○○○○ 수련회 (예시)',
  theme: '주제를 입력하세요',
  subTheme: '부제를 입력하세요',
  dates: '날짜 미설정',
  venue: '장소 미설정',
  venueAddress: '주소 미설정',
  totalQuota: 0,
  eveningSpeaker: { role: '저녁집회 강사', name: '강사명 미입력' },
  lectureSpeaker: { role: '특강 강사',     name: '강사명 미입력' },
  worshipTeam:    { role: '찬양과 경배',   name: '팀명 미입력' },
  inquiry: { name: '담당자 미입력', phone: '', role: '문의' },
};

// ─── 교회 데이터 (가상 — 실제 존재하지 않는 이름) ──────────────────────────────
// quota·applied·confirmed는 아래 participants(학생+교사)와 일치하도록 산출
export const churches: Church[] = [
  { id: 'c01', name: '가람교회',       district: '예시지방회', contact: '02-0000-0001', teacherName: '김지영 교사', teacherPhone: '010-0000-0001', quota: 8, appliedCount: 5,  confirmedCount: 5, feeStatus: 'paid' },
  { id: 'c02', name: '새벽이슬교회',   district: '예시지방회', contact: '02-0000-0002', teacherName: '이서준 교사', teacherPhone: '010-0000-0002', quota: 8, appliedCount: 5,  confirmedCount: 5, feeStatus: 'paid' },
  { id: 'c03', name: '푸른초장교회',   district: '예시지방회', contact: '02-0000-0003', teacherName: '박민수 교사', teacherPhone: '010-0000-0003', quota: 6, appliedCount: 4,  confirmedCount: 3, feeStatus: 'partial' },
  { id: 'c04', name: '빛소금교회',     district: '예시지방회', contact: '02-0000-0004', teacherName: '최예린 교사', teacherPhone: '010-0000-0004', quota: 6, appliedCount: 4,  confirmedCount: 4, feeStatus: 'paid' },
  { id: 'c05', name: '은혜의샘교회',   district: '예시지방회', contact: '02-0000-0005', teacherName: '정도윤 교사', teacherPhone: '010-0000-0005', quota: 6, appliedCount: 4,  confirmedCount: 4, feeStatus: 'paid' },
  { id: 'c06', name: '작은꽃밭교회',   district: '예시지방회', contact: '02-0000-0006', teacherName: '한지민 교사', teacherPhone: '010-0000-0006', quota: 6, appliedCount: 4,  confirmedCount: 3, feeStatus: 'partial' },
  { id: 'c07', name: '한알밀교회',     district: '예시지방회', contact: '02-0000-0007', teacherName: '오태양 교사', teacherPhone: '010-0000-0007', quota: 6, appliedCount: 4,  confirmedCount: 3, feeStatus: 'unpaid' },
  { id: 'c08', name: '별빛교회',       district: '예시지방회', contact: '02-0000-0008', teacherName: '윤채원 교사', teacherPhone: '010-0000-0008', quota: 4, appliedCount: 3,  confirmedCount: 3, feeStatus: 'paid' },
  { id: 'c09', name: '새노래교회',     district: '예시지방회', contact: '02-0000-0009', teacherName: '임도현 교사', teacherPhone: '010-0000-0009', quota: 4, appliedCount: 0,  confirmedCount: 0, feeStatus: 'unpaid' },
  { id: 'c10', name: '참포도교회',     district: '예시지방회', contact: '02-0000-0010', teacherName: '백서연 교사', teacherPhone: '010-0000-0010', quota: 4, appliedCount: 0,  confirmedCount: 0, feeStatus: 'unpaid' },
];

// ─── 참가자 데이터 (총 50명: 학생 25 + 교사 8 + 진행팀 17) ──────────────────────
// 진행팀(목사·전도사·강사·찬양팀·도우미·의료)은 호스트 교회(c01 가람) 소속으로 표시
export const participants: Participant[] = [
  // ── 학생 25명 ─────────────────────────────────────────────────────────────
  // 가람교회 (c01) — 4명
  { id: 's001', name: '김민준', church: 'c01', grade: '고2', gender: 'M', phone: '010-1000-0001', parentPhone: '010-2000-0001', groupId: 'g01', roomId: 'r01', dietType: 'normal', registeredAt: '2026-06-01', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '학생' },
  { id: 's002', name: '이서연', church: 'c01', grade: '고1', gender: 'F', phone: '010-1000-0002', parentPhone: '010-2000-0002', groupId: 'g02', roomId: 'r08', dietType: 'normal', registeredAt: '2026-06-01', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '학생' },
  { id: 's003', name: '박지훈', church: 'c01', grade: '중3', gender: 'M', phone: '010-1000-0003', parentPhone: '010-2000-0003', groupId: 'g01', roomId: 'r01', dietType: 'allergy', allergies: '견과류', registeredAt: '2026-06-02', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '학생' },
  { id: 's004', name: '강수아', church: 'c01', grade: '중2', gender: 'F', phone: '010-1000-0004', parentPhone: '010-2000-0004', groupId: 'g02', roomId: 'r08', dietType: 'normal', registeredAt: '2026-06-02', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '학생' },
  // 새벽이슬교회 (c02) — 4명
  { id: 's005', name: '최수아', church: 'c02', grade: '고2', gender: 'F', phone: '010-1000-0005', parentPhone: '010-2000-0005', groupId: 'g03', roomId: 'r09', dietType: 'normal', registeredAt: '2026-06-03', status: 'confirmed', fee: 'paid', feeAmount: 70000, feeStage: 'second', role: '학생' },
  { id: 's006', name: '정도현', church: 'c02', grade: '고3', gender: 'M', phone: '010-1000-0006', parentPhone: '010-2000-0006', groupId: 'g04', roomId: 'r02', dietType: 'vegetarian', registeredAt: '2026-06-03', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '학생' },
  { id: 's007', name: '김하준', church: 'c02', grade: '중1', gender: 'M', phone: '010-1000-0007', parentPhone: '010-2000-0007', groupId: 'g05', roomId: 'r02', dietType: 'normal', registeredAt: '2026-06-04', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '학생' },
  { id: 's008', name: '이채원', church: 'c02', grade: '중3', gender: 'F', phone: '010-1000-0008', parentPhone: '010-2000-0008', groupId: 'g06', roomId: 'r09', dietType: 'normal', registeredAt: '2026-06-04', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '학생' },
  // 푸른초장교회 (c03) — 3명
  { id: 's009', name: '한지민', church: 'c03', grade: '중2', gender: 'F', phone: '010-1000-0009', parentPhone: '010-2000-0009', groupId: 'g01', roomId: 'r10', dietType: 'normal', registeredAt: '2026-06-05', status: 'confirmed', fee: 'partial', feeAmount: 30000, feeStage: 'pre', role: '학생' },
  { id: 's010', name: '오준서', church: 'c03', grade: '중1', gender: 'M', phone: '010-1000-0010', parentPhone: '010-2000-0010', groupId: 'g02', roomId: 'r03', dietType: 'normal', registeredAt: '2026-06-05', status: 'pending', fee: 'unpaid', feeAmount: 0, feeStage: 'unpaid', role: '학생' },
  { id: 's011', name: '박서영', church: 'c03', grade: '고1', gender: 'F', phone: '010-1000-0011', parentPhone: '010-2000-0011', groupId: 'g03', roomId: 'r10', dietType: 'normal', registeredAt: '2026-06-06', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '학생' },
  // 빛소금교회 (c04) — 3명
  { id: 's012', name: '윤하은', church: 'c04', grade: '고1', gender: 'F', phone: '010-1000-0012', parentPhone: '010-2000-0012', groupId: 'g04', roomId: 'r11', dietType: 'allergy', allergies: '유제품', registeredAt: '2026-06-07', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '학생' },
  { id: 's013', name: '임현우', church: 'c04', grade: '고2', gender: 'M', phone: '010-1000-0013', parentPhone: '010-2000-0013', groupId: 'g05', roomId: 'r04', dietType: 'normal', registeredAt: '2026-06-07', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '학생' },
  { id: 's014', name: '조민서', church: 'c04', grade: '중3', gender: 'F', phone: '010-1000-0014', parentPhone: '010-2000-0014', groupId: 'g06', roomId: 'r11', dietType: 'normal', registeredAt: '2026-06-08', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '학생' },
  // 은혜의샘교회 (c05) — 3명
  { id: 's015', name: '백채원', church: 'c05', grade: '중3', gender: 'F', phone: '010-1000-0015', parentPhone: '010-2000-0015', groupId: 'g01', roomId: 'r12', dietType: 'normal', registeredAt: '2026-06-08', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '학생' },
  { id: 's016', name: '강태양', church: 'c05', grade: '고3', gender: 'M', phone: '010-1000-0016', parentPhone: '010-2000-0016', groupId: 'g02', roomId: 'r05', dietType: 'normal', registeredAt: '2026-06-08', status: 'confirmed', fee: 'paid', feeAmount: 70000, feeStage: 'second', role: '학생' },
  { id: 's017', name: '서윤호', church: 'c05', grade: '고2', gender: 'M', phone: '010-1000-0017', parentPhone: '010-2000-0017', groupId: 'g03', roomId: 'r05', dietType: 'normal', registeredAt: '2026-06-09', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '학생' },
  // 작은꽃밭교회 (c06) — 3명
  { id: 's018', name: '장서윤', church: 'c06', grade: '고1', gender: 'F', phone: '010-1000-0018', parentPhone: '010-2000-0018', groupId: 'g04', roomId: 'r12', dietType: 'normal', registeredAt: '2026-06-09', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '학생' },
  { id: 's019', name: '노민재', church: 'c06', grade: '중2', gender: 'M', phone: '010-1000-0019', parentPhone: '010-2000-0019', groupId: 'g05', roomId: 'r06', dietType: 'allergy', allergies: '밀가루', registeredAt: '2026-06-09', status: 'pending', fee: 'unpaid', feeAmount: 0, feeStage: 'unpaid', role: '학생' },
  { id: 's020', name: '문지윤', church: 'c06', grade: '중1', gender: 'F', phone: '010-1000-0020', parentPhone: '010-2000-0020', groupId: 'g06', roomId: 'r13', dietType: 'normal', registeredAt: '2026-06-10', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '학생' },
  // 한알밀교회 (c07) — 3명
  { id: 's021', name: '신유나', church: 'c07', grade: '고2', gender: 'F', phone: '010-1000-0021', parentPhone: '010-2000-0021', groupId: 'g01', roomId: 'r13', dietType: 'normal', registeredAt: '2026-06-10', status: 'confirmed', fee: 'partial', feeAmount: 30000, feeStage: 'pre', role: '학생' },
  { id: 's022', name: '안재현', church: 'c07', grade: '중3', gender: 'M', phone: '010-1000-0022', parentPhone: '010-2000-0022', groupId: 'g02', roomId: 'r06', dietType: 'normal', registeredAt: '2026-06-11', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '학생' },
  { id: 's023', name: '권나연', church: 'c07', grade: '고1', gender: 'F', phone: '010-1000-0023', parentPhone: '010-2000-0023', groupId: 'g03', roomId: 'r08', dietType: 'normal', registeredAt: '2026-06-11', status: 'pending', fee: 'unpaid', feeAmount: 0, feeStage: 'unpaid', role: '학생' },
  // 별빛교회 (c08) — 2명
  { id: 's024', name: '류준혁', church: 'c08', grade: '중1', gender: 'M', phone: '010-1000-0024', parentPhone: '010-2000-0024', groupId: 'g04', roomId: 'r07', dietType: 'normal', registeredAt: '2026-06-12', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '학생' },
  { id: 's025', name: '황소민', church: 'c08', grade: '고3', gender: 'F', phone: '010-1000-0025', parentPhone: '010-2000-0025', groupId: 'g05', roomId: 'r09', dietType: 'normal', registeredAt: '2026-06-12', status: 'confirmed', fee: 'paid', feeAmount: 70000, feeStage: 'second', role: '학생' },

  // ── 교사 8명 (각 교회 1명, 진행위원 역할) ────────────────────────────────
  { id: 't101', name: '김지영 교사', church: 'c01', grade: '교사', gender: 'F', phone: '010-0000-0001', parentPhone: '010-0000-0001', groupId: 'g01', roomId: 'r14', dietType: 'normal', registeredAt: '2026-05-25', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '교사' },
  { id: 't102', name: '이서준 교사', church: 'c02', grade: '교사', gender: 'M', phone: '010-0000-0002', parentPhone: '010-0000-0002', groupId: 'g02', roomId: 'r15', dietType: 'normal', registeredAt: '2026-05-25', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '교사' },
  { id: 't103', name: '박민수 교사', church: 'c03', grade: '교사', gender: 'M', phone: '010-0000-0003', parentPhone: '010-0000-0003', groupId: 'g03', roomId: 'r15', dietType: 'normal', registeredAt: '2026-05-26', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '교사' },
  { id: 't104', name: '최예린 교사', church: 'c04', grade: '교사', gender: 'F', phone: '010-0000-0004', parentPhone: '010-0000-0004', groupId: 'g04', roomId: 'r14', dietType: 'normal', registeredAt: '2026-05-26', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '교사' },
  { id: 't105', name: '정도윤 교사', church: 'c05', grade: '교사', gender: 'M', phone: '010-0000-0005', parentPhone: '010-0000-0005', groupId: 'g05', roomId: 'r15', dietType: 'normal', registeredAt: '2026-05-27', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '교사' },
  { id: 't106', name: '한지민 교사', church: 'c06', grade: '교사', gender: 'F', phone: '010-0000-0006', parentPhone: '010-0000-0006', groupId: 'g06', roomId: 'r14', dietType: 'normal', registeredAt: '2026-05-27', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '교사' },
  { id: 't107', name: '오태양 교사', church: 'c07', grade: '교사', gender: 'M', phone: '010-0000-0007', parentPhone: '010-0000-0007', groupId: 'g05', roomId: 'r15', dietType: 'normal', registeredAt: '2026-05-28', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '교사' },
  { id: 't108', name: '윤채원 교사', church: 'c08', grade: '교사', gender: 'F', phone: '010-0000-0008', parentPhone: '010-0000-0008', groupId: 'g06', roomId: 'r14', dietType: 'normal', registeredAt: '2026-05-28', status: 'confirmed', fee: 'paid', feeAmount: 60000, feeStage: 'first', role: '교사' },

  // ── 진행팀 17명 (호스트 c01 가람 소속으로 표시, 참가비 면제) ──────────────
  // 목사 2명
  { id: 'm001', name: '박정훈 목사', church: 'c01', grade: '목사',   gender: 'M', phone: '010-9000-0001', parentPhone: '010-9000-0001', roomId: 'r16', dietType: 'normal', registeredAt: '2026-05-15', status: 'confirmed', fee: 'paid', feeAmount: 0, feeStage: 'exempt', role: '진행위원', notes: '담임 / 지방회장' },
  { id: 'm002', name: '김성호 목사', church: 'c01', grade: '목사',   gender: 'M', phone: '010-9000-0002', parentPhone: '010-9000-0002', roomId: 'r16', dietType: 'normal', registeredAt: '2026-05-15', status: 'confirmed', fee: 'paid', feeAmount: 0, feeStage: 'exempt', role: '진행위원', notes: '부목사' },
  // 전도사 3명
  { id: 'e001', name: '이지원 전도사', church: 'c01', grade: '전도사', gender: 'F', phone: '010-9000-0003', parentPhone: '010-9000-0003', roomId: 'r17', dietType: 'normal', registeredAt: '2026-05-18', status: 'confirmed', fee: 'paid', feeAmount: 0, feeStage: 'exempt', role: '진행위원', notes: '교육 전도사' },
  { id: 'e002', name: '송민서 전도사', church: 'c01', grade: '전도사', gender: 'F', phone: '010-9000-0004', parentPhone: '010-9000-0004', roomId: 'r17', dietType: 'normal', registeredAt: '2026-05-18', status: 'confirmed', fee: 'paid', feeAmount: 0, feeStage: 'exempt', role: '진행위원', notes: '청소년 전도사' },
  { id: 'e003', name: '정유진 전도사', church: 'c01', grade: '전도사', gender: 'M', phone: '010-9000-0005', parentPhone: '010-9000-0005', roomId: 'r16', dietType: 'normal', registeredAt: '2026-05-18', status: 'confirmed', fee: 'paid', feeAmount: 0, feeStage: 'exempt', role: '진행위원', notes: '청년 전도사' },
  // 강사 2명 (외부)
  { id: 'l001', name: '최진영 강사', church: 'c01', grade: '강사',   gender: 'M', phone: '010-9000-0006', parentPhone: '010-9000-0006', roomId: 'r16', dietType: 'normal', registeredAt: '2026-05-20', status: 'confirmed', fee: 'paid', feeAmount: 0, feeStage: 'exempt', role: '운영진', notes: '저녁집회 강사 (외부)' },
  { id: 'l002', name: '한세영 강사', church: 'c01', grade: '강사',   gender: 'F', phone: '010-9000-0007', parentPhone: '010-9000-0007', roomId: 'r17', dietType: 'normal', registeredAt: '2026-05-20', status: 'confirmed', fee: 'paid', feeAmount: 0, feeStage: 'exempt', role: '운영진', notes: '특강 강사 (외부)' },
  // 찬양팀 5명
  { id: 'w001', name: '강민호 (찬양 인도)', church: 'c01', grade: '찬양팀', gender: 'M', phone: '010-9000-0008', parentPhone: '010-9000-0008', roomId: 'r15', dietType: 'normal', registeredAt: '2026-05-22', status: 'confirmed', fee: 'paid', feeAmount: 0, feeStage: 'exempt', role: '찬양팀' },
  { id: 'w002', name: '임수빈 (보컬)',     church: 'c01', grade: '찬양팀', gender: 'F', phone: '010-9000-0009', parentPhone: '010-9000-0009', roomId: 'r14', dietType: 'normal', registeredAt: '2026-05-22', status: 'confirmed', fee: 'paid', feeAmount: 0, feeStage: 'exempt', role: '찬양팀' },
  { id: 'w003', name: '윤지원 (건반)',     church: 'c01', grade: '찬양팀', gender: 'F', phone: '010-9000-0010', parentPhone: '010-9000-0010', roomId: 'r14', dietType: 'normal', registeredAt: '2026-05-22', status: 'confirmed', fee: 'paid', feeAmount: 0, feeStage: 'exempt', role: '찬양팀' },
  { id: 'w004', name: '노태우 (드럼)',     church: 'c01', grade: '찬양팀', gender: 'M', phone: '010-9000-0011', parentPhone: '010-9000-0011', roomId: 'r15', dietType: 'normal', registeredAt: '2026-05-22', status: 'confirmed', fee: 'paid', feeAmount: 0, feeStage: 'exempt', role: '찬양팀' },
  { id: 'w005', name: '백설아 (기타)',     church: 'c01', grade: '찬양팀', gender: 'F', phone: '010-9000-0012', parentPhone: '010-9000-0012', roomId: 'r14', dietType: 'normal', registeredAt: '2026-05-22', status: 'confirmed', fee: 'paid', feeAmount: 0, feeStage: 'exempt', role: '찬양팀' },
  // 도우미(자원봉사) 4명 — 조에 배정되어 학생들과 함께 활동
  { id: 'v001', name: '서지훈 도우미', church: 'c01', grade: '도우미', gender: 'M', phone: '010-9000-0013', parentPhone: '010-9000-0013', groupId: 'g01', roomId: 'r15', dietType: 'normal', registeredAt: '2026-05-24', status: 'confirmed', fee: 'paid', feeAmount: 0, feeStage: 'exempt', role: '자원봉사' },
  { id: 'v002', name: '박하늘 도우미', church: 'c01', grade: '도우미', gender: 'F', phone: '010-9000-0014', parentPhone: '010-9000-0014', groupId: 'g02', roomId: 'r14', dietType: 'normal', registeredAt: '2026-05-24', status: 'confirmed', fee: 'paid', feeAmount: 0, feeStage: 'exempt', role: '자원봉사' },
  { id: 'v003', name: '김도윤 도우미', church: 'c01', grade: '도우미', gender: 'M', phone: '010-9000-0015', parentPhone: '010-9000-0015', groupId: 'g03', roomId: 'r15', dietType: 'normal', registeredAt: '2026-05-24', status: 'confirmed', fee: 'paid', feeAmount: 0, feeStage: 'exempt', role: '자원봉사' },
  { id: 'v004', name: '이서아 도우미', church: 'c01', grade: '도우미', gender: 'F', phone: '010-9000-0016', parentPhone: '010-9000-0016', groupId: 'g04', roomId: 'r14', dietType: 'normal', registeredAt: '2026-05-24', status: 'confirmed', fee: 'paid', feeAmount: 0, feeStage: 'exempt', role: '자원봉사' },
  // 의료지원 1명
  { id: 'med001', name: '박미경 간호사', church: 'c01', grade: '의료', gender: 'F', phone: '010-9000-0017', parentPhone: '010-9000-0017', roomId: 'r14', dietType: 'normal', registeredAt: '2026-05-26', status: 'confirmed', fee: 'paid', feeAmount: 0, feeStage: 'exempt', role: '운영진', notes: '응급처치·약품 관리' },
];

// ─── 조 편성 (6조, 각 조 학생 4명 + 교사 1명 + 도우미 0~1명) ───────────────────
export const groups: Group[] = [
  { id: 'g01', name: '1조 빛의 자녀',     color: '#3B82F6', leaderName: '김지영 교사', members: ['s001', 's003', 's009', 's015', 's021', 't101', 'v001'] },
  { id: 'g02', name: '2조 진리의 길',     color: '#3b82f6', leaderName: '이서준 교사', members: ['s002', 's004', 's010', 's016', 's022', 't102', 'v002'] },
  { id: 'g03', name: '3조 생명의 말씀',   color: '#8b5cf6', leaderName: '박민수 교사', members: ['s005', 's011', 's017', 's023',         't103', 'v003'] },
  { id: 'g04', name: '4조 소망의 별',     color: '#10b981', leaderName: '최예린 교사', members: ['s006', 's012', 's018', 's024',         't104', 'v004'] },
  { id: 'g05', name: '5조 하나님의 사랑', color: '#f59e0b', leaderName: '정도윤 교사', members: ['s007', 's013', 's019', 's025',         't105', 't107'] },
  { id: 'g06', name: '6조 평화의 강',     color: '#ef4444', leaderName: '한지민 교사', members: ['s008', 's014', 's020',                  't106', 't108'] },
];

// ─── 숙소 배정 (남학생 7방 + 여학생 6방 + 진행팀 4방 = 17방, 50명 수용) ─────────
export const rooms: Room[] = [
  // 남학생 — A동 1~2층, 방당 4명
  { id: 'r01', name: '101호', building: 'A동', floor: 1, capacity: 4, type: 'male', assignedIds: ['s001', 's003'] },
  { id: 'r02', name: '102호', building: 'A동', floor: 1, capacity: 4, type: 'male', assignedIds: ['s006', 's007'] },
  { id: 'r03', name: '103호', building: 'A동', floor: 1, capacity: 4, type: 'male', assignedIds: ['s010'] },
  { id: 'r04', name: '104호', building: 'A동', floor: 1, capacity: 4, type: 'male', assignedIds: ['s013'] },
  { id: 'r05', name: '201호', building: 'A동', floor: 2, capacity: 4, type: 'male', assignedIds: ['s016', 's017'] },
  { id: 'r06', name: '202호', building: 'A동', floor: 2, capacity: 4, type: 'male', assignedIds: ['s019', 's022'] },
  { id: 'r07', name: '203호', building: 'A동', floor: 2, capacity: 4, type: 'male', assignedIds: ['s024'] },
  // 여학생 — B동 1~2층, 방당 4명
  { id: 'r08', name: '301호', building: 'B동', floor: 1, capacity: 4, type: 'female', assignedIds: ['s002', 's004', 's023'] },
  { id: 'r09', name: '302호', building: 'B동', floor: 1, capacity: 4, type: 'female', assignedIds: ['s005', 's008', 's025'] },
  { id: 'r10', name: '303호', building: 'B동', floor: 1, capacity: 4, type: 'female', assignedIds: ['s009', 's011'] },
  { id: 'r11', name: '304호', building: 'B동', floor: 1, capacity: 4, type: 'female', assignedIds: ['s012', 's014'] },
  { id: 'r12', name: '401호', building: 'B동', floor: 2, capacity: 4, type: 'female', assignedIds: ['s015', 's018'] },
  { id: 'r13', name: '402호', building: 'B동', floor: 2, capacity: 4, type: 'female', assignedIds: ['s020', 's021'] },
  // 진행팀 — C동 (교사·도우미·찬양팀·의료)
  { id: 'r14', name: '501호 (여자 진행팀)', building: 'C동', floor: 1, capacity: 8, type: 'staff', assignedIds: ['t101', 't104', 't106', 't108', 'w002', 'w003', 'w005', 'v002', 'v004', 'med001'] },
  { id: 'r15', name: '502호 (남자 진행팀)', building: 'C동', floor: 1, capacity: 8, type: 'staff', assignedIds: ['t102', 't103', 't105', 't107', 'w001', 'w004', 'v001', 'v003'] },
  { id: 'r16', name: '601호 (목사·강사)', building: 'C동', floor: 2, capacity: 4, type: 'staff', assignedIds: ['m001', 'm002', 'e003', 'l001'] },
  { id: 'r17', name: '602호 (전도사)',   building: 'C동', floor: 2, capacity: 4, type: 'staff', assignedIds: ['e001', 'e002', 'l002'] },
];

// ─── 일정 ─────────────────────────────────────────────────────────────────────
export const schedules: Schedule[] = [
  // 1일차
  { id: 's101', day: 1, time: '14:00', title: '참가자 등록 및 방 배정', location: '수련원 로비', category: 'move', notes: '각 교회별 인솔 교사 확인' },
  { id: 's102', day: 1, time: '16:00', title: '개회 예배', location: '대예배실', category: 'worship', speaker: '박정훈 목사 (담임)' },
  { id: 's103', day: 1, time: '18:00', title: '저녁 식사', location: '식당', category: 'meal' },
  { id: 's104', day: 1, time: '19:30', title: '아이스브레이킹 & 조 모임', location: '강당', category: 'program', notes: '6개 조별 게임 진행' },
  { id: 's105', day: 1, time: '21:00', title: '저녁집회 (찬양 + 말씀)', location: '대예배실', category: 'worship', speaker: '최진영 강사' },
  { id: 's106', day: 1, time: '22:30', title: '취침 준비', location: '각 숙소', category: 'sleep' },
  { id: 's107', day: 1, time: '23:00', title: '소등 & 취침', location: '각 숙소', category: 'sleep' },
  // 2일차
  { id: 's201', day: 2, time: '07:00', title: '기상 & 새벽 기도', location: '대예배실', category: 'worship', speaker: '이지원 전도사' },
  { id: 's202', day: 2, time: '08:00', title: '아침 식사', location: '식당', category: 'meal' },
  { id: 's203', day: 2, time: '09:30', title: '특강 1 — 정체성과 부르심', location: '대예배실', category: 'worship', speaker: '한세영 강사' },
  { id: 's204', day: 2, time: '11:00', title: '조별 토론 & 나눔', location: '소그룹실', category: 'program' },
  { id: 's205', day: 2, time: '12:00', title: '점심 식사', location: '식당', category: 'meal' },
  { id: 's206', day: 2, time: '13:30', title: '야외 활동 (조별 스포츠 대회)', location: '운동장', category: 'program' },
  { id: 's207', day: 2, time: '15:30', title: '자유 시간', location: '시설 내', category: 'free' },
  { id: 's208', day: 2, time: '17:30', title: '조별 발표 준비', location: '소그룹실', category: 'program' },
  { id: 's209', day: 2, time: '18:30', title: '저녁 식사', location: '식당', category: 'meal' },
  { id: 's210', day: 2, time: '20:00', title: '저녁집회 (찬양 + 말씀)', location: '대예배실', category: 'worship', speaker: '최진영 강사' },
  { id: 's211', day: 2, time: '21:30', title: '기도회 & 헌신 예배', location: '대예배실', category: 'worship', speaker: '송민서 전도사' },
  { id: 's212', day: 2, time: '23:00', title: '소등 & 취침', location: '각 숙소', category: 'sleep' },
  // 3일차
  { id: 's301', day: 3, time: '07:00', title: '기상 & 아침 기도', location: '대예배실', category: 'worship', speaker: '정유진 전도사' },
  { id: 's302', day: 3, time: '08:00', title: '아침 식사', location: '식당', category: 'meal' },
  { id: 's303', day: 3, time: '09:30', title: '조별 발표 & 나눔', location: '대예배실', category: 'program' },
  { id: 's304', day: 3, time: '11:00', title: '폐회 예배', location: '대예배실', speaker: '박정훈 목사 (담임)', category: 'worship', notes: '수료증 수여' },
  { id: 's305', day: 3, time: '12:30', title: '점심 식사', location: '식당', category: 'meal' },
  { id: 's306', day: 3, time: '14:00', title: '퇴소 & 귀가', location: '수련원 로비', category: 'move', notes: '교회별 차량 탑승' },
];

// ─── 체크리스트 ────────────────────────────────────────────────────────────────
export const checklistItems: ChecklistItem[] = [
  // 행정
  { id: 'ck01', category: '행정', title: '참가비 수납 현황 최종 확인 (50명 기준)', assignee: '총무 김지영', dueDate: '2026-07-20', status: 'inprogress', priority: 'high' },
  { id: 'ck02', category: '행정', title: '수련원 계약 및 입금 완료', assignee: '총무 김지영', dueDate: '2026-07-15', status: 'done', priority: 'high' },
  { id: 'ck03', category: '행정', title: '차량 렌트 예약 확정 (25인승 2대)', assignee: '총무 김지영', dueDate: '2026-07-20', status: 'done', priority: 'medium' },
  { id: 'ck04', category: '행정', title: '교회별 참가자 명단 최종 제출', assignee: '각 교회 교사', dueDate: '2026-07-20', status: 'inprogress', priority: 'high' },
  // 예배/강의
  { id: 'ck05', category: '예배', title: '강사 섭외 및 일정 확정 (최진영·한세영 강사)', assignee: '예배팀장 이서준', dueDate: '2026-07-01', status: 'done', priority: 'high' },
  { id: 'ck06', category: '예배', title: '찬양팀 5명 합주 일정 확정', assignee: '찬양팀장 강민호', dueDate: '2026-07-24', status: 'inprogress', priority: 'high' },
  { id: 'ck07', category: '예배', title: '빔프로젝터 및 음향 점검', assignee: '기술팀 박민수', dueDate: '2026-07-25', status: 'pending', priority: 'medium' },
  // 식사
  { id: 'ck08', category: '식사', title: '알러지 식단 별도 준비 확인 (3명)', assignee: '식사팀장 최예린', dueDate: '2026-07-24', status: 'inprogress', priority: 'high' },
  { id: 'ck09', category: '식사', title: '채식 식단 준비 확인 (1명)', assignee: '식사팀장 최예린', dueDate: '2026-07-24', status: 'pending', priority: 'medium' },
  // 안전
  { id: 'ck10', category: '안전', title: '응급처치 키트 준비 (박미경 간호사 담당)', assignee: '의료 박미경', dueDate: '2026-07-25', status: 'done', priority: 'high' },
  { id: 'ck11', category: '안전', title: '참가자 건강 설문지 수거 (50명)', assignee: '안전팀장 한지민', dueDate: '2026-07-22', status: 'inprogress', priority: 'high' },
  { id: 'ck12', category: '안전', title: '비상 연락망 배포', assignee: '안전팀장 한지민', dueDate: '2026-07-25', status: 'pending', priority: 'medium' },
  // 물품
  { id: 'ck13', category: '물품', title: '수련회 티셔츠 제작 완료 (50벌)', assignee: '홍보팀 오태양', dueDate: '2026-07-23', status: 'done', priority: 'medium' },
  { id: 'ck14', category: '물품', title: '조별 활동 준비물 구매 (6조분)', assignee: '프로그램팀 윤채원', dueDate: '2026-07-24', status: 'inprogress', priority: 'medium' },
  { id: 'ck15', category: '물품', title: '수료증 제작 (50명)', assignee: '총무 김지영', dueDate: '2026-07-25', status: 'pending', priority: 'low' },
  { id: 'ck16', category: '물품', title: '현수막 제작 및 설치 확인', assignee: '홍보팀 오태양', dueDate: '2026-07-25', status: 'blocked', priority: 'medium', notes: '업체 확인 필요' },
];

// ─── 공지사항 ──────────────────────────────────────────────────────────────────
export const notices: Notice[] = [
  {
    id: 'n01',
    title: '[필독] 최종 참가자 명단 제출 안내 (8개 교회 33명 + 진행팀 17명)',
    content: '각 교회 담당 교사는 7월 20일(월)까지 최종 참가자 명단을 제출해 주시기 바랍니다. 명단에는 이름·학년·성별·연락처·알레르기 정보가 포함되어야 합니다.',
    author: '총무 김지영',
    createdAt: '2026-07-10',
    pinned: true,
    target: 'church',
  },
  {
    id: 'n02',
    title: '[필독] 수련회 준비 전체 회의 일정',
    content: '7월 19일(주일) 오후 3시, 가람교회 소회의실에서 전체 준비위원 회의가 있습니다. 담당 파트 준비 현황을 보고해 주세요.',
    author: '담임 박정훈 목사',
    createdAt: '2026-07-08',
    pinned: true,
    target: 'staff',
  },
  {
    id: 'n03',
    title: '수련회 주제가 악보 배포',
    content: '이번 수련회 주제가 악보를 공유합니다. 각 교회에서 미리 연습해 오시면 좋겠습니다.',
    author: '찬양팀장 강민호',
    createdAt: '2026-07-05',
    pinned: false,
    target: 'all',
  },
  {
    id: 'n04',
    title: '참가비 납부 안내 및 계좌 정보 (예시)',
    content: '학생/교사 6만원(1차)·7만원(2차), 진행팀(목사·전도사·강사·찬양팀·도우미·의료) 면제. EventSettings에서 금액·계좌 정보를 수정하세요.',
    author: '총무 김지영',
    createdAt: '2026-06-20',
    pinned: false,
    target: 'all',
  },
  {
    id: 'n05',
    title: '수련회 티셔츠 사이즈 조사 완료 (50명)',
    content: '티셔츠 사이즈 조사가 완료되었습니다. 제작 업체에 발주했으며 7월 23일 수령 예정입니다.',
    author: '홍보팀 오태양',
    createdAt: '2026-07-12',
    pinned: false,
    target: 'staff',
  },
];

// ─── 안전 관리 ─────────────────────────────────────────────────────────────────
export const safetyItems: SafetyItem[] = [
  { id: 'sf01', category: '응급 대응', description: '응급처치 키트 비치 (박미경 간호사 담당)', responsible: '박미경 간호사', status: 'normal', lastChecked: '2026-07-25' },
  { id: 'sf02', category: '응급 대응', description: '근처 병원 및 119 연락처 공유', responsible: '안전팀', status: 'normal', lastChecked: '2026-07-25' },
  { id: 'sf03', category: '참가자 건강', description: '건강 설문지 수거 및 이상자 파악', responsible: '각 교회 교사', status: 'caution', lastChecked: '2026-07-22' },
  { id: 'sf04', category: '참가자 건강', description: '알레르기 보유자 식단 별도 관리 (3명)', responsible: '식사팀', status: 'normal', lastChecked: '2026-07-24' },
  { id: 'sf05', category: '시설 안전', description: '수련원 시설 안전 점검 완료', responsible: '수련원 담당자', status: 'normal', lastChecked: '2026-07-23' },
  { id: 'sf06', category: '시설 안전', description: '소화기 위치 및 비상구 확인', responsible: '안전팀', status: 'normal', lastChecked: '2026-07-25' },
  { id: 'sf07', category: '이동 안전', description: '차량 기사 연락처 및 경로 확인', responsible: '총무팀', status: 'normal', lastChecked: '2026-07-24' },
  { id: 'sf08', category: '야간 안전', description: '야간 순찰 담당자 배정 (남자 교사·도우미)', responsible: '남자 진행팀 전원', status: 'caution', lastChecked: '2026-07-22' },
];

// ─── 통계 요약 ─────────────────────────────────────────────────────────────────
export const stats = {
  totalParticipants: participants.length,
  confirmed: participants.filter(p => p.status === 'confirmed').length,
  pending: participants.filter(p => p.status === 'pending').length,
  male: participants.filter(p => p.gender === 'M').length,
  female: participants.filter(p => p.gender === 'F').length,
  teachers: participants.filter(p => p.grade === '교사').length,
  students: participants.filter(p => ['중1','중2','중3','고1','고2','고3'].includes(p.grade)).length,
  paidFull: participants.filter(p => p.fee === 'paid').length,
  paidPartial: participants.filter(p => p.fee === 'partial').length,
  unpaid: participants.filter(p => p.fee === 'unpaid').length,
  totalRevenue: participants.reduce((sum, p) => sum + p.feeAmount, 0),
  allergies: participants.filter(p => p.dietType === 'allergy').length,
  vegetarian: participants.filter(p => p.dietType === 'vegetarian').length,
  checklistDone: checklistItems.filter(c => c.status === 'done').length,
  checklistTotal: checklistItems.length,
};
