import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Caveat,
  Figtree,
  Rethink_Sans,
  Syne,
} from "next/font/google";
import "./globals.css";

const rethinkSans = Rethink_Sans({
  variable: "--font-rethink",
  subsets: ["latin"],
});
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const syne = Syne({ variable: "--font-syne", subsets: ["latin"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"] });

const fontVariables = [
  rethinkSans.variable,
  bricolage.variable,
  figtree.variable,
  syne.variable,
  caveat.variable,
].join(" ");

export const metadata: Metadata = {
  title: "Pennumbra — Catch a better sky",
  description:
    "A weather-informed sunset and sunrise forecast, with the science behind every rating.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full bg-[#140d2e] text-[#f5ecff]">
        {children}
      </body>
    </html>
  );
}
