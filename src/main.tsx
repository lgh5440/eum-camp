import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './registerServiceWorker.ts'
import { migrateLocalStorageOnce } from './utils/migrateLocalStorageOnce.ts'

// React 마운트 전에 localStorage prefix 1회 마이그레이션 (youth-retreat-2026 → eum-camp).
// 기존 사용자의 인증·참가자·체크리스트 등 데이터를 새 prefix로 이전.
migrateLocalStorageOnce()

// 새 deploy로 옛 청크가 사라졌을 때 자동 새로고침 (사용자가 수동 새로고침 안 해도 됨).
// Vite 6+ 의 vite:preloadError 이벤트 + lazy import 실패 안전망.
window.addEventListener('vite:preloadError', () => {
  if (!sessionStorage.getItem('eum-camp-reloaded')) {
    sessionStorage.setItem('eum-camp-reloaded', '1');
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

registerServiceWorker()
