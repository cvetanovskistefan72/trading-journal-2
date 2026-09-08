import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { MobileTopBar } from "@/components/mobile-top-bar";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trading Journal",
  description: "A personal trading journal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex bg-background text-foreground" suppressHydrationWarning>
        <Providers>
          <Sidebar />
          <div className="flex flex-1 flex-col min-h-screen">
            <MobileTopBar />
            {children}
          </div>
          <Toaster richColors />
        </Providers>
      </body>
    </html>
  );
}
