import React from 'react';

interface SummaryStatsProps {
  planned: number;
  conducted: number;
  speakers: number;
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({
  planned,
  conducted,
  speakers,
}) => {
  const stats = [
    { label: 'Planned Sessions', value: planned },
    { label: 'Conducted Sessions', value: conducted },
    { label: 'Active Speakers', value: speakers },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 my-8 max-w-5xl mx-auto">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="bg-white rounded-lg p-5 sm:p-6 border border-slate-200 text-center flex flex-col justify-center items-center shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200"
        >
          <span className="text-slate-600 font-medium text-xs sm:text-sm mb-1 tracking-wide">
            {stat.label}
          </span>
          <span className="text-3xl sm:text-4xl font-bold text-primary tracking-tight">
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
};
