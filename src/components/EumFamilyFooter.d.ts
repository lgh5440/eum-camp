// ⚠️ 자동 생성 파일 — 직접 수정 금지.
// 마스터: _eum-family/shared/EumFamilyFooter.d.ts
// 자동 생성: TS 프로젝트(eum-camp)에서 .jsx import 시 타입 선언.
import type { EumAppKey } from '../data/eumFamily';

export interface EumFamilyFooterProps {
  currentApp: EumAppKey;
  variant?: 'footer' | 'cta';
  size?: 'compact' | 'normal';
}

declare const EumFamilyFooter: (props: EumFamilyFooterProps) => JSX.Element;
export default EumFamilyFooter;
