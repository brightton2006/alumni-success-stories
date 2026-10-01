import React from 'react';
import type { CloudKeyword } from '../../types';
import { BookOpen, Tag } from 'lucide-react';

interface KeywordTooltipProps {
  keyword: CloudKeyword | null;
  x: number;
  y: number;
  visible: boolean;
}

export const KeywordTooltip: React.FC<KeywordTooltipProps> = ({ keyword, x, y, visible }) => {
  if (!visible || !keyword) return null;

  const topStory = keyword.stories && keyword.stories.length > 0 ? keyword.stories[0] : null;

  return (
    <div
      className="fixed z-50 pointer-events-none transition-all duration-150 ease-out transform -translate-x-1/2 -translate-y-full mb-3"
      style={{
        left: `${x}px`,
        top: `${y}px`
      }}
    >
      <div className="bg-[#0f172a]/95 backdrop-blur-md text-white text-xs rounded-2xl py-3 px-4 shadow-2xl border border-slate-700/80 max-w-xs space-y-2 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
          <span className="font-black text-sm tracking-wider uppercase text-purple-300">
            {keyword.text}
          </span>
          <span className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 font-extrabold px-2 py-0.5 rounded-full text-[10px] border border-purple-400/30">
            <BookOpen className="w-3 h-3" />
            {keyword.count} {keyword.count === 1 ? 'Story' : 'Stories'}
          </span>
        </div>

        {keyword.categories && keyword.categories.length > 0 && (
          <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
            <Tag className="w-3 h-3 text-purple-400 shrink-0" />
            <span className="font-semibold text-slate-300">
              {keyword.categories.join(' • ')}
            </span>
          </div>
        )}

        {topStory && topStory.shortSummary && (
          <div className="bg-slate-800/80 rounded-xl p-2.5 text-[11px] text-slate-200 border border-slate-700/60 leading-snug space-y-1">
            <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
              {topStory.personName} • {topStory.profession || 'Featured Story'}
            </div>
            <p className="line-clamp-2 italic text-slate-300">
              "{topStory.shortSummary}"
            </p>
          </div>
        )}

        <div className="text-[10px] text-slate-400 italic pt-0.5 text-center">
          Click keyword to inspect full story breakdown & takeaways
        </div>

        {/* Tooltip caret */}
        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-[#0f172a]" />
      </div>
    </div>
  );
};
