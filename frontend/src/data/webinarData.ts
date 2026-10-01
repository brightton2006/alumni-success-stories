export interface WebinarItem {
  id: string;
  title: string;
  speaker: string;
  speakerRole: string;
  company: string;
  date: string;
  time: string;
  status: 'completed' | 'upcoming' | 'postponed';
  attendeesCount: number;
}

export interface DomainData {
  id: string;
  name: string;
  planned: number;
  conducted: number;
  postponed: number;
  status: 'completed' | 'in-progress' | 'pending';
  webinars: WebinarItem[];
}

export interface PhaseData {
  id: string;
  name: string; // e.g. "Phase 7"
  period: string; // e.g. "(Apr 2026 - Oct 2026)"
  totalPlanned: number;
  totalConducted: number;
  totalSpeakers: number;
  domains: DomainData[];
}

export const phasesData: Record<string, PhaseData> = {
  'Phase 7': {
    id: 'phase-7',
    name: 'Phase 7',
    period: '(Apr 2026 - Oct 2026)',
    totalPlanned: 28,
    totalConducted: 26,
    totalSpeakers: 24,
    domains: [
      {
        id: 'fsd',
        name: 'FULL STACK DEVELOPMENT',
        planned: 4,
        conducted: 4,
        postponed: 0,
        status: 'completed',
        webinars: [
          {
            id: 'fsd-1',
            title: 'Building Scalable Microservices with Node.js & React',
            speaker: 'Tharun Kumar',
            speakerRole: 'Staff Frontend Engineer',
            company: 'Google',
            date: 'May 12, 2026',
            time: '10:00 AM - 11:30 AM',
            status: 'completed',
            attendeesCount: 142
          },
          {
            id: 'fsd-2',
            title: 'Modern State Management & React Server Components',
            speaker: 'Ananya Sharma',
            speakerRole: 'Lead UI Architect',
            company: 'Meta',
            date: 'Jun 05, 2026',
            time: '02:00 PM - 03:30 PM',
            status: 'completed',
            attendeesCount: 189
          },
          {
            id: 'fsd-3',
            title: 'Full-Stack Performance Optimization & SSR',
            speaker: 'David Miller',
            speakerRole: 'Principal Engineer',
            company: 'Vercel',
            date: 'Jul 18, 2026',
            time: '11:00 AM - 12:30 PM',
            status: 'completed',
            attendeesCount: 165
          },
          {
            id: 'fsd-4',
            title: 'GraphQL vs REST API Architecture Masterclass',
            speaker: 'Priya Sundaram',
            speakerRole: 'Senior Backend Specialist',
            company: 'Stripe',
            date: 'Aug 22, 2026',
            time: '04:00 PM - 05:30 PM',
            status: 'completed',
            attendeesCount: 178
          }
        ]
      },
      {
        id: 'aids',
        name: 'ARTIFICIAL INTELLIGENCE & DATA SCIENCE',
        planned: 4,
        conducted: 4,
        postponed: 0,
        status: 'completed',
        webinars: [
          {
            id: 'ai-1',
            title: 'LLM Fine-Tuning and RAG Architectures in Production',
            speaker: 'Dr. Rajesh Varma',
            speakerRole: 'AI Research Scientist',
            company: 'DeepMind',
            date: 'Apr 28, 2026',
            time: '10:00 AM - 11:30 AM',
            status: 'completed',
            attendeesCount: 310
          },
          {
            id: 'ai-2',
            title: 'Generative AI Applications & Diffusion Models',
            speaker: 'Sophia Chen',
            speakerRole: 'ML Engineer',
            company: 'OpenAI',
            date: 'May 30, 2026',
            time: '03:00 PM - 04:30 PM',
            status: 'completed',
            attendeesCount: 290
          },
          {
            id: 'ai-3',
            title: 'Computer Vision with PyTorch & YOLOv8',
            speaker: 'Karthik Raja',
            speakerRole: 'Vision Systems Lead',
            company: 'Tesla',
            date: 'Jul 04, 2026',
            time: '11:00 AM - 12:30 PM',
            status: 'completed',
            attendeesCount: 220
          },
          {
            id: 'ai-4',
            title: 'Ethics & Governance in Enterprise AI Deployments',
            speaker: 'Dr. Meera Nambiar',
            speakerRole: 'AI Governance Director',
            company: 'Microsoft',
            date: 'Aug 14, 2026',
            time: '05:00 PM - 06:30 PM',
            status: 'completed',
            attendeesCount: 195
          }
        ]
      },
      {
        id: 'cc',
        name: 'CLOUD COMPUTING',
        planned: 4,
        conducted: 4,
        postponed: 0,
        status: 'completed',
        webinars: [
          {
            id: 'cc-1',
            title: 'AWS Multi-Region Serverless Infrastructure Blueprint',
            speaker: 'Arun Prakash',
            speakerRole: 'Cloud Solutions Architect',
            company: 'AWS',
            date: 'May 02, 2026',
            time: '09:00 AM - 10:30 AM',
            status: 'completed',
            attendeesCount: 155
          },
          {
            id: 'cc-2',
            title: 'Kubernetes Cluster Hardening & Cost Optimization',
            speaker: 'Elena Rostova',
            speakerRole: 'DevOps Director',
            company: 'Datadog',
            date: 'Jun 14, 2026',
            time: '02:00 PM - 03:30 PM',
            status: 'completed',
            attendeesCount: 172
          },
          {
            id: 'cc-3',
            title: 'Google Cloud Anthos & Hybrid Cloud Architecture',
            speaker: 'Siddharth Iyer',
            speakerRole: 'Senior Cloud Consultant',
            company: 'Google Cloud',
            date: 'Jul 26, 2026',
            time: '04:00 PM - 05:30 PM',
            status: 'completed',
            attendeesCount: 140
          },
          {
            id: 'cc-4',
            title: 'Zero Trust Cloud Security Architecture',
            speaker: 'Vikram Joshi',
            speakerRole: 'Head of Cloud Security',
            company: 'Cloudflare',
            date: 'Aug 29, 2026',
            time: '11:00 AM - 12:30 PM',
            status: 'completed',
            attendeesCount: 160
          }
        ]
      },
      {
        id: 'csn',
        name: 'CYBER SECURITY & NETWORKING',
        planned: 4,
        conducted: 4,
        postponed: 0,
        status: 'completed',
        webinars: [
          {
            id: 'cs-1',
            title: 'Offensive Security & Red Teaming Penetration Testing',
            speaker: 'Alexandre Dubois',
            speakerRole: 'Lead Security Analyst',
            company: 'Palo Alto Networks',
            date: 'May 20, 2026',
            time: '03:00 PM - 04:30 PM',
            status: 'completed',
            attendeesCount: 205
          },
          {
            id: 'cs-2',
            title: 'Application Security in CI/CD Pipelines',
            speaker: 'Kavita Menon',
            speakerRole: 'AppSec Engineer',
            company: 'GitLab',
            date: 'Jun 28, 2026',
            time: '10:00 AM - 11:30 AM',
            status: 'completed',
            attendeesCount: 180
          },
          {
            id: 'cs-3',
            title: 'Incident Response & Threat Intelligence',
            speaker: 'Robert Vance',
            speakerRole: 'CISO',
            company: 'CrowdStrike',
            date: 'Jul 30, 2026',
            time: '02:00 PM - 03:30 PM',
            status: 'completed',
            attendeesCount: 190
          },
          {
            id: 'cs-4',
            title: 'Modern Cryptography & Post-Quantum Preparedness',
            speaker: 'Dr. Sanjay Patel',
            speakerRole: 'Crypto Researcher',
            company: 'IBM Security',
            date: 'Aug 25, 2026',
            time: '05:00 PM - 06:30 PM',
            status: 'completed',
            attendeesCount: 150
          }
        ]
      },
      {
        id: 'devops',
        name: 'DEVOPS & SITE RELIABILITY',
        planned: 4,
        conducted: 3,
        postponed: 1,
        status: 'in-progress',
        webinars: [
          {
            id: 'do-1',
            title: 'GitOps Workflow with ArgoCD & Terraform',
            speaker: 'Nikhil Rane',
            speakerRole: 'Staff Site Reliability Engineer',
            company: 'Uber',
            date: 'May 16, 2026',
            time: '11:00 AM - 12:30 PM',
            status: 'completed',
            attendeesCount: 168
          },
          {
            id: 'do-2',
            title: 'Distributed Tracing & Observability with OpenTelemetry',
            speaker: 'Sarah Jenkins',
            speakerRole: 'Observability Architect',
            company: 'Grafana Labs',
            date: 'Jun 22, 2026',
            time: '04:00 PM - 05:30 PM',
            status: 'completed',
            attendeesCount: 145
          },
          {
            id: 'do-3',
            title: 'Chaos Engineering & Resiliency Testing',
            speaker: 'Ganesh Pillai',
            speakerRole: 'Principal SRE',
            company: 'Netflix',
            date: 'Jul 22, 2026',
            time: '02:00 PM - 03:30 PM',
            status: 'completed',
            attendeesCount: 175
          },
          {
            id: 'do-4',
            title: 'Infrastructure as Code Security & Automated Compliance',
            speaker: 'Lucas Meyer',
            speakerRole: 'DevSecOps Specialist',
            company: 'HashiCorp',
            date: 'Sep 15, 2026',
            time: '10:00 AM - 11:30 AM',
            status: 'postponed',
            attendeesCount: 0
          }
        ]
      },
      {
        id: 'dea',
        name: 'DATA ENGINEERING & ANALYTICS',
        planned: 4,
        conducted: 4,
        postponed: 0,
        status: 'completed',
        webinars: [
          {
            id: 'de-1',
            title: 'Building Real-Time Streaming Data Pipelines with Apache Kafka',
            speaker: 'Manish Verma',
            speakerRole: 'Principal Data Engineer',
            company: 'Snowflake',
            date: 'May 08, 2026',
            time: '02:00 PM - 03:30 PM',
            status: 'completed',
            attendeesCount: 198
          },
          {
            id: 'de-2',
            title: 'Modern Data Lakehouse Architecture with Databricks',
            speaker: 'Linda Zhao',
            speakerRole: 'Data Engineering Lead',
            company: 'Databricks',
            date: 'Jun 18, 2026',
            time: '10:00 AM - 11:30 AM',
            status: 'completed',
            attendeesCount: 215
          },
          {
            id: 'de-3',
            title: 'Advanced SQL Performance & Query Optimization',
            speaker: 'Aditya Nair',
            speakerRole: 'Database Specialist',
            company: 'Oracle',
            date: 'Jul 12, 2026',
            time: '04:00 PM - 05:30 PM',
            status: 'completed',
            attendeesCount: 185
          },
          {
            id: 'de-4',
            title: 'Data Governance, Quality & Cataloging at Scale',
            speaker: 'Rachel Green',
            speakerRole: 'Head of Data Platforms',
            company: 'Airbnb',
            date: 'Aug 19, 2026',
            time: '11:00 AM - 12:30 PM',
            status: 'completed',
            attendeesCount: 170
          }
        ]
      },
      {
        id: 'uiux',
        name: 'UI/UX DESIGN & PRODUCT MANAGEMENT',
        planned: 4,
        conducted: 3,
        postponed: 0,
        status: 'in-progress',
        webinars: [
          {
            id: 'ux-1',
            title: 'Design Systems at Scale: From Figma Tokens to Code',
            speaker: 'Jessica Alba',
            speakerRole: 'Lead Product Designer',
            company: 'Figma',
            date: 'May 25, 2026',
            time: '01:00 PM - 02:30 PM',
            status: 'completed',
            attendeesCount: 240
          },
          {
            id: 'ux-2',
            title: 'Data-Driven Product Management & Growth Loops',
            speaker: 'Rohan Deshmukh',
            speakerRole: 'Group Product Manager',
            company: 'Atlassian',
            date: 'Jun 30, 2026',
            time: '11:00 AM - 12:30 PM',
            status: 'completed',
            attendeesCount: 210
          },
          {
            id: 'ux-3',
            title: 'Accessibility (a11y) & Inclusive UI Design Standards',
            speaker: 'Amara Okafor',
            speakerRole: 'Accessibility Specialist',
            company: 'Apple',
            date: 'Aug 05, 2026',
            time: '03:00 PM - 04:30 PM',
            status: 'completed',
            attendeesCount: 180
          },
          {
            id: 'ux-4',
            title: 'User Research Methods & Usability Testing Frameworks',
            speaker: 'David Kim',
            speakerRole: 'UX Researcher',
            company: 'Spotify',
            date: 'Sep 22, 2026',
            time: '02:00 PM - 03:30 PM',
            status: 'upcoming',
            attendeesCount: 0
          }
        ]
      }
    ]
  },
  'Phase 6': {
    id: 'phase-6',
    name: 'Phase 6',
    period: '(Oct 2025 - Mar 2026)',
    totalPlanned: 24,
    totalConducted: 24,
    totalSpeakers: 20,
    domains: [
      {
        id: 'fsd-p6',
        name: 'FULL STACK DEVELOPMENT',
        planned: 4,
        conducted: 4,
        postponed: 0,
        status: 'completed',
        webinars: []
      },
      {
        id: 'ai-p6',
        name: 'ARTIFICIAL INTELLIGENCE & DATA SCIENCE',
        planned: 4,
        conducted: 4,
        postponed: 0,
        status: 'completed',
        webinars: []
      },
      {
        id: 'cc-p6',
        name: 'CLOUD COMPUTING',
        planned: 4,
        conducted: 4,
        postponed: 0,
        status: 'completed',
        webinars: []
      },
      {
        id: 'cs-p6',
        name: 'CYBER SECURITY & NETWORKING',
        planned: 4,
        conducted: 4,
        postponed: 0,
        status: 'completed',
        webinars: []
      },
      {
        id: 'do-p6',
        name: 'DEVOPS & SITE RELIABILITY',
        planned: 4,
        conducted: 4,
        postponed: 0,
        status: 'completed',
        webinars: []
      },
      {
        id: 'ux-p6',
        name: 'UI/UX DESIGN & PRODUCT MANAGEMENT',
        planned: 4,
        conducted: 4,
        postponed: 0,
        status: 'completed',
        webinars: []
      }
    ]
  },
  'Phase 5': {
    id: 'phase-5',
    name: 'Phase 5',
    period: '(Apr 2025 - Sep 2025)',
    totalPlanned: 20,
    totalConducted: 20,
    totalSpeakers: 18,
    domains: [
      { id: 'fsd-p5', name: 'FULL STACK DEVELOPMENT', planned: 4, conducted: 4, postponed: 0, status: 'completed', webinars: [] },
      { id: 'ai-p5', name: 'ARTIFICIAL INTELLIGENCE & DATA SCIENCE', planned: 4, conducted: 4, postponed: 0, status: 'completed', webinars: [] },
      { id: 'cc-p5', name: 'CLOUD COMPUTING', planned: 4, conducted: 4, postponed: 0, status: 'completed', webinars: [] },
      { id: 'cs-p5', name: 'CYBER SECURITY & NETWORKING', planned: 4, conducted: 4, postponed: 0, status: 'completed', webinars: [] },
      { id: 'do-p5', name: 'DEVOPS & SITE RELIABILITY', planned: 4, conducted: 4, postponed: 0, status: 'completed', webinars: [] }
    ]
  },
  'Phase 4': {
    id: 'phase-4',
    name: 'Phase 4',
    period: '(Oct 2024 - Mar 2025)',
    totalPlanned: 18,
    totalConducted: 18,
    totalSpeakers: 16,
    domains: [
      { id: 'fsd-p4', name: 'FULL STACK DEVELOPMENT', planned: 4, conducted: 4, postponed: 0, status: 'completed', webinars: [] },
      { id: 'ai-p4', name: 'ARTIFICIAL INTELLIGENCE & DATA SCIENCE', planned: 4, conducted: 4, postponed: 0, status: 'completed', webinars: [] },
      { id: 'cc-p4', name: 'CLOUD COMPUTING', planned: 4, conducted: 4, postponed: 0, status: 'completed', webinars: [] },
      { id: 'do-p4', name: 'DEVOPS & SITE RELIABILITY', planned: 6, conducted: 6, postponed: 0, status: 'completed', webinars: [] }
    ]
  },
  'Phase 3': {
    id: 'phase-3',
    name: 'Phase 3',
    period: '(Apr 2024 - Sep 2024)',
    totalPlanned: 15,
    totalConducted: 15,
    totalSpeakers: 14,
    domains: [
      { id: 'fsd-p3', name: 'FULL STACK DEVELOPMENT', planned: 5, conducted: 5, postponed: 0, status: 'completed', webinars: [] },
      { id: 'ai-p3', name: 'ARTIFICIAL INTELLIGENCE & DATA SCIENCE', planned: 5, conducted: 5, postponed: 0, status: 'completed', webinars: [] },
      { id: 'cc-p3', name: 'CLOUD COMPUTING', planned: 5, conducted: 5, postponed: 0, status: 'completed', webinars: [] }
    ]
  },
  'Phase 2': {
    id: 'phase-2',
    name: 'Phase 2',
    period: '(Oct 2023 - Mar 2024)',
    totalPlanned: 12,
    totalConducted: 12,
    totalSpeakers: 12,
    domains: [
      { id: 'fsd-p2', name: 'FULL STACK DEVELOPMENT', planned: 6, conducted: 6, postponed: 0, status: 'completed', webinars: [] },
      { id: 'cc-p2', name: 'CLOUD COMPUTING', planned: 6, conducted: 6, postponed: 0, status: 'completed', webinars: [] }
    ]
  },
  'Phase 1': {
    id: 'phase-1',
    name: 'Phase 1',
    period: '(Apr 2023 - Sep 2023)',
    totalPlanned: 10,
    totalConducted: 10,
    totalSpeakers: 10,
    domains: [
      { id: 'fsd-p1', name: 'FULL STACK DEVELOPMENT', planned: 5, conducted: 5, postponed: 0, status: 'completed', webinars: [] },
      { id: 'ai-p1', name: 'ARTIFICIAL INTELLIGENCE & DATA SCIENCE', planned: 5, conducted: 5, postponed: 0, status: 'completed', webinars: [] }
    ]
  }
};
