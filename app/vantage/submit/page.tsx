import type { Metadata } from "next";
import Link from "next/link";
import Logo from "../../components/Logo";
import PennumbraBackground from "../../components/PennumbraBackground";
import SpotSubmissionForm from "../../components/SpotSubmissionForm";

export const metadata: Metadata = {
  title: "Add a vantage point — Pennumbra",
  description: "Share a place to watch the sunrise or sunset around Philadelphia.",
};

export default function SubmitSpotPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#140d2e] text-[#f5ecff]">
      <PennumbraBackground />
      <nav className="relative z-10 flex items-center justify-between px-6 py-7 sm:px-10">
        <Link href="/" className="pn-interactive pn-nav-link text-[#fff2e2] no-underline">
          <Logo />
        </Link>
        <Link href="/vantage" className="pn-interactive pn-nav-link text-sm font-bold text-[#fff2e2] no-underline">← vantage points</Link>
      </nav>

      <section className="relative z-10 mx-auto w-[calc(100%-2rem)] max-w-3xl pb-12 pt-1 sm:w-[calc(100%-3rem)] sm:pb-16 sm:pt-[2vh]">
        <div className="relative overflow-hidden rounded-2xl border border-[#8c7ba8]/55 bg-[#211744]/70 p-4 shadow-[5px_5px_0_rgba(20,13,46,.4)] backdrop-blur-sm sm:p-9 sm:shadow-[8px_8px_0_rgba(20,13,46,.4)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(255,255,255,.1)_0%,rgba(255,242,226,.05)_28%,transparent_62%)]" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[85%] opacity-[.22] [background-image:linear-gradient(rgba(201,184,239,.26)_1px,transparent_1px),linear-gradient(90deg,rgba(201,184,239,.26)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_left_center,black_0%,rgba(0,0,0,.9)_36%,rgba(0,0,0,.42)_60%,transparent_82%)]" />
          <span className="pointer-events-none absolute right-5 top-0 text-[clamp(96px,12vw,150px)] font-bold leading-none text-white/[.14] drop-shadow-[0_3px_16px_rgba(20,13,46,.45)] [font-family:var(--font-syne)]">
            ＋
          </span>

          <div className="relative">
            <header className="mb-6 border-b border-white/20 pb-4 sm:mb-8 sm:pb-5">
              <p className="m-0 text-[11px] font-bold uppercase tracking-[.14em] text-[#e3d2ec]">Vantage submission</p>
              <h1 className="mb-0 mt-1 text-[clamp(38px,7vw,58px)] font-semibold leading-none text-[#ffd166] [font-family:var(--font-caveat)]">
                add your spot
              </h1>
            </header>
            <SpotSubmissionForm />
          </div>
        </div>
      </section>
    </main>
  );
}
