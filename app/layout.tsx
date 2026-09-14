import type { Metadata } from "next";
import { Archivo_Black, Inter } from "next/font/google";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Providers } from "@/components/Providers";
import "./globals.css";

const display = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "NARCI — Statement pieces. Not home goods.",
    template: "%s — NARCI",
  },
  description:
    "Bold, rebellious wall art for internet-native buyers. Framed blades, motorsport mounts, weapon art. Order via WhatsApp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${sans.variable} ${sans.className} min-h-screen bg-bone font-sans text-ink antialiased`}
      >
        <Providers>
          <Nav />
          <main>{children}</main>
          <Footer />
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
