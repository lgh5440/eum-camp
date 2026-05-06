export interface Participant {
  id: string;
  name: string;
  church: string;
  grade: string;         // 중1, 중2, 중3, 고1, 고2, 고3, 교사
  gender: 'M' | 'F';
  phone: string;
  parentPhone: string;
  roomId?: string;
  groupId?: string;
  dietType: 'normal' | 'vegetarian' | 'allergy';
  allergies?: string;
  registeredAt: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  fee: 'paid' | 'partial' | 'unpaid';
  feeAmount: number;
  // 신청서 원본 단계 (UI/CSV 표시용, fee/feeAmount는 이로부터 자동 산출)
  // pre: 가등록 2만원 / first: 1차 6만원 / second: 2차 7만원 / unpaid: 미납 / exempt: 면제(자원봉사·찬양팀·진행팀)
  feeStage?: 'pre' | 'first' | 'second' | 'unpaid' | 'exempt';
  role?: '학생' | '교사' | '학부모' | '운영진' | '찬양팀' | '자원봉사' | '진행위원';
  busId?: string;
  notes?: string;
  applicationToken?: string;
  insuranceConfirmed?: boolean;
  phoneConsent?: boolean;
}

export interface Church {
  id: string;
  name: string;
  district: string;
  contact: string;
  teacherName: string;
  teacherPhone: string;
  quota: number;
  appliedCount: number;
  confirmedCount: number;
  feeStatus: 'paid' | 'partial' | 'unpaid';
}

export interface Group {
  id: string;
  name: string;
  color: string;
  leaderId?: string;
  leaderName: string;
  members: string[];    // participant ids
  room?: string;
}

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  type: 'male' | 'female' | 'staff';
  assignedIds: string[];
}

export interface Schedule {
  id: string;
  day: number;           // 1, 2, 3
  time: string;
  title: string;
  location: string;
  speaker?: string;
  category: 'worship' | 'program' | 'meal' | 'free' | 'sleep' | 'move';
  notes?: string;
}

export interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: 'done' | 'inprogress' | 'pending' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  pinned: boolean;
  target: 'all' | 'staff' | 'church';
}

export interface SafetyItem {
  id: string;
  category: string;
  description: string;
  responsible: string;
  status: 'normal' | 'caution' | 'danger';
  lastChecked: string;
}
