import { normalizeKeywordObjects } from '../services/aiStoryAnalyzer.js';

async function runSemanticCloudTest() {
  console.log('🧪 Testing Semantic Clustered Word-Cloud Keyword Extraction & Metadata...\n');

  const sampleStory = `
  Elena Rostova grew up in a rural village with frequent power outages. Driven by an early childhood dream, she earned her doctorate in Renewable Energy Systems in 2018 and developed decentralized, AI-optimized solar microgrids. Today, her innovation powers over 50,000 rural homes, 120 schools, and 45 clinics across East Africa.
  
  Carlos Mendoza dropped out of high school at 17 to support his family and taught himself software engineering during late-night library shifts. After early startup failures, he realized artificial intelligence could automate software code reviews. He created CodePulse, scaling it to 500 team members and a $1.2B unicorn valuation.
  `;

  const rawKeywords = [
    'Solar Microgrids',
    'Data Engineering',
    'Python',
    'SQL',
    'College Education',
    'Mentor Guidance',
    'Knee Injury Recovery',
    'Olympic Gold Medal',
    '$1.2B Valuation'
  ];

  const processed = normalizeKeywordObjects(rawKeywords, sampleStory, 'Elena & Carlos');

  console.log(`Processed ${processed.length} keywords:\n`);
  let passedCount = 0;

  processed.forEach((kw, idx) => {
    console.log(`[${idx + 1}] Word: "${kw.word}" | Score: ${kw.score}% | Cluster: ${kw.cluster || 'N/A'} | Label: "${kw.clusterLabel || ''}"`);
    if (kw.cluster && kw.clusterLabel && Array.isArray(kw.relatedKeywords)) {
      passedCount++;
    }
  });

  console.log(`\n========================================`);
  console.log(`RESULTS: ${passedCount} / ${processed.length} KEYWORDS PROCESSED WITH FULL SEMANTIC CLUSTER METADATA`);
  console.log(`========================================\n`);

  if (passedCount === processed.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runSemanticCloudTest();
