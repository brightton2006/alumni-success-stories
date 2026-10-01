import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, UserCheck, MapPin, Briefcase, Calendar, XCircle, BookOpen } from 'lucide-react';
import type { CloudKeyword, CloudStorySummary } from '../../types';
import { getStoryAuthorDisplayName } from '../../utils/api';

interface StoryResultsProps {
  selectedKeyword: CloudKeyword;
  onClearFilter: () => void;
}

export const StoryResults: React.FC<StoryResultsProps> = ({ selectedKeyword, onClearFilter }) => {
  return (
    <section className="space-y-6 animate-fadeIn my-10">
      {/* Result Header */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="text-xs uppercase tracking-widest text-purple-200 font-bold mb-1">
            Filtered by Milestone / Keyword
          </div>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <span>#{selectedKeyword.text}</span>
            <span className="px-3 py-1 text-xs rounded-full bg-white/20 border border-white/30 backdrop-blur-md">
              {selectedKeyword.stories.length} {selectedKeyword.stories.length === 1 ? 'Story' : 'Stories'}
            </span>
          </h3>
        </div>

        <button
          onClick={onClearFilter}
          className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold flex items-center gap-2 border border-white/20 transition-all duration-200 shrink-0 hover:scale-105 active:scale-95 shadow-md"
        >
          <XCircle className="w-4 h-4 text-purple-300" />
          <span>Clear Filter & Show All</span>
        </button>
      </div>

      {/* Story Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedKeyword.stories.map((story: CloudStorySummary) => {
          const isNameHidden = story.showName === false;
          const displayName = getStoryAuthorDisplayName(story);
          const displayImage = isNameHidden ? '' : story.personImage;

          return (
            <div
              key={story.id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.05)] hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5 group hover:-translate-y-1"
            >
              <div className="space-y-4">
                {/* Person Header */}
                <div className="flex items-center gap-4">
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={displayName}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-100 shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white font-black text-xl flex items-center justify-center shadow-md ring-2 ring-purple-100">
                      {displayName.charAt(0)}
                    </div>
                  )}

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base group-hover:text-purple-700 transition-colors flex items-center gap-1.5">
                      {displayName}
                      {!isNameHidden && <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />}
                    </h3>
                    <p className="text-slate-500 text-xs font-semibold flex items-center gap-1 mt-0.5">
                      <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[180px]">{story.profession || 'Achiever'}</span>
                    </p>
                    {story.location && (
                      <p className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{story.location}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Story Title & Category Badge */}
                <div className="space-y-2 pt-1">
                  <span className="inline-block px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-[11px] font-extrabold uppercase tracking-wider border border-purple-100">
                    {story.category}
                  </span>

                  <h4 className="font-black text-slate-900 text-lg leading-snug line-clamp-2">
                    {story.storyTitle}
                  </h4>

                  <p className="text-slate-600 text-xs leading-relaxed font-medium line-clamp-3">
                    {story.shortSummary}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {story.publishedAt ? new Date(story.publishedAt).getFullYear() : 'Recent'}
                </span>

                <Link
                  to={`/stories/${story.id}`}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-500/20 flex items-center gap-1.5 group/btn transition-all duration-200"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Read Full Story</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
