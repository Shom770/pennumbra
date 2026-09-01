"use client";

/* Pennumbra — LandingPage component (hero only: animated sky, nav, rating lockup, metric rings, CTAs).
   TypeScript React. Drop into any React app: import LandingPage from './LandingPage';
   <LandingPage score={78} defaultMode="sunset" onFindSpot={() => ...} onBehindRating={() => ...} />
   Fonts are loaded globally by the root layout. */

import React, { useState } from 'react';

type Mode = 'sunset' | 'sunrise';
type Tier = 'BUST' | 'DUD' | 'MEH' | 'GREAT' | 'BANGER';

interface LandingPageProps {
  /** 1-100; drives the tier word, sky mood, and score ring */
  score?: number;
  defaultMode?: Mode;
  onBehindRating?: (e: React.MouseEvent) => void;
  onFindSpot?: (e: React.MouseEvent) => void;
}

interface Star { top: string; left: string; s: number; dur: number; delay: number; c: string; }
type CloudEllipse = [cx: number, cy: number, rx: number, ry: number, fill: string, filterId: number];
type Cloud = [top: string, widthVw: number, heightVh: number, durS: number, delayS: number, ellipses: CloudEllipse[]];
type Light = [x: number, y: number, opacity: number];
interface ModeData { kicker: string; score: number; ring2Val: string; ring2Label: string; ring3Val: string; ring3Label: string; }
interface SkyMood { g: number; s: number; blaze?: number; }

const KEYFRAMES = `
@keyframes pn-drift { from { transform: translateX(-50vw); } to { transform: translateX(115vw); } }
@keyframes pn-twinkle { 0%,100% { opacity: .9; } 50% { opacity: .1; } }
@keyframes pn-sunBreathe { 0%,100% { transform: translateX(-50%) scale(1); } 50% { transform: translateX(-50%) scale(1.06); } }
`;

const STARS: Star[] = [
  { top: '6%', left: '12%', s: 3, dur: 3.2, delay: 0, c: '#fff' },
  { top: '12%', left: '31%', s: 2, dur: 4.1, delay: .8, c: '#ffe9d0' },
  { top: '5%', left: '57%', s: 2, dur: 2.7, delay: .4, c: '#fff' },
  { top: '15%', left: '72%', s: 3, dur: 3.8, delay: 1.4, c: '#ffd9e8' },
  { top: '8%', left: '87%', s: 2, dur: 3, delay: 2, c: '#fff' },
  { top: '20%', left: '46%', s: 2, dur: 4.6, delay: 1.1, c: '#ffe9d0' },
];

// [top, width(vw), height(vh), duration(s), delay(s), ellipses: [cx, cy, rx, ry, fill, filterId]]
const CLOUDS: Cloud[] = [
  ['13%', 48, 15, 95, -20, [[420, 150, 300, 38, 'rgba(255,210,140,.28)', 1], [560, 112, 170, 26, 'rgba(255,232,170,.2)', 2]]],
  ['28%', 58, 16, 135, -70, [[450, 140, 340, 34, 'rgba(255,190,130,.24)', 3], [300, 180, 200, 24, 'rgba(245,180,120,.18)', 2]]],
  ['43%', 40, 12, 78, -40, [[440, 130, 280, 30, 'rgba(255,215,150,.3)', 1]]],
  ['56%', 64, 14, 155, -110, [[430, 140, 330, 36, 'rgba(235,170,120,.24)', 3], [620, 170, 180, 22, 'rgba(255,195,130,.18)', 1]]],
  ['6%', 34, 10, 115, -90, [[450, 130, 260, 26, 'rgba(250,222,165,.16)', 2]]],
  ['20%', 52, 13, 125, -100, [[440, 140, 310, 32, 'rgba(255,205,150,.22)', 3]]],
  ['37%', 44, 12, 100, -55, [[430, 130, 290, 28, 'rgba(255,220,160,.2)', 1], [600, 160, 160, 20, 'rgba(255,200,140,.16)', 2]]],
  ['50%', 36, 10, 88, -25, [[450, 135, 250, 24, 'rgba(250,210,155,.24)', 3]]],
  ['10%', 46, 13, 105, -5, [[440, 140, 300, 32, 'rgba(255,215,155,.24)', 2]]],
  ['24%', 40, 11, 92, -46, [[450, 130, 270, 28, 'rgba(255,200,145,.2)', 1]]],
  ['33%', 56, 14, 140, -128, [[430, 140, 330, 34, 'rgba(250,195,135,.22)', 3]]],
  ['47%', 42, 11, 82, -62, [[440, 135, 280, 26, 'rgba(255,210,150,.26)', 1]]],
  ['60%', 48, 12, 118, -30, [[450, 140, 300, 30, 'rgba(240,185,140,.2)', 2]]],
];

// Window lights: [x, y, opacity], all 4x5 rects
const LIGHTS: Light[] = [
  [538, 70, .75], [550, 70, .35], [538, 84, .5], [550, 84, .8], [538, 98, .3], [550, 98, .6],
  [744, 52, .7], [756, 52, .4], [768, 52, .85], [744, 66, .3], [756, 66, .6], [768, 66, .25],
  [744, 80, .5], [756, 80, .75], [768, 80, .35], [744, 94, .25], [756, 94, .45], [768, 94, .65],
  [956, 34, .8], [968, 34, .35], [956, 48, .55], [968, 48, .7], [956, 62, .25], [968, 62, .5],
  [956, 76, .65], [968, 76, .3], [956, 90, .4], [968, 90, .75], [956, 104, .6], [968, 104, .25],
  [1196, 78, .6], [1208, 78, .35], [1196, 92, .3], [1208, 92, .7],
  [234, 78, .55], [246, 78, .3], [234, 92, .7], [246, 92, .4], [234, 106, .35], [246, 106, .6],
  [430, 86, .6], [442, 86, .3], [430, 100, .35], [442, 100, .7],
  [118, 94, .5], [130, 94, .3], [118, 108, .65], [130, 108, .35],
  [862, 74, .55], [874, 74, .3], [862, 88, .35], [874, 88, .65],
  [652, 88, .5], [664, 88, .3], [652, 102, .6], [664, 102, .35],
];

const SKYLINE_BACK = 'M0,160 L0,110 L50,110 L58,102 L96,102 L104,110 L150,110 L150,88 L160,80 L200,80 L210,88 L210,110 L280,110 L280,72 L296,58 L312,72 L312,110 L360,110 L360,96 L430,96 L430,110 L490,110 L490,64 L500,64 L500,54 L540,54 L540,110 L610,110 L610,90 L618,82 L680,82 L688,90 L688,110 L760,110 L760,50 L800,38 L800,110 L860,110 L860,98 L930,98 L930,110 L990,110 L990,68 L1000,60 L1040,60 L1050,68 L1050,110 L1120,110 L1120,92 L1190,92 L1190,110 L1250,110 L1250,76 L1266,62 L1282,76 L1282,110 L1350,110 L1358,102 L1400,102 L1408,110 L1440,110 L1440,160 Z';

const SKYLINE_FRONT = 'M0,160 L0,126 L28,126 L28,116 L34,112 L40,116 L40,126 L96,126 L96,98 L128,74 L160,90 L160,126 L214,126 L214,72 L224,72 L224,60 L262,60 L262,72 L272,72 L272,126 L330,126 L330,72 L338,66 L372,66 L380,72 L380,126 L418,126 L418,68 L438,42 L458,68 L458,126 L512,126 L512,70 L524,70 L524,54 L548,26 L572,54 L572,70 L584,70 L584,126 L642,126 L642,80 L668,80 L668,68 L676,68 L676,80 L692,80 L692,126 L724,126 L724,34 L730,30 L788,30 L794,34 L794,126 L846,126 L846,52 L852,46 L892,46 L900,52 L900,126 L930,126 L930,24 L938,16 L996,16 L1004,24 L1004,126 L1058,126 L1058,96 L1076,96 L1076,44 L1082,44 L1082,36 L1100,36 L1100,44 L1106,44 L1106,96 L1122,96 L1122,126 L1176,126 L1176,66 L1236,50 L1236,126 L1288,126 L1288,66 L1330,66 L1336,72 L1336,126 L1372,126 L1372,116 L1380,112 L1388,116 L1388,126 L1440,126 L1440,160 Z';

const DATA: Record<Mode, ModeData> = {
  sunset: {
    kicker: "tonight's sunset", score: 78,
    ring2Val: '6:58 pm', ring2Label: 'GOLDEN HOUR', ring3Val: '7:31 pm', ring3Label: 'SUNSET',
  },
  sunrise: {
    kicker: "tomorrow's sunrise", score: 58,
    ring2Val: '6:26 am', ring2Label: 'SUNRISE', ring3Val: '6:59 am', ring3Label: 'GOLDEN ENDS',
  },
};

const TIERS: Tier[] = ['BUST', 'DUD', 'MEH', 'GREAT', 'BANGER'];
const SKY: Record<Tier, SkyMood> = { BUST: { g: .9, s: .1 }, DUD: { g: .68, s: .3 }, MEH: { g: .42, s: .55 }, GREAT: { g: 0, s: 1 }, BANGER: { g: 0, s: 1, blaze: .8 } };
const TINT: Record<Tier, string> = { BUST: '150,145,165', DUD: '178,165,170', MEH: '214,178,150', GREAT: '255,209,102', BANGER: '255,140,92' };

interface RingBadgeProps { val: string; label: string; ringColor: string; id: string; grad: string; }

function RingBadge({ val, label, ringColor, id, grad }: RingBadgeProps) {
  const r = 47, cx = 50, cy = 50;
  const arcLen = label.length * 6.6 + 12;
  const half = Math.min(arcLen / (2 * r), 1.25);
  const sx = cx - r * Math.sin(half), ex = cx + r * Math.sin(half), y = cy - r * Math.cos(half);
  const ring = `M ${sx.toFixed(1)},${y.toFixed(1)} A ${r} ${r} 0 1 0 ${ex.toFixed(1)},${y.toFixed(1)}`;
  return (
    <div style={{ position: 'relative', width: 118, height: 118 }}>
      <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', background: grad, backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', display: 'block' }}>
        <path d={ring} fill="none" stroke={ringColor} strokeWidth="1.6" />
        <path id={'lblArc' + id} d="M 3,50 A 47 47 0 0 1 97,50" fill="none" />
        <text style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.6px', fill: ringColor, fontFamily: "var(--font-rethink), sans-serif" }}>
          <textPath href={'#lblArc' + id} startOffset="50%" textAnchor="middle">{label}</textPath>
        </text>
        <text x="50" y="55" textAnchor="middle" style={{ fontSize: 17, fontWeight: 500, fill: '#fff6e8', fontFamily: "var(--font-figtree), sans-serif" }}>{val}</text>
      </svg>
    </div>
  );
}

export default function LandingPage({ score: scoreProp = 78, defaultMode = 'sunset', onBehindRating, onFindSpot }: LandingPageProps) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const d = DATA[mode];
  const score = Math.max(1, Math.min(100, Math.round(scoreProp ?? d.score)));
  const tier = TIERS[Math.min(4, Math.max(0, Math.ceil(score / 20) - 1))];
  const sky = SKY[tier];
  const tint = TINT[tier];
  const ringGrad = `radial-gradient(circle, rgba(${tint},.38) 0%, rgba(${tint},.16) 55%, rgba(${tint},0) 75%)`;
  const pill = (active: boolean): React.CSSProperties => ({
    border: 'none', cursor: 'pointer', borderRadius: 999, padding: '7px 16px',
    fontFamily: "var(--font-rethink), sans-serif", fontWeight: 700, fontSize: 13, transition: 'all .3s',
    background: active ? '#fff2e2' : 'transparent', color: active ? '#3a1440' : '#fff2e2',
  });

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#140d2e', color: '#f5ecff', fontFamily: "var(--font-rethink), sans-serif" }}>
      <style>{KEYFRAMES}</style>
      {/* sky gradients */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #1f1a3f 0%, #342857 32%, #663f6e 55%, #b0656b 72%, #dc8e70 85%, #eec295 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #121e38 0%, #29406b 34%, #66628e 56%, #c48d97 75%, #e8bb8d 89%, #f2ddad 100%)', opacity: mode === 'sunrise' ? 1 : 0, transition: 'opacity 1.6s ease' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #1a0f45 0%, #3d1b6b 30%, #8a2d6e 54%, #e0485c 72%, #ff8a4d 86%, #ffd08a 100%)', opacity: sky.blaze || 0, transition: 'opacity 1.6s ease' }} />
      {/* stars */}
      {STARS.map((st, i) => (
        <div key={i} style={{ position: 'absolute', top: st.top, left: st.left, width: st.s, height: st.s, borderRadius: '50%', background: st.c, animation: `pn-twinkle ${st.dur}s ease-in-out ${st.delay}s infinite` }} />
      ))}
      {/* sun */}
      <div style={{ position: 'absolute', bottom: '-7vh', left: '50%', width: '34vh', height: '34vh', borderRadius: '50%', background: 'radial-gradient(circle, #fff3d6 0%, #ffd166 34%, rgba(255,158,100,.5) 60%, rgba(255,126,95,0) 72%)', animation: 'pn-sunBreathe 7s ease-in-out infinite', transform: 'translateX(-50%)', opacity: sky.s, transition: 'opacity 1.6s ease' }} />
      {/* wispy cloud filters */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="pn-wisp1" x="-50%" y="-150%" width="200%" height="400%">
            <feTurbulence type="fractalNoise" baseFrequency="0.011 0.03" numOctaves="4" seed="11" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="120" />
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id="pn-wisp2" x="-50%" y="-150%" width="200%" height="400%">
            <feTurbulence type="fractalNoise" baseFrequency="0.016 0.045" numOctaves="4" seed="42" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="90" />
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id="pn-wisp3" x="-50%" y="-150%" width="200%" height="400%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.022" numOctaves="5" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="150" />
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
      </svg>
      {/* drifting clouds */}
      {CLOUDS.map(([top, w, hgt, dur, delay, ellipses], i) => (
        <svg key={i} viewBox="0 0 900 260" preserveAspectRatio="none" style={{ position: 'absolute', top, left: 0, width: `${w}vw`, height: `${hgt}vh`, overflow: 'visible', animation: `pn-drift ${dur}s linear ${delay}s infinite` }}>
          {ellipses.map(([cx, cy, rx, ry, fill, f], j) => (
            <ellipse key={j} cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} filter={`url(#pn-wisp${f})`} />
          ))}
        </svg>
      ))}
      {/* overcast gloom (tier-driven) */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #1c1830 0%, #2c2740 45%, #4c4456 75%, #6f6168 100%)', opacity: sky.g, transition: 'opacity 1.6s ease' }} />
      {/* skyline */}
      <svg viewBox="0 0 1440 160" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '17vh', display: 'block' }}>
        <path d={SKYLINE_BACK} fill="#251a4e" opacity="0.75" />
        <rect x="518" y="34" width="3" height="20" fill="#251a4e" opacity="0.75" />
        <rect x="1018" y="42" width="3" height="18" fill="#251a4e" opacity="0.75" />
      </svg>
      <svg viewBox="0 0 1440 160" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '15vh', display: 'block' }}>
        <path d={SKYLINE_FRONT} fill="#140d2e" />
        <polygon points="1082,36 1091,16 1100,36" fill="#140d2e" />
        <rect x="1089" y="6" width="4" height="12" fill="#140d2e" />
        <rect x="546" y="4" width="4" height="24" fill="#140d2e" />
        <rect x="436" y="36" width="3" height="18" fill="#140d2e" />
        <rect x="964" y="0" width="3" height="16" fill="#140d2e" />
        <circle cx="965.5" cy="2" r="2.2" fill="#ff6b6b" opacity="0.85" />
        <circle cx="1091" cy="58" r="4.5" fill="#ffd166" opacity="0.8" />
        <g fill="#ffd166" style={{ filter: 'drop-shadow(0 0 2.5px rgba(255,200,110,.85))' }}>
          {LIGHTS.map(([x, y, o], i) => <rect key={i} x={x} y={y} width="4" height="5" opacity={o} />)}
        </g>
      </svg>

      {/* nav */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '26px 40px', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: "var(--font-bricolage), sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: '-0.5px', color: '#fff2e2', textShadow: '0 1px 12px rgba(60,20,80,.4)' }}>
          pennumbra<span style={{ color: '#ffd166' }}>.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26, fontSize: 15, fontWeight: 600 }}>
          <a className="pn-interactive pn-nav-link" href="#forecast" onClick={onBehindRating} style={{ color: '#fff2e2', textDecoration: 'none' }}>the breakdown</a>
          <a className="pn-interactive pn-nav-link" href="#vantage" onClick={onFindSpot} style={{ color: '#fff2e2', textDecoration: 'none' }}>vantage points</a>
          <div style={{ display: 'flex', background: 'rgba(20,13,46,.45)', border: '1px solid rgba(255,236,214,.35)', borderRadius: 999, padding: 3, backdropFilter: 'blur(6px)' }}>
            <button className="pn-interactive pn-mode-button" onClick={() => setMode('sunset')} style={pill(mode === 'sunset')}>sunset</button>
            <button className="pn-interactive pn-mode-button" onClick={() => setMode('sunrise')} style={pill(mode === 'sunrise')}>sunrise</button>
          </div>
        </div>
      </div>

      {/* hero lockup */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px 12vh' }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,242,226,.9)', textShadow: '0 1px 14px rgba(40,15,60,.5)', position: 'relative', zIndex: 1 }}>{d.kicker}</div>
        <div style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: 'clamp(60px, 9vw, 110px)', lineHeight: 1.05, letterSpacing: '-0.03em', textTransform: 'uppercase', color: '#fff6e8', textShadow: '0 6px 44px rgba(90,25,70,.55)', margin: '-6px 0 0' }}>{tier}</div>
        <div style={{ display: 'flex', gap: 22, marginTop: 30, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          {/* score ring */}
          <div style={{ position: 'relative', width: 118, height: 118 }}>
            <div style={{ position: 'absolute', inset: 7, borderRadius: '50%', background: ringGrad, backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(#ffd166 ${score}%, rgba(255,242,226,.18) 0)`, WebkitMask: 'radial-gradient(circle, transparent 57%, #000 59%)', mask: 'radial-gradient(circle, transparent 57%, #000 59%)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: "var(--font-figtree), sans-serif", fontWeight: 700, fontSize: 28, color: '#fff6e8', lineHeight: 1 }}>{score}</div>
              <div style={{ fontFamily: "var(--font-figtree), sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '1.3px', color: 'rgba(255,242,226,.65)', marginTop: 3 }}>/ 100</div>
            </div>
          </div>
          <RingBadge val={d.ring2Val} label={d.ring2Label} ringColor="rgba(255,209,102,.85)" id="r2" grad={ringGrad} />
          <RingBadge val={d.ring3Val} label={d.ring3Label} ringColor="rgba(255,242,226,.75)" id="r3" grad={ringGrad} />
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 30 }}>
          <a className="pn-interactive pn-button pn-button-secondary" href="#forecast" onClick={onBehindRating} style={{ border: '1.5px solid rgba(255,255,255,.85)', background: 'rgba(255,255,255,.08)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: '#fff', fontWeight: 700, fontSize: 15, padding: '13px 26px', borderRadius: 999, textDecoration: 'none' }}>behind the rating</a>
          <a className="pn-interactive pn-button pn-button-primary" href="#vantage" onClick={onFindSpot} style={{ background: 'rgba(255,209,102,.88)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: '#3a1440', fontWeight: 800, fontSize: 15, padding: '13px 26px', borderRadius: 999, textDecoration: 'none' }}>find a spot →</a>
        </div>
      </div>
    </div>
  );
}
