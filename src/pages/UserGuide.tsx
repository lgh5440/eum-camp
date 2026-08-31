import {
  BookOpen, AlertTriangle, Users, Shuffle, CheckSquare, Printer,
  ClipboardCheck, PhoneCall, UserCheck, Activity, HardDrive,
  Rocket, Search, ChevronRight, Database, Info, Eye, KeyRound,
} from 'lucide-react';
import { EVENT } from '../data/eventInfo';
import { type PageKey } from '../components/Sidebar';

interface Props {
  onNavigate: (page: PageKey) => void;
}

/* ── 운영 순서 스텝 ──────────────────────────────────── */
const STEPS = [
  { step: 1,  label: '참가자 신청 받기',    desc: '구글폼으로 신청 접수' },
  { step: 2,  label: 'CSV 가져오기',        desc: '참가자 관리에서 업로드' },
  { step: 3,  label: '참가자 정보 확인',    desc: '누락·오류 데이터 수정' },
  { step: 4,  label: '조 편성',             desc: '자동 또는 수동 배정' },
  { step: 5,  label: '방 배정',             desc: '성별/인원 기준 자동 배정' },
  { step: 6,  label: '차량 배정',           desc: '차량별 좌석 자동 배정' },
  { step: 7,  label: '교회별 최종 확인',    desc: '담당 교회 명단 검토' },
  { step: 8,  label: '출력물 준비',         desc: '명단·배정표 인쇄' },
  { step: 9,  label: '데이터 백업',         desc: 'JSON 파일로 저장' },
  { step: 10, label: '현장 체크인 운영',    desc: '도착 확인 실시간 처리' },
];

/* ── 빠른 이동 버튼 ──────────────────────────────────── */
const QUICK_NAV: { label: string; page: PageKey; icon: React.ReactNode; color: string }[] = [
  { label: '참가자 관리', page: 'participants', icon: <Users size={15} />,        color: '#3B82F6' },
  { label: '조 편성',     page: 'groups',       icon: <Shuffle size={15} />,      color: '#8b5cf6' },
  { label: '방 배정',     page: 'rooms',        icon: <Database size={15} />,     color: '#f59e0b' },
  { label: '차량 배정',   page: 'vehicles',     icon: <ChevronRight size={15} />, color: '#10b981' },
  { label: '출력 센터',   page: 'printcenter',  icon: <Printer size={15} />,      color: '#3b82f6' },
  { label: '데이터 관리', page: 'datamanager',  icon: <HardDrive size={15} />,    color: '#ef4444' },
];

/* ── 섹션 데이터 ──────────────────────────────────────── */
interface Section {
  id: number;
  title: string;
  icon: React.ReactNode;
  color: string;
  items: string[];
  warn?: string;
}

const SECTIONS: Section[] = [
  {
    id: 1,
    title: '처음 시작하기',
    icon: <Rocket size={18} />,
    color: '#3B82F6',
    items: [
      '참가자 신청은 구글폼으로 받습니다.',
      '구글시트에서 응답 데이터를 CSV 형식으로 다운로드합니다.',
      '참가자 관리 → "CSV 가져오기" 버튼으로 데이터를 불러옵니다.',
      '작업 전 데이터 관리 → "백업 다운로드"를 먼저 해두세요.',
    ],
    warn: '처음 CSV를 가져오기 전 기존 목업 참가자 데이터를 삭제해야 합니다. 데이터 관리 → 전체 초기화를 사용하세요.',
  },
  {
    id: 2,
    title: '참가자 관리',
    icon: <Users size={18} />,
    color: '#8b5cf6',
    items: [
      '우측 상단 "+ 참가자 추가" 버튼으로 개별 등록합니다.',
      '행 클릭 후 수정 아이콘으로 정보를 편집합니다.',
      '삭제 버튼은 취소 불가 — 백업 후 사용하세요.',
      '"CSV 가져오기"로 구글폼 응답 파일을 한 번에 업로드합니다.',
      '"CSV 내보내기"로 현재 참가자 목록을 파일로 저장합니다.',
      '상단 검색창과 교회/학교/성별 필터로 대상을 좁혀 확인합니다.',
    ],
  },
  {
    id: 3,
    title: '자동 배정',
    icon: <Shuffle size={18} />,
    color: '#f59e0b',
    items: [
      '조 편성 / 방 배정 / 차량 배정 각 페이지에서 자동 배정을 실행합니다.',
      '"미배정만 배정": 이미 배정된 인원은 그대로 두고, 누락된 인원만 추가합니다.',
      '"전체 재배정": 기존 배정을 지우고 처음부터 다시 배정합니다.',
      '배정 결과는 미리보기 화면에서 확인 후 "적용" 버튼을 눌러야 저장됩니다.',
      '적용 전 미리보기를 꼭 검토하세요 — 적용 후에는 전체 재배정으로만 수정됩니다.',
    ],
    warn: '"전체 재배정"은 수동으로 조정한 내용도 초기화됩니다. 신중하게 사용하세요.',
  },
  {
    id: 4,
    title: '체크리스트 관리',
    icon: <CheckSquare size={18} />,
    color: '#10b981',
    items: [
      '각 항목 우측 상태 버튼(대기 → 진행 → 완료)을 클릭해 상태를 변경합니다.',
      '"완료 항목 숨기기" 토글로 완료된 항목을 접을 수 있습니다.',
      '담당자 필터로 본인 담당 항목만 볼 수 있습니다.',
      '체크리스트 상태는 브라우저 localStorage에 자동 저장됩니다.',
      '데이터 관리 → 전체 초기화 시 체크리스트 상태도 함께 초기화됩니다.',
    ],
  },
  {
    id: 5,
    title: '출력 센터',
    icon: <Printer size={18} />,
    color: '#3b82f6',
    items: [
      '전체 참가자 명단 / 조 편성표 / 방 배정표 / 차량 탑승표 / 교회별 확인표를 출력합니다.',
      '각 출력물 우측 상단 "인쇄" 버튼을 클릭하면 브라우저 인쇄 창이 열립니다.',
      '"연락처 마스킹" 옵션을 켜면 전화번호 중간 자리가 ***로 가려진 채 인쇄됩니다.',
      '출력 시 사이드바와 헤더는 자동으로 숨겨집니다 (print CSS 적용).',
      '인쇄 전 미리보기를 반드시 확인하고, 용지 크기를 A4로 설정하세요.',
    ],
  },
  {
    id: 6,
    title: '교회별 확인',
    icon: <ClipboardCheck size={18} />,
    color: '#3B82F6',
    items: [
      '교회별로 참가자 명단과 배정 현황을 한눈에 확인합니다.',
      '참가비 미완료 인원은 붉은 배지로 표시됩니다.',
      '조/방/차량이 미배정인 인원은 노란 경고로 표시됩니다.',
      '담당자가 검토 후 "최종 확인 완료" 체크를 하면 교회 카드에 완료 표시가 됩니다.',
      '모든 교회가 완료 체크되면 출발 준비가 완료된 것입니다.',
    ],
  },
  {
    id: 7,
    title: '비상연락망',
    icon: <PhoneCall size={18} />,
    color: '#ef4444',
    items: [
      '연락처가 누락된 참가자를 목록에서 확인하고 보완합니다.',
      '학생 참가자는 보호자(부모) 연락처가 입력되어 있는지 확인합니다.',
      '알레르기·복용약 주의자를 별도 목록으로 확인합니다.',
      '"비상연락망 인쇄" 기능으로 운영진용 비상연락 문서를 출력합니다.',
    ],
    warn: '비상연락망은 운영진 전용 자료입니다. 행사 종료 후 출력물을 반드시 폐기해 주세요.',
  },
  {
    id: 8,
    title: '현장 체크인',
    icon: <UserCheck size={18} />,
    color: '#3B82F6',
    items: [
      '등록대에서 참가자 이름 또는 교회명으로 빠르게 검색합니다.',
      '대상자 카드의 "체크인" 버튼을 누르면 도착 처리됩니다.',
      '실수로 체크인한 경우 동일 버튼으로 체크인을 취소할 수 있습니다.',
      '"미도착 보기" 필터로 아직 도착하지 않은 참가자만 표시합니다.',
      '차량별 도착 현황 탭에서 탑승 차량 단위로 도착 현황을 확인합니다.',
    ],
  },
  {
    id: 9,
    title: '현장 운영 모드',
    icon: <Activity size={18} />,
    color: '#8b5cf6',
    items: [
      '수련회 당일 총괄 화면으로 모든 현황을 한 화면에서 확인합니다.',
      '미도착 명단 패널에서 연락이 필요한 인원을 즉시 파악합니다.',
      '안전 주의 명단(알레르기·복용약)이 상단 카드에 항상 표시됩니다.',
      '미완료 체크리스트 항목을 확인하고 즉시 처리합니다.',
      '"빠른 이동" 패널의 버튼으로 다른 페이지에 바로 접근합니다.',
    ],
  },
  {
    id: 10,
    title: '데이터 관리',
    icon: <HardDrive size={18} />,
    color: '#f59e0b',
    items: [
      '"백업 다운로드"로 현재 모든 데이터를 JSON 파일로 저장합니다.',
      '"백업 복원"으로 저장된 JSON 파일을 불러와 데이터를 복구합니다.',
      '"전체 초기화"는 모든 데이터(참가자·배정·체크리스트·체크인)를 삭제합니다.',
      '실제 운영 전과 주요 수정 후에는 반드시 백업 파일을 다운로드해 두세요.',
    ],
    warn: '전체 초기화는 되돌릴 수 없습니다. 반드시 백업 후 진행하세요.',
  },
];

/* ── 컴포넌트 ─────────────────────────────────────────── */
export default function UserGuide({ onNavigate }: Props) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── 페이지 헤더 ──────────────────────────────── */}
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#3B82F6,#2563eb)', boxShadow: '0 0 20px rgba(37, 99, 235,0.35)' }}
        >
          <BookOpen size={22} className="text-[#101A3D]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#101A3D]">운영자 사용 매뉴얼</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {EVENT.title} · {EVENT.dates} · {EVENT.venue}
          </p>
        </div>
      </div>

      {/* ── 역할별 빠른 시작 ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 조회용 PIN — 다른 교회 관리자 */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(37, 99, 235,0.06)', border: '1px solid rgba(37, 99, 235,0.25)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(37, 99, 235,0.18)', color: '#2563EB' }}
            >
              <Eye size={15} />
            </span>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">조회용 PIN을 받으셨다면</div>
              <div className="text-sm font-bold text-[#101A3D]">다른 교회 관리자</div>
            </div>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
            <li className="flex gap-2"><span className="text-cyan-400 font-bold">1.</span><span>로그인 화면에서 본인 이름 + PIN 입력 → 들어옴</span></li>
            <li className="flex gap-2"><span className="text-cyan-400 font-bold">2.</span><span>왼쪽 메뉴 <strong className="text-cyan-300">참가자 관리</strong> → 상단 "교회" 필터에서 본인 교회 선택</span></li>
            <li className="flex gap-2"><span className="text-cyan-400 font-bold">3.</span><span>왼쪽 메뉴 <strong className="text-cyan-300">출력 센터</strong> → "교회별 확인표" 인쇄로 명단 받음</span></li>
            <li className="flex gap-2"><span className="text-cyan-400 font-bold">4.</span><span>잘못된 정보·누락은 <strong className="text-cyan-300">교회별 확인</strong> 메뉴에서 메모 남기거나 운영팀에 카톡</span></li>
          </ul>
          <div
            className="mt-3 px-3 py-2 rounded-lg text-[11px] text-slate-400"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            🔒 PIN은 <strong>읽기 전용</strong>입니다. 편집·삭제는 진행위원만 가능.
          </div>
        </div>

        {/* 진행위원 비밀번호 — 운영팀 */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(31,95,217,0.08)', border: '1px solid rgba(47,115,242,0.3)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(31,95,217,0.18)', color: '#2F73F2' }}
            >
              <KeyRound size={15} />
            </span>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#2F73F2' }}>진행위원 비밀번호를 받으셨다면</div>
              <div className="text-sm font-bold text-[#101A3D]">운영팀 (편집 권한)</div>
            </div>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
            <li className="flex gap-2"><span className="font-bold" style={{ color: '#2F73F2' }}>1.</span><span>아래 <strong style={{ color: '#2F73F2' }}>권장 운영 순서</strong> 1~10단계대로 진행</span></li>
            <li className="flex gap-2"><span className="font-bold" style={{ color: '#2F73F2' }}>2.</span><span>작업 시작 전 <strong style={{ color: '#2F73F2' }}>데이터 관리 → 백업 다운로드</strong> 필수</span></li>
            <li className="flex gap-2"><span className="font-bold" style={{ color: '#2F73F2' }}>3.</span><span>여러 명이 동시에 편집하면 마지막 저장이 덮어씁니다 — 한 번에 한 명씩</span></li>
            <li className="flex gap-2"><span className="font-bold" style={{ color: '#2F73F2' }}>4.</span><span>모든 변경은 클라우드에 자동 저장 — 다른 기기에서도 즉시 보임</span></li>
          </ul>
          <div
            className="mt-3 px-3 py-2 rounded-lg text-[11px] text-slate-400"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            ⚠️ 진행위원 비밀번호는 <strong>절대 외부 공유 금지</strong>. 다른 교회엔 PIN만 전달.
          </div>
        </div>
      </div>

      {/* ── localStorage 경고 배너 ───────────────────── */}
      <div
        className="flex gap-3 px-4 py-4 rounded-2xl"
        style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)' }}
      >
        <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: '#fbbf24' }}>데이터 보관 방식 안내</p>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed">
            이 대시보드는 브라우저 <span className="font-semibold text-amber-300">localStorage</span>를 사용합니다.<br />
            따라서 실제 운영 전과 주요 수정 후에는 반드시{' '}
            <span className="font-semibold text-amber-300">데이터 백업을 다운로드</span>해 주세요.
            브라우저 캐시 삭제, 다른 기기 접속, 시크릿 모드에서는 데이터가 보이지 않습니다.
          </p>
        </div>
      </div>

      {/* ── 빠른 이동 ───────────────────────────────── */}
      <div
        className="p-4 rounded-2xl"
        style={{ background: 'rgba(37, 99, 235,0.06)', border: '1px solid rgba(37, 99, 235,0.18)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Search size={15} className="text-cyan-400" />
          <span className="text-sm font-semibold text-cyan-300">빠른 이동</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_NAV.map(n => (
            <button
              key={n.page}
              onClick={() => onNavigate(n.page)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 hover:scale-105 active:scale-95"
              style={{
                background: `${n.color}18`,
                border: `1px solid ${n.color}40`,
                color: n.color,
              }}
            >
              {n.icon}
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 권장 운영 순서 ───────────────────────────── */}
      <div
        className="p-5 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} className="text-cyan-400" />
          <h2 className="text-sm font-bold text-[#101A3D]">권장 운영 순서</h2>
        </div>

        {/* 모바일: 세로 / 데스크탑: 2열 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {STEPS.map((s, idx) => (
            <div
              key={s.step}
              className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(37, 99, 235,0.07)', border: '1px solid rgba(37, 99, 235,0.14)' }}
            >
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{
                  background: idx < 3
                    ? 'linear-gradient(135deg,#3B82F6,#2563eb)'
                    : idx < 7
                      ? 'linear-gradient(135deg,#8b5cf6,#3b82f6)'
                      : 'linear-gradient(135deg,#10b981,#3B82F6)',
                  color: '#fff',
                }}
              >
                {s.step}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#101A3D] leading-tight">{s.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 섹션 카드 그리드 ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECTIONS.map(sec => (
          <div
            key={sec.id}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {/* 카드 헤더 */}
            <div
              className="flex items-center gap-2.5 px-4 py-3"
              style={{ background: `${sec.color}14`, borderBottom: `1px solid ${sec.color}25` }}
            >
              <span
                className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${sec.color}22`, color: sec.color }}
              >
                {sec.icon}
              </span>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: sec.color }}>
                  섹션 {sec.id}
                </span>
                <div className="text-sm font-bold text-[#101A3D] leading-tight">{sec.title}</div>
              </div>
            </div>

            {/* 카드 본문 */}
            <div className="px-4 py-3 space-y-1.5">
              {sec.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span
                    className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
                    style={{ background: sec.color }}
                  />
                  <span className="text-sm text-slate-300 leading-relaxed">{item}</span>
                </div>
              ))}

              {/* 경고 박스 (선택적) */}
              {sec.warn && (
                <div
                  className="flex gap-2 mt-3 px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                  <span className="text-xs text-red-300 leading-relaxed">{sec.warn}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── 하단 안내 ───────────────────────────────── */}
      <div
        className="flex items-start gap-3 px-4 py-4 rounded-2xl"
        style={{ background: 'rgba(37, 99, 235,0.07)', border: '1px solid rgba(37, 99, 235,0.2)' }}
      >
        <Info size={18} className="flex-shrink-0 mt-0.5 text-cyan-400" />
        <div className="text-sm text-slate-300 leading-relaxed">
          이 매뉴얼은 <span className="font-semibold text-cyan-300">{EVENT.title}</span> 운영진을 위해 제작되었습니다.
          사용 중 문의사항이 있으면 시스템 담당자에게 연락하세요.<br />
          <span className="text-slate-500 text-xs mt-1 block">주제: {EVENT.theme} · {EVENT.subTheme}</span>
        </div>
      </div>

    </div>
  );
}
