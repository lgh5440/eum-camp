import { useEffect } from 'react';
import { X, FileText, AlertTriangle, AlertCircle } from 'lucide-react';
import type { Participant } from '../types';
import type { CsvParseResult } from '../utils/csvParser';

interface Props {
  result: CsvParseResult;
  churchMap: Record<string, string>;   // id → 교회명 (표시용)
  onConfirm: (participants: Participant[]) => void;
  onClose: () => void;
}

const FEE_LABEL: Record<Participant['fee'], string>   = { paid: '완납', partial: '면제', unpaid: '미납' };
const FEE_COLOR: Record<Participant['fee'], string>   = { paid: '#10b981', partial: '#8b5cf6', unpaid: '#ef4444' };
const ST_LABEL:  Record<Participant['status'], string> = { confirmed: '확정', pending: '대기', cancelled: '취소' };
const ST_COLOR:  Record<Participant['status'], string> = { confirmed: '#10b981', pending: '#f59e0b', cancelled: '#ef4444' };

export default function CsvImportModal({ result, churchMap, onConfirm, onClose }: Props) {
  const validRows = result.rows.filter(r => !r.isDuplicate);
  const dupRows   = result.rows.filter(r => r.isDuplicate);
  const hasDups   = dupRows.length > 0;
  const hasRows   = result.rows.length > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const stats = [
    { label: '총 읽은 행',   value: result.totalLines,       color: '#64748b' },
    { label: '추가 가능',    value: validRows.length,         color: '#10b981' },
    { label: '중복 의심',    value: dupRows.length,           color: '#f59e0b' },
    { label: '오류 행',      value: result.errorRows.length,  color: '#ef4444' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-[#E4ECF7] backdrop-blur-sm" onClick={onClose} />

      {/* 모바일 바텀시트 / 데스크탑 중앙 모달 */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="CSV 가져오기 결과"
          className="pointer-events-auto w-full sm:max-w-3xl rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh]"
          style={{
            background: 'linear-gradient(160deg, #0f1e3a 0%, #091525 100%)',
            border: '1px solid rgba(37, 99, 235,0.2)',
            boxShadow: '0 32px 72px rgba(0,0,0,0.75)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div
            className="sticky top-0 z-10 px-5 pt-4 pb-4 flex-shrink-0 rounded-t-3xl sm:rounded-t-2xl"
            style={{
              background: 'linear-gradient(160deg, #0f1e3a 0%, #091525 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="sm:hidden w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(37, 99, 235,0.15)', border: '1px solid rgba(37, 99, 235,0.25)' }}
                >
                  <FileText size={15} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1B3A5C]">CSV 가져오기 결과</h3>
                  <p className="text-xs text-slate-500 mt-0.5">내용을 확인하고 가져오기를 확정해 주세요</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors"
                aria-label="닫기"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Scrollable Body ── */}
          <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">

            {/* 요약 통계 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map(s => (
                <div
                  key={s.label}
                  className="rounded-xl p-3 text-center"
                  style={{ background: `${s.color}18`, border: `1px solid ${s.color}35` }}
                >
                  <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* 중복 안내 */}
            {hasDups && (
              <div
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
              >
                <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300 leading-relaxed">
                  <span className="font-semibold">{dupRows.length}명</span>이 기존 목록과 이름·교회·연락처가 동일합니다.
                  하단에서 중복 포함 여부를 선택해 주세요.
                </p>
              </div>
            )}

            {/* 미리보기 테이블 */}
            {result.rows.length === 0 && result.errorRows.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm">
                가져올 수 있는 데이터가 없습니다.
              </div>
            ) : (
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        {['이름', '교회', '구분', '학년', '성별', '참가비', '등록상태', '구분'].map((h, i) => (
                          <th key={i} className="px-3 py-2.5 text-left text-xs font-medium text-slate-400 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* 정상/중복 행 */}
                      {result.rows.map(row => (
                        <tr
                          key={row.rowIndex}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        >
                          <td className="px-3 py-2.5 text-sm text-[#1B3A5C] whitespace-nowrap font-medium">
                            {row.data.name}
                          </td>
                          <td className="px-3 py-2.5 text-sm text-slate-300 whitespace-nowrap">
                            {churchMap[row.data.church] || row.data.church}
                          </td>
                          <td className="px-3 py-2.5 text-sm text-slate-300 whitespace-nowrap">
                            {row.data.role ?? '학생'}
                          </td>
                          <td className="px-3 py-2.5 text-sm text-slate-300 whitespace-nowrap">
                            {row.data.grade}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className={`text-xs font-medium ${row.data.gender === 'M' ? 'text-blue-400' : 'text-pink-400'}`}>
                              {row.data.gender === 'M' ? '남' : '여'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ color: FEE_COLOR[row.data.fee], background: `${FEE_COLOR[row.data.fee]}20` }}
                            >
                              {FEE_LABEL[row.data.fee]}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ color: ST_COLOR[row.data.status], background: `${ST_COLOR[row.data.status]}20` }}
                            >
                              {ST_LABEL[row.data.status]}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {row.isDuplicate ? (
                              <span
                                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ color: '#fbbf24', background: 'rgba(245,158,11,0.18)' }}
                              >
                                <AlertTriangle size={9} />
                                중복
                              </span>
                            ) : (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ color: '#34d399', background: 'rgba(16,185,129,0.15)' }}
                              >
                                신규
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {/* 오류 행 */}
                      {result.errorRows.map(row => (
                        <tr
                          key={`err-${row.rowIndex}`}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        >
                          <td className="px-3 py-2.5 text-sm text-slate-500 whitespace-nowrap">
                            {row.data.name || `행 ${row.rowIndex}`}
                          </td>
                          <td colSpan={6} className="px-3 py-2.5">
                            <span
                              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ color: '#f87171', background: 'rgba(239,68,68,0.15)' }}
                            >
                              <AlertCircle size={9} />
                              오류: {row.errorMsg}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ color: '#f87171', background: 'rgba(239,68,68,0.15)' }}
                            >
                              제외
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div
            className="sticky bottom-0 px-5 py-4 flex flex-wrap items-center gap-2 flex-shrink-0"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.07)',
              background: 'linear-gradient(160deg, #0f1e3a 0%, #091525 100%)',
            }}
          >
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-[#1B3A5C] hover:bg-white/10 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.10)' }}
            >
              취소
            </button>

            <div className="flex-1" />

            {/* 중복 포함 버튼: 중복이 있을 때만 표시 */}
            {hasDups && hasRows && (
              <button
                onClick={() => onConfirm(result.rows.map(r => r.data))}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
                style={{
                  background: 'rgba(245,158,11,0.12)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  color: '#fbbf24',
                }}
              >
                중복 포함 ({result.rows.length}명)
              </button>
            )}

            {/* 중복 제외 / 가져오기 기본 버튼 */}
            {hasRows && (
              <button
                onClick={() => onConfirm(validRows.map(r => r.data))}
                disabled={validRows.length === 0}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#1B3A5C] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={
                  validRows.length > 0
                    ? { background: 'linear-gradient(90deg, #1B3A5C, #93C5FD)', boxShadow: '0 4px 16px rgba(37, 99, 235,0.3)' }
                    : { background: 'rgba(255,255,255,0.08)' }
                }
              >
                {hasDups
                  ? `중복 제외 가져오기 (${validRows.length}명)`
                  : `가져오기 (${validRows.length}명)`}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
