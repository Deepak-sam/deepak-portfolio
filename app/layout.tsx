import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Deepak Thangaraj — Senior IT Leader | M365, Cloud & Zero Trust",
  description:
    "Senior IT Leader with 19+ years steering enterprise infrastructure, Microsoft 365, and Zero Trust security. Chennai, India.",
  authors: [{ name: "Deepak Thangaraj" }],
  openGraph: {
    title: "Deepak Thangaraj — Senior IT Leader",
    description:
      "Architect of digital workplaces. Microsoft 365, Cloud & Zero Trust. 19+ years.",
    type: "profile",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05070d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
