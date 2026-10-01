import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Award, Network, LayoutGrid, Share2 } from 'lucide-react';
import type { JourneyMapData, Story } from '../../types';
import { RadialMindMapCanvas } from './RadialMindMapCanvas';
import { buildRadialMindMapGraph, buildHierarchicalMindMapTree } from '../../utils/aiMindMapBuilder';

interface StoryJourneyMapProps {
  story?: Story | null;
  journeyMap?: JourneyMapData | null;
  personName?: string;
  personImage?: string;
  storyTitle?: string;
  category?: string;
  nodes?: any[];
  edges?: any[];
}

export const StoryMindMap: React.FC<StoryJourneyMapProps> = ({
  story,
  journeyMap: inputJourneyMap,
  personName: inputPersonName,
  personImage: inputPersonImage,
  storyTitle: inputStoryTitle,
  category: inputCategory,
  nodes: inputNodes,
  edges: inputEdges
}) => {
  const [viewMode, setViewMode] = useState<'radial' | 'poster'>('radial');

  const personName = story?.personName || inputPersonName || inputJourneyMap?.personName || 'Featured Alumni';
  const storyTitle = story?.storyTitle || inputStoryTitle || inputJourneyMap?.title || 'Success Story';
  const personImage = story?.personImage || inputPersonImage || inputJourneyMap?.heroImage || '';
  const category = story?.category || inputCategory || inputJourneyMap?.category || 'Success Journey';

  // Construct React Flow radial nodes & edges graph
  const radialGraph = useMemo(() => {
    if (inputNodes && inputNodes.length > 0) {
      return { nodes: inputNodes, edges: inputEdges || [] };
    }
    if (story?.aiMindMap && story.aiMindMap.nodes?.length > 0) {
      return story.aiMindMap;
    }
    // Fallback: construct on-the-fly from story text or extracted sections
    const tree = buildHierarchicalMindMapTree({
      personName,
      storyTitle,
      personImage,
      sections: story?.aiExtractedElements?.sections || {},
      fullStory: story?.fullStory || ''
    });

    return buildRadialMindMapGraph(tree, personName, personImage, storyTitle);
  }, [inputNodes, inputEdges, story?.id, story?.fullStory, story?.aiMindMap, personName, storyTitle, personImage]);

  const hasNodes = radialGraph && radialGraph.nodes && radialGraph.nodes.length > 1;

  // Construct fallback poster milestone cards data if in poster mode
  const journeyData: JourneyMapData = useMemo(() => {
    if (inputJourneyMap && inputJourneyMap.milestones?.length > 0) return inputJourneyMap;
    if (story?.journeyMap && story.journeyMap.milestones?.length > 0) return story.journeyMap;

    const rawSections = story?.aiExtractedElements?.sections || {};
    const STAGE_META = [
      { key: 'beginning', title: 'EARLY BACKGROUND', icon: '🌱', accent: '#10b981' },
      { key: 'education', title: 'EDUCATION & LEARNING', icon: '🎓', accent: '#3b82f6' },
      { key: 'goal', title: 'DREAM & GOAL', icon: '🎯', accent: '#6366f1' },
      { key: 'challenges', title: 'THE CHALLENGE', icon: '⚡', accent: '#f59e0b' },
      { key: 'importantEvents', title: 'IMPORTANT EVENTS', icon: '📅', accent: '#0284c7' },
      { key: 'turningPoint', title: 'TURNING POINT', icon: '🔄', accent: '#8b5cf6' },
      { key: 'actions', title: 'ACTIONS TAKEN', icon: '🚀', accent: '#06b6d4' },
      { key: 'career', title: 'CAREER JOURNEY', icon: '💼', accent: '#64748b' },
      { key: 'achievements', title: 'MAJOR ACHIEVEMENTS', icon: '🏆', accent: '#eab308' },
      { key: 'awards', title: 'AWARDS & RECOGNITION', icon: '🥇', accent: '#f43f5e' },
      { key: 'impact', title: 'IMPACT CREATED', icon: '🌍', accent: '#14b8a6' },
      { key: 'lessons', title: 'LESSONS LEARNED', icon: '💡', accent: '#e11d48' },
      { key: 'futureVision', title: 'FUTURE VISION', icon: '🔮', accent: '#d946ef' }
    ];

    const milestones = STAGE_META.filter(meta => Array.isArray(rawSections[meta.key]) && rawSections[meta.key].length > 0)
      .map((meta, idx) => ({
        stage: idx + 1,
        title: meta.title,
        description: rawSections[meta.key]?.slice(0, 3) || [],
        icon: meta.icon,
        accentColor: meta.accent
      }));

    return {
      title: storyTitle,
      personName,
      summary: story?.shortSummary || '',
      category,
      heroImage: personImage,
      milestones: milestones.length > 0 ? milestones : [
        { stage: 1, title: 'BEGINNING', description: ['Started journey.'], icon: '🌱', accentColor: '#10b981' }
      ],
      achievements: [],
      highlights: Array.isArray(story?.aiKeywords)
        ? story.aiKeywords.map(k => typeof k === 'string' ? k : k.word)
        : ['Success', 'Growth', 'Impact']
    };
  }, [inputJourneyMap, story, personName, storyTitle, personImage, category]);

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(personName)}&background=7c3aed&color=fff&size=256`;

  const [imgError, setImgError] = useState(false);
  const avatarSrc = imgError || !personImage ? defaultAvatar : personImage;

  if (!hasNodes && !story?.fullStory) {
    return (
      <div className="bg-white rounded-3xl p-10 sm:p-14 border-4 border-dashed border-purple-200 text-center space-y-4 my-6 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-700 mx-auto flex items-center justify-center font-black text-2xl shadow-inner">
          🗺️
        </div>
        <h3 className="text-2xl font-black text-[#1e1b4b] uppercase tracking-tight">
          Your Success Journey
        </h3>
        <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto">
          Submit your story to create your personalized visual journey map.
        </p>
        <div className="pt-2">
          <Link
            to="/stories/write"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            <span>Submit Your Story</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 my-8">
      
      {/* Component Header & Mode Switcher Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/90 p-4 rounded-3xl border border-purple-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center font-extrabold shadow-md">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-extrabold text-[11px] uppercase tracking-wider">
                AI Visual Generator
              </span>
            </div>
            <h2 className="text-xl font-black text-[#1e1b4b] tracking-tight">
              Interactive Story Mind Map
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode('radial')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'radial'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Radial Mind Map</span>
            </button>

            <button
              onClick={() => setViewMode('poster')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'poster'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Infographic Poster</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `${personName} - Mind Map`,
                  text: `Check out ${personName}'s Success Story Mind Map!`,
                  url: window.location.href
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Mind Map link copied to clipboard!');
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs rounded-2xl border border-purple-200 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* RENDER INTERACTIVE RADIAL MIND MAP CANVAS */}
      {viewMode === 'radial' ? (
        <RadialMindMapCanvas
          initialNodes={radialGraph.nodes}
          initialEdges={radialGraph.edges}
          personName={personName}
          storyTitle={storyTitle}
        />
      ) : (
        /* FALLBACK INFOGRAPHIC POSTER VIEW */
        <div className="bg-white rounded-3xl border-4 border-slate-200/70 p-6 sm:p-10 shadow-[0_25px_60px_-15px_rgba(124,58,237,0.12)] relative overflow-hidden space-y-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-900 font-black text-xs uppercase tracking-widest border border-purple-200/80 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>{category} • LIFE JOURNEY</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#1e1b4b] uppercase tracking-tight leading-none">
              {personName}
            </h1>

            <p className="text-lg sm:text-xl font-bold text-purple-800 uppercase tracking-wide">
              {storyTitle}
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center my-6">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full p-2 bg-gradient-to-tr from-purple-600 via-indigo-500 to-amber-400 shadow-2xl">
              <img
                src={avatarSrc}
                alt={personName}
                className="w-full h-full rounded-full object-cover border-4 border-white bg-slate-100"
                onError={() => setImgError(true)}
              />
            </div>
            <span className="mt-3 px-4 py-1 rounded-full bg-purple-900 text-purple-100 text-xs font-black tracking-widest uppercase shadow-sm">
              JOURNEY CENTER
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {journeyData.milestones.map((m, idx) => (
              <div
                key={idx}
                style={{ borderColor: m.accentColor || '#7c3aed' }}
                className="bg-white rounded-3xl p-6 border-2 shadow-sm space-y-3"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="text-2xl">{m.icon || '📌'}</span>
                  <h4 className="text-sm font-black text-[#1e1b4b] uppercase tracking-tight">
                    {m.title}
                  </h4>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700 font-semibold">
                  {m.description.map((bullet, bIdx) => (
                    <p key={bIdx}>• {bullet}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-slate-100 flex items-center justify-between text-[11px] font-extrabold text-slate-400">
            <div className="flex items-center gap-1.5 text-purple-900">
              <Award className="w-4 h-4 text-purple-600" />
              <span>Infographic Journey Map</span>
            </div>
            <span>Verified Journey</span>
          </div>

        </div>
      )}

    </div>
  );
};
