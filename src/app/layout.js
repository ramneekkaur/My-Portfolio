import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})
export const metadata = {
  title: "Cosmic Garden",
  description: "AI, Quantum and Space inspired portfolio",
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} text-white`}>
        {children}
      </body>
    </html>
  );
}