import type { Metadata } from "next";
import "./globals.css";
import CasinoBackground from "@/components/layout/CasinoBackground";
import AppShell from "@/components/layout/AppShell";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Kali Gaming | #1 Social Casino & Rewards Platform",
  description: "Join thousands of players. Spin the rewards wheel, play in-house fishing casino games, chat directly with staff, and unlock VIP perks.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen flex flex-col bg-[#070719] text-white selection:bg-[#F36E0F] selection:text-black relative"
        suppressHydrationWarning
      >
        <AuthProvider>
          <CasinoBackground />
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
