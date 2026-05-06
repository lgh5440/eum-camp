// 이음 패밀리 앱 푸터 — 3개 앱 공통 광고 카드.
// 현재 앱 키만 받으면 자동으로 자기 자신은 비활성, 나머지 2개만 카드로 노출.

import { EUM_FAMILY, buildEumFamilyUrl, type EumAppKey } from '../data/eumFamily';

interface Props {
  currentApp: EumAppKey;
  variant?: 'footer' | 'cta';   // footer: 3개 모두 표시(현재 앱 회색), cta: 다른 2개만 강조
}

export default function EumFamilyFooter({ currentApp, variant = 'footer' }: Props) {
  const items = variant === 'cta'
    ? EUM_FAMILY.filter(app => app.key !== currentApp)
    : EUM_FAMILY;

  const heading = variant === 'cta' ? '✨ 이음 패밀리 다른 앱도 만나보세요' : '이음 패밀리 앱';
  const subText = variant === 'cta'
    ? '같은 E:UM 브랜드의 다른 도구들이에요. 마음에 드는 앱을 클릭해 보세요.'
    : '하나님과 사람을, 사람과 사람을 잇다 — E:UM';

  return (
    <section
      aria-label="이음 패밀리 앱"
      className="w-full mt-8 rounded-2xl p-5"
      style={{
        background: 'linear-gradient(150deg, #0d1b3e 0%, #1a1050 50%, #1e3a8a 100%)',
        border: '1px solid rgba(252,211,77,0.25)',
        boxShadow: '0 8px 28px rgba(13,27,62,0.45)',
      }}
    >
      <header className="mb-4">
        <h3
          className="font-black text-base mb-1"
          style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #a16207 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {heading}
        </h3>
        <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {subText}
        </p>
      </header>

      <div className={`grid gap-2 ${items.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {items.map(app => {
          const isCurrent = app.key === currentApp;
          const href = isCurrent ? undefined : buildEumFamilyUrl(app, currentApp, variant);

          const card = (
            <div
              className="h-full rounded-xl p-3 flex flex-col items-center text-center transition-transform"
              style={{
                background: isCurrent
                  ? 'rgba(255,255,255,0.04)'
                  : `linear-gradient(140deg, rgba(255,255,255,0.06), ${app.accent}1f)`,
                border: `1px solid ${isCurrent ? 'rgba(255,255,255,0.08)' : `${app.accent}55`}`,
                opacity: isCurrent ? 0.45 : 1,
              }}
            >
              <span aria-hidden style={{ fontSize: 30, marginBottom: 6 }}>{app.emoji}</span>
              <p
                className="font-black text-[13px] leading-tight"
                style={{ color: isCurrent ? 'rgba(255,255,255,0.6)' : '#fff' }}
              >
                {app.name}
              </p>
              <p
                className="text-[11px] mt-1 leading-snug"
                style={{ color: isCurrent ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)' }}
              >
                {app.tagline}
              </p>
              {isCurrent && (
                <span
                  className="mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
                >
                  현재 앱
                </span>
              )}
            </div>
          );

          return href ? (
            <a
              key={app.key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${app.name} 열기 — ${app.tagline}`}
              className="block hover:scale-[1.03] active:scale-95 transition-transform"
            >
              {card}
            </a>
          ) : (
            <div key={app.key} aria-current="page">{card}</div>
          );
        })}
      </div>
    </section>
  );
}
