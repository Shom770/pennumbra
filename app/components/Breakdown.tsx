/**
 * Pennumbra — "the breakdown" section.
 * Self-contained React component (inline styles, no CSS framework).
 *
 * Host app should load these fonts (e.g. Google Fonts + KaTeX CSS):
 *   Syne (700), Caveat, Figtree (600), Rethink Sans (500-700)
 *   katex.min.css (for KaTeX_Main / KaTeX_Math font faces)
 */
import React from "react";

type Mode = "sunset" | "sunrise";

interface FactorDef {
  sym: string;
  sub: string;
  name: string;
  kind: "pct" | "aod";
  v: number; // base raw value (fraction, or AOD)
  spread: number; // alpha/beta model disagreement
  weight: number; // points available
  color: string;
}

interface BreakdownProps {
  mode?: Mode;
  /** Overrides the mode's base score; factor values rescale to stay consistent. */
  score?: number;
  updatedAt?: string; // e.g. "6:04 pm"
  modelRunAt?: string;
  observations?: {
    highCloudCover: number;
    lowCloudCover: number;
    aerosolOpticalDepth: number;
    relativeHumidity: number;
    hrrr: { highCloudCover: number; lowCloudCover: number; relativeHumidity: number };
    nam: { highCloudCover: number; lowCloudCover: number; relativeHumidity: number };
  };
  modelScores?: { hrrr: number; nam: number };
}

const MODES: Record<
  Mode,
  { factors: FactorDef[]; hrrr: number; nam: number; score: number; verdict: string }
> = {
  sunset: {
    factors: [
      { sym: "C", sub: "hi", name: "high clouds", kind: "pct", v: 0.42, spread: 0.02, weight: 35, color: "#ffd166" },
      { sym: "C", sub: "lo", name: "low clouds", kind: "pct", v: 0.08, spread: 0.02, weight: 25, color: "#ffb88c" },
      { sym: "κ", sub: "", name: "air clarity", kind: "aod", v: 0.09, spread: 0.01, weight: 20, color: "#c9b8ef" },
      { sym: "H", sub: "", name: "humidity", kind: "pct", v: 0.54, spread: 0.025, weight: 20, color: "#ff8f73" },
    ],
    hrrr: 84, nam: 89, score: 87, verdict: "confidence high",
  },
  sunrise: {
    factors: [
      { sym: "C", sub: "hi", name: "high clouds", kind: "pct", v: 0.71, spread: 0.03, weight: 35, color: "#ffd166" },
      { sym: "C", sub: "lo", name: "low clouds", kind: "pct", v: 0.34, spread: 0.04, weight: 25, color: "#ffb88c" },
      { sym: "κ", sub: "", name: "air clarity", kind: "aod", v: 0.12, spread: 0.01, weight: 20, color: "#c9b8ef" },
      { sym: "H", sub: "", name: "humidity", kind: "pct", v: 0.88, spread: 0.02, weight: 20, color: "#ff8f73" },
    ],
    hrrr: 61, nam: 55, score: 59, verdict: "confidence medium",
  },
};

const WHYS = [
  "Cirrus at 6–12 km stays sunlit after ground-level sunset and reflects the reddened light back down. The sweet spot is ~30–60% coverage: too little and there is no canvas, too much and the deck blocks the light entirely.",
  "Stratus and cumulus below ~2 km sit in the light path near the horizon and intercept direct sunlight before it can illuminate the high cloud overhead.",
  "Aerosol optical depth (AOD) measures suspended particulates — dust, smoke, pollution. High loading scatters light diffusely and mutes saturation; low AOD keeps reds crisp. The score uses κ = 1 − 2·AOD, so AOD 0 earns full points and AOD 0.5+ earns none.",
  "High relative humidity swells aerosol particles, increasing Mie scattering. Colors wash toward gray; drier air keeps the palette vivid.",
];

const TILTS = ["-1.2deg", "0.8deg", "-0.6deg", "1.1deg"];
const XS = [8, 220, 432, 644];
const YS = [172, 284, 178, 286];
const LEADERS = [
  { d: "M 190,80 C 162,98 196,112 162,126 C 138,135 118,131 100,141", color: "#ffd166" },
  { d: "M 350,80 C 322,112 352,142 316,174 C 294,197 302,225 289,248", color: "#ffb88c" },
  { d: "M 515,80 C 536,96 490,110 500,124 C 506,132 494,136 496,142", color: "#c9b8ef" },
  { d: "M 650,80 C 694,106 652,142 690,177 C 716,198 702,226 711,248", color: "#ff8f73" },
];
const GAUGE_D =
  "M 2,6.2 C 16,3.9 34,7.4 52,5.3 C 72,3.1 92,6.7 112,5.9 C 132,5.1 148,3.2 168,5.8 C 180,7.2 192,5.0 198,4.4";
const DIVIDER_D =
  "M 2,5.5 C 38,3.1 92,7.2 148,5.1 C 198,3.4 238,6.9 302,6.1 C 368,5.2 422,2.8 488,4.6 C 542,6.1 604,7.2 662,4.3 C 712,2.5 764,5.9 832,5.2 C 892,4.7 952,6.6 998,4.8";

const SERIF = "KaTeX_Main, 'Times New Roman', serif";
const MATH = "KaTeX_Math, serif";
const MUTE = "#8f7fb8";

// ---------- score math ----------
// High clouds use a peaked response: full credit at ≈45% cover, zero at overcast.
const hiT = (v: number) => Math.max(0, 1 - Math.abs(v - 0.45) / 0.55);

function computeFactors(mode: Mode, score: number, observations?: BreakdownProps["observations"]) {
  const d = MODES[mode];
  if (observations) {
    const rawValues = [
      observations.highCloudCover / 100,
      observations.lowCloudCover / 100,
      observations.aerosolOpticalDepth,
      observations.relativeHumidity / 100,
    ];
    const terms = rawValues.map((value, index) =>
      index === 2 ? Math.max(0, 1 - 2 * value) : index === 0 ? hiT(value) : 1 - value
    );
    const fmtAod = (x: number) => x.toFixed(2).replace(/^0/, "");
    return d.factors.map((f, i) => {
      const raw = rawValues[i];
      const contrib = Math.round(f.weight * terms[i]);
      return {
        ...f,
        value: f.kind === "aod" ? `AOD ${fmtAod(raw)}` : `${Math.round(raw * 100)}%`,
        models: i === 2
          ? "shared atmospheric forecast"
          : `alpha ${Math.round(i === 0 ? observations.hrrr.highCloudCover : i === 1 ? observations.hrrr.lowCloudCover : observations.hrrr.relativeHumidity)}% · beta ${Math.round(i === 0 ? observations.nam.highCloudCover : i === 1 ? observations.nam.lowCloudCover : observations.nam.relativeHumidity)}%`,
        pct: Math.round(100 * terms[i]),
        contrib,
        why: WHYS[i],
      };
    });
  }
  const baseT = d.factors.map((f) =>
    f.kind === "aod" ? Math.max(0, 1 - 2 * f.v) : f.sub === "hi" ? hiT(f.v) : 1 - f.v
  );
  const S0 = d.factors.reduce((s, f, i) => s + f.weight * baseT[i], 0);
  const r = S0 > 0 ? score / S0 : 1;
  const t = baseT.map((x) => Math.max(0, Math.min(1, x * r)));
  // AOD is floored at .02, so its term caps at 0.96 of weight
  const maxC = d.factors.map((f) => (f.kind === "aod" ? Math.round(f.weight * 0.96) : f.weight));
  const contribs = t.map((x, i) => Math.min(maxC[i], Math.round(d.factors[i].weight * x)));
  let drift = score - contribs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < contribs.length && drift !== 0; i++) {
    const room = drift > 0 ? maxC[i] - contribs[i] : contribs[i];
    const adj = (drift > 0 ? 1 : -1) * Math.min(Math.abs(drift), room);
    contribs[i] += adj;
    drift -= adj;
  }
  const fmtAod = (x: number) => x.toFixed(2).replace(/^0/, "");
  const clampPct = (x: number) => Math.max(0, Math.min(100, Math.round(x * 100)));
  return d.factors.map((f, i) => {
    const ti = contribs[i] / f.weight;
    // recover the displayed raw value from the final per-term points so value ↔ pts always agree
    const raw =
      f.kind === "aod"
        ? Math.max(0.02, (1 - ti) / 2)
        : f.sub === "hi"
        ? Math.max(0, Math.min(1, 0.45 + (f.v >= 0.45 ? 1 : -1) * (1 - ti) * 0.55))
        : 1 - ti;
    const value = f.kind === "aod" ? "AOD " + fmtAod(raw) : Math.round(raw * 100) + "%";
    const models =
      f.kind === "aod"
        ? `alpha model ${fmtAod(Math.max(0.01, raw - f.spread))} · beta model ${fmtAod(raw + f.spread)}`
        : `alpha model ${clampPct(raw - f.spread)}% · beta model ${clampPct(raw + f.spread)}%`;
    return { ...f, value, models, pct: Math.round(100 * ti), contrib: contribs[i], why: WHYS[i] };
  });
}

// ---------- small pieces ----------
const Tip: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <span
    className="om-tip"
    style={{
      position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", width: 230,
      background: "#241847", border: "1px solid #453470", borderRadius: 10, padding: "10px 12px",
      fontSize: 12.5, lineHeight: 1.55, fontWeight: 500, color: "#d9c9f2",
      fontFamily: "var(--font-rethink), sans-serif", zIndex: 10, boxShadow: "0 8px 24px rgba(10,5,30,.5)",
      letterSpacing: 0, textTransform: "none", ...style,
    }}
  >
    {children}
  </span>
);

const InfoI: React.FC = () => (
  <span
    style={{
      width: 15, height: 15, borderRadius: "50%", border: `1px solid ${MUTE}`, color: MUTE,
      fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center",
      justifyContent: "center", fontFamily: "'Georgia', serif", fontStyle: "italic", letterSpacing: 0,
    }}
  >
    i
  </span>
);

const It: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ fontFamily: MATH, fontStyle: "italic" }}>{children}</span>
);
const ItSub: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <sub style={{ fontFamily: MATH, fontStyle: "italic", fontSize: ".55em" }}>{children}</sub>
);

const Divider: React.FC = () => (
  <svg viewBox="0 0 1000 10" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 10, overflow: "visible" }}>
    <path d={DIVIDER_D} fill="none" stroke="rgba(185,168,217,.3)" strokeWidth={1.4} strokeLinecap="round" strokeDasharray="9 8" />
  </svg>
);

/** Wavy hand-drawn graph-paper patch that fades out radially. */
const GridPatch: React.FC = () => {
  const wob = [1.8, -1.6, 2.2, -1.2, 1.5, -2.0, 1.1, -1.7];
  const mask = "radial-gradient(ellipse at 50% 45%, black 30%, transparent 76%)";
  const paths: string[] = [];
  for (let i = 0; i < 8; i++) {
    const y = 12 + i * 26, w = wob[i % 8];
    paths.push(`M 0,${y} C 40,${y + w} 80,${y - w} 120,${y + w * 0.6} C 160,${y - w} 190,${y + w} 220,${y - w * 0.5}`);
  }
  for (let i = 0; i < 8; i++) {
    const x = 12 + i * 28, w = wob[(i + 3) % 8];
    paths.push(`M ${x},0 C ${x + w},35 ${x - w},70 ${x + w * 0.6},105 C ${x - w},140 ${x + w},170 ${x - w * 0.5},200`);
  }
  return (
    <svg
      viewBox="0 0 220 200" preserveAspectRatio="none"
      style={{
        position: "absolute", inset: "-18px -22px", width: "calc(100% + 44px)", height: "calc(100% + 36px)",
        WebkitMaskImage: mask, maskImage: mask, pointerEvents: "none",
      }}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="rgba(185,168,217,.17)" strokeWidth={1} />
      ))}
    </svg>
  );
};

// ---------- main component ----------
export const Breakdown: React.FC<BreakdownProps> = ({ mode = "sunset", score, updatedAt = "6:04 pm", modelRunAt, observations, modelScores }) => {
  const d = MODES[mode];
  const effScore = Math.max(1, Math.min(100, Math.round(score ?? d.score)));
  const factors = computeFactors(mode, effScore, observations);
  const mRatio = effScore / d.score;
  const hrrr = modelScores?.hrrr ?? Math.max(1, Math.min(100, Math.round(d.hrrr * mRatio)));
  const nam = modelScores?.nam ?? Math.max(1, Math.min(100, Math.round(d.nam * mRatio)));
  const spread = Math.abs(hrrr - nam);
  const confidence = spread <= 5 ? "high" : spread <= 12 ? "medium" : "low";
  const runLabel = modelRunAt
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", timeZone: "UTC", timeZoneName: "short" }).format(new Date(modelRunAt)).toLowerCase()
    : null;

  return (
    <div id="forecast" className="pn-breakdown" style={{ position: "relative", padding: "70px 40px 56px", maxWidth: 1080, margin: "0 auto", background: "#140d2e", color: "#f5ecff" }}>
      <style>{`
        .pn-breakdown-mobile { display: none; }
        @media (max-width: 700px) {
          .pn-breakdown { padding: 48px 18px 44px !important; }
          .pn-breakdown-heading { font-size: 30px !important; }
          .pn-breakdown-meta { font-size: 11px !important; line-height: 1.6; }
          .pn-breakdown-desktop { display: none; }
          .pn-breakdown-mobile { display: grid; }
          .pn-breakdown-models { gap: 12px 20px !important; font-size: 17px !important; }
          .pn-breakdown-models .om-tip { left: 0 !important; transform: none !important; max-width: calc(100vw - 44px); }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <h2 className="pn-breakdown-heading" style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: 40, letterSpacing: "-0.02em", textTransform: "uppercase", margin: 0, color: "#fff2e2" }}>
          the breakdown
        </h2>
        <div className="pn-breakdown-meta" style={{ fontSize: 14, color: MUTE, fontWeight: 600 }}>
          models{" "}
          <span data-tip style={{ position: "relative", cursor: "help", borderBottom: `1px dotted ${MUTE}` }}>
            alpha + beta
            <Tip style={{ bottom: "auto", top: 24, width: "auto", whiteSpace: "nowrap", borderRadius: 8, padding: "7px 11px" }}>
              two independent short-range forecast models
            </Tip>
          </span>{" "}
          · {runLabel ? `same run ${runLabel}` : `updated ${updatedAt}`}
        </div>
      </div>

      <div style={{ marginTop: 24, position: "relative" }}>
        <Divider />
        <div style={{ padding: "22px 0 8px" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: MUTE }}>
            the formula
            <span data-tip style={{ position: "relative", display: "inline-flex", cursor: "help" }}>
              <InfoI />
              <Tip style={{ bottom: "auto", top: 24, left: -8, transform: "none", width: 280 }}>
                Four weighted terms: high-altitude cloud cover, horizon obstruction, aerosol clarity, and atmospheric moisture. Hover each term&apos;s i for the meteorology.
              </Tip>
            </span>
          </div>

          {/* annotated-equation canvas */}
          <div className="pn-breakdown-desktop" style={{ overflowX: "auto", overflowY: "hidden", scrollbarWidth: "none" }}>
            <div style={{ position: "relative", width: 830, height: 470, margin: "6px 0 0" }}>
              <svg viewBox="0 0 830 440" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                {LEADERS.map((l) => (
                  <path key={l.color} d={l.d} fill="none" stroke={l.color} strokeWidth={1.4} strokeLinecap="round" strokeDasharray="6 7" opacity={0.45} />
                ))}
              </svg>

              <div style={{ position: "absolute", top: 6, left: 0, right: 0, textAlign: "left", fontFamily: SERIF, fontSize: 26, lineHeight: 1.5 }}>
                <It>S</It> = 100 × <span style={{ fontSize: "1.15em" }}>[</span>{" "}
                <span style={{ color: "#ffd166" }}>0.35 <It>f</It>(<It>C</It><ItSub>hi</ItSub>)</span> +{" "}
                <span style={{ color: "#ffb88c" }}>0.25 (1 − <It>C</It><ItSub>lo</ItSub>)</span> +{" "}
                <span style={{ color: "#c9b8ef" }}>0.20 <It>κ</It></span> +{" "}
                <span style={{ color: "#ff8f73" }}>0.20 (1 − <It>H</It>)</span>{" "}
                <span style={{ fontSize: "1.15em" }}>]</span>
                <div style={{ fontSize: 15, color: MUTE, marginTop: 6 }}>
                  <It>f</It>(<It>C</It><ItSub>hi</ItSub>) = 1 − |<It>C</It><ItSub>hi</ItSub> − 0.45| / 0.55
                  {"\u00a0\u00a0·\u00a0\u00a0"}peaks at ≈45% high cloud cover{"\u00a0\u00a0\u00a0\u00a0"}
                  <It>κ</It> = 1 − 2 · AOD
                </div>
              </div>

              {factors.map((f, i) => (
                <div key={f.name} style={{ position: "absolute", left: XS[i], top: YS[i], width: 178, transform: `rotate(${TILTS[i]})` }}>
                  <GridPatch />
                  <div style={{ position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontFamily: "var(--font-caveat), cursive", fontSize: 27, lineHeight: 1, color: f.color }}>{f.name}</div>
                      <span data-tip style={{ position: "relative", display: "inline-flex", cursor: "help" }}>
                        <InfoI />
                        <Tip>{f.why}</Tip>
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
                      <div style={{ fontFamily: "var(--font-figtree), sans-serif", fontWeight: 600, fontSize: 34, lineHeight: 1, color: "#fff2e2" }}>{f.value}</div>
                      <div style={{ fontFamily: MATH, fontStyle: "italic", fontSize: 18, color: MUTE }}>
                        {f.sym}
                        {f.sub && <sub style={{ fontSize: ".55em" }}>{f.sub}</sub>}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: MUTE, fontWeight: 600, marginTop: 5, whiteSpace: "nowrap" }}>{f.models}</div>
                    {/* hand-drawn gauge */}
                    <div style={{ margin: "11px 0 3px", position: "relative", height: 10 }}>
                      <svg viewBox="0 0 200 10" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
                        <path d={GAUGE_D} fill="none" stroke="rgba(185,168,217,.22)" strokeWidth={1.5} strokeLinecap="round" />
                      </svg>
                      <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${f.pct}%`, overflow: "hidden", transition: "width .8s ease" }}>
                        <svg viewBox="0 0 200 10" preserveAspectRatio="none" style={{ position: "absolute", top: 0, left: 0, width: `${Math.round(10000 / Math.max(1, f.pct))}%`, height: "100%", overflow: "visible" }}>
                          <path d={GAUGE_D} fill="none" stroke={f.color} strokeWidth={2.2} strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>
                    <div style={{ fontFamily: "var(--font-caveat), cursive", fontSize: 21, color: f.color, transform: "rotate(-1.5deg)", transformOrigin: "left" }}>
                      +{f.contrib} of {f.weight} pts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pn-breakdown-mobile mt-6 grid-cols-1 gap-4">
            <div className="overflow-x-auto pb-2 text-[17px] leading-8 text-[#d9c9f2]" style={{ fontFamily: SERIF }}>
              <span className="whitespace-nowrap"><It>S</It> = 100 × [ 0.35<It>f</It>(<It>C</It><ItSub>hi</ItSub>) + 0.25(1−<It>C</It><ItSub>lo</ItSub>) + 0.20<It>κ</It> + 0.20(1−<It>H</It>) ]</span>
            </div>
            {factors.map((f) => (
              <article key={f.name} className="relative overflow-hidden border border-white/10 bg-[#211744]/35 p-4">
                <GridPatch />
                <div className="relative flex items-end justify-between gap-4">
                  <div>
                    <div className="text-[24px] leading-none [font-family:var(--font-caveat)]" style={{ color: f.color }}>{f.name}</div>
                    <div className="mt-2 text-[28px] font-semibold leading-none text-[#fff2e2] [font-family:var(--font-figtree)]">{f.value}</div>
                    <div className="mt-2 text-[10px] font-semibold text-[#8f7fb8]">{f.models}</div>
                  </div>
                  <div className="shrink-0 text-right text-[20px] [font-family:var(--font-caveat)]" style={{ color: f.color }}>+{f.contrib}/{f.weight}</div>
                </div>
              </article>
            ))}
          </div>

          {/* what the models say */}
          <div style={{ marginTop: 34 }}>
            <Divider />
          </div>
          <div className="pn-breakdown-models" style={{ paddingTop: 16, display: "flex", alignItems: "baseline", justifyContent: "flex-start", gap: "clamp(16px, 3vw, 40px)", flexWrap: "wrap", fontFamily: SERIF, fontSize: 19, color: "#d9c9f2", position: "relative" }}>
            <div data-tip style={{ position: "relative", cursor: "help", whiteSpace: "nowrap" }}>
              <It>S</It><sub style={{ fontSize: ".6em", fontFamily: MATH, fontStyle: "italic" }}>alpha</sub> = <span style={{ color: "#ffd166" }}>{hrrr}</span>
              <Tip style={{ bottom: 30, width: "auto", whiteSpace: "nowrap", borderRadius: 8, padding: "7px 11px", fontSize: 13 }}>alpha model forecast</Tip>
            </div>
            <div data-tip style={{ position: "relative", cursor: "help", whiteSpace: "nowrap" }}>
              <It>S</It><sub style={{ fontSize: ".6em", fontFamily: MATH, fontStyle: "italic" }}>beta</sub> = <span style={{ color: "#ffb88c" }}>{nam}</span>
              <Tip style={{ bottom: 30, width: "auto", whiteSpace: "nowrap", borderRadius: 8, padding: "7px 11px", fontSize: 13 }}>beta model forecast</Tip>
            </div>
            <div>|Δ| = <span style={{ color: "#fff2e2" }}>{spread}</span></div>
            <div style={{ color: MUTE }}>∴ confidence {confidence}</div>
            <div style={{ flexBasis: "100%", fontFamily: "var(--font-figtree), sans-serif", fontSize: 13, color: MUTE, textAlign: "left", marginTop: 2, maxWidth: 520 }}>
              The alpha model and beta model are two independent forecasts. The closer they agree, the more trustworthy the score.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Breakdown;
