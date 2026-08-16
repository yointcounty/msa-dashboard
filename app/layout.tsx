import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./home-photo-carousel.css";
import PwaRegister from "./pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Miami Skate Academy | Private Skater Portal",
  description:
    "Private trick progress, coach updates, milestones, and schedules for enrolled Miami Skate Academy families.",
  applicationName: "MSA Skater Portal",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MSA Portal",
  },
  icons: { apple: "/apple-touch-icon.png" },
  openGraph: {
    type: "website",
    title: "Miami Skate Academy | Private Skater Portal",
    description:
      "Private trick progress, coach updates, milestones, and schedules for enrolled Miami Skate Academy families.",
    images: [
      {
        url: "/images/msa-real-hero.jpg",
        alt: "Miami Skate Academy coaching and skater experiences",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Miami Skate Academy | Private Skater Portal",
    description:
      "Private trick progress, coach updates, milestones, and schedules for enrolled Miami Skate Academy families.",
    images: ["/images/msa-real-hero.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
