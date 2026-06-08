import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "NERD - NewEveryRepoDay",
  description:
    "NERD - NewEveryRepoDay: codzienne questy dla programistów, które wypychają Cię poza znane technologie.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body className="flex min-h-screen flex-col bg-gh-bg-deep font-sans text-gh-text antialiased">
        <Providers>
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
