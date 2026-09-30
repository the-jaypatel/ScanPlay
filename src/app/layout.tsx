import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "ScanPlay — Your Video, One Link Away",
  description:
    "Upload your video. Get a shareable link. Use it anywhere. Direct, fast, and elegant video hosting for invitations and seamless sharing.",
  keywords: [
    "ScanPlay",
    "video hosting",
    "shareable video link",
    "invitation video",
    "direct video link",
  ],
  authors: [{ name: "ScanPlay" }],
  openGraph: {
    title: "ScanPlay — Your Video, One Link Away",
    description: "Upload your video. Get a shareable link. Use it anywhere.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-zinc-800 selection:text-white flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
