import { describe, it, expect } from 'vitest';
import { parseParticipantsCSV } from './csvParser';

const churchMap = { '샘플제일교회': 'c01', '샘플중앙교회': 'c02' };

describe('parseParticipantsCSV — 구글폼 응답 시트 헤더 인식', () => {
  it('표준 헤더 인식', () => {
    const csv = '이름,교회,학년,성별,연락처\n홍길동,샘플제일교회,중1,남,010-1234-5678';
    const r = parseParticipantsCSV(csv, [], churchMap);
    expect(r.totalLines).toBe(1);
    expect(r.recognizedHeaders).toContain('name');
    expect(r.recognizedHeaders).toContain('church');
    expect(r.rows[0].data.name).toBe('홍길동');
    expect(r.rows[0].data.church).toBe('c01');
  });

  it('구글폼 질문 텍스트 헤더 인식 (키워드 fallback)', () => {
    const csv = [
      '타임스탬프,이름을 적어주세요.,교회명을 기입해주세요.,성별을 적어주세요!,연락처,참가비 납부 여부',
      '2026-01-01,성춘향,샘플중앙교회,여,010-1111-2222,1차 등록 6만원',
    ].join('\n');
    const r = parseParticipantsCSV(csv, [], churchMap);
    expect(r.totalLines).toBe(1);
    expect(r.recognizedHeaders).toContain('name');
    expect(r.recognizedHeaders).toContain('church');
    expect(r.recognizedHeaders).toContain('gender');
    expect(r.recognizedHeaders).toContain('fee');
    expect(r.rows[0].data.name).toBe('성춘향');
  });

  it('타임스탬프·여행자 보험·휴대폰 정책은 무시', () => {
    const csv = '타임스탬프,여행자 보험 관련 안내,핸드폰 관리 정책,이름,교회\n2026,확인,확인,A,샘플제일교회';
    const r = parseParticipantsCSV(csv, [], churchMap);
    expect(r.unrecognizedHeaders).toHaveLength(0);
  });

  it('5단계 참가비 라벨 인식 → fee/feeAmount/feeStage 모두 동기화', () => {
    const csv = '이름,교회,참가비\n학생,샘플제일교회,1차 등록 6만원';
    const r = parseParticipantsCSV(csv, [], churchMap);
    expect(r.rows[0].data.feeStage).toBe('first');
    expect(r.rows[0].data.fee).toBe('paid');
    expect(r.rows[0].data.feeAmount).toBe(60000);
  });

  it('가등록 2만원 인식', () => {
    const csv = '이름,교회,참가비\n학생,샘플제일교회,가등록금 2만원';
    const r = parseParticipantsCSV(csv, [], churchMap);
    expect(r.rows[0].data.feeStage).toBe('pre');
    expect(r.rows[0].data.feeAmount).toBe(20000);
  });

  it('자원봉사·찬양팀·진행팀 → 면제', () => {
    const csv = '이름,교회,참가비\n봉사자,샘플제일교회,자원봉사/찬양팀/진행팀';
    const r = parseParticipantsCSV(csv, [], churchMap);
    expect(r.rows[0].data.feeStage).toBe('exempt');
    expect(r.rows[0].data.feeAmount).toBe(0);
  });

  it('보호자 연락처와 본인 연락처 구분', () => {
    const csv = '이름,교회,연락처,보호자 연락처\n학생,샘플제일교회,010-1111-1111,010-2222-2222';
    const r = parseParticipantsCSV(csv, [], churchMap);
    expect(r.rows[0].data.phone).toBe('010-1111-1111');
    expect(r.rows[0].data.parentPhone).toBe('010-2222-2222');
  });

  it('알레르기 상세 vs 식단/알레르기 여부 구분', () => {
    const csv = '이름,교회,식단/알레르기 여부,알레르기 상세\nA,샘플제일교회,알레르기 있음,땅콩';
    const r = parseParticipantsCSV(csv, [], churchMap);
    expect(r.rows[0].data.dietType).toBe('allergy');
    expect(r.rows[0].data.allergies).toBe('땅콩');
  });

  it('필수 필드 누락 시 errorRows', () => {
    const csv = '이름,교회\n,샘플제일교회';
    const r = parseParticipantsCSV(csv, [], churchMap);
    expect(r.errorRows).toHaveLength(1);
    expect(r.errorRows[0].errorMsg).toContain('이름');
  });

  it('역할 인식 — 진행위원·자원봉사·찬양팀', () => {
    const csv = '이름,교회,구분\nA,샘플제일교회,진행위원\nB,샘플제일교회,자원봉사\nC,샘플제일교회,찬양팀';
    const r = parseParticipantsCSV(csv, [], churchMap);
    expect(r.rows[0].data.role).toBe('진행위원');
    expect(r.rows[1].data.role).toBe('자원봉사');
    expect(r.rows[2].data.role).toBe('찬양팀');
  });
});
