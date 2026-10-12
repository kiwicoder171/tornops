import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { CommandPalette } from "@/components/CommandPalette";
import { TornProvider } from "@/context/TornContext";

export const metadata: Metadata = {
  title: "Torn Faction Operations Suite",
  description: "Advanced intelligence, Ranked War watchdog, banking ledger, and payout engine for Torn City factions",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen bg-black text-zinc-100 antialiased selection:bg-blue-600 selection:text-white">
        <TornProvider>
          <CommandPalette />
          <Sidebar />
          <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </TornProvider>
      </body>
    </html>
  );
}
