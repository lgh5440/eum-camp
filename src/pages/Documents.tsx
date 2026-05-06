import { Download, FileText, FileSpreadsheet, Image } from 'lucide-react';

const docs = [
  { id: 'd01', name: '수련회 참가 신청서 양식',       type: 'word',  size: '45KB',   category: '양식',   date: '2026-06-01', desc: '참가자 신청 시 사용하는 공식 양식입니다.' },
  { id: 'd02', name: '2026 수련회 프로그램 일정표',   type: 'pdf',   size: '128KB',  category: '일정',   date: '2026-07-15', desc: '전체 3일 프로그램 상세 일정이 포함되어 있습니다.' },
  { id: 'd03', name: '수련회 운영 매뉴얼',           type: 'pdf',   size: '256KB',  category: '운영',   date: '2026-07-01', desc: '담당자별 역할 분담 및 비상 대응 절차를 안내합니다.' },
  { id: 'd04', name: '참가자 명단 엑셀 양식',         type: 'excel', size: '32KB',   category: '양식',   date: '2026-06-10', desc: '교회 담당자가 제출할 참가자 명단 양식입니다.' },
  { id: 'd05', name: '수련회 주제가 악보',           type: 'pdf',   size: '512KB',  category: '예배',   date: '2026-07-05', desc: '"내 정체성 (My Identity)" 주제가 악보 (피아노·기타 코드)' },
  { id: 'd06', name: '현장 안전 지침 및 비상 연락망', type: 'pdf',   size: '98KB',   category: '안전',   date: '2026-07-20', desc: '응급 대응 절차, 근처 병원, 비상 연락처가 포함됩니다.' },
  { id: 'd07', name: '수련회 포스터 (고해상도)',      type: 'image', size: '2.1MB',  category: '홍보',   date: '2026-07-10', desc: '각 교회 게시용 공식 포스터입니다.' },
  { id: 'd08', name: '수료증 양식',                 type: 'word',  size: '88KB',   category: '양식',   date: '2026-07-24', desc: '폐회 예배 수여용 수료증 편집 가능 양식입니다.' },
  { id: 'd09', name: '조별 활동 프로그램 가이드',    type: 'pdf',   size: '175KB',  category: '프로그램', date: '2026-07-20', desc: '조별 토론 및 야외 활동 진행 방법 안내서입니다.' },
  { id: 'd10', name: '수련원 시설 안내도',           type: 'image', size: '1.5MB',  category: '시설',   date: '2026-07-25', desc: '수련원 건물 배치, 숙소, 식당, 예배실 위치 안내.' },
];

const typeConfig: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  pdf:   { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   label: 'PDF',   icon: <FileText size={18} /> },
  excel: { color: '#10b981', bg: 'rgba(16,185,129,0.15)',  label: 'Excel', icon: <FileSpreadsheet size={18} /> },
  word:  { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  label: 'Word',  icon: <FileText size={18} /> },
  image: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', label: '이미지', icon: <Image size={18} /> },
};

const catBadgeColor: Record<string, string> = {
  양식: '#06b6d4', 일정: '#3b82f6', 운영: '#8b5cf6', 예배: '#f59e0b',
  안전: '#ef4444', 홍보: '#ec4899', 프로그램: '#10b981', 시설: '#64748b',
};

// 카테고리별 문서 수 집계
const catCount = docs.reduce<Record<string, number>>((acc, d) => {
  acc[d.category] = (acc[d.category] || 0) + 1;
  return acc;
}, {});

export default function Documents() {
  return (
    <div className="space-y-5">

      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-bold text-white">문서 자료</h2>
        <p className="text-sm text-slate-400 mt-0.5">수련회 공식 문서 · 총 {docs.length}건</p>
      </div>

      {/* 카테고리 요약 배지 */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(catCount).map(([cat, count]) => {
          const color = catBadgeColor[cat] || '#64748b';
          return (
            <span
              key={cat}
              className="text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1"
              style={{
                background: `${color}15`,
                color,
                border: `1px solid ${color}25`,
              }}
            >
              {cat} {count}
            </span>
          );
        })}
      </div>

      {/* 문서 목록 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {docs.map(doc => {
          const tc = typeConfig[doc.type] || typeConfig.pdf;
          const badgeColor = catBadgeColor[doc.category] || '#64748b';

          return (
            <div
              key={doc.id}
              className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl
                         transition-colors hover:bg-white/[0.06]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* 파일 타입 아이콘 */}
              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: tc.bg, color: tc.color }}
              >
                {tc.icon}
              </div>

              {/* 내용 영역 */}
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">

                {/* 파일명 */}
                <span className="text-sm font-medium text-white leading-snug">
                  {doc.name}
                </span>

                {/* 설명 */}
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {doc.desc}
                </p>

                {/* 하단: 메타 배지 + 다운로드 버튼 */}
                <div className="flex items-center justify-between gap-2 flex-wrap mt-0.5">

                  {/* 메타 배지들 */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ color: badgeColor, background: `${badgeColor}15` }}
                    >
                      {doc.category}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ color: tc.color, background: tc.bg }}
                    >
                      {tc.label}
                    </span>
                    <span className="text-[10px] text-slate-600">{doc.size}</span>
                    <span className="text-[10px] text-slate-600 hidden sm:inline">{doc.date}</span>
                  </div>

                  {/*
                    다운로드 버튼
                    ─ 모바일: 항상 표시, h-9(36px) 터치 영역 확보
                    ─ 데스크탑: 항상 표시 + hover 시 배경 강조
                  */}
                  <button
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 h-9 rounded-lg
                               text-xs font-medium flex-shrink-0 transition-all
                               hover:brightness-125 active:scale-95"
                    style={{
                      background: 'rgba(6,182,212,0.12)',
                      color: '#06b6d4',
                      border: '1px solid rgba(6,182,212,0.25)',
                    }}
                    title={`${doc.name} 다운로드`}
                    aria-label={`${doc.name} 다운로드`}
                  >
                    <Download size={13} className="flex-shrink-0" />
                    {/* 텍스트: 모바일에서는 숨기고 아이콘만 / sm+에서 텍스트 표시 */}
                    <span className="hidden sm:inline whitespace-nowrap">다운로드</span>
                  </button>

                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
