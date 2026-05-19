// ⚠️ 자동 생성 파일 — 직접 수정 금지.
// 마스터: _eum-family/shared/EumFamilyFooter.jsx
// 갱신: node _eum-family/scripts/sync-eum-family.mjs
// 이음 패밀리 앱 푸터 — 3개 React 앱 공통 광고 카드.
// SSOT: 이 파일이 마스터. 사용처는 자동 생성됨.
//
// props:
//   currentApp : 'talentroad' | 'myrealid' | 'eumplay'
//   variant    : 'footer' (3개 모두 표시, 현재 앱 회색) | 'cta' (다른 2개만 강조). default 'footer'
//   size       : 'compact' (게임 화면 등 작은 영역) | 'normal' (대시보드 등). default 'normal'

import { EUM_FAMILY, buildEumFamilyUrl } from '../data/eumFamily'

const SIZE = {
  compact: {
    section: 'w-full mt-6 rounded-2xl p-4',
    headerMb: 'mb-3',
    heading: 'font-black text-sm mb-1',
    sub: 'text-[11px] leading-relaxed',
    cardPad: 'h-full rounded-xl p-2.5 flex flex-col items-center text-center transition-transform',
    emoji: { fontSize: 26, marginBottom: 4 },
    name: 'font-black text-[12px] leading-tight',
    tagline: 'text-[10px] mt-1 leading-snug',
    badge: 'mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider',
  },
  normal: {
    section: 'w-full mt-8 rounded-2xl p-5',
    headerMb: 'mb-4',
    heading: 'font-black text-base mb-1',
    sub: 'text-[12px] leading-relaxed',
    cardPad: 'h-full rounded-xl p-3 flex flex-col items-center text-center transition-transform',
    emoji: { fontSize: 30, marginBottom: 6 },
    name: 'font-black text-[13px] leading-tight',
    tagline: 'text-[11px] mt-1 leading-snug',
    badge: 'mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider',
  },
}

const EMOJI_FONT =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", emoji'

export default function EumFamilyFooter({ currentApp, variant = 'footer', size = 'normal' }) {
  const s = SIZE[size] || SIZE.normal
  const items = variant === 'cta' ? EUM_FAMILY.filter((app) => app.key !== currentApp) : EUM_FAMILY

  const heading = variant === 'cta' ? '✨ 이음 패밀리 다른 앱도 만나보세요' : '이음 패밀리 앱'
  const subText =
    variant === 'cta'
      ? '같은 E:UM 브랜드의 다른 도구들이에요. 마음에 드는 앱을 클릭해 보세요.'
      : '하나님과 사람을, 사람과 사람을 잇다 — E:UM'

  return (
    <section
      aria-label="이음 패밀리 앱"
      className={s.section}
      style={{
        background: 'linear-gradient(150deg, #0d1b3e 0%, #1a1050 50%, #1e3a8a 100%)',
        border: '1px solid rgba(252,211,77,0.25)',
        boxShadow: '0 8px 28px rgba(13,27,62,0.45)',
      }}
    >
      <header className={s.headerMb}>
        <h3
          className={s.heading}
          style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #a16207 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {heading}
        </h3>
        <p className={s.sub} style={{ color: 'rgba(255,255,255,0.7)' }}>
          {subText}
        </p>
      </header>

      <p
        className="mt-3 text-center text-[11px]"
        style={{ color: 'rgba(255,255,255,0.55)' }}
      >
        오류 신고 · 문의 :{' '}
        <a
          href="mailto:lgh544092@gmail.com?subject=%5BE%3AUM%20%ED%8C%A8%EB%B0%80%EB%A6%AC%5D%20%EB%AC%B8%EC%9D%98%C2%B7%EC%98%A4%EB%A5%98%20%EC%A0%9C%EB%B3%B4"
          style={{
            color: 'rgba(252,211,77,0.9)',
            textDecoration: 'underline',
            textUnderlineOffset: 4,
          }}
        >
          lgh544092@gmail.com
        </a>
      </p>

      <div className={`grid gap-2 ${items.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`} style={{ marginTop: 8 }}>
        {items.map((app) => {
          const isCurrent = app.key === currentApp
          const href = isCurrent ? undefined : buildEumFamilyUrl(app, currentApp, variant)

          const card = (
            <div
              className={s.cardPad}
              style={{
                background: isCurrent
                  ? 'rgba(255,255,255,0.04)'
                  : `linear-gradient(140deg, rgba(255,255,255,0.06), ${app.accent}1f)`,
                border: `1px solid ${isCurrent ? 'rgba(255,255,255,0.08)' : `${app.accent}55`}`,
                opacity: isCurrent ? 0.45 : 1,
              }}
            >
              <span
                aria-hidden
                style={{
                  fontSize: s.emoji.fontSize,
                  marginBottom: s.emoji.marginBottom,
                  fontFamily: EMOJI_FONT,
                  lineHeight: 1,
                }}
              >
                {app.emoji}
              </span>
              <p
                className={s.name}
                style={{ color: isCurrent ? 'rgba(255,255,255,0.6)' : '#fff' }}
              >
                {app.name}
              </p>
              <p
                className={s.tagline}
                style={{ color: isCurrent ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)' }}
              >
                {app.tagline}
              </p>
              {isCurrent && (
                <span
                  className={s.badge}
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
                >
                  현재 앱
                </span>
              )}
            </div>
          )

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
            <div key={app.key} aria-current="page">
              {card}
            </div>
          )
        })}
      </div>
    </section>
  )
}
