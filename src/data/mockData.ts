import type { Participant, Church, Group, Room, Schedule, ChecklistItem, Notice, SafetyItem } from '../types';

// 데모용 폴백 — 실제 행사 정보는 EventSettings에서 입력 (eventConfig.ts)
// 여기 데이터는 GUI에서 행사 정보 입력 전 시연용·스크린샷용으로만 사용됨.
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

// ─── 교회 데이터 ───────────────────────────────────────────────────────────────
export const churches: Church[] = [
  { id: 'c01', name: '영락교회', district: '서울남', contact: '02-1234-5678', teacherName: '김영수', teacherPhone: '010-1111-0001', quota: 25, appliedCount: 22, confirmedCount: 20, feeStatus: 'paid' },
  { id: 'c02', name: '강남교회', district: '서울남', contact: '02-2345-6789', teacherName: '이미선', teacherPhone: '010-1111-0002', quota: 20, appliedCount: 18, confirmedCount: 18, feeStatus: 'paid' },
  { id: 'c03', name: '서초교회', district: '서울남', contact: '02-3456-7890', teacherName: '박준호', teacherPhone: '010-1111-0003', quota: 15, appliedCount: 15, confirmedCount: 12, feeStatus: 'partial' },
  { id: 'c04', name: '송파교회', district: '서울남', contact: '02-4567-8901', teacherName: '최지영', teacherPhone: '010-1111-0004', quota: 20, appliedCount: 17, confirmedCount: 15, feeStatus: 'paid' },
  { id: 'c05', name: '광진교회', district: '서울남', contact: '02-5678-9012', teacherName: '정현우', teacherPhone: '010-1111-0005', quota: 15, appliedCount: 10, confirmedCount: 10, feeStatus: 'paid' },
  { id: 'c06', name: '성동교회', district: '서울남', contact: '02-6789-0123', teacherName: '한소희', teacherPhone: '010-1111-0006', quota: 18, appliedCount: 14, confirmedCount: 13, feeStatus: 'partial' },
  { id: 'c07', name: '관악교회', district: '서울남', contact: '02-7890-1234', teacherName: '오태양', teacherPhone: '010-1111-0007', quota: 15, appliedCount: 11, confirmedCount: 9, feeStatus: 'unpaid' },
  { id: 'c08', name: '동작교회', district: '서울남', contact: '02-8901-2345', teacherName: '윤채원', teacherPhone: '010-1111-0008', quota: 12, appliedCount: 9, confirmedCount: 8, feeStatus: 'paid' },
  { id: 'c09', name: '금천교회', district: '서울남', contact: '02-9012-3456', teacherName: '임도현', teacherPhone: '010-1111-0009', quota: 10, appliedCount: 8, confirmedCount: 7, feeStatus: 'partial' },
  { id: 'c10', name: '구로교회', district: '서울남', contact: '02-0123-4567', teacherName: '백서연', teacherPhone: '010-1111-0010', quota: 12, appliedCount: 10, confirmedCount: 10, feeStatus: 'paid' },
];

// ─── 참가자 데이터 ─────────────────────────────────────────────────────────────
export const participants: Participant[] = [
  { id: 'p001', name: '김민준', church: 'c01', grade: '고2', gender: 'M', phone: '010-2001-0001', parentPhone: '010-3001-0001', groupId: 'g01', roomId: 'r01', dietType: 'normal', registeredAt: '2026-06-01', status: 'confirmed', fee: 'paid', feeAmount: 80000 },
  { id: 'p002', name: '이서연', church: 'c01', grade: '고1', gender: 'F', phone: '010-2001-0002', parentPhone: '010-3001-0002', groupId: 'g02', roomId: 'r05', dietType: 'normal', registeredAt: '2026-06-01', status: 'confirmed', fee: 'paid', feeAmount: 80000 },
  { id: 'p003', name: '박지훈', church: 'c01', grade: '중3', gender: 'M', phone: '010-2001-0003', parentPhone: '010-3001-0003', groupId: 'g01', roomId: 'r01', dietType: 'allergy', allergies: '견과류', registeredAt: '2026-06-02', status: 'confirmed', fee: 'paid', feeAmount: 80000 },
  { id: 'p004', name: '최수아', church: 'c02', grade: '고2', gender: 'F', phone: '010-2002-0001', parentPhone: '010-3002-0001', groupId: 'g02', roomId: 'r05', dietType: 'normal', registeredAt: '2026-06-03', status: 'confirmed', fee: 'paid', feeAmount: 80000 },
  { id: 'p005', name: '정도윤', church: 'c02', grade: '고3', gender: 'M', phone: '010-2002-0002', parentPhone: '010-3002-0002', groupId: 'g03', roomId: 'r02', dietType: 'vegetarian', registeredAt: '2026-06-03', status: 'confirmed', fee: 'paid', feeAmount: 80000 },
  { id: 'p006', name: '한지민', church: 'c03', grade: '중2', gender: 'F', phone: '010-2003-0001', parentPhone: '010-3003-0001', groupId: 'g04', roomId: 'r06', dietType: 'normal', registeredAt: '2026-06-05', status: 'confirmed', fee: 'partial', feeAmount: 40000 },
  { id: 'p007', name: '오준서', church: 'c03', grade: '중1', gender: 'M', phone: '010-2003-0002', parentPhone: '010-3003-0002', groupId: 'g01', roomId: 'r01', dietType: 'normal', registeredAt: '2026-06-05', status: 'pending', fee: 'unpaid', feeAmount: 0 },
  { id: 'p008', name: '윤하은', church: 'c04', grade: '고1', gender: 'F', phone: '010-2004-0001', parentPhone: '010-3004-0001', groupId: 'g03', roomId: 'r06', dietType: 'allergy', allergies: '유제품', registeredAt: '2026-06-07', status: 'confirmed', fee: 'paid', feeAmount: 80000 },
  { id: 'p009', name: '임현우', church: 'c04', grade: '고2', gender: 'M', phone: '010-2004-0002', parentPhone: '010-3004-0002', groupId: 'g02', roomId: 'r02', dietType: 'normal', registeredAt: '2026-06-07', status: 'confirmed', fee: 'paid', feeAmount: 80000 },
  { id: 'p010', name: '백채원', church: 'c05', grade: '중3', gender: 'F', phone: '010-2005-0001', parentPhone: '010-3005-0001', groupId: 'g04', roomId: 'r07', dietType: 'normal', registeredAt: '2026-06-08', status: 'confirmed', fee: 'paid', feeAmount: 80000 },
  { id: 'p011', name: '강태양', church: 'c05', grade: '고3', gender: 'M', phone: '010-2005-0002', parentPhone: '010-3005-0002', groupId: 'g05', roomId: 'r03', dietType: 'normal', registeredAt: '2026-06-08', status: 'confirmed', fee: 'paid', feeAmount: 80000 },
  { id: 'p012', name: '장서윤', church: 'c06', grade: '고1', gender: 'F', phone: '010-2006-0001', parentPhone: '010-3006-0001', groupId: 'g01', roomId: 'r07', dietType: 'normal', registeredAt: '2026-06-09', status: 'confirmed', fee: 'paid', feeAmount: 80000 },
  { id: 'p013', name: '노민재', church: 'c06', grade: '중2', gender: 'M', phone: '010-2006-0002', parentPhone: '010-3006-0002', groupId: 'g05', roomId: 'r03', dietType: 'allergy', allergies: '밀가루', registeredAt: '2026-06-09', status: 'pending', fee: 'unpaid', feeAmount: 0 },
  { id: 'p014', name: '신유나', church: 'c07', grade: '고2', gender: 'F', phone: '010-2007-0001', parentPhone: '010-3007-0001', groupId: 'g02', roomId: 'r05', dietType: 'normal', registeredAt: '2026-06-10', status: 'confirmed', fee: 'partial', feeAmount: 40000 },
  { id: 'p015', name: '류준혁', church: 'c08', grade: '중1', gender: 'M', phone: '010-2008-0001', parentPhone: '010-3008-0001', groupId: 'g03', roomId: 'r04', dietType: 'normal', registeredAt: '2026-06-12', status: 'confirmed', fee: 'paid', feeAmount: 80000 },
  // 교사
  { id: 't001', name: '김영수', church: 'c01', grade: '교사', gender: 'M', phone: '010-1111-0001', parentPhone: '010-1111-0001', groupId: 'g01', roomId: 'r09', dietType: 'normal', registeredAt: '2026-06-01', status: 'confirmed', fee: 'paid', feeAmount: 80000 },
  { id: 't002', name: '이미선', church: 'c02', grade: '교사', gender: 'F', phone: '010-1111-0002', parentPhone: '010-1111-0002', groupId: 'g02', roomId: 'r10', dietType: 'normal', registeredAt: '2026-06-01', status: 'confirmed', fee: 'paid', feeAmount: 80000 },
];

// ─── 조 편성 ───────────────────────────────────────────────────────────────────
export const groups: Group[] = [
  { id: 'g01', name: '1조 빛의 자녀', color: '#06b6d4', leaderName: '김영수', members: ['p001', 'p003', 'p007', 'p012', 't001'] },
  { id: 'g02', name: '2조 진리의 길', color: '#3b82f6', leaderName: '이미선', members: ['p002', 'p004', 'p009', 'p014', 't002'] },
  { id: 'g03', name: '3조 생명의 말씀', color: '#8b5cf6', leaderName: '박준호', members: ['p005', 'p008', 'p015'] },
  { id: 'g04', name: '4조 소망의 별', color: '#10b981', leaderName: '최지영', members: ['p006', 'p010'] },
  { id: 'g05', name: '5조 하나님의 사랑', color: '#f59e0b', leaderName: '정현우', members: ['p011', 'p013'] },
];

// ─── 숙소 배정 ─────────────────────────────────────────────────────────────────
export const rooms: Room[] = [
  { id: 'r01', name: '101호', building: 'A동', floor: 1, capacity: 8, type: 'male', assignedIds: ['p001', 'p003', 'p007'] },
  { id: 'r02', name: '102호', building: 'A동', floor: 1, capacity: 8, type: 'male', assignedIds: ['p005', 'p009'] },
  { id: 'r03', name: '103호', building: 'A동', floor: 1, capacity: 8, type: 'male', assignedIds: ['p011', 'p013'] },
  { id: 'r04', name: '104호', building: 'A동', floor: 1, capacity: 8, type: 'male', assignedIds: ['p015'] },
  { id: 'r05', name: '201호', building: 'B동', floor: 2, capacity: 8, type: 'female', assignedIds: ['p002', 'p004', 'p014'] },
  { id: 'r06', name: '202호', building: 'B동', floor: 2, capacity: 8, type: 'female', assignedIds: ['p006', 'p008'] },
  { id: 'r07', name: '203호', building: 'B동', floor: 2, capacity: 8, type: 'female', assignedIds: ['p010', 'p012'] },
  { id: 'r08', name: '204호', building: 'B동', floor: 2, capacity: 8, type: 'female', assignedIds: [] },
  { id: 'r09', name: '301호', building: 'C동', floor: 3, capacity: 4, type: 'staff', assignedIds: ['t001'] },
  { id: 'r10', name: '302호', building: 'C동', floor: 3, capacity: 4, type: 'staff', assignedIds: ['t002'] },
];

// ─── 일정 ─────────────────────────────────────────────────────────────────────
export const schedules: Schedule[] = [
  // 1일차 (7/26 주일)
  { id: 's101', day: 1, time: '14:00', title: '참가자 등록 및 방 배정', location: '수련원 로비', category: 'move', notes: '각 교회별 인솔 교사 확인' },
  { id: 's102', day: 1, time: '16:00', title: '개회 예배', location: '대예배실', category: 'worship', notes: '예시 일정 — EventSettings에서 강사·찬양팀 정보 입력' },
  { id: 's103', day: 1, time: '18:00', title: '저녁 식사', location: '식당', category: 'meal' },
  { id: 's104', day: 1, time: '19:30', title: '아이스브레이킹 & 조 모임', location: '강당', category: 'program', notes: '조별 게임 진행' },
  { id: 's105', day: 1, time: '21:00', title: '저녁집회 (찬양 + 말씀)', location: '대예배실', category: 'worship', notes: '예시 일정' },
  { id: 's106', day: 1, time: '22:30', title: '취침 준비', location: '각 숙소', category: 'sleep' },
  { id: 's107', day: 1, time: '23:00', title: '소등 & 취침', location: '각 숙소', category: 'sleep' },
  // 2일차 (7/27 월)
  { id: 's201', day: 2, time: '07:00', title: '기상 & 새벽 기도', location: '대예배실', category: 'worship' },
  { id: 's202', day: 2, time: '08:00', title: '아침 식사', location: '식당', category: 'meal' },
  { id: 's203', day: 2, time: '09:30', title: '특강 1', location: '대예배실', category: 'worship' },
  { id: 's204', day: 2, time: '11:00', title: '조별 토론 & 나눔', location: '소그룹실', category: 'program' },
  { id: 's205', day: 2, time: '12:00', title: '점심 식사', location: '식당', category: 'meal' },
  { id: 's206', day: 2, time: '13:30', title: '야외 활동 (스포츠 대회)', location: '운동장', category: 'program' },
  { id: 's207', day: 2, time: '15:30', title: '자유 시간', location: '시설 내', category: 'free' },
  { id: 's208', day: 2, time: '17:30', title: '조별 발표 준비', location: '소그룹실', category: 'program' },
  { id: 's209', day: 2, time: '18:30', title: '저녁 식사', location: '식당', category: 'meal' },
  { id: 's210', day: 2, time: '20:00', title: '저녁집회 (찬양 + 말씀)', location: '대예배실', category: 'worship', notes: '예시 일정' },
  { id: 's211', day: 2, time: '21:30', title: '기도회 & 헌신 예배', location: '대예배실', category: 'worship' },
  { id: 's212', day: 2, time: '23:00', title: '소등 & 취침', location: '각 숙소', category: 'sleep' },
  // 3일차 (7/28 화)
  { id: 's301', day: 3, time: '07:00', title: '기상 & 아침 기도', location: '대예배실', category: 'worship' },
  { id: 's302', day: 3, time: '08:00', title: '아침 식사', location: '식당', category: 'meal' },
  { id: 's303', day: 3, time: '09:30', title: '조별 발표 & 나눔', location: '대예배실', category: 'program' },
  { id: 's304', day: 3, time: '11:00', title: '폐회 예배', location: '대예배실', speaker: '지방회장 목사', category: 'worship', notes: '수료증 수여' },
  { id: 's305', day: 3, time: '12:30', title: '점심 식사', location: '식당', category: 'meal' },
  { id: 's306', day: 3, time: '14:00', title: '퇴소 & 귀가', location: '수련원 로비', category: 'move', notes: '교회별 버스 탑승' },
];

// ─── 체크리스트 ────────────────────────────────────────────────────────────────
export const checklistItems: ChecklistItem[] = [
  // 행정
  { id: 'ck01', category: '행정', title: '참가비 수납 현황 최종 확인', assignee: '총무 김○○', dueDate: '2026-07-20', status: 'inprogress', priority: 'high' },
  { id: 'ck02', category: '행정', title: '수련원 계약 및 입금 완료', assignee: '총무 김○○', dueDate: '2026-07-15', status: 'done', priority: 'high' },
  { id: 'ck03', category: '행정', title: '차량 렌트 예약 확정', assignee: '총무 김○○', dueDate: '2026-07-20', status: 'done', priority: 'medium' },
  { id: 'ck04', category: '행정', title: '교회별 참가자 명단 최종 제출', assignee: '각 교회 교사', dueDate: '2026-07-20', status: 'inprogress', priority: 'high' },
  // 예배/강의
  { id: 'ck05', category: '예배', title: '강사 섭외 및 일정 확정', assignee: '예배팀장 이○○', dueDate: '2026-07-01', status: 'done', priority: 'high' },
  { id: 'ck06', category: '예배', title: '찬양팀 구성 및 연습 일정', assignee: '찬양팀장 박○○', dueDate: '2026-07-24', status: 'inprogress', priority: 'high' },
  { id: 'ck07', category: '예배', title: '빔프로젝터 및 음향 점검', assignee: '기술팀 최○○', dueDate: '2026-07-25', status: 'pending', priority: 'medium' },
  // 식사
  { id: 'ck08', category: '식사', title: '알러지 식단 별도 준비 확인', assignee: '식사팀장 정○○', dueDate: '2026-07-24', status: 'inprogress', priority: 'high' },
  { id: 'ck09', category: '식사', title: '채식 식단 준비 확인', assignee: '식사팀장 정○○', dueDate: '2026-07-24', status: 'pending', priority: 'medium' },
  // 안전
  { id: 'ck10', category: '안전', title: '응급처치 키트 준비', assignee: '안전팀장 한○○', dueDate: '2026-07-25', status: 'done', priority: 'high' },
  { id: 'ck11', category: '안전', title: '참가자 건강 설문지 수거', assignee: '안전팀장 한○○', dueDate: '2026-07-22', status: 'inprogress', priority: 'high' },
  { id: 'ck12', category: '안전', title: '비상 연락망 배포', assignee: '안전팀장 한○○', dueDate: '2026-07-25', status: 'pending', priority: 'medium' },
  // 물품
  { id: 'ck13', category: '물품', title: '수련회 티셔츠 제작 완료', assignee: '홍보팀 오○○', dueDate: '2026-07-23', status: 'done', priority: 'medium' },
  { id: 'ck14', category: '물품', title: '조별 활동 준비물 구매', assignee: '프로그램팀 윤○○', dueDate: '2026-07-24', status: 'inprogress', priority: 'medium' },
  { id: 'ck15', category: '물품', title: '수료증 제작', assignee: '총무 김○○', dueDate: '2026-07-25', status: 'pending', priority: 'low' },
  { id: 'ck16', category: '물품', title: '현수막 제작 및 설치 확인', assignee: '홍보팀 오○○', dueDate: '2026-07-25', status: 'blocked', priority: 'medium', notes: '업체 확인 필요' },
];

// ─── 공지사항 ──────────────────────────────────────────────────────────────────
export const notices: Notice[] = [
  {
    id: 'n01',
    title: '[필독] 최종 참가자 명단 제출 안내',
    content: '각 교회 담당 교사는 7월 20일(월)까지 최종 참가자 명단을 제출해 주시기 바랍니다. 명단에는 이름, 학년, 성별, 연락처, 알레르기 정보가 포함되어야 합니다.',
    author: '총무 김○○',
    createdAt: '2026-07-10',
    pinned: true,
    target: 'church',
  },
  {
    id: 'n02',
    title: '[필독] 수련회 준비 전체 회의 일정',
    content: '7월 19일(주일) 오후 3시, 영락교회 소회의실에서 전체 준비위원 회의가 있습니다. 담당 파트 준비 현황을 보고해 주세요.',
    author: '회장 최○○',
    createdAt: '2026-07-08',
    pinned: true,
    target: 'staff',
  },
  {
    id: 'n03',
    title: '수련회 주제가 악보 배포',
    content: '이번 수련회 주제가 "내 정체성 (My Identity)" 악보를 공유합니다. 각 교회에서 미리 연습해 오시면 좋겠습니다.',
    author: '찬양팀 박○○',
    createdAt: '2026-07-05',
    pinned: false,
    target: 'all',
  },
  {
    id: 'n04',
    title: '참가비 납부 안내 및 계좌 정보',
    content: '참가비 안내 예시입니다. EventSettings에서 금액·계좌 정보를 수정하세요.',
    author: '총무 김○○',
    createdAt: '2026-06-20',
    pinned: false,
    target: 'all',
  },
  {
    id: 'n05',
    title: '수련회 티셔츠 사이즈 조사 완료',
    content: '티셔츠 사이즈 조사가 완료되었습니다. 제작 업체에 발주했으며 7월 23일 수령 예정입니다.',
    author: '홍보팀 오○○',
    createdAt: '2026-07-12',
    pinned: false,
    target: 'staff',
  },
];

// ─── 안전 관리 ─────────────────────────────────────────────────────────────────
export const safetyItems: SafetyItem[] = [
  { id: 'sf01', category: '응급 대응', description: '응급처치 키트 비치 및 담당자 지정', responsible: '한○○ 집사', status: 'normal', lastChecked: '2026-07-25' },
  { id: 'sf02', category: '응급 대응', description: '근처 병원 및 119 연락처 공유', responsible: '안전팀', status: 'normal', lastChecked: '2026-07-25' },
  { id: 'sf03', category: '참가자 건강', description: '건강 설문지 수거 및 이상자 파악', responsible: '각 교회 교사', status: 'caution', lastChecked: '2026-07-22' },
  { id: 'sf04', category: '참가자 건강', description: '알레르기 보유자 식단 별도 관리', responsible: '식사팀', status: 'normal', lastChecked: '2026-07-24' },
  { id: 'sf05', category: '시설 안전', description: '수련원 시설 안전 점검 완료', responsible: '수련원 담당자', status: 'normal', lastChecked: '2026-07-23' },
  { id: 'sf06', category: '시설 안전', description: '소화기 위치 및 비상구 확인', responsible: '안전팀', status: 'normal', lastChecked: '2026-07-25' },
  { id: 'sf07', category: '이동 안전', description: '버스 기사 연락처 및 경로 확인', responsible: '총무팀', status: 'normal', lastChecked: '2026-07-24' },
  { id: 'sf08', category: '야간 안전', description: '야간 순찰 담당자 배정', responsible: '남자 교사 전원', status: 'caution', lastChecked: '2026-07-22' },
];

// ─── 통계 요약 ─────────────────────────────────────────────────────────────────
export const stats = {
  totalParticipants: participants.length,
  confirmed: participants.filter(p => p.status === 'confirmed').length,
  pending: participants.filter(p => p.status === 'pending').length,
  male: participants.filter(p => p.gender === 'M').length,
  female: participants.filter(p => p.gender === 'F').length,
  teachers: participants.filter(p => p.grade === '교사').length,
  students: participants.filter(p => p.grade !== '교사').length,
  paidFull: participants.filter(p => p.fee === 'paid').length,
  paidPartial: participants.filter(p => p.fee === 'partial').length,
  unpaid: participants.filter(p => p.fee === 'unpaid').length,
  totalRevenue: participants.reduce((sum, p) => sum + p.feeAmount, 0),
  allergies: participants.filter(p => p.dietType === 'allergy').length,
  vegetarian: participants.filter(p => p.dietType === 'vegetarian').length,
  checklistDone: checklistItems.filter(c => c.status === 'done').length,
  checklistTotal: checklistItems.length,
};
