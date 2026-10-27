export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  fullName: string;
  email: string;
  mobile?: string;
  role: UserRole;
  profileImage?: string;
  designation?: string;
  organization?: string;
  company?: string;
  department?: string;
  stream?: string;
  graduationYear?: number | null;
  location?: string;
  bio?: string;
  contactPrivacy?: string;
  achievements?: Array<{ id?: string; title: string; category?: string; year?: number | string; description?: string }>;
  isActive: boolean;
  createdAt: string;
  storiesCount?: number;
  authProvider?: 'LOCAL' | 'GOOGLE';
  googleId?: string;
  emailVerified?: boolean;
  alumniProfile?: Member | null;
}

export type StoryStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'UNPUBLISHED' | 'DRAFT' | 'CHANGES_REQUESTED';

export type PublicationLocation = 'Homepage' | 'Success Stories' | 'Featured Stories' | 'Category Page' | 'Community' | 'Do Not Publish';

export const ALL_PUBLICATION_LOCATIONS: PublicationLocation[] = [
  'Homepage',
  'Success Stories',
  'Featured Stories',
  'Category Page',
  'Community',
  'Do Not Publish'
];

export interface HierarchicalTreeNode {
  id?: string;
  title: string;
  summary?: string;
  icon?: string;
  color?: string;
  date?: string;
  number?: string;
  categoryKey?: string;
  children?: HierarchicalTreeNode[];
}

export interface HierarchicalMindMapData {
  person: {
    name: string;
    title: string;
    photo?: string;
  };
  mindMap: {
    title: string;
    children: HierarchicalTreeNode[];
  };
}

export interface MindMapNodeData {
  categoryKey?: string;
  category?: string;
  label?: string;
  title?: string;
  summary?: string;
  details?: string;
  sourceText?: string;
  icon?: string;
  color?: string;
  accentColor?: string;
  items?: string[];
  people?: string[];
  numbers?: string[];
  achievements?: string[];
  name?: string;
  image?: string;
  level?: 'center' | 'main' | 'sub' | 'detail';
  parentId?: string;
  isExpanded?: boolean;
  hasChildren?: boolean;
  childCount?: number;
  date?: string;
  number?: string;
  storyQuote?: string;
  onToggleExpand?: (nodeId: string) => void;
  onSelectNode?: (nodeData: MindMapNodeData) => void;
}

export interface MindMapNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: MindMapNodeData;
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: Record<string, any>;
  type?: string;
}

export interface JourneyMilestone {
  stage: number;
  title: string;
  period?: string;
  description: string[];
  icon?: string;
  importance?: 'high' | 'medium' | 'normal';
  categoryKey?: string;
  accentColor?: string;
}

export interface AchievementStat {
  value: string;
  label: string;
}

export interface JourneyMapData {
  title: string;
  personName: string;
  summary: string;
  category: string;
  heroImage?: string;
  milestones: JourneyMilestone[];
  achievements: AchievementStat[];
  highlights: string[];
  impact?: string;
  futureVision?: string;
}

export interface AiExtractedSections {
  beginning?: string[];
  goal?: string[];
  challenges?: string[];
  importantEvents?: string[];
  turningPoint?: string[];
  actions?: string[];
  achievements?: string[];
  impact?: string[];
  lessons?: string[];
  futureVision?: string[];
  [key: string]: string[] | undefined;
}

export interface StoryKeyword {
  word: string;
  score: number; // 0 to 100
  count?: number;
  type?: string; // 'Achievement' | 'Technology' | 'Milestone' | 'Challenge' | 'Core Theme'
  cluster?: string; // e.g. 'FOUNDATION', 'TECHNOLOGY', 'PROJECTS', 'SUPPORT', 'CHALLENGE', 'ACHIEVEMENTS'
  clusterLabel?: string;
  relatedKeywords?: string[];
  relatedMilestones?: number[];
}

export interface CloudStorySummary {
  id: string;
  storyTitle: string;
  personName: string;
  profession: string;
  location: string;
  category: string;
  shortSummary: string;
  personImage: string;
  showName: boolean;
  publishedAt?: string;
  aiKeywords?: string[];
}

export interface CloudKeyword {
  text: string;
  count: number;
  importanceScore: number; // 0 to 100
  sizeCategory: 'hero' | 'large' | 'medium' | 'small';
  categories: string[];
  stories: CloudStorySummary[];
  cluster?: string;
  clusterLabel?: string;
  relatedKeywords?: string[];
  relatedMilestones?: number[];
}

export interface AiExtractedElements {
  person: string;
  profileImage?: string;
  keywords: StoryKeyword[] | string[];
  sections: AiExtractedSections;
}

export interface Story {
  id: string;
  authorAdminId?: string | null;
  submittedByUserId?: string | null;
  submittedByUserName?: string;
  submittedByUserEmail?: string;
  storyTitle: string;
  personName: string;
  profession: string;
  location: string;
  category: string;
  shortSummary: string;
  fullStory: string;
  personImage: string;
  additionalImages?: string[];
  status: StoryStatus;
  showName: boolean;
  publicationLocations: string[];
  views: number;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  adminFeedback?: string | null;
  journeyMap?: JourneyMapData;
  aiExtractedElements?: AiExtractedElements;
  aiKeywords?: StoryKeyword[] | string[];
  aiMindMap?: {
    nodes: MindMapNode[];
    edges: MindMapEdge[];
  };
  batchYear?: string;
  batchNumber?: string;
  batchDisplay?: string;
  batch?: string;
  role?: string;
  company?: string;
  department?: string;
  isVerified?: boolean;
  authorMemberId?: string;
  beneficiaryName?: string;
  beneficiaryBatch?: string;
  supporterName?: string;
  supporterBatch?: string;
  storyRole?: 'BENEFICIARY' | 'SUPPORTER' | 'BOTH' | 'GENERAL' | string;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string | null;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
}

export interface DashboardSummaryStats {
  storiesShared: number;
  peopleFeatured: number;
  communitiesReached: number;
  storiesInspiringChange: number;
}

export interface AdminAnalyticsStats {
  totalStories: number;
  publishedStories: number;
  pendingStories: number;
  rejectedStories: number;
  draftStories: number;
  totalUsers: number;
  totalCategories: number;
  aiMapsGenerated: number;
  totalViews: number;
  mostViewedStories: Array<{
    id: string;
    storyTitle: string;
    personName: string;
    category: string;
    views: number;
    publishedAt: string;
  }>;
  storiesByCategory: Array<{
    category: string;
    count: number;
  }>;
  recentStories: Story[];
}

export interface EducationDetail {
  course: string;
  stream: string;
  institution: string;
  startYear?: number | null;
  endYear?: number | null;
  siteId?: string;
}

export interface WorkDetail {
  company: string;
  position: string;
  department?: string;
  startYear?: number | null;
  startMonth?: number | null;
  endYear?: number | null;
  endMonth?: number | null;
  currentCompany?: boolean;
}

export interface ProfileLinks {
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
  youtube?: string;
  instagram?: string;
}

export interface MembershipSubDetail {
  relation?: string;
  rollNo?: string;
  course?: string;
  stream?: string;
  entity?: string;
  startYear?: number | null;
  endYear?: number | null;
}

export interface MembershipDetail {
  siteId?: string;
  status?: string;
  registeredOn?: string | null;
  approvedOn?: string | null;
  adminNote?: string;
  details?: MembershipSubDetail[];
}

export interface ProfessionalDetails {
  experienceYears?: number;
  skills?: string[];
  industries?: string[];
  roles?: string[];
}

export interface MemberLocation {
  location?: string;
  city?: string;
  country?: string;
}

export interface Member {
  _id: string;
  id: string;
  basic: {
    salutation?: string;
    name: string;
    gender?: string;
    dateOfBirth?: string | null;
    label?: string;
    email?: string;
    alternateEmail?: string;
    profileUpdatedOn?: string | null;
    profileLinks?: ProfileLinks;
  };
  pictures: {
    profile?: string;
    thumb?: string;
    full?: string;
  };
  membershipDetails?: MembershipDetail[];
  educationDetails?: EducationDetail[];
  professionalDetails?: ProfessionalDetails;
  workDetails?: WorkDetail[];
  contactDetails?: {
    mobile?: string;
    home?: string;
    office?: string;
    currentLocation?: MemberLocation;
  };
  memberRoles?: string[];
  other?: Array<{ key: string; value: string }>;
  searchHelper?: {
    name: string;
    email?: string;
    course?: string;
    stream?: string;
    endYear?: number | null;
    city?: string;
    company?: string;
    position?: string;
    skills?: string[];
    membershipStatus?: string;
  };
}

export interface MemberFilterParams {
  search?: string;
  stream?: string;
  course?: string;
  endYear?: string | number;
  city?: string;
  company?: string;
  skill?: string;
  page?: number;
  limit?: number;
}

export interface MemberFilterOptions {
  streams: Array<{ name: string; count: number }>;
  graduationYears: number[];
  courses: Array<{ name: string; count: number }>;
  cities: Array<{ name: string; count: number }>;
  companies: Array<{ name: string; count: number }>;
}

export interface MemberPaginatedResponse {
  success: boolean;
  members: Member[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AlumniBenefit {
  id: string;
  userId: string;
  authorName: string;
  authorEmail: string;
  designation?: string;
  organization?: string;
  graduationYear?: number | null;
  category: string;
  title: string;
  description: string;
  skillsOffered?: string;
  availability?: string;
  contactPreference: string;
  contactDetails?: string;
  relevantLinks?: string;
  isFinancialAid: boolean;
  financialAmount?: string;
  privacySetting: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface BenefitRequest {
  id: string;
  benefitId: string;
  benefitTitle?: string;
  benefitCategory?: string;
  authorName?: string;
  userId: string;
  applicantName: string;
  applicantEmail: string;
  applicantRole: string;
  message: string;
  resumeLink?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
}


