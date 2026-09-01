import Breakdown from "./components/Breakdown";
import LandingPage from "./components/LandingPage";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#140d2e]">
      <LandingPage score={78} />
      <section aria-label="Sunset forecast details">
        <Breakdown score={78} />
      </section>
    </main>
  );
}
