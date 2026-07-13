export type UserRole = "Admin" | "Participant";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  members: string; // Comma-separated names or emails
  createdAt: string;
}

export interface Participant {
  id: string;
  userId: string;
  teamId: string;
  college?: string;
  bio?: string;
}

export interface HackathonEvent {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface ProjectSubmission {
  id: string;
  projectName: string;
  teamName: string;
  teamMembers: string;
  description: string;
  problemStatement: string;
  githubUrl: string;
  aiStudioUrl: string;
  liveUrl: string;
  demoVideoUrl: string;
  presentationDocName?: string; // Stored filename
  presentationDocUrl?: string;  // Simulated upload link
  hackathonId: string;
  createdAt: string;
  status: "pending" | "evaluated";
}

export interface GitHubAnalysis {
  id: string;
  projectId: string;
  stars: number;
  forks: number;
  contributors: number;
  commits: number;
  languages: Record<string, number>;
  readmeContent: string;
  repoStructure: string[];
  analyzedAt: string;
  
  // NEW METRICS
  commitFrequency?: string;
  branches?: string[];
  pullRequests?: { open: number; closed: number; total: number };
  issues?: { open: number; closed: number; total: number };
  githubActions?: { hasActions: boolean; workflows: string[] };
  license?: string | null;
  hasGitignore?: boolean;
  readmeQuality?: {
    score: number;
    hasSetupGuide: boolean;
    hasPrerequisites: boolean;
    hasArchitectureSection: boolean;
    missingSections: string[];
  };
  repoHealthScore?: number;
  developerPracticeScore?: number;
  codeQualityObservations?: string[];
  
  // ERROR & BOUNDARY STATE HANDLING
  isPrivate?: boolean;
  isEmpty?: boolean;
  hasReadme?: boolean;
  errorState?: "private" | "invalid_url" | "empty_repo" | "missing_readme" | null;
}

export interface AIEvaluation {
  id: string;
  projectId: string;
  ideaScore: number;
  innovationScore: number;
  codeQualityScore: number;
  readmeScore: number;
  uiScore: number;
  aiUsageScore: number;
  technicalScore: number;
  overallScore: number;
  feedback: string;
  evaluatedAt: string;
}

export interface ScoreCriteria {
  idea: number;
  innovation: number;
  codeQuality: number;
  readme: number;
  ui: number;
  aiUsage: number;
  technical: number;
}

export interface JudgeReview {
  id: string;
  projectId: string;
  judgeId: string;
  judgeName: string;
  scores: ScoreCriteria;
  overallScore: number;
  feedback: string;
  submittedAt: string;
}

export interface Comment {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  createdAt: string;
}

export interface LeaderboardRanking {
  projectId: string;
  projectName: string;
  teamName: string;
  aiOverallScore: number | null;
  judgeAverageScore: number | null;
  combinedScore: number;
  rank: number;
}

export interface Certificate {
  id: string;
  projectId: string;
  projectName: string;
  teamName: string;
  recipientEmail: string;
  recipientName: string;
  role: string; // e.g. "Winner", "Runner-up", "Participant"
  issuedAt: string;
  certificateCode: string;
}

export interface LiveAnalysisIssue {
  type: "performance" | "accessibility" | "seo" | "ux" | "security" | "mobile";
  severity: "high" | "medium" | "low";
  message: string;
  recommendation: string;
}

export interface LiveAnalysisResult {
  url: string;
  available: boolean;
  statusCode: number;
  responseTimeMs: number;
  performance_score: number;
  accessibility_score: number;
  seo_score: number;
  ux_score: number;
  security_score: number;
  mobile_responsiveness_score: number;
  issues: LiveAnalysisIssue[];
  analyzedAt: string;
}

