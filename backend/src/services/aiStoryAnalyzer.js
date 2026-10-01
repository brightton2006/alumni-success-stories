import OpenAI from 'openai';

function getOpenAIClient() {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return null;
}

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

export const CATEGORY_CONFIG = {
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
export const buildHierarchicalMindMapTree = ({ personName, storyTitle, personImage, sections, fullStory, events }) => {
  const safeSections = sections || {};
  let children = [];

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
export const buildRadialMindMapGraph = (treeData, personName, personImage, storyTitle) => {
  const nodes = [];
  const edges = [];

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

  eventNodes.forEach((event, i) => {
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

// Main analyze function exported for API routes
export const analyzeStoryWithAI = async ({ storyTitle, personName, fullStory, personImage, category }) => {
  const openai = getOpenAIClient();
  let extractedData;

  if (openai) {
    try {
      const prompt = `
You are an expert story analyst. Analyze the complete success story of "${personName}".
Read the ENTIRE story from beginning to end. DO NOT invent information. Extract ACTUAL facts, events, dates, metrics, people, and original quotes.

Return ONLY a valid JSON object matching this schema:
{
  "person": "${personName}",
  "profileImage": "${personImage || ''}",
  "keywords": [
    {
      "word": "Keyword string",
      "score": 95,
      "count": 5,
      "type": "Achievement / Skill / Milestone / Challenge / Concept"
    }
  ],
  "events": [
    {
      "id": "node-1",
      "category": "Beginning / Education / Dream / Challenge / Turning Point / Achievement / Impact / etc.",
      "title": "Short Event Title",
      "summary": "1 to 3 sentence detailed explanation of what happened based strictly on the text.",
      "details": "Full description of event from the story",
      "date": "Year or period if present, e.g. 2019-2023",
      "people": ["People involved"],
      "numbers": ["Key numbers or metrics"],
      "achievements": ["Results or awards"],
      "sourceText": "Exact quote or sentence from the original story for this event"
    }
  ]
}

Ensure "keywords" contains 12 to 18 meaningful keywords with calculated importance scores from 20 to 100 based on frequency and significance in the story.
One top dominant keyword should have a score between 90 and 100.
Do NOT include generic stop words like "the", "and", "was", "for", "with".

Story Title: ${storyTitle}
Person Name: ${personName}
Story Content:
${fullStory}
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a precise JSON-only story extraction assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      const jsonText = response.choices[0]?.message?.content?.trim();
      extractedData = JSON.parse(jsonText);
    } catch (err) {
      console.warn('OpenAI API call failed or not configured, using fallback extractor:', err.message);
      extractedData = fallbackExtractStoryElements(storyTitle, personName, fullStory, personImage, category);
    }
  } else {
    extractedData = fallbackExtractStoryElements(storyTitle, personName, fullStory, personImage, category);
  }

  if (!extractedData || typeof extractedData !== 'object') {
    extractedData = fallbackExtractStoryElements(storyTitle, personName, fullStory, personImage, category);
  }

  // Standardize keywords into array of structured objects { word, score, count, type }
  const formattedKeywords = normalizeKeywordObjects(extractedData.keywords, fullStory, personName);

  // Construct standard journeyMap poster object for backward compatibility
  const journeyMap = buildJourneyMapDataObject({
    storyTitle,
    personName,
    fullStory,
    personImage,
    category,
    sections: extractedData.sections || {},
    keywords: formattedKeywords.map(k => k.word)
  });

  // Construct standard Hierarchical Mind Map Tree JSON structure
  const hierarchicalMindMap = buildHierarchicalMindMapTree({
    personName,
    storyTitle,
    personImage,
    sections: extractedData.sections,
    fullStory,
    events: extractedData.events
  });

  // Generate radial React Flow graph nodes & edges
  const radialGraph = buildRadialMindMapGraph(hierarchicalMindMap, personName, personImage, storyTitle);

  return {
    journeyMap,
    hierarchicalMindMap,
    aiExtractedElements: {
      ...extractedData,
      keywords: formattedKeywords
    },
    aiKeywords: formattedKeywords,
    aiMindMap: radialGraph
  };
};

function classifyKeywordMeta(word) {
  const w = (word || '').toLowerCase();
  
  if (w.includes('college') || w.includes('education') || w.includes('learning') || w.includes('background') || w.includes('early') || w.includes('school') || w.includes('degree') || w.includes('self-taught') || w.includes('doctorate') || w.includes('study')) {
    return {
      type: 'Foundation',
      cluster: 'FOUNDATION',
      clusterLabel: 'Foundation & Education',
      relatedKeywords: ['Education', 'Learning', 'College', 'Self-Taught', 'Degree', 'Background']
    };
  }
  if (w.includes('python') || w.includes('java') || w.includes('sql') || w.includes('code') || w.includes('solar') || w.includes('energy') || w.includes('tech') || w.includes('programming') || w.includes('software') || w.includes('ai') || w.includes('system') || w.includes('grid') || w.includes('data') || w.includes('spark') || w.includes('kafka') || w.includes('aws') || w.includes('react') || w.includes('docker')) {
    return {
      type: 'Technology',
      cluster: 'TECHNOLOGY',
      clusterLabel: 'Technology & Skills',
      relatedKeywords: ['Programming', 'Software', 'Data', 'System', 'AI', 'Coding', 'Tech']
    };
  }
  if (w.includes('project') || w.includes('development') || w.includes('internship') || w.includes('implementation') || w.includes('codepulse') || w.includes('homes') || w.includes('microgrid') || w.includes('startup') || w.includes('scholarship')) {
    return {
      type: 'Project',
      cluster: 'PROJECTS',
      clusterLabel: 'Projects & Experience',
      relatedKeywords: ['Project', 'Development', 'Implementation', 'Deployment', 'Startup']
    };
  }
  if (w.includes('mentor') || w.includes('anna') || w.includes('guidance') || w.includes('support') || w.includes('teacher') || w.includes('community') || w.includes('youth') || w.includes('team') || w.includes('foundation') || w.includes('coaching') || w.includes('help')) {
    return {
      type: 'Support',
      cluster: 'SUPPORT',
      clusterLabel: 'People & Support',
      relatedKeywords: ['Mentor', 'Guidance', 'Support', 'Community', 'Team', 'Help']
    };
  }
  if (w.includes('injury') || w.includes('challenge') || w.includes('difficulty') || w.includes('failure') || w.includes('obstacle') || w.includes('hardship') || w.includes('debt') || w.includes('outage') || w.includes('resilience') || w.includes('problem')) {
    return {
      type: 'Challenge',
      cluster: 'CHALLENGE',
      clusterLabel: 'Challenges & Problems',
      relatedKeywords: ['Challenge', 'Obstacle', 'Hardship', 'Resilience', 'Struggle', 'Problem']
    };
  }
  if (w.includes('gold') || w.includes('award') || w.includes('record') || w.includes('unicorn') || w.includes('billion') || w.includes('winner') || w.includes('achieve') || w.includes('success') || w.includes('impact') || w.includes('valuation') || w.includes('medal') || w.includes('growth')) {
    return {
      type: 'Achievement',
      cluster: 'ACHIEVEMENTS',
      clusterLabel: 'Achievement & Impact',
      relatedKeywords: ['Success', 'Impact', 'Achievement', 'Growth', 'Award', 'Valuation']
    };
  }
  
  return {
    type: 'Core Theme',
    cluster: 'FOUNDATION',
    clusterLabel: 'Core Concepts',
    relatedKeywords: ['Core Theme', 'Growth', 'Perseverance']
  };
}

function classifyKeywordType(word) {
  return classifyKeywordMeta(word).type;
}

// Standardize any keyword input into structured array of objects with score, count, type, cluster
export const normalizeKeywordObjects = (keywords, fullStory = '', personName = '') => {
  if (!Array.isArray(keywords) || keywords.length === 0) {
    return extractStructuredKeywordsFromText(fullStory, personName);
  }

  const result = [];
  keywords.forEach((kw, idx) => {
    if (typeof kw === 'string' && kw.trim()) {
      const word = kw.trim();
      const count = (fullStory.match(new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')) || []).length || 1;
      const score = Math.max(20, Math.round(98 - idx * (75 / Math.max(1, keywords.length - 1))));
      const meta = classifyKeywordMeta(word);
      result.push({
        word,
        score,
        count,
        type: meta.type,
        cluster: meta.cluster,
        clusterLabel: meta.clusterLabel,
        relatedKeywords: meta.relatedKeywords
      });
    } else if (kw && typeof kw === 'object' && kw.word) {
      const word = kw.word.trim();
      const meta = classifyKeywordMeta(word);
      result.push({
        word,
        score: typeof kw.score === 'number' ? Math.min(100, Math.max(15, kw.score)) : 50,
        count: typeof kw.count === 'number' ? kw.count : 1,
        type: kw.type || meta.type,
        cluster: kw.cluster || meta.cluster,
        clusterLabel: kw.clusterLabel || meta.clusterLabel,
        relatedKeywords: kw.relatedKeywords || meta.relatedKeywords
      });
    }
  });

  if (result.length === 0) {
    return extractStructuredKeywordsFromText(fullStory, personName);
  }

  // Ensure descending sort by score
  result.sort((a, b) => b.score - a.score);
  return result;
};

// Fallback intelligent NLP keyword extractor & scorer
export const extractStructuredKeywordsFromText = (fullStory = '', personName = '') => {
  if (!fullStory || fullStory.trim().length === 0) {
    return [
      { word: 'PERSEVERANCE', score: 98, count: 1, type: 'Core Theme' },
      { word: 'SUCCESS', score: 85, count: 1, type: 'Core Theme' },
      { word: 'IMPACT', score: 72, count: 1, type: 'Core Theme' },
      { word: 'GROWTH', score: 58, count: 1, type: 'Core Theme' }
    ];
  }

  const stopWords = new Set([
    'the', 'and', 'a', 'an', 'to', 'of', 'in', 'is', 'it', 'that', 'for', 'was', 'with', 'on', 'at', 'by', 'be', 'this',
    'which', 'or', 'from', 'has', 'had', 'have', 'were', 'been', 'their', 'they', 'his', 'her', 'she', 'he', 'more',
    'about', 'can', 'also', 'into', 'over', 'after', 'other', 'out', 'new', 'very', 'really', 'just', 'some', 'than',
    'them', 'these', 'those', 'then', 'there', 'when', 'where', 'who', 'whom', 'what', 'why', 'how', 'all', 'any',
    'both', 'each', 'few', 'most', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'too', 's', 't', 'will',
    'should', 'now', 'i', 'we', 'you', 'my', 'me', 'our', 'us', 'your', 'would', 'could', 'first', 'second', 'years',
    'year', 'time', 'day', 'days', 'made', 'make', 'well', 'way', 'going', 'getting', 'took', 'take', 'back', 'through',
    'another', 'around', 'became', 'become', 'becomes', 'being', 'better', 'build', 'built', 'called', 'come', 'came'
  ]);

  const personTokens = (personName || '').toLowerCase().split(/\s+/).filter(t => t.length > 1);

  // Term normalization map (stems / variants to canonical terms)
  const normalizeTerm = (term) => {
    const t = term.toUpperCase().trim();
    if (t === 'DEVELOP' || t === 'DEVELOPED' || t === 'DEVELOPING') return 'DEVELOPMENT';
    if (t === 'LEARN' || t === 'LEARNED' || t === 'LEARNINGS') return 'LEARNING';
    if (t === 'ACHIEVE' || t === 'ACHIEVING' || t === 'ACHIEVED') return 'ACHIEVEMENT';
    if (t === 'CHALLENGED' || t === 'CHALLENGING' || t === 'CHALLENGES') return 'CHALLENGE';
    if (t === 'STRUGGLED' || t === 'STRUGGLING' || t === 'STRUGGLES') return 'STRUGGLE';
    if (t === 'TRAINED' || t === 'TRAINING') return 'TRAINING';
    if (t === 'LEAD' || t === 'LEADING' || t === 'LEADER') return 'LEADERSHIP';
    if (t === 'INNOVATED' || t === 'INNOVATING' || t === 'INNOVATIVE') return 'INNOVATION';
    if (t === 'PERSEVERED' || t === 'PERSEVERING') return 'PERSEVERANCE';
    if (t === 'TRANSFORMED' || t === 'TRANSFORMING') return 'TRANSFORMATION';
    return t;
  };

  const text = fullStory.replace(/[^\w\s-]/g, ' ');
  const rawWords = text.split(/\s+/).filter(Boolean);

  const candidateMap = {};

  // 1. Scan 2-word bigrams
  for (let i = 0; i < rawWords.length - 1; i++) {
    const w1 = rawWords[i];
    const w2 = rawWords[i + 1];
    if (w1.length > 2 && w2.length > 2 && !stopWords.has(w1.toLowerCase()) && !stopWords.has(w2.toLowerCase())) {
      if (w1[0] === w1[0].toUpperCase() && w2[0] === w2[0].toUpperCase()) {
        const phrase = `${normalizeTerm(w1)} ${normalizeTerm(w2)}`;
        if (!personTokens.includes(w1.toLowerCase()) && !personTokens.includes(w2.toLowerCase())) {
          candidateMap[phrase] = (candidateMap[phrase] || 0) + 1.8;
        }
      }
    }
  }

  // 2. Scan unigrams
  rawWords.forEach((w) => {
    const lower = w.toLowerCase();
    if (lower.length > 3 && !stopWords.has(lower) && !personTokens.includes(lower)) {
      const normalized = normalizeTerm(w);
      candidateMap[normalized] = (candidateMap[normalized] || 0) + 1;
    }
  });

  const sentences = fullStory.split(/(?<=[.!?])\s+/);
  const candidateScores = [];

  Object.keys(candidateMap).forEach(term => {
    let count = Math.ceil(candidateMap[term]);
    let contextBonus = 0;

    const termLower = term.toLowerCase();
    sentences.forEach(sent => {
      const sLower = sent.toLowerCase();
      if (sLower.includes(termLower)) {
        if (sLower.includes('turning point') || sLower.includes('breakthrough') || sLower.includes('realized') || sLower.includes('pivotal')) contextBonus += 25;
        if (sLower.includes('achieved') || sLower.includes('won') || sLower.includes('record') || sLower.includes('award') || sLower.includes('unicorn') || sLower.includes('billion')) contextBonus += 30;
        if (sLower.includes('dream') || sLower.includes('goal') || sLower.includes('struggled') || sLower.includes('challenge') || sLower.includes('failed')) contextBonus += 20;
        if (sLower.includes('education') || sLower.includes('degree') || sLower.includes('university') || sLower.includes('college')) contextBonus += 15;
      }
    });

    const isPhrase = term.includes(' ');
    const rawScore = (count * 18) + contextBonus + (isPhrase ? 35 : 0) + (term.length > 5 ? 8 : 0);

    candidateScores.push({
      word: term,
      rawScore,
      count,
      type: classifyKeywordType(term)
    });
  });

  const phrases = candidateScores.filter(c => c.word.includes(' ')).map(c => c.word.toLowerCase());
  const filtered = candidateScores.filter(c => {
    if (!c.word.includes(' ')) {
      const wLower = c.word.toLowerCase();
      const inPhrase = phrases.some(p => p.includes(wLower));
      if (inPhrase && c.count <= 2) return false;
    }
    return true;
  });

  filtered.sort((a, b) => b.rawScore - a.rawScore);

  const topKeywords = filtered.slice(0, 30);
  if (topKeywords.length === 0) {
    return [
      { word: 'PERSEVERANCE', score: 98, count: 1, type: 'Core Theme' },
      { word: 'SUCCESS', score: 85, count: 1, type: 'Core Theme' },
      { word: 'IMPACT', score: 72, count: 1, type: 'Core Theme' },
      { word: 'GROWTH', score: 58, count: 1, type: 'Core Theme' }
    ];
  }

  const maxRaw = topKeywords[0].rawScore || 1;
  const minRaw = topKeywords[topKeywords.length - 1].rawScore || 0;

  return topKeywords.map((item, idx) => {
    let score;
    if (idx === 0) {
      score = 98;
    } else if (idx === 1 && topKeywords.length > 1) {
      score = 88;
    } else if (idx === 2 && topKeywords.length > 2) {
      score = 80;
    } else if (maxRaw === minRaw) {
      score = Math.max(18, 90 - idx * 3);
    } else {
      const normalized = ((item.rawScore - minRaw) / (maxRaw - minRaw)) * 62 + 18;
      score = Math.round(normalized);
    }

    return {
      word: item.word,
      score,
      count: item.count,
      type: item.type
    };
  });
};

export const buildJourneyMapDataObject = ({ storyTitle, personName, fullStory, personImage, category, sections, keywords }) => {
  const safeSections = sections || {};

  const STAGE_META = [
    { key: 'beginning', title: 'EARLY BACKGROUND', icon: '🌱', accent: '#10b981' },
    { key: 'education', title: 'EDUCATION & LEARNING', icon: '🎓', accent: '#3b82f6' },
    { key: 'goal', title: 'THE DREAM & GOAL', icon: '🎯', accent: '#6366f1' },
    { key: 'challenges', title: 'CHALLENGES & STRUGGLES', icon: '⚡', accent: '#f59e0b' },
    { key: 'importantEvents', title: 'IMPORTANT EVENTS', icon: '📅', accent: '#0284c7' },
    { key: 'turningPoint', title: 'TURNING POINT', icon: '🔄', accent: '#8b5cf6' },
    { key: 'actions', title: 'ACTIONS TAKEN', icon: '🚀', accent: '#06b6d4' },
    { key: 'skills', title: 'SKILLS & PROJECTS', icon: '💻', accent: '#14b8a6' },
    { key: 'career', title: 'CAREER JOURNEY', icon: '💼', accent: '#64748b' },
    { key: 'achievements', title: 'MAJOR ACHIEVEMENTS', icon: '🏆', accent: '#eab308' },
    { key: 'awards', title: 'AWARDS & RECOGNITION', icon: '🥇', accent: '#f43f5e' },
    { key: 'impact', title: 'IMPACT CREATED', icon: '🌍', accent: '#10b981' },
    { key: 'lessons', title: 'LESSONS LEARNED', icon: '💡', accent: '#e11d48' },
    { key: 'futureVision', title: 'FUTURE VISION', icon: '🔮', accent: '#d946ef' }
  ];

  const milestones = [];
  let stageCount = 1;

  STAGE_META.forEach(meta => {
    const rawItems = safeSections[meta.key];
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      let period = '';
      const yearMatch = rawItems.join(' ').match(/\b(19\d\d|20\d\d|age\s+\d+|year\s+\d+)\b/i);
      if (yearMatch) period = yearMatch[0].toUpperCase();

      const formattedBullets = rawItems.slice(0, 5).map(item => {
        let clean = item.trim();
        if (clean.length > 150) clean = clean.slice(0, 147) + '...';
        return clean;
      });

      milestones.push({
        stage: stageCount++,
        title: meta.title,
        period: period || undefined,
        description: formattedBullets,
        icon: meta.icon,
        importance: meta.key === 'turningPoint' || meta.key === 'achievements' ? 'high' : 'normal',
        categoryKey: meta.key,
        accentColor: meta.accent
      });
    }
  });

  const achievements = [];
  const foundStats = new Set();
  const storyText = fullStory || '';
  const sentences = storyText.split(/(?<=[.!?])\s+/);

  sentences.forEach(sent => {
    if (achievements.length >= 4) return;
    const matches = sent.match(/(\$\d+(?:\.\d+)?[BMK]?|\b\d+(?:,\d+)*\b)/g);
    if (matches) {
      matches.forEach(val => {
        if (achievements.length >= 4) return;
        if (val.length < 1 || foundStats.has(val) || val === '1' || val === '2' || val === '3') return;

        const sLower = sent.toLowerCase();
        let label = 'MILESTONE';

        if (sLower.includes('home')) label = 'HOMES POWERED';
        else if (sLower.includes('user')) label = 'ACTIVE USERS';
        else if (sLower.includes('school')) label = 'RURAL SCHOOLS';
        else if (sLower.includes('clinic')) label = 'HEALTH CLINICS';
        else if (sLower.includes('job') || sLower.includes('employee')) label = 'JOBS CREATED';
        else if (sLower.includes('billion') || sLower.includes('valuation') || sLower.includes('$')) label = 'VALUATION / FUNDING';
        else if (sLower.includes('scholarship')) label = 'SCHOLARSHIP FUND';
        else if (sLower.includes('gold') || sLower.includes('medal') || sLower.includes('win')) label = 'RECORD / AWARD';
        else if (sLower.includes('year') || parseInt(val) > 1950) label = 'KEY YEAR';

        foundStats.add(val);
        achievements.push({
          value: val.startsWith('$') ? val : val.toUpperCase(),
          label
        });
      });
    }
  });

  const cleanHighlights = Array.isArray(keywords) && keywords.length > 0
    ? keywords.slice(0, 10)
    : ['Perseverance', 'Leadership', 'Innovation', 'Growth', 'Success', 'Impact'];

  return {
    title: storyTitle || `${personName}'s Story`,
    personName: personName || 'Featured Individual',
    summary: (fullStory || '').slice(0, 160) + '...',
    category: category || 'Success Story',
    heroImage: personImage || '',
    milestones: milestones.length > 0 ? milestones : [
      {
        stage: 1,
        title: 'STORY HIGHLIGHT',
        description: [fullStory ? fullStory.slice(0, 120) + '...' : 'An inspiring journey.'],
        icon: '⭐',
        importance: 'high',
        categoryKey: 'beginning',
        accentColor: '#6366f1'
      }
    ],
    achievements,
    highlights: cleanHighlights,
    impact: (safeSections.impact && safeSections.impact[0]) || '',
    futureVision: (safeSections.futureVision && safeSections.futureVision[0]) || ''
  };
};

const fallbackExtractStoryElements = (storyTitle, personName, fullStory, existingProfileImage, category) => {
  const beginning = [];
  const goal = [];
  const challenges = [];
  const importantEvents = [];
  const turningPoint = [];
  const actions = [];
  const achievements = [];
  const impact = [];
  const lessons = [];
  const futureVision = [];

  const sentences = fullStory
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  sentences.forEach(s => {
    const sLower = s.toLowerCase();
    if (sLower.includes('born') || sLower.includes('grew up') || sLower.includes('early') || sLower.includes('childhood') || sLower.includes('started in') || sLower.includes('beginning')) {
      if (beginning.length < 3) beginning.push(s);
    } else if (sLower.includes('dream') || sLower.includes('goal') || sLower.includes('aspired') || sLower.includes('wanted to') || sLower.includes('mission') || sLower.includes('ambition')) {
      if (goal.length < 3) goal.push(s);
    } else if (sLower.includes('challenge') || sLower.includes('struggled') || sLower.includes('obstacle') || sLower.includes('hardship') || sLower.includes('failure') || sLower.includes('rejection') || sLower.includes('difficult') || sLower.includes('injury')) {
      if (challenges.length < 3) challenges.push(s);
    } else if (sLower.includes('turning point') || sLower.includes('pivot') || sLower.includes('breakthrough') || sLower.includes('realized') || sLower.includes('decided to')) {
      if (turningPoint.length < 3) turningPoint.push(s);
    } else if (sLower.includes('award') || sLower.includes('achieved') || sLower.includes('won') || sLower.includes('built') || sLower.includes('launched') || sLower.includes('milestone') || sLower.includes('recognized') || sLower.includes('record')) {
      if (achievements.length < 3) achievements.push(s);
    } else if (sLower.includes('action') || sLower.includes('step') || sLower.includes('worked') || sLower.includes('practiced') || sLower.includes('developed') || sLower.includes('created') || sLower.includes('coded')) {
      if (actions.length < 3) actions.push(s);
    } else if (sLower.includes('impact') || sLower.includes('helped') || sLower.includes('community') || sLower.includes('thousands') || sLower.includes('transformed') || sLower.includes('lives')) {
      if (impact.length < 3) impact.push(s);
    } else if (sLower.includes('lesson') || sLower.includes('learned') || sLower.includes('advice') || sLower.includes('believes')) {
      if (lessons.length < 3) lessons.push(s);
    } else if (sLower.includes('future') || sLower.includes('vision') || sLower.includes('next') || sLower.includes('plans to') || sLower.includes('aims to')) {
      if (futureVision.length < 3) futureVision.push(s);
    } else {
      if (importantEvents.length < 3) importantEvents.push(s);
    }
  });

  const structuredKeywords = extractStructuredKeywordsFromText(fullStory, personName);

  const sections = {
    beginning,
    goal,
    challenges,
    importantEvents,
    turningPoint,
    actions,
    achievements,
    impact,
    lessons,
    futureVision
  };

  return {
    person: personName,
    profileImage: existingProfileImage || '',
    keywords: structuredKeywords,
    sections
  };
};

export const generateMindMapGraph = (extractedData, personName, personImage) => {
  const hierarchicalTree = buildHierarchicalMindMapTree({
    personName,
    storyTitle: `${personName}'s Success Mind Map`,
    personImage,
    sections: extractedData.sections || {}
  });
  return buildRadialMindMapGraph(hierarchicalTree, personName, personImage, `${personName}'s Success Mind Map`);
};


