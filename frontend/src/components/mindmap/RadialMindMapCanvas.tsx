import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  BackgroundVariant
} from '@xyflow/react';
import {
  Sparkles,
  RotateCcw,
  Download,
  Info,
  ChevronRight,
  Search,
  X
} from 'lucide-react';
import { toPng } from 'html-to-image';
import type { MindMapNode, MindMapEdge, MindMapNodeData } from '../../types';

// ==========================================
// CUSTOM REACT FLOW NODES FOR RADIAL MIND MAP
// ==========================================

// 1. Center Person Node
const CenterPersonNode: React.FC<{ data: MindMapNodeData }> = ({ data }) => {
  const [imgError, setImgError] = useState(false);
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'Hero')}&background=7c3aed&color=fff&size=256`;
  const avatarSrc = imgError || !data.image ? defaultAvatar : data.image;

  return (
    <div className="relative group cursor-pointer">
      <Handle type="source" position={Position.Right} id="right" className="opacity-0" />
      <Handle type="source" position={Position.Left} id="left" className="opacity-0" />
      <Handle type="source" position={Position.Top} id="top" className="opacity-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0" />

      {/* Radiant Glowing Ring Effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 via-indigo-500 to-amber-400 rounded-full blur-lg opacity-70 group-hover:opacity-100 transition-opacity" />

      <div className="relative w-44 h-44 rounded-full bg-white p-2 shadow-2xl border-4 border-purple-400 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-purple-600 to-indigo-500 overflow-hidden shadow-inner">
          <img
            src={avatarSrc}
            alt={data.name || 'Center'}
            className="w-full h-full rounded-full object-cover bg-slate-100"
            onError={() => setImgError(true)}
          />
        </div>

        <h3 className="mt-2 text-sm font-black text-[#1e1b4b] line-clamp-1 uppercase tracking-tight px-2">
          {data.name || 'Protagonist'}
        </h3>
        <p className="text-[10px] font-extrabold text-purple-700 line-clamp-1 tracking-wider uppercase px-2">
          {data.title || 'Success Story'}
        </p>

        <span className="absolute -bottom-2 bg-gradient-to-r from-purple-700 to-indigo-600 text-white text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-widest shadow-md">
          STORY CENTER
        </span>
      </div>
    </div>
  );
};

// 2. Level 1 Main Branch Node
const MainBranchNode: React.FC<{ data: MindMapNodeData }> = ({ data }) => {
  const accent = data.color || data.accentColor || '#7c3aed';

  return (
    <div
      onClick={() => data.onSelectNode?.(data)}
      style={{ borderColor: accent }}
      className="bg-white rounded-2xl p-4 border-3 shadow-lg min-w-[220px] max-w-[260px] transition-all hover:scale-105 hover:shadow-xl cursor-pointer relative group"
    >
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">{data.icon || '📌'}</span>
          <span className="text-xs font-black text-[#1e1b4b] uppercase tracking-tight line-clamp-1">
            {data.title || data.label}
          </span>
        </div>

        {data.date && (
          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black shrink-0">
            {data.date}
          </span>
        )}
      </div>

      <div className="mb-2">
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-extrabold uppercase tracking-wider">
          {data.categoryKey || data.category || 'Event'}
        </span>
      </div>

      {data.summary && (
        <p className="text-[11px] font-medium text-slate-600 line-clamp-3 leading-snug">
          {data.summary}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between text-[10px] font-extrabold text-purple-700">
        <span>Click for details</span>
        <ChevronRight className="w-3.5 h-3.5 text-purple-500 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

// 3. Level 2 Sub Branch Node
const SubBranchNode: React.FC<{ data: MindMapNodeData }> = ({ data }) => {
  const accent = data.color || data.accentColor || '#3b82f6';

  return (
    <div
      onClick={() => data.onSelectNode?.(data)}
      className="bg-white rounded-xl p-3 border-2 border-slate-200 shadow-md min-w-[180px] max-w-[220px] hover:border-purple-400 hover:shadow-lg transition-all cursor-pointer relative"
    >
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />

      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accent }} />
        <h4 className="text-[11px] font-extrabold text-[#1e1b4b] uppercase tracking-tight line-clamp-1 flex-1">
          {data.title || data.label}
        </h4>

        {data.date && (
          <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[9px] font-black shrink-0">
            {data.date}
          </span>
        )}
      </div>

      {data.summary && (
        <p className="text-[10px] font-medium text-slate-500 line-clamp-2 leading-tight">
          {data.summary}
        </p>
      )}
    </div>
  );
};

// 4. Level 3 Detail Node
const DetailNode: React.FC<{ data: MindMapNodeData }> = ({ data }) => {
  return (
    <div
      onClick={() => data.onSelectNode?.(data)}
      className="bg-slate-900 text-white rounded-lg px-3 py-2 border border-slate-700 shadow-sm max-w-[180px] hover:bg-purple-950 transition-colors cursor-pointer"
    >
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
      <Handle type="target" position={Position.Top} className="opacity-0" />

      <p className="text-[10px] font-bold leading-tight line-clamp-2">
        • {data.title || data.label}
      </p>
    </div>
  );
};

// Node types mapping table for React Flow
const nodeTypes = {
  centerPersonNode: CenterPersonNode,
  personNode: CenterPersonNode,
  mainBranchNode: MainBranchNode,
  categoryNode: MainBranchNode,
  subBranchNode: SubBranchNode,
  detailNode: DetailNode
};

// ==========================================
// MAIN RADIAL MIND MAP CANVAS CONTAINER
// ==========================================

interface RadialMindMapCanvasProps {
  initialNodes: MindMapNode[];
  initialEdges: MindMapEdge[];
  personName?: string;
  storyTitle?: string;
  onRegenerate?: () => void;
}

export const RadialMindMapCanvas: React.FC<RadialMindMapCanvasProps> = ({
  initialNodes,
  initialEdges,
  personName = 'Featured Alumni',
  storyTitle = 'Success Story',
  onRegenerate
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<any>(initialNodes as any[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>(initialEdges as any[]);
  const [selectedNode, setSelectedNode] = useState<MindMapNodeData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedBranchIds, setCollapsedBranchIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const handleSelectNode = useCallback((data: MindMapNodeData) => {
    setSelectedNode(data);
  }, []);

  // Helper functions for structural equality checking
  const areNodesStructurallyEqual = (prevNodes: any[], newNodes: any[]) => {
    if (prevNodes.length !== newNodes.length) return false;
    return prevNodes.every((n, i) => {
      const target = newNodes[i];
      if (!target) return false;
      return (
        n.id === target.id &&
        n.type === target.type &&
        (n.data?.title || n.data?.label || '') === (target.data?.title || target.data?.label || '')
      );
    });
  };

  const areEdgesStructurallyEqual = (prevEdges: any[], newEdges: any[]) => {
    if (prevEdges.length !== newEdges.length) return false;
    return prevEdges.every((e, i) => {
      const target = newEdges[i];
      if (!target) return false;
      return e.id === target.id && e.source === target.source && e.target === target.target;
    });
  };

  // Sync state when props change (only if structurally different)
  useEffect(() => {
    setNodes(prev => {
      if (areNodesStructurallyEqual(prev, initialNodes)) {
        return prev;
      }
      return initialNodes as any[];
    });
    setEdges(prev => {
      if (areEdgesStructurallyEqual(prev, initialEdges)) {
        return prev;
      }
      return initialEdges as any[];
    });
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Toggle Collapse / Expand for branch nodes
  const handleToggleExpand = useCallback((branchId: string) => {
    setCollapsedBranchIds((prev) => {
      const next = new Set(prev);
      if (next.has(branchId)) {
        next.delete(branchId);
      } else {
        next.add(branchId);
      }
      return next;
    });
  }, []);

  // Filter visible nodes based on collapse state & search query
  const visibleNodes = useMemo(() => {
    return nodes.map((node: any) => {
      const nodeData = (node.data || {}) as MindMapNodeData;
      const labelText = (nodeData.label || nodeData.title || '').toString();
      const summaryText = (nodeData.summary || '').toString();

      const isSearchMatch =
        searchQuery.trim() === '' ||
        labelText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        summaryText.toLowerCase().includes(searchQuery.toLowerCase());

      const parentId = nodeData.parentId;
      const isParentCollapsed = parentId ? collapsedBranchIds.has(parentId) : false;

      const isHidden = isParentCollapsed || (!isSearchMatch && searchQuery.trim().length > 0);
      const isExpanded = !collapsedBranchIds.has(node.id);

      // Preserve reference if no relevant property changed
      if (
        node.hidden === isHidden &&
        nodeData.isExpanded === isExpanded &&
        nodeData.onSelectNode === handleSelectNode &&
        nodeData.onToggleExpand === handleToggleExpand
      ) {
        return node;
      }

      return {
        ...node,
        hidden: isHidden,
        data: {
          ...nodeData,
          isExpanded,
          onToggleExpand: handleToggleExpand,
          onSelectNode: handleSelectNode
        }
      };
    });
  }, [nodes, collapsedBranchIds, searchQuery, handleToggleExpand, handleSelectNode]);

  const visibleEdges = useMemo(() => {
    return edges.map((edge) => {
      const isSourceCollapsed = collapsedBranchIds.has(edge.source);
      if (edge.hidden === isSourceCollapsed) return edge;
      return {
        ...edge,
        hidden: isSourceCollapsed
      };
    });
  }, [edges, collapsedBranchIds]);

  // PNG Export Handler
  const handleExportPng = async () => {
    if (!containerRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(containerRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `${personName.replace(/\s+/g, '_')}_Radial_Mind_Map.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export Mind Map PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative w-full h-[650px] sm:h-[750px] bg-gradient-to-br from-slate-50 via-purple-50/20 to-indigo-50/30 rounded-3xl border-4 border-purple-200/80 shadow-2xl overflow-hidden my-6">
      
      {/* Top Floating Controls Header Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-purple-100 shadow-md">
        
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#1e1b4b] uppercase tracking-tight flex items-center gap-2">
              <span>Dynamic Story Journey Map</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black">
                {visibleNodes.filter(n => !n.hidden).length} Nodes
              </span>
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              {personName}: {storyTitle}
            </p>
          </div>
        </div>

        {/* Search Input Filter */}
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search story nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Regenerate</span>
            </button>
          )}

          <button
            onClick={handleExportPng}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Save PNG'}</span>
          </button>
        </div>

      </div>

      {/* Main React Flow Canvas */}
      <div ref={containerRef} className="w-full h-full">
        <ReactFlow
          nodes={visibleNodes}
          edges={visibleEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2.5}
          defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#cbd5e1" />
          <Controls showInteractive={false} className="bg-white rounded-2xl shadow-lg border border-purple-100 p-1" />
        </ReactFlow>
      </div>

      {/* Bottom Canvas Usage Tips */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-purple-100 text-[10px] font-bold text-slate-500 shadow-sm flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-purple-600" />
        <span>Drag nodes to position • Click nodes to expand source quote & full details</span>
      </div>

      {/* Node Inspector Drawer / Modal */}
      {selectedNode && (
        <div className="absolute top-20 right-4 z-30 w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border-2 border-purple-300 animate-in slide-in-from-right duration-200 space-y-4 max-h-[80%] overflow-y-auto">
          <div className="flex items-start justify-between gap-2 border-b border-purple-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedNode.icon || '📍'}</span>
              <div>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[9px] font-black uppercase tracking-wider">
                  {selectedNode.categoryKey || selectedNode.category || 'Story Event'}
                </span>
                <h4 className="text-base font-black text-[#1e1b4b] uppercase tracking-tight mt-0.5">
                  {selectedNode.title || selectedNode.label}
                </h4>
              </div>
            </div>

            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {selectedNode.summary && (
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                EVENT EXPLANATION
              </label>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed bg-purple-50/50 p-3 rounded-2xl border border-purple-100">
                {selectedNode.summary}
              </p>
            </div>
          )}

          {selectedNode.sourceText && (
            <div>
              <label className="block text-[10px] font-extrabold text-amber-700 uppercase tracking-widest mb-1 flex items-center gap-1">
                <span>Based on this part of the original story</span>
              </label>
              <p className="text-xs italic text-slate-700 bg-amber-50/80 p-3 rounded-2xl border border-amber-200/80 leading-relaxed">
                "{selectedNode.sourceText}"
              </p>
            </div>
          )}

          {selectedNode.date && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span className="text-purple-600">Period / Date:</span>
              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[11px] font-extrabold">
                {selectedNode.date}
              </span>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setSelectedNode(null)}
              className="px-4 py-1.5 bg-purple-600 text-white text-xs font-extrabold rounded-xl shadow-xs hover:bg-purple-700 transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
