import React from 'react';

interface MainTitleSectionProps {
  phaseName: string;
  phasePeriod: string;
}

export const MainTitleSection: React.FC<MainTitleSectionProps> = ({
  phaseName,
  phasePeriod,
}) => {
  return (
    <div className="text-center my-6 max-w-3xl mx-auto px-4">
      {/* Current Phase Pill / Indicator */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-soft border border-purple-200 text-primary font-semibold text-xs sm:text-sm mb-3">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        <span>Current Phase: {phaseName} {phasePeriod}</span>
      </div>

      {/* Main Title */}
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
        Domain Webinars Overview
      </h2>

      {/* Subtitle / Description */}
      <p className="text-slate-600 text-sm font-medium">
        Manage and track academic webinars across institutional domains
      </p>
    </div>
  );
};
