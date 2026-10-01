import React, { useState } from 'react';
import { Trash2, Save, Sparkles, RefreshCw, Plus, Edit2, Check, X } from 'lucide-react';
import type { Story, MindMapNode } from '../../types';

interface AdminMindMapEditorProps {
  story: Story;
  onSave: (updatedStory: Story) => void;
  onRegenerateAi: () => void;
  isAnalyzing?: boolean;
}

export const AdminMindMapEditor: React.FC<AdminMindMapEditorProps> = ({
  story,
  onSave,
  onRegenerateAi,
  isAnalyzing = false
}) => {
  const [nodes, setNodes] = useState<MindMapNode[]>(story.aiMindMap?.nodes || []);

  // Editing Node state
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editItemsText, setEditItemsText] = useState('');

  // New Node state
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeIcon, setNewNodeIcon] = useState('📌');
  const [newNodeItemsText, setNewNodeItemsText] = useState('');

  const handleDeleteNode = (nodeId: string) => {
    if (nodeId === 'center-person') return; // Cannot delete center node
    const updatedNodes = nodes.filter(n => n.id !== nodeId);
    setNodes(updatedNodes);
  };

  const handleStartEditNode = (node: MindMapNode) => {
    setEditingNodeId(node.id);
    setEditLabel(node.data.label || node.data.title || node.data.name || '');
    setEditItemsText(node.data.summary || (Array.isArray(node.data.items) ? node.data.items.join('\n') : ''));
  };

  const handleSaveNodeEdit = (nodeId: string) => {
    const updatedNodes = nodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          data: {
            ...n.data,
            label: editLabel.trim(),
            title: editLabel.trim(),
            summary: editItemsText.trim()
          }
        };
      }
      return n;
    });

    setNodes(updatedNodes);
    setEditingNodeId(null);
  };

  const handleAddNode = () => {
    if (!newNodeLabel.trim()) return;

    const itemsArray = newNodeItemsText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const newNodeId = `node_custom_${Date.now()}`;
    const totalNodes = nodes.length;
    const angle = (2 * Math.PI * totalNodes) / (totalNodes + 1) - Math.PI / 2;
    const radius = 320;
    const x = Math.round(400 + radius * Math.cos(angle));
    const y = Math.round(300 + radius * Math.sin(angle));

    const newNode: MindMapNode = {
      id: newNodeId,
      type: 'mainBranchNode',
      position: { x, y },
      data: {
        categoryKey: 'Custom',
        label: newNodeLabel.trim(),
        title: newNodeLabel.trim(),
        summary: newNodeItemsText.trim() || 'Custom journey milestone',
        details: newNodeItemsText.trim() || 'Custom journey milestone',
        icon: newNodeIcon.trim() || '📌',
        color: '#8b5cf6',
        items: itemsArray.length > 0 ? itemsArray : ['Custom key point']
      }
    };

    setNodes([...nodes, newNode]);
    setShowAddNodeModal(false);
    setNewNodeLabel('');
    setNewNodeIcon('📌');
    setNewNodeItemsText('');
  };

  const handleSaveAll = () => {
    const updatedEdges = (story.aiMindMap?.edges || []).filter(
      e => nodes.some(n => n.id === e.source) && nodes.some(n => n.id === e.target)
    );

    // Add edges for any new nodes
    nodes.forEach(n => {
      if (n.id !== 'center-person' && !updatedEdges.some(e => e.target === n.id)) {
        updatedEdges.push({
          id: `edge-center-${n.id}`,
          source: 'center-person',
          target: n.id,
          animated: true,
          style: { stroke: '#7c3aed', strokeWidth: 2 }
        });
      }
    });

    const updatedStory: Story = {
      ...story,
      aiKeywords: story.aiKeywords,
      aiMindMap: {
        nodes,
        edges: updatedEdges
      }
    };

    onSave(updatedStory);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_10px_30px_-5px_rgba(124,58,237,0.1)] border-2 border-purple-200 my-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-purple-100">
        <div>
          <h3 className="text-xl font-black text-[#1e1b4b] flex items-center gap-2">
            <span>Admin Story Journey & Highlights Editor</span>
            <Sparkles className="w-5 h-5 text-purple-600" />
          </h3>
          <p className="text-xs font-semibold text-slate-500">
            Customize extracted nodes, add points, and update highlights before publishing. (Original story text remains 100% preserved).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRegenerateAi}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-300 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>Regenerate Journey Map</span>
          </button>

          <button
            onClick={() => setShowAddNodeModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary-soft hover:bg-primary-light text-primary font-bold text-xs rounded-xl border border-purple-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Node</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Edits</span>
          </button>
        </div>
      </div>

      {/* Add New Node Modal */}
      {showAddNodeModal && (
        <div className="p-5 rounded-2xl bg-purple-50 border-2 border-purple-300 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-purple-900 uppercase tracking-wider">
              Add Custom Journey Node
            </h4>
            <button onClick={() => setShowAddNodeModal(false)} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Node Label / Title</label>
              <input
                type="text"
                placeholder="e.g. Key Milestone"
                value={newNodeLabel}
                onChange={(e) => setNewNodeLabel(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Icon Emoji</label>
              <input
                type="text"
                placeholder="🎯"
                value={newNodeIcon}
                onChange={(e) => setNewNodeIcon(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-semibold text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Node Points (One per line)</label>
            <textarea
              rows={3}
              placeholder="First key takeaway..."
              value={newNodeItemsText}
              onChange={(e) => setNewNodeItemsText(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-medium"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAddNodeModal(false)}
              className="px-4 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNode}
              className="px-5 py-1.5 bg-purple-600 text-white text-xs font-extrabold rounded-xl shadow-xs"
            >
              Confirm Add Node
            </button>
          </div>
        </div>
      )}

      {/* Nodes List Editor */}
      <div>
        <h4 className="text-sm font-extrabold text-[#2e1065] mb-3 uppercase tracking-wide">
          Extracted Journey Nodes ({nodes.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nodes.map((node) => {
            const isCenter = node.id === 'center-person';
            const isEditing = editingNodeId === node.id;

            return (
              <div
                key={node.id}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  isCenter ? 'bg-purple-900 text-white border-purple-700' : 'bg-purple-50/50 border-purple-200'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-purple-900 mb-1">Title</label>
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-purple-900 mb-1">Bullet Points (One per line)</label>
                      <textarea
                        rows={3}
                        value={editItemsText}
                        onChange={(e) => setEditItemsText(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-medium text-slate-800"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingNodeId(null)}
                        className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveNodeEdit(node.id)}
                        className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Node</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{node.data.icon || '📍'}</span>
                        <span className={`font-black text-sm ${isCenter ? 'text-white' : 'text-[#2e1065]'}`}>
                          {node.data.label || node.data.name}
                        </span>
                      </div>

                      {!isCenter && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEditNode(node)}
                            className="p-1 text-purple-600 hover:text-purple-900 rounded"
                            title="Edit Node Title & Content"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNode(node.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Remove Node"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {node.data.summary ? (
                      <p className="text-xs text-slate-600 font-medium line-clamp-3">
                        {node.data.summary}
                      </p>
                    ) : Array.isArray(node.data.items) && (
                      <ul className="space-y-1 text-xs text-slate-600 font-medium">
                        {node.data.items.map((item: string, i: number) => (
                          <li key={i} className="line-clamp-2">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

