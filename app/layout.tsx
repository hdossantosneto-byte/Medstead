import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { Providers } from "@/components/providers";
import { PUBLIC_LINE, TAGLINE } from "@/lib/constants";
import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MedStead — Faster access. Better care.",
    template: "%s · MedStead",
  },
  description: PUBLIC_LINE,
  keywords: ["MedStead", "clinic supply", "medical freight", TAGLINE],
  icons: {
    icon: [{ url: "/medstead-logo.svg", type: "image/svg+xml" }, { url: "/favicon.svg" }],
    apple: [{ url: "/medstead-logo.svg" }],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "MedStead",
    statusBarStyle: "default",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
