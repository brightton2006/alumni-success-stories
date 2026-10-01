import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

interface LoadingAnalyzerProps {
  onComplete?: () => void;
}

const STAGES = [
  'Creating your journey...',
  'Identifying story milestones...',
  'Designing visual timeline...',
  'Your Story Journey Map is ready!'
];

export const LoadingAnalyzer: React.FC<LoadingAnalyzerProps> = ({ onComplete }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  const onCompleteRef = React.useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < STAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentStageIndex === STAGES.length - 1 && onCompleteRef.current) {
      onCompleteRef.current();
    }
  }, [currentStageIndex]);

  const progressPercentage = Math.round(((currentStageIndex + 1) / STAGES.length) * 100);
  const isFinished = currentStageIndex === STAGES.length - 1;

  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-[0_20px_50px_-10px_rgba(124,58,237,0.15)] border-2 border-purple-200 text-center max-w-xl mx-auto my-8">
      {/* Animated Journey Icon */}
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20 relative">
        {isFinished ? (
          <CheckCircle2 className="w-10 h-10 text-emerald-300 animate-bounce" />
        ) : (
          <Sparkles className="w-10 h-10 text-purple-100 animate-pulse" />
        )}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-500"></span>
        </span>
      </div>

      {/* Main Title */}
      <h3 className="text-2xl font-black text-[#1e1b4b] mb-2 tracking-tight">
        {STAGES[currentStageIndex]}
      </h3>

      <p className="text-sm font-semibold text-slate-500 mb-8">
        Automatically structuring your story into a visual journey map poster.
      </p>

      {/* Progress Bar */}
      <div className="w-full bg-purple-100 rounded-full h-3.5 p-0.5 overflow-hidden mb-6 border border-purple-200">
        <div
          className="bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      {/* Checklist items */}
      <div className="space-y-2.5 text-left max-w-sm mx-auto bg-purple-50/70 p-4 rounded-2xl border border-purple-100">
        {STAGES.slice(0, STAGES.length - 1).map((stage, idx) => {
          const isDone = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;

          return (
            <div key={idx} className="flex items-center gap-3 text-xs font-bold">
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-purple-600 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
              )}
              <span className={isDone ? 'text-slate-800 font-semibold' : isCurrent ? 'text-purple-900 font-extrabold' : 'text-slate-400'}>
                {stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
