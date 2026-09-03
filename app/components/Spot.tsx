export interface SpotProps {
  number: number;
  name: string;
  area: string;
  bestFor: string;
  view: string;
  crowd: string;
  image?: string;
  credit?: string;
  submission?: boolean;
}

export default function Spot({
  number,
  name,
  area,
  bestFor,
  view,
  crowd,
  image,
  credit,
  submission = false,
}: SpotProps) {
  const card = (
    <article className={`group relative h-full min-h-52 overflow-hidden rounded-2xl border ${submission ? "border-dashed border-[#ffd166]/65 bg-[#211744]/35 transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-[#ffd166] hover:bg-[#211744]/55" : "border-white/25 bg-[#211744]/45"} p-5 text-left backdrop-blur-sm sm:min-h-48 sm:p-6`}>
      {image && (
        <div
          className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center opacity-80 blur-[2.5px]"
          style={{ backgroundImage: `url("${image}")` }}
        />
      )}
      <div className={`pointer-events-none absolute inset-0 ${image ? "bg-[linear-gradient(115deg,rgba(20,13,46,.92)_0%,rgba(20,13,46,.8)_55%,rgba(20,13,46,.68)_100%)]" : "bg-[#211744]/50"}`} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_35%,rgba(255,255,255,.12)_0%,rgba(255,242,226,.055)_30%,transparent_64%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[.28] [background-image:linear-gradient(rgba(201,184,239,.26)_1px,transparent_1px),linear-gradient(90deg,rgba(201,184,239,.26)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_left_center,black_0%,rgba(0,0,0,.85)_28%,transparent_68%)]" />
      <span className="absolute right-4 -top-5 text-[clamp(88px,12vw,150px)] font-bold leading-none text-white/[.28] drop-shadow-[0_3px_16px_rgba(20,13,46,.45)] transition-colors group-hover:text-white/[.38] sm:right-5 sm:-top-7 [font-family:var(--font-syne)]">
        {String(number).padStart(2, "0")}
      </span>
      <div className="relative">
        {submission && <span className="mb-1 block text-4xl font-light leading-none text-[#ffd166]">＋</span>}
        <h2 className={`m-0 text-[clamp(30px,4vw,46px)] font-semibold ${submission ? "text-[#c9b8ef]" : "text-[#ffd166]"} [font-family:var(--font-caveat)]`}>
          {name}
        </h2>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#e3d2ec]">{area}</p>
        <p className="mt-3 max-w-[82%] text-[11px] font-bold uppercase leading-5 tracking-[0.08em] text-[#fff2e2]">
          <span className="text-[#b9a8d9]">Light</span> {bestFor}
          <span className="mx-2 text-white/30">|</span>
          <span className="text-[#b9a8d9]">View</span> {view}
          <span className="mx-2 text-white/30">|</span>
          <span className="text-[#b9a8d9]">Crowd</span> {crowd}
        </p>
      </div>
      {image && credit && <span className="absolute bottom-2 right-3 text-[8px] uppercase tracking-[0.12em] text-white/40">photo · {credit}</span>}
    </article>
  );

  return submission ? (
    <Link href="/vantage/submit" aria-label="Add your vantage point" className="block h-full rounded-2xl no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffd166]">
      {card}
    </Link>
  ) : card;
}
import Link from "next/link";
