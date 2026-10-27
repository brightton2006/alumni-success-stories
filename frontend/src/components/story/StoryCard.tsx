import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Eye, ArrowRight, Share2, Check } from 'lucide-react';
import { getStoryAuthorDisplayName, getStoryBeneficiaryDisplayName, getStorySupporterDisplayName } from '../../utils/api';
import type { Story } from '../../types';

interface StoryCardProps {
  story: Partial<Story> & {
    hasMindMap?: boolean;
  };
}

export const StoryCard: React.FC<StoryCardProps> = ({ story }) => {
  const {
    id,
    storyTitle,
    profession,
    location,
    category,
    publishedAt,
    views = 0
  } = story;

  const [copied, setCopied] = useState(false);
  const displayPersonName = getStoryAuthorDisplayName(story);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const storyUrl = window.location.origin + '/stories/' + id;
    navigator.clipboard.writeText(storyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs flex flex-col justify-between h-full transition-all duration-200 hover:border-primary/40 hover:shadow-md group">
      <div className="flex flex-col flex-1">
        {/* Top Row: Category Badge & Share Button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-primary-soft text-primary text-[11px] font-semibold uppercase tracking-wider border border-purple-200">
              {category || 'Alumni Story'}
            </span>
            {(story.beneficiaryName || story.supporterName) && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200 flex items-center gap-1">
                <span>🤝 Support Story</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-primary bg-slate-50 hover:bg-primary-soft px-2 py-0.5 rounded transition-colors cursor-pointer"
            title="Copy link to share story"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3 h-3" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>

        {/* Person Name / Profession / Location */}
        <div className="mb-2 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-primary transition-colors line-clamp-1">
              {displayPersonName}
            </h4>
            {story.isVerified !== false && (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                Verified
              </span>
            )}
          </div>
          {(profession || story.role || story.company) && (
            <p className="text-xs text-slate-500 line-clamp-1">
              {profession || story.role}{story.company ? ` at ${story.company}` : ''}
            </p>
          )}
          {location && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-0.5">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="line-clamp-1">{location}</span>
            </div>
          )}
        </div>

        {/* Story Title */}
        <h3 className="text-sm font-semibold text-slate-800 leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {storyTitle}
        </h3>

        {(story.beneficiaryName || story.supporterName) && (
          <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 mb-2 space-y-0.5">
            {story.beneficiaryName && (
              <div className="truncate"><span className="font-semibold text-slate-700">Beneficiary:</span> {getStoryBeneficiaryDisplayName(story)}</div>
            )}
            {story.supporterName && (
              <div className="truncate"><span className="font-semibold text-slate-700">Supporter:</span> {getStorySupporterDisplayName(story)}</div>
            )}
          </div>
        )}

      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-3">
        <div className="flex items-center gap-2.5 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {views} Views
          </span>
          {publishedAt && (
            <span>• {new Date(publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          )}
        </div>

        <Link
          to={'/stories/' + id}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary-soft hover:bg-primary text-primary hover:text-white font-semibold text-xs transition-colors duration-150 cursor-pointer shadow-2xs"
        >
          <span>Read</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
