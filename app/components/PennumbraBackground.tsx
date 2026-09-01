import { PennumbraSky } from "./LandingPage";

interface PennumbraBackgroundProps {
  mode?: "sunset" | "sunrise";
}

/** Shared atmospheric scene: sky, stars, clouds, sun, skyline, and window lights. */
export default function PennumbraBackground({
  mode = "sunset",
}: PennumbraBackgroundProps) {
  return <PennumbraSky mode={mode} />;
}
