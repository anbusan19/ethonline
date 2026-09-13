// Ported from AeroGuard's components/Navbar.tsx — layout/styling unchanged, nav
// links swapped for Vault402's real sections. No hooks — safe as a server component.
import React from "react";
import { Hexagon } from "lucide-react";

const NavItem: React.FC<{ text: string; href: string; active?: boolean }> = ({ text, href, active }) => (
  <a
    href={href}
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
        <NavItem text="Home" href="/" active />
        <NavItem text="How it works" href="/#how" />
        <NavItem text="Stack" href="/#stack" />
        <NavItem text="Console" href="/console" />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        <a
          href="https://github.com/anbusan19/ethonline2026"
          className="
          relative px-6 py-2
          font-mono text-xs uppercase tracking-wider
          border border-white/20 hover:border-white/60
          transition-all duration-300
          group overflow-hidden
          inline-block
        "
        >
          <span className="relative z-10 group-hover:text-black transition-colors duration-300">View repo</span>
          <div className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></div>
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
