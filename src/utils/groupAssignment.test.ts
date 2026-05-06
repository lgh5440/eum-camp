import { describe, it, expect } from 'vitest';
import { isStudent } from './groupAssignment';
import type { Participant } from '../types';

const base: Participant = {
  id: 'x', name: 'X', church: 'c01', grade: '중1', gender: 'M',
  phone: '', parentPhone: '', dietType: 'normal',
  registeredAt: '2026-01-01', status: 'pending',
  fee: 'unpaid', feeAmount: 0,
};

describe('isStudent — 역할 기준 학생 판별', () => {
  it('role 미지정 + 학생 학년 → 학생', () => {
    expect(isStudent({ ...base, grade: '중1' })).toBe(true);
    expect(isStudent({ ...base, grade: '고2' })).toBe(true);
    expect(isStudent({ ...base, grade: '초등5' })).toBe(true);
    expect(isStudent({ ...base, grade: '청년' })).toBe(true);
  });

  it('role=학생 → 학생', () => {
    expect(isStudent({ ...base, role: '학생' })).toBe(true);
  });

  it('비학생 역할 → 학생 아님', () => {
    expect(isStudent({ ...base, role: '교사' })).toBe(false);
    expect(isStudent({ ...base, role: '학부모' })).toBe(false);
    expect(isStudent({ ...base, role: '운영진' })).toBe(false);
    expect(isStudent({ ...base, role: '찬양팀' })).toBe(false);
    expect(isStudent({ ...base, role: '자원봉사' })).toBe(false);
    expect(isStudent({ ...base, role: '진행위원' })).toBe(false);
  });

  it('레거시: grade에 역할명 들어 있어도 인식', () => {
    expect(isStudent({ ...base, grade: '교사' })).toBe(false);
    expect(isStudent({ ...base, grade: '진행위원' })).toBe(false);
  });
});
