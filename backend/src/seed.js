import bcrypt from 'bcryptjs';
import { usersDb, storiesDb, categoriesDb } from './db.js';
import { analyzeStoryWithAI } from './services/aiStoryAnalyzer.js';

export const seedDatabase = async () => {
  try {
    // 1. Seed Categories
    const defaultCategories = [
      { name: 'Education', description: 'Transformational stories in academia and learning' },
      { name: 'Entrepreneurship', description: 'Ventures, startups, and business breakthroughs' },
      { name: 'Technology', description: 'Innovations in AI, software, and digital engineering' },
      { name: 'Innovation', description: 'Pioneering solutions and creative discoveries' },
      { name: 'Sports', description: 'Athletic perseverance, championships, and athletic triumph' },
      { name: 'Agriculture', description: 'Sustainable farming, agritech, and rural development' },
      { name: 'Social Impact', description: 'Community uplifting, philanthropy, and advocacy' },
      { name: 'Career', description: 'Professional growth, leadership, and domain mastery' },
      { name: 'Community', description: 'Grassroots leadership and social empowerment' },
      { name: 'Other', description: 'Diverse inspirational success stories' }
    ];

    const existingCategories = categoriesDb.read();
    if (existingCategories.length === 0) {
      defaultCategories.forEach(cat => {
        categoriesDb.insert({
          ...cat,
          isActive: true
        });
      });
      console.log('✅ Default categories seeded.');
    }

    // 2. Seed Admin Account (Password: admin123)
    const existingAdmin = usersDb.findOne(u => u.email === 'admin@successstory.com' || u.email === 'admin@storymap.com');
    let adminUser = existingAdmin;

    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);

      adminUser = usersDb.insert({
        fullName: 'Success Story Admin',
        email: 'admin@successstory.com',
        mobile: '+1 (555) 019-2831',
        passwordHash,
        role: 'ADMIN',
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        isActive: true
      });
      console.log('✅ Default Admin account created: admin@successstory.com / admin123');
    }

    // Seed Demo User Account (Password: user123)
    const existingDemoUser = usersDb.findOne(u => u.email === 'user@successstory.com' || u.email === 'user@storymap.com');
    if (!existingDemoUser) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('user123', salt);

      usersDb.insert({
        fullName: 'Alex Morgan',
        email: 'user@successstory.com',
        mobile: '+1 (555) 234-5678',
        passwordHash,
        role: 'USER',
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        isActive: true
      });
      console.log('✅ Default Demo User created: user@successstory.com / user123');
    }

    // 3. Seed Initial Published Stories if database is empty
    const existingStories = storiesDb.read();
    if (existingStories.length === 0 && adminUser) {
      const seedStories = [
        {
          personName: 'Elena Rostova',
          storyTitle: 'Pioneering Clean Solar Microgrids for Rural Communities',
          profession: 'Clean Energy Innovator & Researcher',
          location: 'Nairobi, Kenya',
          category: 'Innovation',
          shortSummary: 'How Elena built accessible off-grid solar energy systems that now power over 50,000 rural homes across East Africa.',
          personImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
          fullStory: `Elena Rostova grew up in a rural village where electrical power outages lasted for days, severely disrupting evening study hours and healthcare clinic operations. From her early childhood in 2010, she harbored a deep dream to make clean, affordable energy accessible to every off-grid community in East Africa.

After earning her doctorate in Renewable Energy Systems in 2018, Elena faced tremendous challenges: lack of early-stage venture funding, rugged terrain that hindered traditional infrastructure, and skepticism from legacy utility companies.

The pivotal turning point arrived in 2020 when Elena designed a decentralized solar microgrid powered by AI-optimized lithium battery management. Instead of relying on expensive centralized grids, her system allowed villagers to buy micro-shares of solar power via mobile payments.

Taking decisive actions in 2021, Elena partnered with local youth, training over 200 young technicians to install and maintain the microgrids. Within three years, her startup successfully powered over 50,000 homes, 120 rural schools, and 45 community health clinics.

Her key achievements include winning the Global CleanTech Innovation Award in 2023 and delivering uninterrupted light to over 250,000 citizens. Elena believes the key lesson is that sustainable technology succeeds only when built in true partnership with local communities. Looking toward her future vision, Elena aims to expand solar microgrid networks to cover 500,000 off-grid families by 2030.`
        },
        {
          personName: 'Carlos Mendoza',
          storyTitle: 'From High School Dropout to Tech Unicorn Founder',
          profession: 'CEO & Co-founder, CodePulse',
          location: 'Austin, Texas',
          category: 'Entrepreneurship',
          shortSummary: 'Carlos overcame early financial hardship and multiple startup rejections to build an AI code review platform valued at $1.2B.',
          personImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
          fullStory: `Carlos Mendoza was born in a working-class neighborhood where computer science education was virtually non-existent. Forced to drop out of high school at age 17 to support his family, Carlos taught himself software development during late-night shifts at a local library.

His early dream was simple: build software tools that help self-taught developers write bug-free code without requiring expensive engineering degrees. However, his journey was plagued by severe obstacles. His first two software startups failed completely, leaving him heavily in debt and working multiple freelance gigs to survive.

The turning point occurred when Carlos realized that artificial intelligence could automate complex software quality audits for small dev teams. Driven by determination, he spent 18 months coding the prototype for CodePulse in a small garage.

Through relentless execution, Carlos secured his first 1,000 paying users without any paid marketing. Fast forward five years, CodePulse raised its Series C funding round, scaling to 500 employees and reaching unicorn status with a $1.2 Billion valuation.

Carlos has created over 800 tech jobs and established a $10M developer scholarship for underrepresented youth. His enduring lesson to aspiring founders is that failure is not the opposite of success, but an essential stepping stone towards it. His future vision is to establish 50 free coding academies across Latin America.`
        },
        {
          personName: 'Elena Rostova',
          storyTitle: 'Breaking Olympic Records in Distance Running',
          profession: 'Olympic Marathon Gold Medalist',
          location: 'Zurich, Switzerland',
          category: 'Sports',
          shortSummary: 'Elena recovered from a career-threatening knee injury to win Olympic Gold and inspire millions of young female athletes worldwide.',
          personImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          fullStory: `Elena Rostova began distance running at age ten, discovering her natural endurance on the alpine trails of her home village. Her childhood dream was to stand atop the Olympic podium wearing her national colors.

At age 22, just one year before the World Championships, Elena suffered a devastating knee ligament tear during training. Doctors warned her that she might never sprint competitively again. The emotional hardship and physical pain tested her resilience to the absolute limit.

Her turning point came during her eight-month intensive rehabilitation. Refusing to succumb to despair, Elena embraced a groundbreaking biomechanical recovery program paired with rigorous mental conditioning and swimming workouts.

Taking disciplined action, Elena returned to competitive running, training 100 miles a week under extreme weather conditions. Her perseverance paid off when she broke the national marathon record and went on to claim the Olympic Gold Medal in Paris with a record-breaking time of 2:18:42.

Her impact extends beyond sport: she launched the RunHer Foundation, providing athletic gear and coaching grants to young girls in underserved areas. Elena's core lesson is that true strength is forged in moments when giving up feels like the easiest option. Her future vision is to coach the next generation of Olympic champion runners.`
        }
      ];

      for (const storyData of seedStories) {
        const aiResult = await analyzeStoryWithAI({
          storyTitle: storyData.storyTitle,
          personName: storyData.personName,
          fullStory: storyData.fullStory,
          personImage: storyData.personImage
        });

        storiesDb.insert({
          authorAdminId: adminUser.id,
          storyTitle: storyData.storyTitle,
          personName: storyData.personName,
          profession: storyData.profession,
          location: storyData.location,
          category: storyData.category,
          shortSummary: storyData.shortSummary,
          fullStory: storyData.fullStory,
          personImage: storyData.personImage,
          additionalImages: [],
          status: 'PUBLISHED',
          showName: true,
          publicationLocations: ['Homepage', 'Success Stories', 'Featured Stories'],
          views: Math.floor(Math.random() * 400) + 150,
          journeyMap: aiResult.journeyMap,
          aiExtractedElements: aiResult.aiExtractedElements,
          aiKeywords: aiResult.aiKeywords,
          aiMindMap: aiResult.aiMindMap,
          publishedAt: new Date(Date.now() - Math.floor(Math.random() * 10 * 86400000)).toISOString()
        });
      }
      console.log('✅ Initial inspirational published stories seeded with AI Mind Maps & Keywords.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
