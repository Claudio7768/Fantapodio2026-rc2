import type { Metadata } from "next";
import { Titillium_Web } from "next/font/google";
import "./globals.css";

const titillium = Titillium_Web({ 
  weight: ['400', '600', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ["latin"],
  variable: '--font-titillium'
});

export const metadata: Metadata = {
  title: "Fantapodio 2026",
  description: "Official F1 Podium Prediction Game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${titillium.variable} font-sans bg-[#0f0f12] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
