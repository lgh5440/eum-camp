import { useEffect, useState } from 'react';
import { Cloud, CloudOff, WifiOff } from 'lucide-react';
import { isCloudSyncEnabled } from '../services/cloudStore';

export default function ConnectionStatus() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const cloud = isCloudSyncEnabled();
  const tone  = !online ? '#f59e0b' : cloud ? '#10b981' : '#a78bfa';
  const label = !online ? '오프라인 저장 중' : cloud ? '온라인 동기화' : '체험 모드';
  const Icon  = !online ? WifiOff : cloud ? Cloud : CloudOff;
  const tip   = !online
    ? '연결되면 변경 사항을 다시 동기화합니다.'
    : cloud
      ? '모든 기기에 자동 동기화됩니다.'
      : '체험 모드 — 이 기기에만 저장됩니다. 다른 사람과 공유하려면 Firebase 설정이 필요합니다.';

  return (
    <span
      className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{
        color: tone,
        background: `${tone}18`,
        border: `1px solid ${tone}35`,
      }}
      title={tip}
    >
      <Icon size={11} aria-hidden="true" />
      {label}
    </span>
  );
}
