// Ported unchanged from AeroGuard's components/Hero.tsx. No hooks of its own —
// safe as a server component; ParticleJet (its one client-hook dependency)
// marks its own "use client" boundary.
import React from "react";
import ParticleJet from "./ParticleJet";
import TechButton from "./ui/TechButton";
import StatsRow from "./StatsRow";
import { MoveRight } from "lucide-react";

const Hero: React.FC = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col md:flex-row bg-aero-black">
      {/* Background Tech Grid (Subtle) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundSize: "40px 40px",
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
        }}
      />

      {/* LEFT PANEL: Content */}
      <div className="relative w-full md:w-1/2 h-full flex flex-col justify-center px-6 md:px-12 lg:px-20 z-10 pt-20 md:pt-0">
        {/* Decorative Lines */}
        <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/5 hidden md:block"></div>
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/5 hidden md:block"></div>

        {/* Content Wrapper */}
        <div className="max-w-2xl">
          <div className="mb-6 overflow-hidden">
            <p className="font-mono text-blue-500 text-xs tracking-[0.2em] mb-4 animate-fade-in-up">
              // ADVANCED AEROSPACE SYSTEMS
            </p>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-white leading-[1.1] tracking-tight mb-8">
            Engineering <br />
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
              Air Superiority
            </span>
          </h1>

          <p className="text-gray-400 max-w-md leading-relaxed mb-10 text-sm md:text-base border-l-2 border-blue-900/50 pl-6">
            Next-generation aircraft, defense platforms, and intelligent flight systems designed to secure the future of
            global airspace.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 mb-16 sm:items-center">
            <TechButton variant="outline">Defense Solutions</TechButton>

            <TechButton variant="solid">
              Explore Programs <MoveRight className="w-4 h-4 ml-2" />
            </TechButton>
          </div>

          {/* Technical Decorative Elements in Left Panel Background */}
          <div className="absolute bottom-40 right-20 w-64 h-64 border border-blue-900/10 rounded-full opacity-20 pointer-events-none animate-pulse"></div>
          <div className="absolute bottom-40 right-20 w-48 h-48 border border-blue-500/10 rounded-full opacity-30 pointer-events-none"></div>
        </div>

        {/* Bottom Stats Row - Pinned to bottom of left panel */}
        <div className="absolute bottom-0 left-0 w-full px-6 md:px-12 lg:px-20 pb-8 md:pb-12">
          <StatsRow />
        </div>
      </div>

      {/* RIGHT PANEL: Visuals */}
      <div className="relative w-full md:w-1/2 h-full bg-black/50 overflow-hidden">
        {/* The Particle Canvas Visualization */}
        <ParticleJet />

        {/* Overlay UI Elements on the Visual */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Floating Label 1 */}
          <div className="absolute top-[30%] right-[20%] flex items-center gap-4 animate-float-slow">
            <div className="text-right">
              <div className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">Active AESA</div>
              <div className="font-mono text-[10px] text-blue-400 uppercase tracking-widest">Radar System</div>
            </div>
            <div className="w-16 h-[1px] bg-blue-500/50 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-blue-400 rounded-full"></div>
            </div>
          </div>

          {/* Floating Label 2 */}
          <div className="absolute bottom-[30%] left-[20%] flex items-center gap-4 animate-float-delayed">
            <div className="w-16 h-[1px] bg-red-500/50 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-red-400 rounded-full"></div>
            </div>
            <div className="text-left">
              <div className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">Mach 2.4</div>
              <div className="font-mono text-[10px] text-red-400 uppercase tracking-widest">Maximum Velocity</div>
            </div>
          </div>

          {/* Floating Label 3 */}
          <div className="absolute top-[50%] right-[5%] flex items-center gap-4 opacity-70">
            <div className="px-2 py-1 border border-white/10 bg-black/40 backdrop-blur-sm">
              <div className="font-mono text-[10px] text-gray-300">45,000 FT</div>
              <div className="font-mono text-[9px] text-gray-500">Operational Ceiling</div>
            </div>
          </div>
        </div>

        {/* Gradient Overlay for blending */}
        <div className="absolute inset-0 bg-gradient-to-r from-aero-black via-transparent to-transparent z-10"></div>
      </div>
    </div>
  );
};

export default Hero;
