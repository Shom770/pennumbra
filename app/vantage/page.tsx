import type { Metadata } from "next";
import Link from "next/link";
import Logo from "../components/Logo";
import PennumbraBackground from "../components/PennumbraBackground";
import Spot, { type SpotProps } from "../components/Spot";
import { isMongoConfigured, listPublishedSpots } from "../utils/submissions";

export const metadata: Metadata = {
  title: "Vantage points — Pennumbra",
  description: "Where you can watch the sunset and sunrise around Penn.",
};

// The list is read per request so a newly published spot shows up without a rebuild.
export const dynamic = "force-dynamic";

const LIGHT_LABEL = { both: "BOTH", sunrise: "SUNRISE", sunset: "SUNSET" } as const;
const CROWD_LABEL = { low: "LOW", medium: "MED", high: "HIGH", unknown: "—" } as const;

const SUBMISSION_CARD = {
  name: "your spot",
  area: "add a vantage point",
  bestFor: "SUBMIT",
  view: "LOCAL",
  crowd: "—",
  submission: true,
} satisfies Omit<SpotProps, "number">;

async function loadSpots(): Promise<SpotProps[]> {
  if (!isMongoConfigured()) return [];
  try {
    const spots = await listPublishedSpots();
    return spots.map((spot, index) => ({
      number: index + 1,
      name: spot.name,
      area: spot.location,
      bestFor: LIGHT_LABEL[spot.bestFor],
      view: spot.view.toUpperCase(),
      crowd: CROWD_LABEL[spot.crowd],
      image: spot.pictureUrl,
      credit: spot.credit,
    }));
  } catch (error) {
    // A database hiccup shouldn't take the page down — fall back to just the submit card.
    console.error("Could not load vantage points", error);
    return [];
  }
}

export default async function VantagePage() {
  const spots = await loadSpots();
  const cards: SpotProps[] = [...spots, { ...SUBMISSION_CARD, number: spots.length + 1 }];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#140d2e] text-[#f5ecff]">
      <style>{`
        .vp-grid-window { scrollbar-color: rgba(255,209,102,.75) rgba(33,23,68,.45); scrollbar-width: thin; }
        .vp-grid-window::-webkit-scrollbar { width: 8px; }
        .vp-grid-window::-webkit-scrollbar-track { background: rgba(33,23,68,.45); border-radius: 999px; }
        .vp-grid-window::-webkit-scrollbar-thumb { background: rgba(255,209,102,.75); border-radius: 999px; }
      `}</style>
      <PennumbraBackground />

      <nav className="relative z-10 flex items-center justify-between px-6 py-7 sm:px-10">
        <Link href="/" className="pn-interactive pn-nav-link text-[#fff2e2] no-underline">
          <Logo />
        </Link>
        <Link href="/" className="pn-interactive pn-nav-link text-sm font-bold text-[#fff2e2] no-underline">← forecast</Link>
      </nav>

      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 pb-8 pt-2 text-center sm:px-6 sm:pt-[3vh]">
        <h1 className="m-0 w-full max-w-4xl bg-[radial-gradient(ellipse_at_center,rgba(20,13,46,.2)_0%,rgba(20,13,46,.1)_46%,transparent_76%)] px-2 py-2 text-[clamp(18px,5vw,38px)] font-bold uppercase leading-tight tracking-[-0.025em] text-[#fff6e8] backdrop-blur-[2px] sm:whitespace-nowrap sm:px-4 [font-family:var(--font-syne)] [text-shadow:0_3px_18px_rgba(20,13,46,.9),0_1px_3px_rgba(20,13,46,.8)]">
          where to watch the sunset / sunrise
        </h1>

        <div className="vp-grid-window relative mt-5 h-[62vh] min-h-[400px] max-h-[620px] w-full max-w-5xl overflow-y-auto rounded-2xl pr-1 sm:mt-6 sm:h-[55vh] sm:min-h-[360px] sm:max-h-[520px] sm:pr-2">
          <div className="grid grid-cols-1 gap-3 sm:h-full sm:grid-cols-2 sm:[grid-auto-rows:calc((100%-12px)/2)]">
            {cards.map((spot) => <Spot key={spot.number} {...spot} />)}
          </div>
        </div>
      </section>
    </main>
  );
}
