import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond } from "next/font/google";
import localFont from "next/font/local";
import { AppShell } from "@/components/AppShell";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const heading = localFont({ src: "./fonts/FuturaPTCond-Bold.otf", weight: "700", variable: "--font-heading" });
const body = localFont({ src: "./fonts/FuturaPT-Book.otf", weight: "400", variable: "--font-body" });
const wordmark = Cormorant_Garamond({ subsets: ["latin"], weight: "400", variable: "--font-wordmark" }); // the ARTHA name only

export const metadata: Metadata = {
  title: "ARTHA, a Wellness Sanctuary",
  description: "Book classes, therapies and treatments at ARTHA Studio City and West LA.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#120702",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable} ${wordmark.variable}`}>
      <body className="font-sans antialiased">
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
