// Ported from AeroGuard's App.tsx. Marked "use client" for the loading-state
// hooks; index.tsx's ReactDOM.createRoot bootstrap is no longer needed under
// Next.js App Router.
"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { MousePositionProvider } from "@/components/utils/MousePositionContext";

export default function Page() {
  // Simple loading state for a tech-startup feel
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center font-mono text-xs text-blue-500">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 border border-blue-900 border-t-blue-500 rounded-full animate-spin"></div>
          <p>INITIALIZING SYSTEMS...</p>
        </div>
      </div>
    );
  }

  return (
    <MousePositionProvider>
      <main className="relative min-h-screen bg-aero-black text-aero-text selection:bg-blue-500/30">
        <Navbar />
        <Hero />
      </main>
    </MousePositionProvider>
  );
}
