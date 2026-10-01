// Color palette pool for dynamic main branches & event nodes
const BRANCH_COLORS = [
  { name: 'emerald', hex: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
  { name: 'blue', hex: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { name: 'amber', hex: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { name: 'purple', hex: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  { name: 'cyan', hex: '#06b6d4', bg: '#ecfeff', border: '#a5f3fc' },
  { name: 'rose', hex: '#f43f5e', bg: '#fff1f2', border: '#fecdd3' },
  { name: 'indigo', hex: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  { name: 'teal', hex: '#14b8a6', bg: '#f0fdfa', border: '#99f6e4' },
  { name: 'pink', hex: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8' },
  { name: 'yellow', hex: '#eab308', bg: '#fefce8', border: '#fef08a' }
];

export const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  beginning: { label: 'Early Background', icon: '🌱', color: '#10b981' },
  education: { label: 'Education & Learning', icon: '🎓', color: '#3b82f6' },
  goal: { label: 'Dream & Goal', icon: '🎯', color: '#6366f1' },
  challenges: { label: 'Challenges & Struggles', icon: '⚡', color: '#f59e0b' },
  importantEvents: { label: 'Important Events', icon: '📅', color: '#0284c7' },
  turningPoint: { label: 'Turning Point', icon: '🔄', color: '#8b5cf6' },
  actions: { label: 'Actions Taken', icon: '🚀', color: '#06b6d4' },
  skills: { label: 'Skills & Projects', icon: '💻', color: '#14b8a6' },
  career: { label: 'Career Journey', icon: '💼', color: '#64748b' },
  achievements: { label: 'Key Achievements', icon: '🏆', color: '#eab308' },
  awards: { label: 'Awards & Recognition', icon: '🥇', color: '#f43f5e' },
  impact: { label: 'Impact Created', icon: '🌍', color: '#10b981' },
  lessons: { label: 'Lessons Learned', icon: '💡', color: '#e11d48' },
  futureVision: { label: 'Future Vision', icon: '🔮', color: '#d946ef' }
};

// Build hierarchical Mind Map tree structure from extracted sections or story text
export const buildHierarchicalMindMapTree = ({
  personName,
  storyTitle,
  personImage,
  sections: _sections,
  fullStory,
  events
}: {
  personName?: string;
  storyTitle?: string;
  personImage?: string;
  sections?: Record<string, any>;
  fullStory?: string;
  events?: any[];
}) => {
  let children: any[] = [];

  if (Array.isArray(events) && events.length > 0) {
    children = events.map((evt, idx) => {
      const colorObj = BRANCH_COLORS[idx % BRANCH_COLORS.length];
      return {
        id: evt.id || `node-${idx + 1}`,
        title: evt.title || `Stage ${idx + 1}`,
        summary: evt.summary || evt.details || '',
        details: evt.details || evt.summary || '',
        date: evt.date,
        people: evt.people || [],
        numbers: evt.numbers || [],
        achievements: evt.achievements || [],
        sourceText: evt.sourceText || '',
        category: evt.category || 'Event',
        icon: evt.icon || '📌',
        color: colorObj.hex
      };
    });
  } else {
    // Construct dynamic events directly from story paragraphs / sentences
    const storyText = fullStory || '';
    const paragraphs = storyText.split(/\n\n+/).filter(p => p.trim().length > 10);
    const textBlocks = paragraphs.length > 1 ? paragraphs : storyText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 15);

    textBlocks.forEach((block, idx) => {
      const colorObj = BRANCH_COLORS[idx % BRANCH_COLORS.length];
      const sentences = block.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 5);
      const mainSentence = sentences[0] || block;

      let category = 'Milestone';
      let icon = '📌';
      const bLower = block.toLowerCase();
      if (idx === 0 || bLower.includes('grew up') || bLower.includes('born') || bLower.includes('early')) {
        category = 'Beginning';
        icon = '🌱';
      } else if (bLower.includes('education') || bLower.includes('degree') || bLower.includes('school') || bLower.includes('college')) {
        category = 'Education';
        icon = '🎓';
      } else if (bLower.includes('dream') || bLower.includes('goal') || bLower.includes('wanted to')) {
        category = 'Dream & Goal';
        icon = '🎯';
      } else if (bLower.includes('challenge') || bLower.includes('struggle') || bLower.includes('obstacle') || bLower.includes('failed')) {
        category = 'Challenge';
        icon = '⚡';
      } else if (bLower.includes('turning point') || bLower.includes('realized') || bLower.includes('breakthrough')) {
        category = 'Turning Point';
        icon = '🔄';
      } else if (bLower.includes('achieved') || bLower.includes('won') || bLower.includes('secured') || bLower.includes('built')) {
        category = 'Achievement';
        icon = '🏆';
      } else if (bLower.includes('impact') || bLower.includes('helped') || bLower.includes('community')) {
        category = 'Impact';
        icon = '🌍';
      }

      const dateMatch = block.match(/\b(19\d\d|20\d\d|age\s+\d+|year\s+\d+)\b/i);
      const date = dateMatch ? dateMatch[0] : undefined;

      const titleParts = mainSentence.split(/[:–—]/);
      let shortTitle = titleParts[0]?.trim() || mainSentence.slice(0, 35);
      if (shortTitle.length > 45) shortTitle = shortTitle.slice(0, 42) + '...';

      children.push({
        id: `node-${idx + 1}`,
        title: shortTitle,
        summary: block.length > 200 ? block.slice(0, 197) + '...' : block,
        details: block,
        date,
        sourceText: block,
        category,
        icon,
        color: colorObj.hex
      });
    });
  }

  return {
    person: {
      name: personName || 'Featured Hero',
      title: storyTitle || 'Success Story',
      photo: personImage || ''
    },
    mindMap: {
      title: storyTitle || `${personName}'s Journey Mind Map`,
      children
    }
  };
};

// Generate React Flow Radial & Timeline Nodes & Edges from Hierarchical Mind Map Tree
export const buildRadialMindMapGraph = (
  treeData: any,
  personName?: string,
  personImage?: string,
  storyTitle?: string
) => {
  const nodes: any[] = [];
  const edges: any[] = [];

  const centerX = 600;
  const centerY = 500;

  const name = personName || treeData?.person?.name || 'Featured Individual';
  const title = storyTitle || treeData?.mindMap?.title || 'Success Story';
  const image = personImage || treeData?.person?.photo || '';

  // 1. CENTER PROFILE NODE
  nodes.push({
    id: 'center-person',
    type: 'centerPersonNode',
    position: { x: centerX - 90, y: centerY - 90 },
    data: {
      name,
      title,
      image,
      label: name,
      level: 'center'
    }
  });

  const eventNodes = treeData?.mindMap?.children || [];
  const N = eventNodes.length;
  if (N === 0) {
    return { nodes, edges };
  }

  // Position nodes in a dynamic radial timeline layout around center profile
  const R = Math.max(340, 260 + N * 18);
  const dTheta = (2 * Math.PI) / N;

  let prevNodeId = 'center-person';

  eventNodes.forEach((event: any, i: number) => {
    const theta_i = i * dTheta - Math.PI / 2;
    const branchColor = event.color || BRANCH_COLORS[i % BRANCH_COLORS.length].hex;

    const nodeId = event.id || `node-${i + 1}`;

    const posX = Math.round(centerX + R * Math.cos(theta_i) - 100);
    const posY = Math.round(centerY + R * Math.sin(theta_i) - 60);

    nodes.push({
      id: nodeId,
      type: 'mainBranchNode',
      position: { x: posX, y: posY },
      data: {
        label: event.title,
        title: event.title,
        summary: event.summary,
        details: event.details,
        date: event.date,
        people: event.people,
        numbers: event.numbers,
        achievements: event.achievements,
        sourceText: event.sourceText,
        icon: event.icon || '📌',
        color: branchColor,
        accentColor: branchColor,
        categoryKey: event.category || 'Event',
        level: 'main',
        isExpanded: false
      }
    });

    // Edge: Center -> Node
    edges.push({
      id: `edge-center-${nodeId}`,
      source: 'center-person',
      target: nodeId,
      type: 'smoothstep',
      animated: true,
      style: { stroke: branchColor, strokeWidth: 3, strokeDasharray: '4 4' }
    });

    // Edge: Chronological Node-to-Node Flow (Timeline connector)
    if (i > 0) {
      edges.push({
        id: `edge-flow-${prevNodeId}-${nodeId}`,
        source: prevNodeId,
        target: nodeId,
        type: 'bezier',
        animated: true,
        style: { stroke: '#7c3aed', strokeWidth: 2, opacity: 0.8 }
      });
    }

    prevNodeId = nodeId;
  });

  return { nodes, edges };
};
