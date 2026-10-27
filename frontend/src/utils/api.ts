
import type { Story, Category, DashboardSummaryStats, CloudKeyword, Member, MemberFilterParams, MemberFilterOptions, MemberPaginatedResponse } from '../types';

const MOCK_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Education', description: 'Transformational stories in academia and learning', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_2', name: 'Entrepreneurship', description: 'Ventures, startups, and business breakthroughs', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_3', name: 'Technology', description: 'Innovations in AI, software, and digital engineering', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_4', name: 'Innovation', description: 'Pioneering solutions and creative discoveries', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_5', name: 'Sports', description: 'Athletic perseverance, championships, and athletic triumph', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_6', name: 'Agriculture', description: 'Sustainable farming, agritech, and rural development', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_7', name: 'Social Impact', description: 'Community uplifting, philanthropy, and advocacy', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_8', name: 'Career', description: 'Professional growth, leadership, and domain mastery', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_9', name: 'Community', description: 'Grassroots leadership and social empowerment', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat_10', name: 'Other', description: 'Diverse inspirational success stories', isActive: true, createdAt: new Date().toISOString() }
];

const MOCK_STORIES: Story[] = [
  {
    id: 'story_maya_lin',
    authorAdminId: 'admin_id_default',
    personName: 'Elena Rostova',
    storyTitle: 'Pioneering Clean Solar Microgrids for Rural Communities',
    profession: 'Clean Energy Innovator & Researcher',
    location: 'Nairobi, Kenya',
    category: 'Innovation',
    shortSummary: 'How Elena built accessible off-grid solar energy systems that now power over 50,000 rural homes across East Africa.',
    fullStory: `Elena Rostova grew up in a rural village where electrical power outages lasted for days, severely disrupting evening study hours and healthcare clinic operations. From her early childhood in 2010, she harbored a deep dream to make clean, affordable energy accessible to every off-grid community in East Africa.

After earning her doctorate in Renewable Energy Systems in 2018, Elena faced tremendous challenges: lack of early-stage venture funding, rugged terrain that hindered traditional infrastructure, and skepticism from legacy utility companies.

The pivotal turning point arrived in 2020 when Elena designed a decentralized solar microgrid powered by AI-optimized lithium battery management. Instead of relying on expensive centralized grids, her system allowed villagers to buy micro-shares of solar power via mobile payments.

Taking decisive actions in 2021, Elena partnered with local youth, training over 200 young technicians to install and maintain the microgrids. Within three years, her startup successfully powered over 50,000 homes, 120 rural schools, and 45 community health clinics.

Her key achievements include winning the Global CleanTech Innovation Award in 2023 and delivering uninterrupted light to over 250,000 citizens. Elena believes the key lesson is that sustainable technology succeeds only when built in true partnership with local communities. Looking toward her future vision, Elena aims to expand solar microgrid networks to cover 500,000 off-grid families by 2030.`,
    personImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    additionalImages: [],
    status: 'PUBLISHED',
    showName: true,
    publicationLocations: ['Homepage', 'Success Stories', 'Featured Stories'],
    views: 375,
    journeyMap: {
      title: 'Pioneering Clean Solar Microgrids for Rural Communities',
      personName: 'Elena Rostova',
      summary: 'How Elena built accessible off-grid solar energy systems that now power over 50,000 rural homes across East Africa.',
      category: 'Innovation',
      heroImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      milestones: [
        { stage: 1, title: 'EARLY BACKGROUND', period: '2010', description: ['Grew up in a village with frequent power outages', 'Disrupted evening study hours and health clinics'], icon: '🌱', accentColor: '#10b981', categoryKey: 'beginning' },
        { stage: 2, title: 'DREAM & GOAL', period: '2015', description: ['Make clean, affordable energy accessible', 'Power off-grid communities in East Africa'], icon: '🎯', accentColor: '#6366f1', categoryKey: 'goal' },
        { stage: 3, title: 'CHALLENGES FACED', period: '2018', description: ['Lack of early venture capital funding', 'Rugged terrain hindered grid infrastructure', 'Skepticism from legacy utility companies'], icon: '⚡', accentColor: '#f59e0b', categoryKey: 'challenges' },
        { stage: 4, title: 'TURNING POINT', period: '2020', description: ['Designed decentralized solar microgrids', 'Optimized lithium battery management', 'Villagers buy micro-shares via mobile payments'], icon: '🔄', accentColor: '#8b5cf6', importance: 'high', categoryKey: 'turningPoint' },
        { stage: 5, title: 'ACTIONS TAKEN', period: '2021', description: ['Partnered with local youth', 'Trained over 200 young technicians for installation and maintenance'], icon: '🚀', accentColor: '#06b6d4', categoryKey: 'actions' },
        { stage: 6, title: 'MAJOR ACHIEVEMENTS', period: '2023', description: ['Powered over 50,000 rural homes', 'Electrified 120 schools and 45 health clinics', 'Won Global CleanTech Innovation Award'], icon: '🏆', accentColor: '#eab308', importance: 'high', categoryKey: 'achievements' }
      ],
      achievements: [
        { value: '50,000', label: 'HOMES POWERED' },
        { value: '120', label: 'RURAL SCHOOLS' },
        { value: '45', label: 'HEALTH CLINICS' },
        { value: '250,000', label: 'CITIZENS IMPACTED' }
      ],
      highlights: ['Solar Microgrid', 'Clean Energy', 'East Africa', 'Innovation', 'Community', 'Sustainability', 'Tech Leadership']
    },
    aiKeywords: [
      { word: 'Solar Microgrid', score: 96, count: 4, type: 'Technology' },
      { word: 'Clean Energy', score: 85, count: 3, type: 'Technology' },
      { word: 'East Africa', score: 72, count: 2, type: 'Milestone' },
      { word: 'Innovation', score: 65, count: 2, type: 'Core Theme' },
      { word: 'Community', score: 52, count: 3, type: 'Core Theme' },
      { word: 'Sustainability', score: 40, count: 1, type: 'Core Theme' },
      { word: 'Tech Leadership', score: 28, count: 1, type: 'Milestone' }
    ],
    aiMindMap: {
      nodes: [
        { id: 'center-person', type: 'centerPersonNode', position: { x: 600, y: 500 }, data: { name: 'Elena Rostova', title: 'Pioneering Clean Solar Microgrids for Rural Communities', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80', label: 'Elena Rostova', level: 'center' } },
        { id: 'node-1', type: 'mainBranchNode', position: { x: 600, y: 150 }, data: { title: 'Early Childhood & Dream', summary: 'Elena grew up in a rural village with severe power outages and harbored a dream to make clean energy accessible.', date: '2010', sourceText: 'Elena Rostova grew up in a rural village where electrical power outages lasted for days...', icon: '🌱', color: '#10b981', categoryKey: 'Beginning' } },
        { id: 'node-2', type: 'mainBranchNode', position: { x: 950, y: 330 }, data: { title: 'Overcoming Infrastructure Challenges', summary: 'Faced lack of venture funding and rugged terrain that hindered traditional power grids.', date: '2018', sourceText: 'After earning her doctorate in Renewable Energy Systems in 2018, Elena faced tremendous challenges...', icon: '⚡', color: '#f59e0b', categoryKey: 'Challenge' } },
        { id: 'node-3', type: 'mainBranchNode', position: { x: 850, y: 750 }, data: { title: 'AI Solar Microgrid Breakthrough', summary: 'Designed AI-optimized lithium battery microgrids allowing villagers to buy power micro-shares via mobile payments.', date: '2020', sourceText: 'The pivotal turning point arrived in 2020 when Elena designed a decentralized solar microgrid...', icon: '🔄', color: '#8b5cf6', categoryKey: 'Turning Point' } },
        { id: 'node-4', type: 'mainBranchNode', position: { x: 350, y: 750 }, data: { title: 'Training 200 Youth Technicians', summary: 'Trained local youth technicians to maintain microgrids across 50,000 rural homes and 120 schools.', date: '2021', sourceText: 'Taking decisive actions in 2021, Elena partnered with local youth, training over 200 young technicians...', icon: '🚀', color: '#06b6d4', categoryKey: 'Action' } },
        { id: 'node-5', type: 'mainBranchNode', position: { x: 250, y: 330 }, data: { title: 'Global CleanTech Innovation Award', summary: 'Won global recognition and delivered uninterrupted electricity to 250,000 citizens.', date: '2023', sourceText: 'Her key achievements include winning the Global CleanTech Innovation Award in 2023...', icon: '🏆', color: '#eab308', categoryKey: 'Achievement' } }
      ],
      edges: [
        { id: 'edge-center-node-1', source: 'center-person', target: 'node-1', type: 'smoothstep', animated: true, style: { stroke: '#10b981', strokeWidth: 3, strokeDasharray: '4 4' } },
        { id: 'edge-center-node-2', source: 'center-person', target: 'node-2', type: 'smoothstep', animated: true, style: { stroke: '#f59e0b', strokeWidth: 3, strokeDasharray: '4 4' } },
        { id: 'edge-center-node-3', source: 'center-person', target: 'node-3', type: 'smoothstep', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 3, strokeDasharray: '4 4' } },
        { id: 'edge-center-node-4', source: 'center-person', target: 'node-4', type: 'smoothstep', animated: true, style: { stroke: '#06b6d4', strokeWidth: 3, strokeDasharray: '4 4' } },
        { id: 'edge-center-node-5', source: 'center-person', target: 'node-5', type: 'smoothstep', animated: true, style: { stroke: '#eab308', strokeWidth: 3, strokeDasharray: '4 4' } },
        { id: 'edge-flow-node-1-node-2', source: 'node-1', target: 'node-2', type: 'bezier', animated: true, style: { stroke: '#7c3aed', strokeWidth: 2, opacity: 0.8 } },
        { id: 'edge-flow-node-2-node-3', source: 'node-2', target: 'node-3', type: 'bezier', animated: true, style: { stroke: '#7c3aed', strokeWidth: 2, opacity: 0.8 } },
        { id: 'edge-flow-node-3-node-4', source: 'node-3', target: 'node-4', type: 'bezier', animated: true, style: { stroke: '#7c3aed', strokeWidth: 2, opacity: 0.8 } },
        { id: 'edge-flow-node-4-node-5', source: 'node-4', target: 'node-5', type: 'bezier', animated: true, style: { stroke: '#7c3aed', strokeWidth: 2, opacity: 0.8 } }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString()
  },
  {
    id: 'story_carlos_mendoza',
    authorAdminId: 'admin_id_default',
    personName: 'Carlos Mendoza',
    storyTitle: 'From High School Dropout to Tech Unicorn Founder',
    profession: 'CEO & Co-founder, CodePulse',
    location: 'Austin, Texas',
    category: 'Entrepreneurship',
    shortSummary: 'Carlos overcame early financial hardship and multiple startup rejections to build a software quality platform valued at $1.2B.',
    fullStory: `Carlos Mendoza was born in a working-class neighborhood where computer science education was virtually non-existent. Forced to drop out of high school at age 17 to support his family, Carlos taught himself software development during late-night shifts at a local library.

His early dream was simple: build software tools that help self-taught developers write bug-free code without requiring expensive engineering degrees. However, his journey was plagued by severe obstacles. His first two software startups failed completely, leaving him heavily in debt and working multiple freelance gigs to survive.

The turning point occurred when Carlos realized that automated software quality audits could empower small dev teams. Driven by determination, he spent 18 months coding the prototype for CodePulse in a small garage.

Through relentless execution, Carlos secured his first 1,000 paying users without any paid marketing. Fast forward five years, CodePulse raised its Series C funding round, scaling to 500 employees and reaching unicorn status with a $1.2 Billion valuation.

Carlos has created over 800 tech jobs and established a $10M developer scholarship for underrepresented youth. His enduring lesson to aspiring founders is that failure is not the opposite of success, but an essential stepping stone towards it. His future vision is to establish 50 free coding academies across Latin America.`,
    personImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    additionalImages: [],
    status: 'PUBLISHED',
    showName: true,
    publicationLocations: ['Homepage', 'Success Stories', 'Featured Stories'],
    views: 350,
    journeyMap: {
      title: 'From High School Dropout to Tech Unicorn Founder',
      personName: 'Carlos Mendoza',
      summary: 'Carlos overcame early financial hardship and multiple startup rejections to build a software quality platform valued at $1.2B.',
      category: 'Entrepreneurship',
      heroImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      milestones: [
        { stage: 1, title: 'EARLY BACKGROUND', period: 'AGE 17', description: ['Raised in working-class neighborhood without CS courses', 'Dropped out of high school at 17 to support family', 'Taught himself coding during library night shifts'], icon: '🌱', accentColor: '#10b981', categoryKey: 'beginning' },
        { stage: 2, title: 'INITIAL GOAL', period: 'FIRST AMBITION', description: ['Build tools for self-taught software developers', 'Eliminate reliance on expensive engineering degrees'], icon: '🎯', accentColor: '#6366f1', categoryKey: 'goal' },
        { stage: 3, title: 'EARLY SETBACKS', period: 'STARTUP FAILURES', description: ['First two software startups failed completely', 'Left heavily in debt and took freelance gigs to survive'], icon: '⚡', accentColor: '#f59e0b', categoryKey: 'challenges' },
        { stage: 4, title: 'TURNING POINT', period: 'GARAGE PROTOTYPE', description: ['Realized automated quality audits for dev teams', 'Spent 18 months coding prototype for CodePulse'], icon: '🔄', accentColor: '#8b5cf6', importance: 'high', categoryKey: 'turningPoint' },
        { stage: 5, title: 'BREAKTHROUGH & SCALE', period: 'SERIES C FUNDING', description: ['Secured first 1,000 paying users organically', 'Scaled to 500 employees over five years', 'Reached Unicorn status with $1.2B valuation'], icon: '🏆', accentColor: '#eab308', importance: 'high', categoryKey: 'achievements' },
        { stage: 6, title: 'COMMUNITY IMPACT', period: 'PAYING IT FORWARD', description: ['Created over 800 high-tech jobs', 'Established $10M developer scholarship for youth'], icon: '🌍', accentColor: '#14b8a6', categoryKey: 'impact' },
        { stage: 7, title: 'FUTURE VISION', period: 'ACADEMY EXPANSION', description: ['Establish 50 free coding academies across Latin America'], icon: '🔮', accentColor: '#d946ef', categoryKey: 'futureVision' }
      ],
      achievements: [
        { value: '$1.2B', label: 'COMPANY VALUATION' },
        { value: '500', label: 'EMPLOYEES' },
        { value: '800', label: 'TECH JOBS CREATED' },
        { value: '$10M', label: 'SCHOLARSHIP FUND' }
      ],
      highlights: ['Unicorn Founder', 'Self-Taught', 'CodePulse', 'Tech Startup', 'Persistence', 'Scholarship']
    },
    aiKeywords: [
      { word: 'Unicorn Founder', score: 96, count: 2, type: 'Milestone' },
      { word: 'CodePulse', score: 86, count: 4, type: 'Technology' },
      { word: 'Software Quality', score: 74, count: 3, type: 'Technology' },
      { word: 'Self-Taught', score: 62, count: 2, type: 'Core Theme' },
      { word: 'Developer Scholarship', score: 48, count: 2, type: 'Achievement' },
      { word: 'Persistence', score: 32, count: 1, type: 'Core Theme' }
    ],
    aiExtractedElements: {
      person: 'Carlos Mendoza',
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      keywords: [
        { word: 'Unicorn Founder', score: 96, count: 2, type: 'Milestone' },
        { word: 'CodePulse', score: 86, count: 4, type: 'Technology' },
        { word: 'Software Quality', score: 74, count: 3, type: 'Technology' },
        { word: 'Self-Taught', score: 62, count: 2, type: 'Core Theme' },
        { word: 'Developer Scholarship', score: 48, count: 2, type: 'Achievement' },
        { word: 'Persistence', score: 32, count: 1, type: 'Core Theme' }
      ],
      sections: {
        beginning: ['Dropped out of high school at age 17 to support his family and taught himself software engineering.'],
        goal: ['Build software tools that help self-taught developers write high quality code.'],
        challenges: ['First two software startups failed completely, leaving him heavily in debt.'],
        turningPoint: ['Realized automated code audits could empower dev teams and coded CodePulse prototype.'],
        achievements: ['Scaled CodePulse to $1.2 Billion unicorn status with 500 employees.'],
        impact: ['Created 800 tech jobs and established a $10M developer scholarship.']
      }
    },
    aiMindMap: {
      nodes: [
        { id: 'center-person', type: 'personNode', position: { x: 400, y: 300 }, data: { name: 'Carlos Mendoza', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', label: 'JOURNEY CENTER' } },
        { id: 'node-beginning', type: 'categoryNode', position: { x: 400, y: 50 }, data: { categoryKey: 'beginning', label: 'Beginning & Early Life', icon: '🌱', color: 'emerald', items: ['Taught himself coding at library.'] } },
        { id: 'node-goal', type: 'categoryNode', position: { x: 670, y: 150 }, data: { categoryKey: 'goal', label: 'Dream & Goal', icon: '🎯', color: 'indigo', items: ['Empower self-taught developers.'] } },
        { id: 'node-achievements', type: 'categoryNode', position: { x: 200, y: 450 }, data: { categoryKey: 'achievements', label: 'Key Achievements', icon: '🏆', color: 'amber', items: ['Built $1.2B Tech Unicorn.'] } }
      ],
      edges: [
        { id: 'e1', source: 'center-person', target: 'node-beginning' },
        { id: 'e2', source: 'center-person', target: 'node-goal' },
        { id: 'e3', source: 'center-person', target: 'node-achievements' }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString()
  },
  {
    id: 'story_elena_rostova',
    authorAdminId: 'admin_id_default',
    personName: 'Elena Rostova',
    storyTitle: 'Breaking Olympic Records in Distance Running',
    profession: 'Olympic Marathon Gold Medalist',
    location: 'Zurich, Switzerland',
    category: 'Sports',
    shortSummary: 'Elena recovered from a career-threatening knee injury to win Olympic Gold and inspire millions of young female athletes worldwide.',
    fullStory: `Elena Rostova began distance running at age ten, discovering her natural endurance on the alpine trails of her home village. Her childhood dream was to stand atop the Olympic podium wearing her national colors.

At age 22, just one year before the World Championships, Elena suffered a devastating knee ligament tear during training. Doctors warned her that she might never sprint competitively again. The emotional hardship and physical pain tested her resilience to the absolute limit.

Her turning point came during her eight-month intensive rehabilitation. Refusing to succumb to despair, Elena embraced a groundbreaking biomechanical recovery program paired with rigorous mental conditioning and swimming workouts.

Taking disciplined action, Elena returned to competitive running, training 100 miles a week under extreme weather conditions. Her perseverance paid off when she broke the national marathon record and went on to claim the Olympic Gold Medal in Paris with a record-breaking time of 2:18:42.

Her impact extends beyond sport: she launched the RunHer Foundation, providing athletic gear and coaching grants to young girls in underserved areas. Elena's core lesson is that true strength is forged in moments when giving up feels like the easiest option. Her future vision is to coach the next generation of Olympic champion runners.`,
    personImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    additionalImages: [],
    status: 'PUBLISHED',
    showName: true,
    publicationLocations: ['Homepage', 'Success Stories', 'Featured Stories'],
    views: 367,
    journeyMap: {
      title: 'Breaking Olympic Records in Distance Running',
      personName: 'Elena Rostova',
      summary: 'Elena recovered from a career-threatening knee injury to win Olympic Gold and inspire millions of young female athletes worldwide.',
      category: 'Sports',
      heroImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      milestones: [
        { stage: 1, title: 'EARLY START', period: 'AGE 10', description: ['Discovered natural endurance on alpine trail runs', 'Dreamed of standing atop the Olympic podium'], icon: '🌱', accentColor: '#10b981', categoryKey: 'beginning' },
        { stage: 2, title: 'CAREER SETBACK', period: 'AGE 22', description: ['Suffered devastating knee ligament tear', 'Doctors warned she might never sprint competitively again'], icon: '⚡', accentColor: '#f59e0b', categoryKey: 'challenges' },
        { stage: 3, title: 'REHABILITATION PIVOT', period: '8 MONTHS RECOVERY', description: ['Embraced intensive biomechanical rehab program', 'Combined mental conditioning with pool workouts'], icon: '🔄', accentColor: '#8b5cf6', importance: 'high', categoryKey: 'turningPoint' },
        { stage: 4, title: 'DISCIPLINED ACTION', period: 'TRAINING REGIMEN', description: ['Trained 100 miles a week under extreme weather', 'Focused relentlessly on peak athletic endurance'], icon: '🚀', accentColor: '#06b6d4', categoryKey: 'actions' },
        { stage: 5, title: 'OLYMPIC TRIUMPH', period: 'PARIS GAMES', description: ['Broke national marathon record', 'Claimed Olympic Gold Medal with record time of 2:18:42'], icon: '🏆', accentColor: '#eab308', importance: 'high', categoryKey: 'achievements' },
        { stage: 6, title: 'ATHLETIC IMPACT', period: 'RUNHER FOUNDATION', description: ['Launched RunHer Foundation for female athletes', 'Provided gear and coaching grants to underserved youth'], icon: '🌍', accentColor: '#14b8a6', categoryKey: 'impact' }
      ],
      achievements: [
        { value: 'GOLD', label: 'OLYMPIC MEDAL' },
        { value: '2:18:42', label: 'RECORD TIME' },
        { value: '100', label: 'MILES / WEEK' },
        { value: 'PARIS', label: 'GAMES VENUE' }
      ],
      highlights: ['Olympic Gold', 'Marathon Record', 'Resilience', 'Sportsmanship', 'RunHer Foundation']
    },
    aiKeywords: [
      { word: 'Olympic Gold', score: 96, count: 2, type: 'Achievement' },
      { word: 'Marathon Record', score: 84, count: 2, type: 'Achievement' },
      { word: 'Rehabilitation', score: 70, count: 2, type: 'Milestone' },
      { word: 'Resilience', score: 58, count: 2, type: 'Core Theme' },
      { word: 'RunHer Foundation', score: 44, count: 1, type: 'Milestone' },
      { word: 'Sportsmanship', score: 28, count: 1, type: 'Core Theme' }
    ],
    aiExtractedElements: {
      person: 'Elena Rostova',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      keywords: [
        { word: 'Olympic Gold', score: 96, count: 2, type: 'Achievement' },
        { word: 'Marathon Record', score: 84, count: 2, type: 'Achievement' },
        { word: 'Rehabilitation', score: 70, count: 2, type: 'Milestone' },
        { word: 'Resilience', score: 58, count: 2, type: 'Core Theme' },
        { word: 'RunHer Foundation', score: 44, count: 1, type: 'Milestone' },
        { word: 'Sportsmanship', score: 28, count: 1, type: 'Core Theme' }
      ],
      sections: {
        beginning: ['Discovered distance running on alpine trails at age ten.'],
        goal: ['Win an Olympic Gold Medal in distance running.'],
        challenges: ['Suffered a career-threatening knee ligament tear at age 22.'],
        turningPoint: ['Embraced intensive biomechanical rehabilitation and mental conditioning.'],
        achievements: ['Claimed Olympic Gold in Paris with a record time of 2:18:42.'],
        impact: ['Launched RunHer Foundation supporting young female athletes.']
      }
    },
    aiMindMap: {
      nodes: [
        { id: 'center-person', type: 'personNode', position: { x: 400, y: 300 }, data: { name: 'Elena Rostova', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', label: 'JOURNEY CENTER' } },
        { id: 'node-goal', type: 'categoryNode', position: { x: 400, y: 80 }, data: { categoryKey: 'goal', label: 'Dream & Goal', icon: '🎯', color: 'indigo', items: ['Win Olympic Gold.'] } },
        { id: 'node-achievements', type: 'categoryNode', position: { x: 650, y: 350 }, data: { categoryKey: 'achievements', label: 'Key Achievements', icon: '🏆', color: 'amber', items: ['Olympic Gold Medalist (2:18:42).'] } }
      ],
      edges: [
        { id: 'e1', source: 'center-person', target: 'node-goal' },
        { id: 'e2', source: 'center-person', target: 'node-achievements' }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString()
  }
];

const customApiUrl = (import.meta as any).env?.VITE_API_URL || '';
export const API_HOSTS = [customApiUrl, '', 'http://localhost:5000', 'http://127.0.0.1:5000'].filter((h, i, arr) => h !== undefined && arr.indexOf(h) === i);

export async function fetchJsonSafely(path: string, options: RequestInit = {}): Promise<{ ok: boolean; data: any; status: number }> {
  const rawToken = localStorage.getItem('successstory_token') || localStorage.getItem('storymap_token');
  const token = (rawToken && rawToken !== 'null' && rawToken !== 'undefined') ? rawToken : null;
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let lastStatus = 0;
  let lastData: any = null;

  for (const host of API_HOSTS) {
    try {
      const url = path.startsWith('http') ? path : `${host}${path}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for AI operations

      const res = await fetch(url, { ...options, headers, signal: controller.signal });
      clearTimeout(timeoutId);

      lastStatus = res.status;

      // If status is 502/503/504 (gateway error), attempt direct backend host fallback
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        try {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data && data.error) lastData = data;
          }
        } catch {}
        continue;
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const data = await res.json();
          if (res.status === 401) {
            localStorage.removeItem('successstory_token');
            localStorage.removeItem('successstory_user');
            localStorage.removeItem('storymap_token');
            localStorage.removeItem('storymap_user');
            window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: data }));
          }
          return { ok: res.ok, data, status: res.status };
        } catch {
          // JSON parsing failed
        }
      }

      if (res.status === 401) {
        localStorage.removeItem('successstory_token');
        localStorage.removeItem('successstory_user');
        localStorage.removeItem('storymap_token');
        localStorage.removeItem('storymap_user');
        window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { error: 'Authentication required' } }));
        return { ok: false, data: { error: 'Authentication required. Missing or invalid token.' }, status: 401 };
      }

      if (res.ok) {
        return { ok: true, data: {}, status: res.status };
      }

      lastData = { error: `HTTP ${res.status}: ${res.statusText || 'Request failed'}` };
    } catch (err) {
      // Network error on this host, try next host in API_HOSTS
    }
  }

  return {
    ok: false,
    data: lastData || { error: 'Unable to connect to Success Story backend server. Please verify the backend server is running on http://localhost:5000 (`npm run dev:full` or `npm run server`).' },
    status: lastStatus || 502
  };
}

export const getMockStories = () => MOCK_STORIES;
export const getMockCategories = () => MOCK_CATEGORIES;
export const getMockStats = (): DashboardSummaryStats => ({
  storiesShared: MOCK_STORIES.length,
  peopleFeatured: MOCK_STORIES.length,
  communitiesReached: 3,
  storiesInspiringChange: 1092
});

export async function fetchKeywordCloud(): Promise<{ ok: boolean; keywords: CloudKeyword[]; totalStories: number }> {
  try {
    const res = await fetchJsonSafely('/api/stories/keywords/cloud');
    if (res.ok && res.data && Array.isArray(res.data.keywords)) {
      return {
        ok: true,
        keywords: res.data.keywords,
        totalStories: res.data.totalStories || 0
      };
    }
  } catch (err) {
    // Fallback if backend offline
  }

  // Generate fallback cloud from MOCK_STORIES if backend fails or offline
  const keywordStore: Record<string, CloudKeyword> = {};
  MOCK_STORIES.filter(s => s.status === 'PUBLISHED').forEach(story => {
    const rawKws = [
      ...(Array.isArray(story.aiKeywords) ? story.aiKeywords.map(k => typeof k === 'string' ? k : k.word) : []),
      ...(story.journeyMap?.highlights || [])
    ];
    rawKws.forEach(kwText => {
      if (!kwText || kwText.length < 2) return;
      const text = kwText.toUpperCase();
      if (!keywordStore[text]) {
        keywordStore[text] = {
          text,
          count: 0,
          importanceScore: 50,
          sizeCategory: 'medium',
          categories: [story.category || 'General'],
          stories: []
        };
      }
      if (!keywordStore[text].stories.some(s => s.id === story.id)) {
        keywordStore[text].count += 1;
        keywordStore[text].stories.push({
          id: story.id,
          storyTitle: story.storyTitle,
          personName: story.personName,
          profession: story.profession,
          location: story.location,
          category: story.category,
          shortSummary: story.shortSummary,
          personImage: story.personImage,
          showName: story.showName,
          publishedAt: story.publishedAt
        });
      }
    });
  });

  const keywords = Object.values(keywordStore).sort((a, b) => b.count - a.count);
  keywords.forEach((kw, idx) => {
    kw.importanceScore = Math.max(30, 98 - idx * 6);
    if (idx === 0 || kw.importanceScore >= 85) kw.sizeCategory = 'hero';
    else if (kw.importanceScore >= 65) kw.sizeCategory = 'large';
    else if (kw.importanceScore >= 40) kw.sizeCategory = 'medium';
    else kw.sizeCategory = 'small';
  });

  return {
    ok: true,
    keywords,
    totalStories: MOCK_STORIES.length
  };
}

export async function fetchMembers(params: MemberFilterParams = {}): Promise<MemberPaginatedResponse & { error?: string }> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.stream) query.set('stream', params.stream);
  if (params.course) query.set('course', params.course);
  if (params.endYear) query.set('endYear', String(params.endYear));
  if (params.city) query.set('city', params.city);
  if (params.company) query.set('company', params.company);
  if (params.skill) query.set('skill', params.skill);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const res = await fetchJsonSafely(`/api/alumni?${query.toString()}`);
  if (res.ok && res.data && Array.isArray(res.data.members)) {
    return {
      success: true,
      members: res.data.members,
      pagination: res.data.pagination || {
        page: params.page || 1,
        limit: params.limit || 12,
        total: res.data.total ?? res.data.members.length,
        totalPages: res.data.totalPages ?? 1,
        hasNext: (params.page || 1) < (res.data.totalPages || 1),
        hasPrev: (params.page || 1) > 1
      }
    };
  }

  return {
    success: false,
    members: [],
    error: res.data?.error || 'Unable to load alumni data. Please try again.',
    pagination: { page: 1, limit: 12, total: 0, totalPages: 1, hasNext: false, hasPrev: false }
  };
}

export async function fetchMemberById(id: string): Promise<{ success: boolean; member?: Member; error?: string }> {
  const res = await fetchJsonSafely(`/api/alumni/${id}`);
  if (res.ok && res.data && res.data.member) {
    return { success: true, member: res.data.member };
  }
  return { success: false, error: res.data?.error || 'Unable to load alumni data. Please try again.' };
}

export async function fetchMemberFilters(): Promise<{ success: boolean; filters?: MemberFilterOptions }> {
  const res = await fetchJsonSafely('/api/alumni/filters');
  if (res.ok && res.data && res.data.filters) {
    return { success: true, filters: res.data.filters };
  }
  return {
    success: false,
    filters: {
      streams: [],
      graduationYears: [],
      courses: [],
      cities: [],
      companies: []
    }
  };
}

export async function fetchMemberStats(): Promise<{ success: boolean; stats?: any }> {
  const res = await fetchJsonSafely('/api/members/admin/stats');
  if (res.ok && res.data && res.data.stats) {
    return { success: true, stats: res.data.stats };
  }
  return { success: false };
}

/**
 * Format hidden story author identity into "Batch - XX Alumni" from database/story metadata
 */
export function getBatchAlumniDisplay(story?: Partial<Story> | null): string {
  if (!story) return 'Batch - 26 Alumni';
  if (story.batchDisplay) return story.batchDisplay;
  
  const batchCandidate = story.batchNumber || story.batchYear;
  if (batchCandidate) {
    const str = String(batchCandidate).trim();
    const digits = str.match(/\d+/);
    if (digits) {
      const num = digits[0];
      const suffix = num.length === 4 ? num.slice(-2) : num;
      return `Batch - ${suffix} Alumni`;
    }
    return `Batch - ${str} Alumni`;
  }

  // Check story text for any graduation or batch year reference
  const textToScan = `${story.storyTitle || ''} ${story.fullStory || ''} ${story.shortSummary || ''}`;
  const yearMatch = textToScan.match(/\b(19\d\d|20\d\d)\b/);
  if (yearMatch) {
    return `Batch - ${yearMatch[1].slice(-2)} Alumni`;
  }

  return 'Batch - 26 Alumni';
}

/**
 * Returns either the author's full name or "Batch - XX Alumni" if name is hidden
 */
export function getStoryAuthorDisplayName(story?: Partial<Story> | null): string {
  if (!story) return 'NEC Alumni';
  if (story.showName === false) {
    return getBatchAlumniDisplay(story);
  }
  return story.personName || 'NEC Alumni';
}

/**
 * Format hidden story beneficiary identity into "Batch - XX Alumni" from beneficiary batch or story metadata
 */
export function getBatchBeneficiaryDisplay(story?: Partial<Story> | null): string {
  if (!story) return 'Batch - 26 Alumni';
  const batchCandidate = story.beneficiaryBatch || (story as any)?.beneficiaryBatchYear || story.batchNumber || story.batchYear;
  if (batchCandidate) {
    const str = String(batchCandidate).trim();
    const digits = str.match(/\d+/);
    if (digits) {
      const num = digits[0];
      const suffix = num.length === 4 ? num.slice(-2) : num;
      return `Batch - ${suffix} Alumni`;
    }
    return `Batch - ${str} Alumni`;
  }
  return getBatchAlumniDisplay(story);
}

/**
 * Format hidden story supporter identity into "Batch - XX Alumni" from supporter batch or story metadata
 */
export function getBatchSupporterDisplay(story?: Partial<Story> | null): string {
  if (!story) return 'Batch - 26 Alumni';
  const batchCandidate = story.supporterBatch || (story as any)?.supporterBatchYear || story.batchNumber || story.batchYear;
  if (batchCandidate) {
    const str = String(batchCandidate).trim();
    const digits = str.match(/\d+/);
    if (digits) {
      const num = digits[0];
      const suffix = num.length === 4 ? num.slice(-2) : num;
      return `Batch - ${suffix} Alumni`;
    }
    return `Batch - ${str} Alumni`;
  }
  return getBatchAlumniDisplay(story);
}

/**
 * Returns either beneficiary's real name or "Batch - XX Alumni" if name is hidden
 */
export function getStoryBeneficiaryDisplayName(story?: Partial<Story> | null): string {
  if (!story || !story.beneficiaryName) return '';
  if (story.showName === false) {
    return getBatchBeneficiaryDisplay(story);
  }
  return story.beneficiaryName;
}

/**
 * Returns either supporter's real name or "Batch - XX Alumni" if name is hidden
 */
export function getStorySupporterDisplayName(story?: Partial<Story> | null): string {
  if (!story || !story.supporterName) return '';
  if (story.showName === false) {
    return getBatchSupporterDisplay(story);
  }
  return story.supporterName;
}




