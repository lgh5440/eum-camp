import { describe, it, expect } from 'vitest';
import { feeStageDerive, legacyFeeToStage, feeShortLabel, feeFullLabel } from './feeLabels';
import type { Participant } from '../types';

const base: Participant = {
  id: 'x', name: 'X', church: 'c01', grade: '중1', gender: 'M',
  phone: '', parentPhone: '', dietType: 'normal',
  registeredAt: '2026-01-01', status: 'pending',
  fee: 'unpaid', feeAmount: 0,
};

describe('feeStageDerive', () => {
  it('가등록(pre) → partial 20,000원', () => {
    expect(feeStageDerive('pre')).toEqual({ bucket: 'partial', amount: 20000 });
  });
  it('1차(first) → paid 60,000원', () => {
    expect(feeStageDerive('first')).toEqual({ bucket: 'paid', amount: 60000 });
  });
  it('2차(second) → paid 70,000원', () => {
    expect(feeStageDerive('second')).toEqual({ bucket: 'paid', amount: 70000 });
  });
  it('미납(unpaid) → unpaid 0원', () => {
    expect(feeStageDerive('unpaid')).toEqual({ bucket: 'unpaid', amount: 0 });
  });
  it('면제(exempt) → paid 0원', () => {
    expect(feeStageDerive('exempt')).toEqual({ bucket: 'paid', amount: 0 });
  });
});

describe('legacyFeeToStage (기존 데이터 추정)', () => {
  it('feeStage 있으면 그대로', () => {
    expect(legacyFeeToStage({ ...base, feeStage: 'first' })).toBe('first');
  });
  it('fee=unpaid → unpaid', () => {
    expect(legacyFeeToStage({ ...base, fee: 'unpaid' })).toBe('unpaid');
  });
  it('fee=partial → pre (가등록 추정)', () => {
    expect(legacyFeeToStage({ ...base, fee: 'partial' })).toBe('pre');
  });
  it('fee=paid + 0원 → exempt (면제)', () => {
    expect(legacyFeeToStage({ ...base, fee: 'paid', feeAmount: 0 })).toBe('exempt');
  });
  it('fee=paid + 60,000 이하 → first', () => {
    expect(legacyFeeToStage({ ...base, fee: 'paid', feeAmount: 60000 })).toBe('first');
  });
  it('fee=paid + 60,000 초과 → second', () => {
    expect(legacyFeeToStage({ ...base, fee: 'paid', feeAmount: 70000 })).toBe('second');
  });
});

describe('feeShortLabel / feeFullLabel', () => {
  it('feeStage 있으면 5단계 라벨', () => {
    const p = { ...base, feeStage: 'pre' as const };
    expect(feeShortLabel(p)).toBe('가등록');
    expect(feeFullLabel(p)).toContain('가등록');
  });
  it('feeStage 없으면 3-bucket 라벨로 fallback', () => {
    expect(feeShortLabel({ ...base, fee: 'unpaid' })).toBe('미납');
    expect(feeShortLabel({ ...base, fee: 'paid' })).toBe('완납');
  });
});
