import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './registerServiceWorker.ts'
import { migrateLocalStorageOnce } from './utils/migrateLocalStorageOnce.ts'

// React 마운트 전에 localStorage prefix 1회 마이그레이션 (youth-retreat-2026 → eum-camp).
// 기존 사용자의 인증·참가자·체크리스트 등 데이터를 새 prefix로 이전.
migrateLocalStorageOnce()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

registerServiceWorker()
