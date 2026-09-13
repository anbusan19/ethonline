// Ported unchanged from AeroGuard's components/utils/MousePositionContext.tsx,
// with "use client" added for Next.js App Router (uses state/effect/context).
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface MousePosition {
  x: number;
  y: number;
}

const MousePositionContext = createContext<MousePosition>({ x: 0, y: 0 });

export const MousePositionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <MousePositionContext.Provider value={mousePosition}>{children}</MousePositionContext.Provider>
  );
};

export const useMousePosition = () => useContext(MousePositionContext);
