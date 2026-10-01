import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Sparkles,
  Flame,
  GraduationCap,
  Cpu,
  FolderKanban,
  HeartHandshake,
  AlertTriangle,
  Trophy,
  Target,
  Briefcase,
  Info,
  X,
  Layers,
  ChevronRight
} from 'lucide-react';
import type { StoryKeyword } from '../../types';

interface KeywordCloudProps {
  keywords: StoryKeyword[] | string[];
  variant?: 'card' | 'full';
  storyTitle?: string;
  category?: string;
}

export interface PlacedCloudWord {
  text: string;
  rawKeyword: StoryKeyword;
  fontSize: number;
  color: string;
  clusterKey: string;
  clusterLabel: string;
  isCentral: boolean;
  importanceScore: number;
  relatedWordTexts: string[];
}

export interface ClusterDefinition {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;        // Text / Main Accent Color
  bgColor: string;      // Soft Pastel Fill
  borderColor: string;  // Border & Connection Stroke Color
  targetXRatio: number; // 0..1 Canvas X Ratio
  targetYRatio: number; // 0..1 Canvas Y Ratio
  rxRatio: number;      // Horizontal Radius Ratio
  ryRatio: number;      // Vertical Radius Ratio
}

// 8 Semantic Clusters around the Center Concept
const SEMANTIC_CLUSTERS: Record<string, ClusterDefinition> = {
  EDUCATION: {
    key: 'EDUCATION',
    label: 'Education',
    icon: GraduationCap,
    color: '#0369a1',       // Deep Sky Blue
    bgColor: '#f0f9ff',     // Light Blue Pastel
    borderColor: '#7dd3fc', // Soft Blue Border
    targetXRatio: 0.22,
    targetYRatio: 0.22,
    rxRatio: 0.16,
    ryRatio: 0.15
  },
  PEOPLE: {
    key: 'PEOPLE',
    label: 'People & Mentors',
    icon: HeartHandshake,
    color: '#854d0e',       // Deep Amber/Yellow
    bgColor: '#fefce8',     // Light Yellow Pastel
    borderColor: '#fde047', // Soft Yellow Border
    targetXRatio: 0.78,
    targetYRatio: 0.22,
    rxRatio: 0.16,
    ryRatio: 0.15
  },
  TECHNOLOGY: {
    key: 'TECHNOLOGY',
    label: 'Technology & Skills',
    icon: Cpu,
    color: '#6b21a8',       // Deep Lavender/Purple
    bgColor: '#faf5ff',     // Light Lavender Pastel
    borderColor: '#d8b4fe', // Soft Lavender Border
    targetXRatio: 0.16,
    targetYRatio: 0.52,
    rxRatio: 0.16,
    ryRatio: 0.15
  },
  CHALLENGES: {
    key: 'CHALLENGES',
    label: 'Challenges & Growth',
    icon: AlertTriangle,
    color: '#9f1239',       // Deep Rose
    bgColor: '#fff1f2',     // Light Pink Pastel
    borderColor: '#fecdd3', // Soft Pink Border
    targetXRatio: 0.84,
    targetYRatio: 0.52,
    rxRatio: 0.16,
    ryRatio: 0.15
  },
  PROJECTS: {
    key: 'PROJECTS',
    label: 'Projects & Work',
    icon: FolderKanban,
    color: '#115e59',       // Deep Teal
    bgColor: '#f0fdf4',     // Light Teal/Mint Pastel
    borderColor: '#99f6e4', // Soft Teal Border
    targetXRatio: 0.22,
    targetYRatio: 0.82,
    rxRatio: 0.16,
    ryRatio: 0.15
  },
  ACHIEVEMENT: {
    key: 'ACHIEVEMENT',
    label: 'Achievements & Impact',
    icon: Trophy,
    color: '#701a75',       // Deep Purple
    bgColor: '#fdf4ff',     // Light Purple Pastel
    borderColor: '#f5d0fe', // Soft Purple Border
    targetXRatio: 0.78,
    targetYRatio: 0.82,
    rxRatio: 0.16,
    ryRatio: 0.15
  },
  FUTURE: {
    key: 'FUTURE',
    label: 'Future & Vision',
    icon: Target,
    color: '#0284c7',       // Sky Blue
    bgColor: '#e0f2fe',     // Light Sky Pastel
    borderColor: '#bae6fd', // Soft Sky Border
    targetXRatio: 0.50,
    targetYRatio: 0.14,
    rxRatio: 0.15,
    ryRatio: 0.13
  },
  CAREER: {
    key: 'CAREER',
    label: 'Career Milestones',
    icon: Briefcase,
    color: '#14532d',       // Deep Green
    bgColor: '#f0fdf4',     // Light Green Pastel
    borderColor: '#bbf7d0', // Soft Green Border
    targetXRatio: 0.50,
    targetYRatio: 0.88,
    rxRatio: 0.15,
    ryRatio: 0.13
  }
};

// Fallback Cluster Mapping based on Keyword Text or Type
function classifySemanticCluster(kwText: string, type?: string, clusterProp?: string): string {
  if (clusterProp && SEMANTIC_CLUSTERS[clusterProp.toUpperCase()]) {
    return clusterProp.toUpperCase();
  }
  if (type) {
    const t = type.toUpperCase();
    if (t.includes('ACHIEV') || t.includes('AWARD') || t.includes('RECORD')) return 'ACHIEVEMENT';
    if (t.includes('TECH') || t.includes('SKILL')) return 'TECHNOLOGY';
    if (t.includes('CHALLENG') || t.includes('OBSTACL')) return 'CHALLENGES';
    if (t.includes('MILESTON') || t.includes('CAREER')) return 'CAREER';
  }

  const text = kwText.toUpperCase();
  if (text.includes('COLLEGE') || text.includes('DEGREE') || text.includes('EDUCATION') || text.includes('LEARNING') || text.includes('SCHOOL') || text.includes('DOCTORATE') || text.includes('GRADUAT') || text.includes('STUDY') || text.includes('UNIVERSITY') || text.includes('ACADEMIC')) {
    return 'EDUCATION';
  }
  if (text.includes('PYTHON') || text.includes('JAVA') || text.includes('SQL') || text.includes('CODE') || text.includes('TECH') || text.includes('SOFTWARE') || text.includes('AI') || text.includes('DATA') || text.includes('REACT') || text.includes('SYSTEM') || text.includes('ENGINEER') || text.includes('ALGORITHM') || text.includes('CLOUD') || text.includes('SOLAR') || text.includes('GRID')) {
    return 'TECHNOLOGY';
  }
  if (text.includes('PROJECT') || text.includes('STARTUP') || text.includes('IMPLEMENT') || text.includes('MICROGRID') || text.includes('PLATFORM') || text.includes('PRODUCT') || text.includes('APP') || text.includes('BUILD') || text.includes('DEVELOPMENT') || text.includes('INITIATIVE')) {
    return 'PROJECTS';
  }
  if (text.includes('MENTOR') || text.includes('SUPPORT') || text.includes('GUIDANCE') || text.includes('COMMUNITY') || text.includes('TEAM') || text.includes('PEOPLE') || text.includes('ADVISOR') || text.includes('FAMILY') || text.includes('LEADER') || text.includes('COLLABORAT')) {
    return 'PEOPLE';
  }
  if (text.includes('CHALLENGE') || text.includes('INJURY') || text.includes('DIFFICULT') || text.includes('FAILURE') || text.includes('OBSTACLE') || text.includes('HARDSHIP') || text.includes('DEBT') || text.includes('RECOVERY') || text.includes('RESILIENC') || text.includes('STRUGGLE')) {
    return 'CHALLENGES';
  }
  if (text.includes('GOLD') || text.includes('AWARD') || text.includes('UNICORN') || text.includes('BILLION') || text.includes('VALUATION') || text.includes('WINNER') || text.includes('MEDAL') || text.includes('IMPACT') || text.includes('SUCCESS') || text.includes('RECOGNITION') || text.includes('HONOR')) {
    return 'ACHIEVEMENT';
  }
  if (text.includes('FUTURE') || text.includes('VISION') || text.includes('GOAL') || text.includes('SCALE') || text.includes('EXPANSION') || text.includes('NEXT') || text.includes('TRANSFORMATION') || text.includes('INNOVATION')) {
    return 'FUTURE';
  }
  return 'CAREER';
}

// Generate organic SVG blob path d attribute
function getOrganicBlobPath(cx: number, cy: number, rx: number, ry: number, seedIndex: number = 0): string {
  // Variations for smooth organic blob edges
  const offsets = [
    [0.98, 0.95, 1.04, 0.96, 1.02, 0.94, 1.05, 0.95],
    [1.02, 0.94, 0.98, 1.05, 0.95, 1.02, 0.96, 1.04],
    [0.95, 1.04, 0.96, 1.02, 0.94, 1.05, 0.95, 1.02],
    [1.04, 0.96, 1.02, 0.94, 1.05, 0.95, 1.02, 0.94]
  ];
  const o = offsets[seedIndex % offsets.length];

  const topY = cy - ry * o[0];
  const rightX = cx + rx * o[1];
  const bottomY = cy + ry * o[2];
  const leftX = cx - rx * o[3];

  const cpTopRightX = cx + rx * 0.55 * o[4];
  const cpTopRightY = cy - ry * o[0];
  const cpRightTopX = cx + rx * o[1];
  const cpRightTopY = cy - ry * 0.55 * o[5];

  const cpRightBottomX = cx + rx * o[1];
  const cpRightBottomY = cy + ry * 0.55 * o[6];
  const cpBottomRightX = cx + rx * 0.55 * o[7];
  const cpBottomRightY = cy + ry * o[2];

  const cpBottomLeftX = cx - rx * 0.55 * o[4];
  const cpBottomLeftY = cy + ry * o[2];
  const cpLeftBottomX = cx - rx * o[3];
  const cpLeftBottomY = cy + ry * 0.55 * o[5];

  const cpLeftTopX = cx - rx * o[3];
  const cpLeftTopY = cy - ry * 0.55 * o[6];
  const cpTopLeftX = cx - rx * 0.55 * o[7];
  const cpTopLeftY = cy - ry * o[0];

  return `M ${cx} ${topY}
    C ${cpTopRightX} ${cpTopRightY}, ${cpRightTopX} ${cpRightTopY}, ${rightX} ${cy}
    C ${cpRightBottomX} ${cpRightBottomY}, ${cpBottomRightX} ${cpBottomRightY}, ${cx} ${bottomY}
    C ${cpBottomLeftX} ${cpBottomLeftY}, ${cpLeftBottomX} ${cpLeftBottomY}, ${leftX} ${cy}
    C ${cpLeftTopX} ${cpLeftTopY}, ${cpTopLeftX} ${cpTopLeftY}, ${cx} ${topY} Z`;
}

// Generate smooth curved quadratic/cubic bezier connecting lines
function getOrganicConnectorPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  // Offset control point orthogonally for smooth curved stroke
  const cx1 = x1 + dx * 0.5 - dy * 0.18;
  const cy1 = y1 + dy * 0.5 + dx * 0.18;
  return `M ${x1} ${y1} Q ${cx1} ${cy1} ${x2} ${y2}`;
}

export const KeywordCloud: React.FC<KeywordCloudProps> = ({ keywords, variant = 'full', storyTitle, category: _category }) => {
  const [hoveredWord, setHoveredWord] = useState<PlacedCloudWord | null>(null);
  const [selectedWord, setSelectedWord] = useState<PlacedCloudWord | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasDim, setCanvasDim] = useState<{ width: number; height: number }>({ width: 1000, height: 680 });

  // Canvas Dimensions & Responsive Handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = Math.min(720, Math.max(480, w * 0.64));
        setCanvasDim({ width: Math.max(320, w), height: h });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Parse & Normalize Input Keywords
  const normalizedKeywords: StoryKeyword[] = useMemo(() => {
    if (!keywords || keywords.length === 0) return [];

    const parsed = keywords.map((item, idx) => {
      if (typeof item === 'string') {
        const word = item.trim();
        const score = Math.max(35, Math.round(98 - idx * (60 / Math.max(1, keywords.length - 1))));
        return {
          word,
          score,
          count: 1,
          type: 'Core Theme',
          cluster: classifySemanticCluster(word)
        };
      }
      return {
        word: item.word.trim(),
        score: typeof item.score === 'number' ? item.score : 60,
        count: item.count || 1,
        type: item.type || 'Core Theme',
        cluster: item.cluster || classifySemanticCluster(item.word, item.type, item.cluster),
        relatedKeywords: item.relatedKeywords || []
      };
    });

    // Deduplicate by uppercase word
    const map = new Map<string, StoryKeyword>();
    parsed.forEach(k => {
      const uKey = k.word.toUpperCase();
      if (!map.has(uKey) || (map.get(uKey)?.score || 0) < k.score) {
        map.set(uKey, k);
      }
    });

    const list = Array.from(map.values());
    list.sort((a, b) => b.score - a.score);
    return list;
  }, [keywords]);

  // Card Variant Rendering (for inline story list cards)
  if (variant === 'card') {
    return (
      <div className="w-full bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80 my-2 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-black text-slate-500 uppercase tracking-wider px-1">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>Story Keywords</span>
          </span>
          <span className="text-purple-700 font-extrabold">{normalizedKeywords.length} Concepts</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {normalizedKeywords.slice(0, 6).map((kw, idx) => {
            const clusterKey = kw.cluster || classifySemanticCluster(kw.word);
            const cluster = SEMANTIC_CLUSTERS[clusterKey] || SEMANTIC_CLUSTERS.CAREER;
            return (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-800 bg-white border shadow-2xs"
                style={{ borderColor: cluster.borderColor, backgroundColor: cluster.bgColor }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cluster.color }} />
                <span>{kw.word}</span>
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // Handle Empty Keywords State
  if (normalizedKeywords.length === 0) {
    return (
      <div className="w-full bg-white rounded-[32px] p-8 border border-slate-200 text-center my-6 shadow-sm">
        <Info className="w-8 h-8 text-purple-400 mx-auto mb-2" />
        <p className="text-sm font-bold text-slate-600">No story keywords available to render the visualization.</p>
      </div>
    );
  }

  // Identify Central Concept (Highest importance keyword)
  const centralKeyword = normalizedKeywords[0];

  // Group keywords into active semantic clusters around center
  const clusterGroups = useMemo(() => {
    const groups: Record<string, StoryKeyword[]> = {};
    normalizedKeywords.slice(1).forEach(kw => {
      const cKey = kw.cluster || classifySemanticCluster(kw.word, kw.type);
      if (!groups[cKey]) groups[cKey] = [];
      groups[cKey].push(kw);
    });
    return groups;
  }, [normalizedKeywords]);

  const activeClusterKeys = Object.keys(clusterGroups);
  const W = 1000;
  const H = 680;
  const centerX = W / 2;
  const centerY = H / 2;
  const isMobile = canvasDim.width < 640;

  return (
    <div className="w-full bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] border border-slate-100 relative overflow-hidden my-6 select-none font-sans">

      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black shadow-2xs mt-0.5">
            <Sparkles className="w-6 h-6 text-amber-500 fill-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-[34px] font-black text-slate-900 tracking-tight flex items-center gap-2 font-sans">
              <span>STORY KEYWORD CLOUD</span>
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
              Key concepts connected across this success journey
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-4 py-1.5 rounded-full text-xs font-black text-purple-900 bg-purple-50 border border-purple-200/80 shadow-2xs">
            {normalizedKeywords.length} Connected Concepts
          </span>
        </div>
      </div>

      {/* VISUALIZATION CANVAS */}
      <div
        ref={containerRef}
        className="relative w-full bg-[#fafafd] rounded-[28px] border border-slate-200/80 overflow-hidden"
        style={{ minHeight: isMobile ? 'auto' : `${canvasDim.height}px` }}
      >

        {/* DESKTOP & TABLET SVG RADIAL INFOGRAPHIC (>= 640px) */}
        {!isMobile && (
          <svg
            className="w-full h-full block"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Soft Drop Shadow Filter for Organic Blobs */}
              <filter id="blob-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.04" />
              </filter>
              {/* Soft Ambient Glow for Central Node */}
              <filter id="center-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="16" floodColor="#059669" floodOpacity="0.12" />
              </filter>
            </defs>

            {/* BACKGROUND DECORATIVE ELEMENTS */}
            <g className="pointer-events-none opacity-40">
              {/* Subtle Floating Dots */}
              <circle cx="120" cy="100" r="2.5" fill="#cbd5e1" />
              <circle cx="880" cy="110" r="2" fill="#cbd5e1" />
              <circle cx="90" cy="560" r="3" fill="#cbd5e1" />
              <circle cx="920" cy="580" r="2.5" fill="#cbd5e1" />
              <circle cx="500" cy="60" r="2" fill="#94a3b8" />
              {/* Short Accent Strokes */}
              <path d="M 140 180 Q 155 170 170 185" stroke="#cbd5e1" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
              <path d="M 830 520 Q 845 535 860 520" stroke="#cbd5e1" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
            </g>

            {/* CURVED CONNECTING BEZIER LINES & CIRCULAR NODES */}
            {activeClusterKeys.map((cKey) => {
              const cluster = SEMANTIC_CLUSTERS[cKey] || SEMANTIC_CLUSTERS.CAREER;
              const targetX = cluster.targetXRatio * W;
              const targetY = cluster.targetYRatio * H;
              const pathD = getOrganicConnectorPath(centerX, centerY, targetX, targetY);

              return (
                <g key={`connector-${cKey}`} className="transition-opacity duration-300">
                  {/* Curved Connector Stroke */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={cluster.borderColor}
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    opacity="0.8"
                  />
                  {/* Node Dot at Center end */}
                  <circle
                    cx={centerX + (targetX - centerX) * 0.18}
                    cy={centerY + (targetY - centerY) * 0.18}
                    r="4"
                    fill={cluster.color}
                    opacity="0.9"
                  />
                  {/* Node Dot at Cluster end */}
                  <circle
                    cx={targetX - (targetX - centerX) * 0.15}
                    cy={targetY - (targetY - centerY) * 0.15}
                    r="4"
                    fill={cluster.color}
                    opacity="0.9"
                  />
                </g>
              );
            })}

            {/* ORGANIC BLOB CLOUDS */}
            {activeClusterKeys.map((cKey, seedIdx) => {
              const cluster = SEMANTIC_CLUSTERS[cKey] || SEMANTIC_CLUSTERS.CAREER;
              const clusterKwList = clusterGroups[cKey] || [];
              const IconComp = cluster.icon;

              const cx = cluster.targetXRatio * W;
              const cy = cluster.targetYRatio * H;
              const rx = cluster.rxRatio * W;
              const ry = cluster.ryRatio * H;

              const blobPathD = getOrganicBlobPath(cx, cy, rx, ry, seedIdx);

              // Sort cluster words by score
              const sortedWords = [...clusterKwList].sort((a, b) => b.score - a.score);
              const mainWord = sortedWords[0];
              const supportingWords = sortedWords.slice(1, 4);

              return (
                <g key={`cloud-${cKey}`} className="group">
                  {/* Blob Path Background */}
                  <path
                    d={blobPathD}
                    fill={cluster.bgColor}
                    stroke={cluster.borderColor}
                    strokeWidth="2.5"
                    filter="url(#blob-shadow)"
                    className="transition-all duration-300 group-hover:stroke-purple-400 group-hover:scale-[1.02]"
                    style={{ transformOrigin: `${cx}px ${cy}px` }}
                  />

                  {/* CLUSTER TITLE & VECTOR ICON */}
                  <g transform={`translate(${cx}, ${cy - ry * 0.55})`}>
                    {/* Foreign Object for Vector Icon */}
                    <foreignObject x="-14" y="-24" width="28" height="28" className="overflow-visible pointer-events-none">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-2xs mx-auto" style={{ backgroundColor: cluster.color }}>
                        <IconComp className="w-4 h-4 text-white" />
                      </div>
                    </foreignObject>

                    {/* Category Title Text */}
                    <text
                      x="0"
                      y="18"
                      textAnchor="middle"
                      fill={cluster.color}
                      fontSize="16"
                      fontWeight="900"
                      letterSpacing="0.05em"
                      className="uppercase select-none font-sans"
                    >
                      {cluster.label.toUpperCase()}
                    </text>
                  </g>

                  {/* MAIN IMPORTANT KEYWORD INSIDE CLOUD */}
                  {mainWord && (
                    <g
                      transform={`translate(${cx}, ${cy - ry * 0.05})`}
                      className="cursor-pointer"
                      onClick={() => setSelectedWord({
                        text: mainWord.word,
                        rawKeyword: mainWord,
                        fontSize: 26,
                        color: cluster.color,
                        clusterKey: cKey,
                        clusterLabel: cluster.label,
                        isCentral: false,
                        importanceScore: mainWord.score,
                        relatedWordTexts: (mainWord.relatedKeywords || []).map(r => r.toUpperCase())
                      })}
                      onMouseEnter={(e) => {
                        setHoveredWord({
                          text: mainWord.word,
                          rawKeyword: mainWord,
                          fontSize: 26,
                          color: cluster.color,
                          clusterKey: cKey,
                          clusterLabel: cluster.label,
                          isCentral: false,
                          importanceScore: mainWord.score,
                          relatedWordTexts: (mainWord.relatedKeywords || []).map(r => r.toUpperCase())
                        });
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (rect) {
                          setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top - 40 });
                        }
                      }}
                      onMouseLeave={() => setHoveredWord(null)}
                    >
                      <text
                        x="0"
                        y="0"
                        textAnchor="middle"
                        fill="#0f172a"
                        fontSize="23"
                        fontWeight="800"
                        className="hover:fill-purple-700 transition-colors select-none font-sans"
                      >
                        {mainWord.word}
                      </text>
                    </g>
                  )}

                  {/* SUPPORTING KEYWORDS INSIDE CLOUD */}
                  {supportingWords.length > 0 && (
                    <g transform={`translate(${cx}, ${cy + ry * 0.38})`}>
                      <text textAnchor="middle" x="0" y="0">
                        {supportingWords.map((sKw, sIdx) => {
                          const xOffset = (sIdx - (supportingWords.length - 1) / 2) * 64;
                          return (
                            <tspan
                              key={sIdx}
                              x={xOffset}
                              fill="#475569"
                              fontSize="14"
                              fontWeight="600"
                              className="cursor-pointer hover:fill-purple-800 transition-colors select-none font-sans"
                              onClick={() => setSelectedWord({
                                text: sKw.word,
                                rawKeyword: sKw,
                                fontSize: 15,
                                color: cluster.color,
                                clusterKey: cKey,
                                clusterLabel: cluster.label,
                                isCentral: false,
                                importanceScore: sKw.score,
                                relatedWordTexts: (sKw.relatedKeywords || []).map(r => r.toUpperCase())
                              })}
                            >
                              {sKw.word}{sIdx < supportingWords.length - 1 ? '  ' : ''}
                            </tspan>
                          );
                        })}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* CENTRAL CONCEPT NODE */}
            <g transform={`translate(${centerX}, ${centerY})`} className="group cursor-pointer">
              {/* Outer Glow Backdrop */}
              <ellipse
                cx="0"
                cy="0"
                rx={Math.max(140, centralKeyword.word.length * 14)}
                ry="50"
                fill="#ecfdf5"
                stroke="#10b981"
                strokeWidth="2.5"
                filter="url(#center-glow)"
                className="transition-transform duration-300 group-hover:scale-105"
              />

              {/* Central Keyword Text (60–90px bold visual weight) */}
              <text
                x="0"
                y="12"
                textAnchor="middle"
                fill="#064e3b"
                fontSize="38"
                fontWeight="900"
                className="tracking-tight select-none font-sans"
                onClick={() => setSelectedWord({
                  text: centralKeyword.word,
                  rawKeyword: centralKeyword,
                  fontSize: 42,
                  color: '#064e3b',
                  clusterKey: centralKeyword.cluster || 'CAREER',
                  clusterLabel: 'Central Concept',
                  isCentral: true,
                  importanceScore: centralKeyword.score,
                  relatedWordTexts: (centralKeyword.relatedKeywords || []).map(r => r.toUpperCase())
                })}
              >
                {centralKeyword.word}
              </text>

              {/* Central Badge Label */}
              <rect
                x="-50"
                y="-42"
                width="100"
                height="20"
                rx="10"
                fill="#047857"
              />
              <text
                x="0"
                y="-28"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="10"
                fontWeight="800"
                letterSpacing="0.08em"
                className="uppercase select-none"
              >
                CORE CONCEPT
              </text>
            </g>
          </svg>
        )}

        {/* MOBILE RESPONSIVE STACKED CLUSTER CARDS (< 640px) */}
        {isMobile && (
          <div className="p-4 space-y-5">
            {/* HERO CENTRAL CONCEPT CARD */}
            <div className="bg-emerald-50/90 rounded-2xl p-5 border-2 border-emerald-300 text-center space-y-2 shadow-sm">
              <span className="inline-block px-3 py-1 bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-full">
                Core Story Concept
              </span>
              <h3 className="text-2xl font-black text-emerald-950 tracking-tight">
                {centralKeyword.word}
              </h3>
              <p className="text-xs font-semibold text-emerald-800">
                Primary theme connecting all story milestones
              </p>
            </div>

            {/* VERTICAL ORGANIC CLUSTER CARDS */}
            {activeClusterKeys.map(cKey => {
              const cluster = SEMANTIC_CLUSTERS[cKey] || SEMANTIC_CLUSTERS.CAREER;
              const clusterKwList = clusterGroups[cKey] || [];
              if (clusterKwList.length === 0) return null;
              const IconComp = cluster.icon;

              return (
                <div
                  key={`mobile-cluster-${cKey}`}
                  className="rounded-2xl p-4 border-2 shadow-2xs space-y-3"
                  style={{ borderColor: cluster.borderColor, backgroundColor: cluster.bgColor }}
                >
                  <div className="flex items-center gap-2.5 border-b pb-2.5" style={{ borderColor: `${cluster.color}33` }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: cluster.color }}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-wide font-sans" style={{ color: cluster.color }}>
                      {cluster.label}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {clusterKwList.map((kw, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedWord({
                          text: kw.word,
                          rawKeyword: kw,
                          fontSize: idx === 0 ? 20 : 14,
                          color: cluster.color,
                          clusterKey: cKey,
                          clusterLabel: cluster.label,
                          isCentral: false,
                          importanceScore: kw.score,
                          relatedWordTexts: (kw.relatedKeywords || []).map(r => r.toUpperCase())
                        })}
                        className="px-3.5 py-1.5 bg-white border rounded-xl text-xs font-extrabold shadow-2xs active:scale-95 transition-transform flex items-center gap-1.5"
                        style={{ borderColor: `${cluster.color}55`, color: idx === 0 ? '#0f172a' : cluster.color }}
                      >
                        <span className={idx === 0 ? 'font-black text-sm text-slate-900' : 'font-semibold'}>
                          {kw.word}
                        </span>
                        <span className="text-[10px] opacity-70 font-bold">({kw.score}%)</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* HOVER TOOLTIP OVERLAY */}
        {hoveredWord && !isMobile && (
          <div
            className="absolute z-30 pointer-events-none bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xl border border-slate-700 -translate-x-1/2 transition-all duration-150 flex items-center gap-2"
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hoveredWord.color }} />
            <span className="font-extrabold">{hoveredWord.text}</span>
            <span className="text-slate-400 text-[10px]">({hoveredWord.importanceScore}% Importance)</span>
          </div>
        )}
      </div>

      {/* DETAIL MODAL DIALOG ON CLICK */}
      {selectedWord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 relative">
            <button
              onClick={() => setSelectedWord(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Title & Category Badge */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{selectedWord.clusterLabel}</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 pt-1">
                {selectedWord.text}
              </h3>
            </div>

            {/* Importance Score Bar */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
                <span>Semantic Story Importance</span>
                <span style={{ color: selectedWord.color }}>{selectedWord.importanceScore}% Score</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${selectedWord.importanceScore}%`, backgroundColor: selectedWord.color }}
                />
              </div>
            </div>

            {/* Story Context Explanation */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Story Context</h4>
              <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed">
                "{selectedWord.text}" represents a key concept in {storyTitle || 'this success journey'}. It contributes significantly to overall career trajectory and accomplishments.
              </p>
            </div>

            {/* Related Concepts */}
            {selectedWord.relatedWordTexts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Related Concepts</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedWord.relatedWordTexts.map((rel, rIdx) => (
                    <span key={rIdx} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-900 border border-purple-100">
                      {rel}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedWord(null)}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Close Detail View</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FOOTER METADATA */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500 pt-4 border-t border-slate-100">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
          Semantic cluster positioning based on real story context and concept relationships
        </span>
        <span className="text-[11px] text-slate-400 italic">
          Click any keyword concept to view detailed insights
        </span>
      </div>
    </div>
  );
};
