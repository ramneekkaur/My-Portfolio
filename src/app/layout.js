import { Inter } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import CosmicCursor from "@/components/CosmicCursor";
import FilmGrain from "@/components/FilmGrain";
import SoundToggle from "@/components/SoundToggle";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})
export const metadata = {
  title: "Ramneek Kaur — Cosmic Garden",
  description:
    "Portfolio of Ramneek Kaur: machine learning, LLM and AI-driven systems. MSc Computer Science student at Universität Paderborn.",
};


export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} relative`}>
      {/* No background on <body>: it would paint over the -z-10 starfield.
          The page background lives on <html> in globals.css. */}
      <body className="text-white font-sans antialiased">
        <SmoothScroll>{children}</SmoothScroll>
        <FilmGrain />
        <SoundToggle />
        <CosmicCursor />
      </body>
    </html>
  );
}
