// Ported from AeroGuard's index.html <head> (title, Google Fonts) to Next.js's
// root layout. Fonts move from <link> tags to next/font/google; the scanline
// overlay div and Tailwind CDN config move to globals.css / tailwind.config.ts.
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Agentry | Ledger-secured, Graph-powered purchase agent",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        {children}
        <div className="scanline" />
      </body>
    </html>
  );
}
