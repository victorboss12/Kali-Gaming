"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    // Admin backend console has its own independent enterprise layout & navigation
    return <div className="min-h-screen flex flex-col">{children}</div>;
  }

  // Consumer Player Casino Frontend with Player Navbar & Footer
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col relative z-10">{children}</main>
      <Footer />
    </>
  );
}
