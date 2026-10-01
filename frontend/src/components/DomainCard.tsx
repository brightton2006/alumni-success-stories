import React from 'react';
import { GraduationCap } from 'lucide-react';
import type { DomainData } from '../data/webinarData';

interface DomainCardProps {
  domain: DomainData;
  onClick?: (domain: DomainData) => void;
}

export const DomainCard: React.FC<DomainCardProps> = ({ domain, onClick }) => {
  const { name, planned, conducted, postponed, status } = domain;

  // Calculate dynamic completion percentage safely
  const completionPercentage = planned > 0 ? Math.round((conducted / planned) * 100) : 0;

  // Dynamic status dot indicator colors
  const statusDotColor =
    status === 'completed'
      ? 'bg-emerald-600'
      : status === 'in-progress'
      ? 'bg-primary'
      : 'bg-amber-500';

  return (
    <div
      onClick={() => onClick && onClick(domain)}
      className="bg-white rounded-lg p-5 sm:p-6 shadow-xs border border-slate-200 hover:border-primary/40 hover:shadow-md flex flex-col justify-between transition-all duration-200 cursor-pointer group"
    >
      {/* Top Row: Graduation Cap Icon + Domain Title + Status Indicator Dot */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          {/* Graduation Cap Icon Badge */}
          <div className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-white transition-colors duration-200 shadow-2xs border border-purple-200">
            <GraduationCap className="w-4 h-4" />
          </div>

          {/* Domain Title */}
          <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-primary transition-colors tracking-tight leading-snug">
            {name}
          </h3>
        </div>

        {/* Status Dot */}
        <div className="shrink-0 pt-1" title={`Status: ${status}`}>
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${statusDotColor}`}></span>
        </div>
      </div>

      {/* Domain Statistics (3 boxes) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mb-4">
        {/* PLANNED Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 text-center flex flex-col justify-center items-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
            PLANNED
          </span>
          <span className="text-base sm:text-lg font-bold text-primary">
            {planned}
          </span>
        </div>

        {/* CONDUCTED Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 text-center flex flex-col justify-center items-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
            CONDUCTED
          </span>
          <span className="text-base sm:text-lg font-bold text-emerald-700">
            {conducted}
          </span>
        </div>

        {/* POSTPONED Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 text-center flex flex-col justify-center items-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
            POSTPONED
          </span>
          <span className="text-base sm:text-lg font-bold text-amber-700">
            {postponed}
          </span>
        </div>
      </div>

      {/* Progress Bar & Percentage */}
      <div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(completionPercentage, 100)}%` }}
          ></div>
        </div>

        <div className="text-center mt-2">
          <span className="text-xs font-semibold text-slate-500">
            {completionPercentage}% Target Completed
          </span>
        </div>
      </div>
    </div>
  );
};
