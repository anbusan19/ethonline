// Ported unchanged from AeroGuard's components/StatsRow.tsx.
import React from "react";

interface StatItemProps {
  value: string;
  label: string;
}

const StatItem: React.FC<StatItemProps> = ({ value, label }) => {
  return (
    <div className="relative group p-4 border-l border-white/10 first:border-l-0 md:first:border-l">
      {/* Corner Brackets for Hover State */}
      <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-3 h-px bg-blue-500"></div>
        <div className="absolute bottom-0 left-0 w-px h-3 bg-blue-500"></div>
        <div className="absolute bottom-0 right-0 w-3 h-px bg-blue-500"></div>
        <div className="absolute bottom-0 right-0 w-px h-3 bg-blue-500"></div>
      </div>

      <h3 className="text-xl md:text-2xl font-light text-white mb-1 tracking-tight group-hover:text-blue-400 transition-colors duration-300">
        {value}
      </h3>
      <p className="text-[10px] md:text-xs font-mono text-gray-500 uppercase tracking-wider leading-tight max-w-[120px]">
        {label}
      </p>
    </div>
  );
};

const StatsRow: React.FC = () => {
  return (
    <div className="w-full grid grid-cols-2 md:grid-cols-4 border-t border-white/10 bg-black/20 backdrop-blur-sm">
      <StatItem value="12" label="Nations Global Defense Partnerships" />
      <StatItem value="40+" label="Years Aerospace Innovation" />
      <StatItem value="5,000+" label="Aircraft Delivered" />
      <StatItem value="24/7" label="Mission Support" />
    </div>
  );
};

export default StatsRow;
