// Ported unchanged from AeroGuard's components/ui/TechButton.tsx. No hooks —
// safe as a server component (Next.js App Router default).
import React from "react";
import { clsx } from "clsx";

interface TechButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline" | "solid";
  children: React.ReactNode;
}

const TechButton: React.FC<TechButtonProps> = ({ variant = "outline", children, className, ...props }) => {
  const isOutline = variant === "outline";

  return (
    <button
      className={clsx(
        "relative group px-8 py-4 font-mono text-sm tracking-wider uppercase transition-all duration-300",
        isOutline ? "bg-transparent text-gray-300 hover:text-white" : "text-white",
        className
      )}
      {...props}
    >
      {/* Background for Solid Variant */}
      {!isOutline && (
        <div className="absolute inset-0 bg-blue-900/40 border border-blue-500/30 overflow-hidden">
          {/* Gradient Shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-blue-400/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform"></div>
          {/* Tech Texture */}
          <div
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle, #3b82f6 1px, transparent 1px)", backgroundSize: "4px 4px" }}
          ></div>
        </div>
      )}

      {/* Border for Outline Variant */}
      {isOutline && <div className="absolute inset-0 border border-white/20 group-hover:border-white/40 transition-colors"></div>}

      {/* Corner Brackets - Top Left */}
      <span
        className={clsx(
          "absolute top-0 left-0 w-2 h-2 border-t border-l transition-colors duration-300",
          isOutline ? "border-gray-500 group-hover:border-white" : "border-blue-400 group-hover:border-blue-300"
        )}
      ></span>

      {/* Corner Brackets - Bottom Right */}
      <span
        className={clsx(
          "absolute bottom-0 right-0 w-2 h-2 border-b border-r transition-colors duration-300",
          isOutline ? "border-gray-500 group-hover:border-white" : "border-blue-400 group-hover:border-blue-300"
        )}
      ></span>

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center">{children}</span>
    </button>
  );
};

export default TechButton;
