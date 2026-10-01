import React from 'react';
import { X, Sparkles, Layers, BookOpen, ExternalLink, ArrowRight, Award, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface KeywordDetailModalProps {
  keyword: {
    title: string;
    category: string;
    description: string;
    iconName?: string;
    color?: string;
    bgColor?: string;
    borderColor?: string;
    badge?: string;
    importanceScore?: number;
    count?: number;
    stories?: Array<{
      id: string;
      storyTitle: string;
      personName: string;
      profession?: string;
      location?: string;
      category?: string;
      shortSummary?: string;
      personImage?: string;
    }>;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const KeywordDetailModal: React.FC<KeywordDetailModalProps> = ({ keyword, isOpen, onClose }) => {
  if (!isOpen || !keyword) return null;

  const color = keyword.color || '#6366f1';
  const stories = keyword.stories || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 transform transition-all animate-scaleUp max-h-[92vh] flex flex-col">
        
        {/* Color Accent Bar */}
        <div className="h-2.5 w-full" style={{ backgroundColor: color }} />

        {/* Modal Header */}
        <div className="p-5 sm:p-8 pb-4 flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white shadow-xs"
                style={{ backgroundColor: color }}
              >
                <Tag className="w-3.5 h-3.5" />
                {keyword.category}
              </span>

              {keyword.badge && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  {keyword.badge}
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-1">
              {keyword.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-8 space-y-6 overflow-y-auto flex-1 scrollbar-thin">
          
          {/* Concept Overview Box */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-slate-50 rounded-2xl p-5 border border-purple-100 space-y-2">
            <div className="text-xs font-extrabold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
              <span>Milestone Concept Overview</span>
            </div>
            <p className="text-slate-800 text-sm sm:text-base font-semibold leading-relaxed">
              {keyword.description}
            </p>
          </div>

          {/* Key Stats Bar */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs text-center">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Relevance Impact
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1" style={{ color }}>
                {keyword.importanceScore ? `${keyword.importanceScore}%` : 'High'}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs text-center">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Connected Success Journeys
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {stories.length || keyword.count || 1}
              </div>
            </div>
          </div>

          {/* Related Published Stories with Short Summaries */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span>Full Story Short Summaries & Highlights</span>
              </h3>
              <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                {stories.length} Story {stories.length === 1 ? 'Breakdown' : 'Breakdowns'}
              </span>
            </div>

            {stories.length === 0 ? (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 text-center space-y-1">
                <p className="font-bold text-slate-800">Core Knowledge Milestone</p>
                <p>This milestone theme represents an overarching achievement pattern embedded across all featured success stories in the database.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stories.map((story) => (
                  <div
                    key={story.id}
                    className="group bg-white rounded-2xl p-5 border border-slate-200 hover:border-purple-300 shadow-2xs hover:shadow-md transition-all duration-200 space-y-4 relative overflow-hidden"
                  >
                    {/* Person & Header info */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3 min-w-0">
                        {story.personImage ? (
                          <img
                            src={story.personImage}
                            alt={story.personName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-purple-100 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-base shrink-0 shadow-sm">
                            {story.personName?.charAt(0) || 'S'}
                          </div>
                        )}

                        <div className="min-w-0">
                          <h4 className="font-extrabold text-base text-slate-900 group-hover:text-purple-700 transition-colors leading-snug">
                            {story.storyTitle}
                          </h4>
                          <p className="text-xs font-semibold text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-slate-800 font-extrabold">{story.personName}</span>
                            {story.profession && <span>• {story.profession}</span>}
                            {story.location && <span className="text-slate-400">• {story.location}</span>}
                          </p>
                        </div>
                      </div>

                      {story.category && (
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 shrink-0 self-start sm:self-center">
                          {story.category}
                        </span>
                      )}
                    </div>

                    {/* Short Story Summary Box */}
                    {story.shortSummary && (
                      <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/80 space-y-1.5">
                        <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          <span>Short Story Overview</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                          {story.shortSummary}
                        </p>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-end pt-1">
                      <Link
                        to={`/stories/${story.id}`}
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition-all flex items-center gap-2 shadow-sm hover:shadow-purple-500/20"
                      >
                        <span>Read Complete Story</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Interactive Knowledge Milestone</span>
          </span>
          <Link
            to="/explore"
            onClick={onClose}
            className="text-purple-600 hover:text-purple-800 flex items-center gap-1 hover:underline font-extrabold"
          >
            <span>Explore All Success Stories</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
};
