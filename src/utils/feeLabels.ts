// 참가비 5단계 ↔ 3-bucket 통합 헬퍼.
// feeStage(있을 때)를 우선 표시하고, 없으면 3-bucket fee로 fallback.
// 모든 페이지(참가자 관리·교회별·상세 모달·신청서·CSV)에서 같은 라벨/색상 보장.

import type { Participant } from '../types';

export type FeeStage = NonNullable<Participant['feeStage']>;

export interface FeeStageInfo {
  value: FeeStage;
  label:    string;        // 신청서·운영자 폼용 풀 라벨
  shortLabel: string;      // 표/배지용 짧은 라벨
  hint:     string;        // 신청서 도움말
  amount:   number;        // 자동 책정 금액
  bucket:   Participant['fee'];
  color:    string;        // 표시 색
}

export const FEE_STAGES: readonly FeeStageInfo[] = [
  { value: 'pre',    label: '가등록 (2만원 입금)',          shortLabel: '가등록',  hint: '1차 마감 전 미리 입금하면 1차 등록(6만원) 혜택 적용', amount: 20000, bucket: 'partial', color: '#0ea5e9' },
  { value: 'first',  label: '1차 등록 (6만원 완납)',        shortLabel: '1차',     hint: '6월 30일까지 완납 — 가장 저렴한 등록',                amount: 60000, bucket: 'paid',    color: '#10b981' },
  { value: 'second', label: '2차 등록 (7만원 완납)',        shortLabel: '2차',     hint: '7월 26일까지 완납',                                   amount: 70000, bucket: 'paid',    color: '#22c55e' },
  { value: 'unpaid', label: '아직 입금 전',                   shortLabel: '미납',    hint: '신청만 먼저 — 입금은 나중에',                         amount: 0,     bucket: 'unpaid',  color: '#ef4444' },
  { value: 'exempt', label: '회비 면제 (자원봉사·찬양팀·진행팀)', shortLabel: '면제',    hint: '봉사자는 회비를 내지 않습니다',                       amount: 0,     bucket: 'paid',    color: '#8b5cf6' },
] as const;

const STAGE_BY_VALUE = new Map<FeeStage, FeeStageInfo>(FEE_STAGES.map(s => [s.value, s]));

export function getFeeStage(p: Participant): FeeStageInfo | undefined {
  if (!p.feeStage) return undefined;
  return STAGE_BY_VALUE.get(p.feeStage);
}

// 3-bucket(fee) 단독으로만 정보가 있을 때의 표시값
const BUCKET_LABEL: Record<Participant['fee'], string> = {
  paid:    '완납',
  partial: '부분납',
  unpaid:  '미납',
};
const BUCKET_COLOR: Record<Participant['fee'], string> = {
  paid:    '#10b981',
  partial: '#f59e0b',
  unpaid:  '#ef4444',
};

/** 표·배지에 쓰는 짧은 라벨 (feeStage 우선, 없으면 bucket) */
export function feeShortLabel(p: Participant): string {
  return getFeeStage(p)?.shortLabel ?? BUCKET_LABEL[p.fee];
}

/** 모달·상세에 쓰는 풀 라벨 */
export function feeFullLabel(p: Participant): string {
  return getFeeStage(p)?.label ?? BUCKET_LABEL[p.fee];
}

/** 표시 색 */
export function feeColor(p: Participant): string {
  return getFeeStage(p)?.color ?? BUCKET_COLOR[p.fee];
}

/** 단계 → fee bucket + 금액 자동 산출 (운영자 폼용) */
export function feeStageDerive(stage: FeeStage): { bucket: Participant['fee']; amount: number } {
  const info = STAGE_BY_VALUE.get(stage);
  return info ? { bucket: info.bucket, amount: info.amount } : { bucket: 'unpaid', amount: 0 };
}

/** 기존 3-bucket fee 만 있는 레거시 데이터를 5단계로 추정 (편집 모달 진입 시) */
export function legacyFeeToStage(p: Participant): FeeStage {
  if (p.feeStage) return p.feeStage;
  if (p.fee === 'unpaid') return 'unpaid';
  if (p.fee === 'partial') return 'pre';
  // paid: 금액으로 추정 (60K=first, 70K=second, 0=exempt, 그 외=second)
  if (p.feeAmount === 0)   return 'exempt';
  if (p.feeAmount <= 60000) return 'first';
  return 'second';
}
