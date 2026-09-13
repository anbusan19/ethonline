// Ported unchanged from AeroGuard's components/Navbar.tsx. No hooks — safe as
// a server component (Next.js App Router default).
import React from "react";
import { Hexagon, ChevronDown } from "lucide-react";

const NavItem: React.FC<{ text: string; active?: boolean }> = ({ text, active }) => (
  <a
    href="#"
    className={`
      font-mono text-xs uppercase tracking-widest transition-colors duration-300
      ${active ? "text-white" : "text-gray-500 hover:text-blue-400"}
    `}
  >
    <span className="text-blue-600 mr-1">//</span>
    {text}
  </a>
);

const Navbar: React.FC = () => {
  return (
    <nav className="fixed top-0 left-0 w-full z-40 px-6 py-6 flex items-center justify-between mix-blend-difference bg-gradient-to-b from-black/80 to-transparent backdrop-blur-[2px]">
      {/* Logo Area */}
      <div className="flex items-center gap-2">
        <div className="relative group cursor-pointer">
          <Hexagon className="w-8 h-8 text-white stroke-[1.5]" />
          <div className="absolute inset-0 bg-blue-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      </div>

      {/* Navigation Links - Hidden on small mobile */}
      <div className="hidden md:flex items-center gap-8 lg:gap-12">
        <NavItem text="Home" active />
        <NavItem text="Technology" />
        <NavItem text="Programs" />
        <NavItem text="Systems" />
        <NavItem text="Company" />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        <button className="hidden md:flex items-center gap-1 font-mono text-xs text-gray-400 hover:text-white transition-colors">
          <ChevronDown className="w-3 h-3" /> EN
        </button>

        <button
          className="
          relative px-6 py-2
          font-mono text-xs uppercase tracking-wider
          border border-white/20 hover:border-white/60
          transition-all duration-300
          group overflow-hidden
        "
        >
          <span className="relative z-10 group-hover:text-black transition-colors duration-300">Contact us</span>
          <div className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></div>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
