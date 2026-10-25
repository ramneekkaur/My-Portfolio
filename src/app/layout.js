import { IBM_Plex_Mono, Space_Mono } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import CosmicCursor from "@/components/CosmicCursor";
import FilmGrain from "@/components/FilmGrain";
import SoundToggle from "@/components/SoundToggle";

// Mission-control type: IBM Plex Mono for text, Space Mono for titles.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-plex-mono",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata = {
  title: "Ramneek Kaur — Cosmic Garden",
  description:
    "Portfolio of Ramneek Kaur: machine learning, LLM and AI-driven systems. MSc Computer Science student at Universität Paderborn.",
};


export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: browser extensions (Grammarly, password managers,
    // dark-mode tools…) add attributes to <html>/<body> before React loads.
    // This only ignores attribute differences on these two tags, not their children.
    <html lang="en" className={`${plexMono.variable} ${spaceMono.variable} relative`} suppressHydrationWarning>
      {/* No background on <body>: it would paint over the -z-10 starfield.
          The page background lives on <html> in globals.css. */}
      <body className="text-white font-sans antialiased" suppressHydrationWarning>
        <SmoothScroll>{children}</SmoothScroll>
        <FilmGrain />
        <SoundToggle />
        <CosmicCursor />
      </body>
    </html>
  );
}
