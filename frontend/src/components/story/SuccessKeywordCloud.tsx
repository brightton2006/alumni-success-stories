import React, { useEffect, useState, useRef, useMemo } from 'react';
import type { CloudKeyword } from '../../types';
import { fetchKeywordCloud } from '../../utils/api';
import { KeywordTooltip } from './KeywordTooltip';
import { StoryResults } from './StoryResults';
import {
  Sparkles,
  RefreshCw,
  Compass,
  GitCommit,
  BookOpen,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Cpu,
  FolderKanban,
  HeartHandshake,
  AlertTriangle,
  Trophy
} from 'lucide-react';
import { VisualKeywordMap } from './VisualKeywordMap';
import { KeywordDetailModal } from './KeywordDetailModal';

export interface PlacedWord {
  keyword: CloudKeyword;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  fontWeight: number;
  clusterKey: string;
  clusterLabel: string;
  isCentral: boolean;
  relatedWordTexts: string[];
}

interface SuccessKeywordCloudProps {
  onKeywordClick?: (keyword: CloudKeyword) => void;
}

// Semantic Cluster Metadata Definition
export interface ClusterMeta {
  key: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  targetX: number; // 0 to 1 ratio of container width
  targetY: number; // 0 to 1 ratio of container height
}

const CLUSTER_DEFINITIONS: Record<string, ClusterMeta> = {
  FOUNDATION: {
    key: 'FOUNDATION',
    label: 'Foundation & Education',
    icon: GraduationCap,
    color: '#059669', // Emerald
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    targetX: 0.22,
    targetY: 0.28
  },
  TECHNOLOGY: {
    key: 'TECHNOLOGY',
    label: 'Technology & Skills',
    icon: Cpu,
    color: '#7c3aed', // Purple
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    targetX: 0.24,
    targetY: 0.72
  },
  PROJECTS: {
    key: 'PROJECTS',
    label: 'Projects & Experience',
    icon: FolderKanban,
    color: '#0284c7', // Cyan / Sky Blue
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
    targetX: 0.50,
    targetY: 0.80
  },
  SUPPORT: {
    key: 'SUPPORT',
    label: 'People & Support',
    icon: HeartHandshake,
    color: '#e11d48', // Rose
    bgColor: '#fff1f2',
    borderColor: '#fecdd3',
    targetX: 0.78,
    targetY: 0.28
  },
  CHALLENGE: {
    key: 'CHALLENGE',
    label: 'Challenges & Resilience',
    icon: AlertTriangle,
    color: '#d97706', // Amber
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    targetX: 0.50,
    targetY: 0.22
  },
  ACHIEVEMENTS: {
    key: 'ACHIEVEMENTS',
    label: 'Achievement & Impact',
    icon: Trophy,
    color: '#b45309', // Gold
    bgColor: '#fefce8',
    borderColor: '#fef08a',
    targetX: 0.78,
    targetY: 0.72
  }
};

// Map raw keyword to cluster key
function getClusterKeyForKeyword(kw: CloudKeyword): string {
  if (kw.cluster && CLUSTER_DEFINITIONS[kw.cluster]) {
    return kw.cluster;
  }

  const text = kw.text.toUpperCase();
  const category = (kw.categories && kw.categories[0]) ? kw.categories[0].toUpperCase() : '';

  if (text.includes('COLLEGE') || text.includes('EDUCATION') || text.includes('LEARNING') || text.includes('BACKGROUND') || text.includes('EARLY') || text.includes('SCHOOL') || text.includes('DEGREE') || text.includes('SELF-TAUGHT') || text.includes('DOCTORATE') || category.includes('EDUCATION')) {
    return 'FOUNDATION';
  }
  if (text.includes('PYTHON') || text.includes('JAVA') || text.includes('SQL') || text.includes('CODE') || text.includes('SOLAR') || text.includes('ENERGY') || text.includes('TECH') || text.includes('PROGRAMMING') || text.includes('SOFTWARE') || text.includes('AI') || text.includes('SYSTEM') || text.includes('GRID') || text.includes('DATA') || text.includes('SPARK') || text.includes('KAFKA') || text.includes('AWS') || text.includes('REACT') || text.includes('DOCKER') || category.includes('PROGRAMMING') || category.includes('DATABASE') || category.includes('CLOUD') || category.includes('TECHNOLOGY')) {
    return 'TECHNOLOGY';
  }
  if (text.includes('PROJECT') || text.includes('DEVELOPMENT') || text.includes('INTERNSHIP') || text.includes('IMPLEMENTATION') || text.includes('CODEPULSE') || text.includes('HOMES') || text.includes('MICROGRID') || text.includes('STARTUP') || text.includes('SCHOLARSHIP') || category.includes('PROJECT')) {
    return 'PROJECTS';
  }
  if (text.includes('MENTOR') || text.includes('ANNA') || text.includes('GUIDANCE') || text.includes('SUPPORT') || text.includes('TEACHER') || text.includes('COMMUNITY') || text.includes('YOUTH') || text.includes('TEAM') || text.includes('FOUNDATION') || text.includes('COACHING') || text.includes('HELP')) {
    return 'SUPPORT';
  }
  if (text.includes('INJURY') || text.includes('CHALLENGE') || text.includes('DIFFICULTY') || text.includes('FAILURE') || text.includes('OBSTACLE') || text.includes('HARDSHIP') || text.includes('DEBT') || text.includes('OUTAGE') || text.includes('RESILIENCE') || text.includes('PROBLEM')) {
    return 'CHALLENGE';
  }
  if (text.includes('GOLD') || text.includes('AWARD') || text.includes('RECORD') || text.includes('UNICORN') || text.includes('BILLION') || text.includes('WINNER') || text.includes('ACHIEVE') || text.includes('SUCCESS') || text.includes('IMPACT') || text.includes('VALUATION') || text.includes('MEDAL') || text.includes('GROWTH') || category.includes('ACHIEVEMENT')) {
    return 'ACHIEVEMENTS';
  }

  return 'FOUNDATION';
}

// Derive related keywords array dynamically
function getRelatedWordTexts(kw: CloudKeyword, allKeywords: CloudKeyword[]): string[] {
  if (Array.isArray(kw.relatedKeywords) && kw.relatedKeywords.length > 0) {
    return kw.relatedKeywords.map(k => k.toUpperCase());
  }

  const clusterKey = getClusterKeyForKeyword(kw);
  const clusterMembers = allKeywords
    .filter(k => getClusterKeyForKeyword(k) === clusterKey && k.text !== kw.text)
    .map(k => k.text.toUpperCase());

  return clusterMembers;
}

export const SuccessKeywordCloud: React.FC<SuccessKeywordCloudProps> = ({ onKeywordClick }) => {
  const [viewMode, setViewMode] = useState<'cloud' | 'timeline'>('cloud');
  const [keywords, setKeywords] = useState<CloudKeyword[]>([]);
  const [_totalStories, setTotalStories] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedKeyword, setSelectedKeyword] = useState<CloudKeyword | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [showFullStory, setShowFullStory] = useState<boolean>(false);

  // Hover state for interactive relationship highlighting
  const [hoveredWord, setHoveredWord] = useState<PlacedWord | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 960, height: 600 });

  // Fetch real-time cloud data from backend API & supplement with rich dataset
  const loadCloudData = async () => {
    setLoading(true);
    try {
      const res = await fetchKeywordCloud();
      if (res.ok && Array.isArray(res.keywords) && res.keywords.length > 0) {
        setKeywords(res.keywords);
        setTotalStories(res.totalStories || 0);
      } else {
        setKeywords(getFallbackKeywordData());
      }
    } catch (err) {
      setKeywords(getFallbackKeywordData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCloudData();
  }, []);

  // Update cloud container dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = Math.min(680, Math.max(480, w * 0.58));
        setDimensions({ width: Math.max(340, w), height: h });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // =========================================================================
  // SEMANTIC CLUSTER-CENTROID LAYOUT ENGINE (Zero Overlap & Spatial Proximity)
  // =========================================================================
  const placedWords = useMemo<PlacedWord[]>(() => {
    if (!keywords || keywords.length === 0) return [];

    const { width: W, height: H } = dimensions;
    const isMobile = W < 640;

    // Mobile layout handled separately via stacked cards
    if (isMobile) {
      return [];
    }

    const placed: PlacedWord[] = [];

    // Collision detection with bounding box padding
    const isColliding = (
      x1: number, y1: number, w1: number, h1: number,
      x2: number, y2: number, w2: number, h2: number,
      padding: number = 8
    ) => {
      return (
        x1 - padding < x2 + w2 &&
        x1 + w1 + padding > x2 &&
        y1 - padding < y2 + h2 &&
        y1 + h1 + padding > y2
      );
    };

    // Sort keywords: Highest importance score first
    const sortedKeywords = [...keywords].sort((a, b) => b.importanceScore - a.importanceScore);

    // Identify central concept (Top 1 importance keyword)
    const centralKeyword = sortedKeywords[0];

    sortedKeywords.forEach((kw, idx) => {
      const isCentral = (kw.text === centralKeyword.text);
      const clusterKey = getClusterKeyForKeyword(kw);
      const clusterMeta = CLUSTER_DEFINITIONS[clusterKey] || CLUSTER_DEFINITIONS.FOUNDATION;

      // Font size calculation based on importance score
      let fontSize = 16;
      if (isCentral) {
        fontSize = Math.min(64, Math.max(38, Math.round(W * 0.042)));
      } else if (kw.sizeCategory === 'hero' || kw.importanceScore >= 90) {
        fontSize = Math.min(48, Math.max(28, Math.round(W * 0.030)));
      } else if (kw.sizeCategory === 'large' || kw.importanceScore >= 75) {
        fontSize = Math.min(34, Math.max(22, Math.round(W * 0.022)));
      } else if (kw.sizeCategory === 'medium' || kw.importanceScore >= 55) {
        fontSize = Math.min(24, Math.max(16, Math.round(W * 0.016)));
      } else {
        fontSize = Math.min(18, Math.max(13, Math.round(W * 0.012)));
      }

      const fontWidthRatio = 0.58;
      const textWidth = Math.max(30, kw.text.length * fontSize * fontWidthRatio);
      const textHeight = fontSize * 1.15;

      const boxW = textWidth;
      const boxH = textHeight;

      // Target centroid for this cluster
      let targetX = isCentral ? (W / 2) : (clusterMeta.targetX * W);
      let targetY = isCentral ? (H / 2) : (clusterMeta.targetY * H);

      // Spiral outward search centered around cluster centroid
      let posX = targetX - boxW / 2;
      let posY = targetY - boxH / 2;
      let placedSuccessfully = false;

      let theta = (idx * 45 * Math.PI) / 180;
      let radius = 0;
      const stepSize = 0.18;
      const spiralA = 6;
      const maxSteps = 1500;

      for (let step = 0; step < maxSteps; step++) {
        theta += stepSize;
        radius = spiralA * theta;

        const testX = targetX + radius * Math.cos(theta) - boxW / 2;
        const testY = targetY + radius * Math.sin(theta) * 0.75 - boxH / 2;

        // Ensure within canvas boundaries
        if (testX < 16 || testX + boxW > W - 16 || testY < 20 || testY + boxH > H - 20) {
          continue;
        }

        // Test collision against already placed words
        let collision = false;
        for (const p of placed) {
          if (isColliding(testX, testY, boxW, boxH, p.x, p.y, p.width, p.height, 8)) {
            collision = true;
            break;
          }
        }

        if (!collision) {
          posX = testX;
          posY = testY;
          placedSuccessfully = true;
          break;
        }
      }

      if (placedSuccessfully || isCentral || idx < 3) {
        const relatedWordTexts = getRelatedWordTexts(kw, keywords);
        const fontWeight = isCentral ? 900 : kw.importanceScore >= 80 ? 800 : kw.importanceScore >= 60 ? 700 : 600;

        placed.push({
          keyword: kw,
          x: posX,
          y: posY,
          width: boxW,
          height: boxH,
          fontSize,
          color: clusterMeta.color,
          fontWeight,
          clusterKey,
          clusterLabel: clusterMeta.label,
          isCentral,
          relatedWordTexts
        });
      }
    });

    return placed;
  }, [keywords, dimensions]);

  // Derive cluster centroid positions for visual cluster headers & hulls
  const clusterCentroidMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number; count: number; meta: ClusterMeta }>();
    placedWords.forEach(p => {
      const meta = CLUSTER_DEFINITIONS[p.clusterKey];
      if (!meta) return;
      if (!map.has(p.clusterKey)) {
        map.set(p.clusterKey, { x: p.x + p.width / 2, y: p.y + p.height / 2, count: 1, meta });
      } else {
        const curr = map.get(p.clusterKey)!;
        curr.x += p.x + p.width / 2;
        curr.y += p.y + p.height / 2;
        curr.count += 1;
      }
    });

    const result: Array<{ key: string; x: number; y: number; meta: ClusterMeta }> = [];
    map.forEach((val, key) => {
      result.push({
        key,
        x: Math.round(val.x / val.count),
        y: Math.round(val.y / val.count),
        meta: val.meta
      });
    });

    return result;
  }, [placedWords]);

  // Compute SVG connecting line paths between hovered word and related words
  const relationshipConnectorLines = useMemo(() => {
    if (!hoveredWord) return [];

    const lines: Array<{ id: string; pathStr: string; color: string }> = [];
    const sourceX = hoveredWord.x + hoveredWord.width / 2;
    const sourceY = hoveredWord.y + hoveredWord.height / 2;

    const relatedTextsUpper = new Set(hoveredWord.relatedWordTexts.map(t => t.toUpperCase()));

    placedWords.forEach((targetWord) => {
      if (targetWord.keyword.text === hoveredWord.keyword.text) return;

      const isRelated = relatedTextsUpper.has(targetWord.keyword.text.toUpperCase()) ||
        targetWord.clusterKey === hoveredWord.clusterKey;

      if (isRelated) {
        const targetX = targetWord.x + targetWord.width / 2;
        const targetY = targetWord.y + targetWord.height / 2;

        // Quadratic curve through midpoint with perpendicular offset
        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2;
        const ctrlX = midX + (targetY - sourceY) * 0.15;
        const ctrlY = midY - (targetX - sourceX) * 0.15;

        const pathStr = `M ${sourceX} ${sourceY} Q ${ctrlX} ${ctrlY} ${targetX} ${targetY}`;

        lines.push({
          id: `link-${hoveredWord.keyword.text}-${targetWord.keyword.text}`,
          pathStr,
          color: hoveredWord.color
        });
      }
    });

    return lines;
  }, [hoveredWord, placedWords]);

  // Handlers
  const handleKeywordClick = (kw: CloudKeyword) => {
    setSelectedKeyword(kw);
    setIsDetailModalOpen(true);
    if (onKeywordClick) onKeywordClick(kw);
  };

  const handleMouseEnterWord = (item: PlacedWord, e: React.MouseEvent) => {
    setHoveredWord(item);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (hoveredWord) {
      setTooltipPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseLeaveCanvas = () => {
    setHoveredWord(null);
  };

  return (
    <section className="w-full space-y-8 py-4 select-none">
      
      {/* SECTION HEADER */}
      <div className="text-center max-w-4xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100/90 border border-purple-200 text-purple-900 font-extrabold text-xs tracking-wider uppercase shadow-2xs">
          <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
          <span>AI & Semantic Clustered Intelligence</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1e1b4b] tracking-tight">
          SEMANTIC STORY WORD CLOUD
        </h2>

        <p className="text-slate-600 text-sm sm:text-base font-semibold max-w-2xl mx-auto leading-relaxed">
          Keywords are grouped into semantic clusters in physical proximity based on story relationships. Hover over any keyword to reveal related concepts.
        </p>

        {/* View Switcher & Action Bar */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setViewMode('cloud')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                viewMode === 'cloud'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Clustered Word Cloud</span>
            </button>

            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                viewMode === 'timeline'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitCommit className="w-4 h-4" />
              <span>Visual Roadmap</span>
            </button>
          </div>

          <button
            onClick={() => setShowFullStory(!showFullStory)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs border border-purple-200 transition-all shadow-2xs"
          >
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span>{showFullStory ? 'Hide Full Story' : 'Explore My Full Story'}</span>
            {showFullStory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* RENDER VIEW: CLUSTERED WORD CLOUD OR ROADMAP */}
      {viewMode === 'timeline' ? (
        <VisualKeywordMap />
      ) : (
        /* MAIN SEMANTIC WORD CLOUD CONTAINER */
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeaveCanvas}
          className="relative w-full bg-white rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_-15px_rgba(30,27,75,0.06)] p-4 sm:p-8 overflow-hidden min-h-[480px] flex items-center justify-center select-none"
        >
          {/* Subtle Decorative Canvas Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_50%,#000_70%,transparent_100%)] opacity-50 pointer-events-none" />

          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-20 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
              <p className="font-extrabold text-sm text-slate-600">Extracting Semantic Clusters & Positioning Keywords...</p>
            </div>
          ) : keywords.length === 0 ? (
            <div className="text-center max-w-md py-16 px-4 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-purple-50 border border-purple-200 text-purple-600 mx-auto flex items-center justify-center shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                No Keywords Available
              </h3>
            </div>
          ) : dimensions.width < 640 ? (
            /* ======================================================== */
            /* MOBILE STACKED SEMANTIC CLUSTER VIEW (< 640px)           */
            /* ======================================================== */
            <div className="w-full space-y-6 py-4 px-1 relative z-10">
              {Object.values(CLUSTER_DEFINITIONS).map((clusterMeta) => {
                const clusterKeywords = keywords.filter(k => getClusterKeyForKeyword(k) === clusterMeta.key);
                if (clusterKeywords.length === 0) return null;
                const IconComp = clusterMeta.icon;

                return (
                  <div
                    key={clusterMeta.key}
                    className="p-4 rounded-2xl border transition-all space-y-3"
                    style={{ backgroundColor: clusterMeta.bgColor, borderColor: clusterMeta.borderColor }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: clusterMeta.color }}>
                        <IconComp className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                        {clusterMeta.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {clusterKeywords.map((kw) => (
                        <button
                          key={kw.text}
                          onClick={() => handleKeywordClick(kw)}
                          className="px-3 py-1.5 rounded-xl bg-white border font-bold text-xs shadow-2xs hover:scale-105 transition-transform"
                          style={{ borderColor: `${clusterMeta.color}44`, color: clusterMeta.color }}
                        >
                          <span>{kw.text}</span>
                          <span className="ml-1 text-[10px] opacity-70">({kw.importanceScore}%)</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ======================================================== */
            /* DESKTOP 2D SEMANTIC CLUSTER SVG CANVAS (md / lg screens) */
            /* ======================================================== */
            <svg
              width="100%"
              height={dimensions.height}
              viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
              className="w-full h-full cursor-default relative z-10"
            >
              <defs>
                {/* Glow Filter for Active Hovered Keywords */}
                <filter id="semantic-hover-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#6366f1" floodOpacity="0.35" />
                </filter>
              </defs>

              {/* 1. CLUSTER BACKGROUND CENTROID LABELS */}
              {clusterCentroidMap.map((c) => {
                return (
                  <g key={`cluster-label-${c.key}`} className="pointer-events-none opacity-40">
                    <rect
                      x={c.x - 70}
                      y={c.y - 45}
                      width={140}
                      height={26}
                      rx={13}
                      fill={c.meta.bgColor}
                      stroke={c.meta.borderColor}
                      strokeWidth={1}
                    />
                    <text
                      x={c.x}
                      y={c.y - 28}
                      fontSize={10}
                      fontWeight={800}
                      fill={c.meta.color}
                      textAnchor="middle"
                      letterSpacing="0.05em"
                      fontFamily="Inter, system-ui, sans-serif"
                    >
                      {c.meta.label.toUpperCase()}
                    </text>
                  </g>
                );
              })}

              {/* 2. DYNAMIC RELATIONSHIP CONNECTOR LINES (Fade in on hover) */}
              {relationshipConnectorLines.map((line) => (
                <path
                  key={line.id}
                  d={line.pathStr}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  opacity={0.85}
                  className="animate-pulse"
                />
              ))}

              {/* 3. SEMANTIC CLUSTERED KEYWORD LABELS */}
              {placedWords.map((item, idx) => {
                const { keyword, x, y, width, height, fontSize, color, fontWeight, isCentral } = item;
                const isSelected = selectedKeyword?.text === keyword.text;
                const isHovered = hoveredWord?.keyword.text === keyword.text;

                const isRelatedToHovered = hoveredWord ? (
                  hoveredWord.keyword.text === keyword.text ||
                  hoveredWord.relatedWordTexts.map(t => t.toUpperCase()).includes(keyword.text.toUpperCase()) ||
                  hoveredWord.clusterKey === item.clusterKey
                ) : true;

                const textX = x + width / 2;
                const textY = y + fontSize * 0.88;

                // Opacity & Transform depending on hover status
                let opacity = 0.90;
                let scale = 1;
                if (hoveredWord) {
                  if (isHovered) {
                    opacity = 1.0;
                    scale = 1.12;
                  } else if (isRelatedToHovered) {
                    opacity = 1.0;
                    scale = 1.04;
                  } else {
                    opacity = 0.18; // Slightly fade unrelated keywords as specified in prompt
                    scale = 0.95;
                  }
                }

                return (
                  <g
                    key={`${keyword.text}-${idx}`}
                    tabIndex={0}
                    role="button"
                    aria-label={`${keyword.text}, cluster ${item.clusterLabel}, importance score ${keyword.importanceScore}%`}
                    onClick={() => handleKeywordClick(keyword)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleKeywordClick(keyword);
                      }
                    }}
                    onMouseEnter={(e) => handleMouseEnterWord(item, e)}
                    className="group outline-none cursor-pointer"
                  >
                    {/* Background Chip Glow for Central / Hero Keywords */}
                    {(isCentral || isHovered || isSelected) && (
                      <rect
                        x={x - 6}
                        y={y - 2}
                        width={width + 12}
                        height={height + 4}
                        rx={8}
                        fill={isHovered ? `${color}18` : isCentral ? '#f5f3ff' : 'transparent'}
                        stroke={isHovered ? color : isCentral ? `${color}44` : 'transparent'}
                        strokeWidth={1.5}
                        className="transition-all duration-200"
                      />
                    )}

                    <text
                      x={textX}
                      y={textY}
                      fontSize={fontSize}
                      fontWeight={fontWeight}
                      fill={isHovered ? '#6366f1' : color}
                      opacity={opacity}
                      fontFamily="Inter, system-ui, -apple-system, sans-serif"
                      className="transition-all duration-200 ease-out font-black"
                      style={{
                        textAnchor: 'middle',
                        letterSpacing: isCentral ? '-0.04em' : '-0.02em',
                        transform: `scale(${scale})`,
                        transformOrigin: `${textX}px ${textY}px`,
                        filter: isHovered || isSelected ? 'url(#semantic-hover-glow)' : 'none'
                      }}
                    >
                      {keyword.text}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      )}

      {/* FLOATING HOVER TOOLTIP */}
      <KeywordTooltip
        keyword={hoveredWord ? hoveredWord.keyword : null}
        x={tooltipPos.x}
        y={tooltipPos.y}
        visible={Boolean(hoveredWord)}
      />

      {/* INTERACTIVE KEYWORD DETAIL MODAL */}
      <KeywordDetailModal
        keyword={selectedKeyword ? {
          title: selectedKeyword.text,
          category: (selectedKeyword.categories && selectedKeyword.categories[0]) ? selectedKeyword.categories[0] : 'TECHNOLOGY',
          description: `Key concept extracted from my journey. Cluster: ${selectedKeyword.clusterLabel || getClusterKeyForKeyword(selectedKeyword)}. Importance Score: ${selectedKeyword.importanceScore}%.`,
          importanceScore: selectedKeyword.importanceScore,
          stories: selectedKeyword.stories
        } : null}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />

      {/* EXPANDABLE COMPLETE ORIGINAL STORY SECTION */}
      {showFullStory && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-purple-100 shadow-xl space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
          
          <div className="flex items-center justify-between border-b border-purple-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  MY COMPLETE STORY & JOURNEY
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  Original long-form storytelling content extracted to construct the visual semantic keyword cloud above.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowFullStory(false)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs"
            >
              Close Story
            </button>
          </div>

          {/* Structured Story Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Story 1 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-3">
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase">
                Clean Energy & Microgrids
              </div>
              <h4 className="font-extrabold text-slate-900 text-lg">Elena Rostova</h4>
              <p className="text-xs font-semibold text-slate-500">Clean Energy Innovator & Researcher • Nairobi, Kenya</p>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Elena Rostova grew up in a rural village with frequent power outages. Driven by an early childhood dream, she earned her doctorate in Renewable Energy Systems in 2018 and developed decentralized, AI-optimized solar microgrids. Today, her innovation powers over 50,000 rural homes, 120 schools, and 45 clinics across East Africa.
              </p>
            </div>

            {/* Story 2 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-3">
              <div className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-black uppercase">
                Data & Software Engineering
              </div>
              <h4 className="font-extrabold text-slate-900 text-lg">Carlos Mendoza</h4>
              <p className="text-xs font-semibold text-slate-500">CEO & Co-founder, CodePulse • Austin, Texas</p>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Carlos dropped out of high school at 17 to support his family and taught himself software engineering during late-night library shifts. After early startup failures, he realized artificial intelligence could automate software code reviews. He created CodePulse, scaling it to 500 team members and a $1.2B unicorn valuation.
              </p>
            </div>

            {/* Story 3 */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-3">
              <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black uppercase">
                Athletic Endurance & Sports
              </div>
              <h4 className="font-extrabold text-slate-900 text-lg">Elena Rostova</h4>
              <p className="text-xs font-semibold text-slate-500">Olympic Marathon Gold Medalist • Zurich, Switzerland</p>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                After suffering a devastating knee injury at age 22, doctors warned Elena she might never sprint competitively again. Through an intensive biomechanical recovery program and mental conditioning, she returned to competition, set a national marathon record, and won Olympic Gold in Paris.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* FILTERED STORY RESULTS IF A KEYWORD IS CLICKED BELOW */}
      <StoryResults
        selectedKeyword={selectedKeyword}
        onClearFilter={() => setSelectedKeyword(null)}
      />

    </section>
  );
};

// Fallback Structured Keyword Dataset (Rich Semantic Cluster Meta Included)
function getFallbackKeywordData(): CloudKeyword[] {
  return [
    {
      text: 'DATA ENGINEERING',
      count: 12,
      importanceScore: 100,
      sizeCategory: 'hero',
      categories: ['DATA ENGINEERING'],
      cluster: 'TECHNOLOGY',
      clusterLabel: 'Technology & Skills',
      relatedKeywords: ['PYTHON', 'SQL', 'SPARK', 'KAFKA', 'AWS'],
      stories: [
        {
          id: 'seed-story-2',
          storyTitle: 'From High School Dropout to Tech Unicorn Founder',
          personName: 'Carlos Mendoza',
          profession: 'CEO & Co-founder, CodePulse',
          location: 'Austin, Texas',
          category: 'Entrepreneurship',
          shortSummary: 'Carlos built AI automated code audit & data pipeline infrastructure valued at $1.2B.',
          personImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
          showName: true
        }
      ]
    },
    {
      text: 'PYTHON',
      count: 10,
      importanceScore: 92,
      sizeCategory: 'hero',
      categories: ['PROGRAMMING'],
      cluster: 'TECHNOLOGY',
      clusterLabel: 'Technology & Skills',
      relatedKeywords: ['DATA ENGINEERING', 'SQL', 'SPARK', 'REACT'],
      stories: []
    },
    {
      text: 'SQL',
      count: 9,
      importanceScore: 90,
      sizeCategory: 'hero',
      categories: ['DATABASE'],
      cluster: 'TECHNOLOGY',
      clusterLabel: 'Technology & Skills',
      relatedKeywords: ['PYTHON', 'DATA ENGINEERING', 'KAFKA'],
      stories: []
    },
    {
      text: 'SOLAR MICROGRIDS',
      count: 8,
      importanceScore: 88,
      sizeCategory: 'hero',
      categories: ['TECHNOLOGY'],
      cluster: 'PROJECTS',
      clusterLabel: 'Projects & Experience',
      relatedKeywords: ['50K HOMES ELECTRIFIED', 'CLEAN ENERGY', 'NROOBI INNOVATION'],
      stories: [
        {
          id: 'seed-story-1',
          storyTitle: 'Pioneering Clean Solar Microgrids for Rural Communities',
          personName: 'Elena Rostova',
          profession: 'Clean Energy Innovator',
          location: 'Nairobi, Kenya',
          category: 'Innovation',
          shortSummary: 'Decentralized off-grid solar microgrids powering over 50,000 rural families.',
          personImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
          showName: true
        }
      ]
    },
    {
      text: 'SELF-TAUGHT LEARNING',
      count: 7,
      importanceScore: 85,
      sizeCategory: 'hero',
      categories: ['EDUCATION'],
      cluster: 'FOUNDATION',
      clusterLabel: 'Foundation & Education',
      relatedKeywords: ['DEGREE', 'LIBRARY SHIFTS', 'COLLEGE'],
      stories: []
    },
    {
      text: 'AWS CLOUD',
      count: 7,
      importanceScore: 82,
      sizeCategory: 'large',
      categories: ['CLOUD'],
      cluster: 'TECHNOLOGY',
      clusterLabel: 'Technology & Skills',
      relatedKeywords: ['DOCKER', 'KAFKA', 'DATA ENGINEERING'],
      stories: []
    },
    {
      text: 'CODEPULSE UNICORN',
      count: 6,
      importanceScore: 80,
      sizeCategory: 'large',
      categories: ['PROJECTS'],
      cluster: 'PROJECTS',
      clusterLabel: 'Projects & Experience',
      relatedKeywords: ['1.2B VALUATION', 'STARTUP', 'SERIES C'],
      stories: []
    },
    {
      text: 'MENTOR GUIDANCE',
      count: 6,
      importanceScore: 78,
      sizeCategory: 'large',
      categories: ['SUPPORT'],
      cluster: 'SUPPORT',
      clusterLabel: 'People & Support',
      relatedKeywords: ['TEACHER SUPPORT', 'COMMUNITY TEAM', 'YOUTH ADVICE'],
      stories: []
    },
    {
      text: 'KNEE INJURY RECOVERY',
      count: 5,
      importanceScore: 75,
      sizeCategory: 'large',
      categories: ['CHALLENGE'],
      cluster: 'CHALLENGE',
      clusterLabel: 'Challenges & Resilience',
      relatedKeywords: ['FINANCIAL HARDSHIP', 'STARTUP FAILURES', 'OBSTACLES'],
      stories: []
    },
    {
      text: 'OLYMPIC GOLD MEDAL',
      count: 5,
      importanceScore: 72,
      sizeCategory: 'large',
      categories: ['ACHIEVEMENTS'],
      cluster: 'ACHIEVEMENTS',
      clusterLabel: 'Achievement & Impact',
      relatedKeywords: ['1.2B VALUATION', 'MARATHON RECORD', 'SUCCESS'],
      stories: []
    },
    {
      text: '$1.2B VALUATION',
      count: 5,
      importanceScore: 70,
      sizeCategory: 'medium',
      categories: ['ACHIEVEMENTS'],
      cluster: 'ACHIEVEMENTS',
      clusterLabel: 'Achievement & Impact',
      relatedKeywords: ['OLYMPIC GOLD MEDAL', 'MARATHON RECORD', 'IMPACT'],
      stories: []
    },
    {
      text: 'REACT & TYPESCRIPT',
      count: 4,
      importanceScore: 68,
      sizeCategory: 'medium',
      categories: ['PROGRAMMING'],
      cluster: 'TECHNOLOGY',
      clusterLabel: 'Technology & Skills',
      relatedKeywords: ['PYTHON', 'SQL', 'AWS CLOUD'],
      stories: []
    },
    {
      text: 'COMMUNITY YOUTH TEAM',
      count: 4,
      importanceScore: 65,
      sizeCategory: 'medium',
      categories: ['SUPPORT'],
      cluster: 'SUPPORT',
      clusterLabel: 'People & Support',
      relatedKeywords: ['MENTOR GUIDANCE', 'TEACHER SUPPORT'],
      stories: []
    },
    {
      text: 'MARATHON RECORD',
      count: 4,
      importanceScore: 62,
      sizeCategory: 'medium',
      categories: ['ACHIEVEMENTS'],
      cluster: 'ACHIEVEMENTS',
      clusterLabel: 'Achievement & Impact',
      relatedKeywords: ['OLYMPIC GOLD MEDAL', '$1.2B VALUATION'],
      stories: []
    },
    {
      text: 'STARTUP FAILURES',
      count: 3,
      importanceScore: 58,
      sizeCategory: 'medium',
      categories: ['CHALLENGE'],
      cluster: 'CHALLENGE',
      clusterLabel: 'Challenges & Resilience',
      relatedKeywords: ['KNEE INJURY RECOVERY', 'FINANCIAL HARDSHIP'],
      stories: []
    },
    {
      text: '50K HOMES ELECTRIFIED',
      count: 3,
      importanceScore: 54,
      sizeCategory: 'medium',
      categories: ['PROJECTS'],
      cluster: 'PROJECTS',
      clusterLabel: 'Projects & Experience',
      relatedKeywords: ['SOLAR MICROGRIDS', 'CODEPULSE UNICORN'],
      stories: []
    },
    {
      text: '$10M SCHOLARSHIP FUND',
      count: 3,
      importanceScore: 50,
      sizeCategory: 'small',
      categories: ['PROJECTS'],
      cluster: 'PROJECTS',
      clusterLabel: 'Projects & Experience',
      relatedKeywords: ['50K HOMES ELECTRIFIED', 'SOLAR MICROGRIDS'],
      stories: []
    }
  ];
}
