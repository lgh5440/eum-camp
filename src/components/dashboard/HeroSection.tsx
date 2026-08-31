// 대시보드 영웅 영역 — 행사 제목·테마·날짜·장소 표시 + E:UM 로고 워터마크
import { MapPin, Calendar } from 'lucide-react';
import { EVENT } from '../../data/eventInfo';
import { EUM_BRAND } from '../../data/eumBrand';

interface DdayInfo { text: string; color: string; bg: string; border: string }

export default function HeroSection({ dday }: { dday: DdayInfo }) {
  return (
    <div className="relative rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(31,95,217,0.16) 0%, rgba(27,58,92,0.45) 50%, rgba(15,37,64,0.55) 100%)',
        border: '1px solid rgba(47,115,242,0.25)',
        boxShadow: '0 0 80px rgba(31,95,217,0.08)',
      }}>
      <div className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(31,95,217,0.14) 0%, transparent 65%)' }}/>
      <div className="absolute -bottom-20 -left-12 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(47,115,242,0.10) 0%, transparent 60%)' }}/>
      <div className="relative z-10 flex items-center justify-between gap-4 sm:gap-6 px-5 sm:px-10 py-6 sm:py-10">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1' }}>
              {EVENT.title}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-black tracking-wide"
              style={{ background: dday.bg, border: `1px solid ${dday.border}`, color: dday.color }}>
              {dday.text}
            </span>
          </div>
          <h1 className="font-black text-[#101A3D] tracking-tight leading-none mb-2"
            style={{ fontSize: 'clamp(1.6rem, 5vw, 4rem)' }}>{EVENT.theme}</h1>
          <p className="font-bold" style={{ color: 'var(--eum-gold)', fontSize: 'clamp(0.85rem, 2vw, 1.25rem)' }}>
            {EVENT.subTheme}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs sm:text-sm text-slate-300">
            <span className="flex items-center gap-1.5">
              <MapPin size={13} style={{ color: 'var(--eum-gold)' }} className="flex-shrink-0"/>{EVENT.venue}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={13} style={{ color: 'var(--eum-gold)' }} className="flex-shrink-0"/>{EVENT.dates}
            </span>
          </div>
        </div>
        {EVENT.heroImage ? (
          <div
            className="hidden md:block flex-shrink-0 rounded-2xl overflow-hidden"
            style={{
              width: 280, height: 180,
              backgroundImage: `url(${EVENT.heroImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid rgba(47,115,242,0.18)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            }}
            aria-label="행사 메인 이미지"
          />
        ) : (
          <EumLogoBadge/>
        )}
      </div>
    </div>
  );
}

function EumLogoBadge() {
  return (
    <div className="hidden md:flex items-center justify-center flex-shrink-0">
      <img
        src={EUM_BRAND.logoUrl}
        alt={EUM_BRAND.name}
        className="w-32 h-32 lg:w-40 lg:h-40 object-contain opacity-90"
        style={{ filter: 'drop-shadow(0 0 24px rgba(47,115,242,0.45))' }}
      />
    </div>
  );
}


