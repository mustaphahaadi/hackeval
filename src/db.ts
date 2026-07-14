import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, setDoc, deleteDoc, getDocs, collection } from "firebase/firestore";

import {
  User,
  Team,
  Participant,
  HackathonEvent,
  ProjectSubmission,
  GitHubAnalysis,
  AIEvaluation,
  JudgeReview,
  Comment,
  Certificate,
  LeaderboardRanking,
  UserRole,
  LiveAnalysisResult
} from "./types";

// Initialize Firebase on backend
let dbFirestore: any = null;

try {
  let firebaseConfig: any = null;
  let currentDir = "";
  try {
    currentDir = path.dirname(fileURLToPath(import.meta.url));
  } catch (e) {
    currentDir = "";
  }

  const pathsToSearch = [
    path.join(process.cwd(), "firebase-applet-config.json"),
    path.join(process.cwd(), "dist", "firebase-applet-config.json"),
    path.join(process.cwd(), "..", "firebase-applet-config.json"),
    path.join(process.cwd(), "api", "firebase-applet-config.json")
  ];

  if (currentDir) {
    pathsToSearch.push(path.join(currentDir, "firebase-applet-config.json"));
    pathsToSearch.push(path.join(currentDir, "..", "firebase-applet-config.json"));
    pathsToSearch.push(path.join(currentDir, "../..", "firebase-applet-config.json"));
  }

  for (const p of pathsToSearch) {
    if (fs.existsSync(p)) {
      try {
        firebaseConfig = JSON.parse(fs.readFileSync(p, "utf-8"));
        console.log(`Successfully loaded Firebase config from ${p}`);
        break;
      } catch (e) {
        console.error(`Found config at ${p} but failed to parse:`, e);
      }
    }
  }

  if (firebaseConfig) {
    const firebaseApp = initializeApp({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
    });
    dbFirestore = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId || "(default)");
    console.log("Firebase initialized successfully on backend server.");
  } else {
    console.warn("firebase-applet-config.json not found, falling back to local memory DB");
  }
} catch (err) {
  console.error("Failed to initialize Firebase:", err);
}

// Database storage location
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

interface DBState {
  users: User[];
  teams: Team[];
  participants: Participant[];
  hackathons: HackathonEvent[];
  projects: ProjectSubmission[];
  githubAnalyses: GitHubAnalysis[];
  aiEvaluations: AIEvaluation[];
  judgeReviews: JudgeReview[];
  comments: Comment[];
  certificates: Certificate[];
  liveAnalyses: LiveAnalysisResult[];
}

// Initial default state with robust seed data
const DEFAULT_STATE = (): DBState => ({
  users: [],
  teams: [],
  participants: [],
  hackathons: [],
  projects: [],
  githubAnalyses: [],
  aiEvaluations: [],
  judgeReviews: [],
  comments: [],
  certificates: [],
  liveAnalyses: []
});

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Firestore operation '${operationName}' timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

class LocalDB {
  private state: DBState = DEFAULT_STATE();
  private initPromise: Promise<void> | null = null;
  private isInitialized = false;

  constructor() {
    this.init(); // Sync fallback init so we don't start with undefined/empty state before async completes
    this.ensureInitialized().catch(err => {
      console.error("Async Firebase initialization failed:", err);
    });
  }

  ensureInitialized(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.initFirebase();
    return this.initPromise;
  }

  private async initFirebase() {
    if (!dbFirestore) {
      console.warn("No dbFirestore instance. Operating purely on memory / local file.");
      this.isInitialized = true;
      return;
    }

    try {
      console.log("Loading data from Firestore with safe timeouts...");
      const collectionsList = [
        "users", "teams", "participants", "hackathons", "projects", 
        "githubAnalyses", "aiEvaluations", "judgeReviews", "comments", "certificates", "liveAnalyses"
      ];

      // Load all collections from Firestore in parallel with self-healing / seeding for empty collections
      await Promise.all(collectionsList.map(async (colName) => {
        try {
          const querySnapshot = await withTimeout(getDocs(collection(dbFirestore, colName)), 4000, `load collection ${colName}`);
          
          if (!querySnapshot.empty) {
            // Load documents from Firestore
            const docs: any[] = [];
            querySnapshot.forEach((d) => {
              docs.push({ id: d.id, ...d.data() });
            });

            // Special self-healing: Ensure Admin user always exists in 'users' collection
            if (colName === "users") {
              const adminEmail = "admin@hackathon.edu";
              const adminUserExists = docs.some(u => u.email && u.email.toLowerCase() === adminEmail);
              if (!adminUserExists) {
                const seededAdmin = this.state.users.find(u => u.email && u.email.toLowerCase() === adminEmail);
                if (seededAdmin) {
                  docs.push(seededAdmin);
                  await withTimeout(setDoc(doc(dbFirestore, "users", seededAdmin.id), seededAdmin), 2000, "ensure admin user in firestore");
                  console.log("Seeded default Admin user into Firestore users collection.");
                }
              }
            }

            this.state[colName as keyof DBState] = docs;
            console.log(`Loaded ${docs.length} documents for ${colName} from Firestore.`);
          } else {
            // Collection is empty in Firestore. Let's see if we have local seed data from init()
            const localItems = this.state[colName as keyof DBState] || [];
            if (localItems.length > 0) {
              console.log(`Firestore collection ${colName} is empty. Seeding it with ${localItems.length} default items...`);
              await Promise.all(localItems.map(async (item) => {
                const docId = (item as any).id || (item as any).url || "default";
                await withTimeout(setDoc(doc(dbFirestore, colName, docId), item), 2000, `seed setDoc ${colName}/${docId}`);
              }));
              // Keep the local state
              console.log(`Seeded ${colName} collection successfully in Firestore.`);
            } else {
              this.state[colName as keyof DBState] = [];
            }
          }
        } catch (colErr) {
          console.error(`Failed to load/seed collection ${colName} from Firestore, keeping local file/memory data:`, colErr);
        }
      }));
      this.isInitialized = true;
      console.log("Firestore initialization and self-healing completed.");
    } catch (error) {
      console.error("Failed to initialize Firebase database, falling back to local file DB:", error);
      this.isInitialized = true;
    }
  }

  private async persistCollection(colName: keyof DBState) {
    if (!dbFirestore) {
      this.save();
      return;
    }
    try {
      const colRef = collection(dbFirestore, colName);
      const querySnapshot = await withTimeout(getDocs(colRef), 4000, `persist query ${colName}`);
      const currentIds = new Set((this.state[colName] || []).map((item: any) => item.id || item.url || ""));

      // Overwrite / write all current items
      for (const item of (this.state[colName] || [])) {
        const docId = (item as any).id || (item as any).url || "default";
        await withTimeout(setDoc(doc(dbFirestore, colName, docId), item), 3000, `persist setDoc ${colName}/${docId}`);
      }

      // Delete any items that are no longer present
      for (const d of querySnapshot.docs) {
        if (!currentIds.has(d.id)) {
          await withTimeout(deleteDoc(doc(dbFirestore, colName, d.id)), 3000, `persist deleteDoc ${colName}/${d.id}`);
        }
      }
    } catch (err) {
      console.error(`Failed to persist collection ${colName} to Firestore:`, err);
      this.save();
    }
  }

  private async persistItem(colName: keyof DBState, docId: string, item: any) {
    if (!dbFirestore) {
      this.save();
      return;
    }
    try {
      await withTimeout(setDoc(doc(dbFirestore, colName, docId), item), 3000, `persistItem ${colName}/${docId}`);
    } catch (err) {
      console.error(`Failed to persist item ${colName}/${docId} to Firestore:`, err);
      this.save();
    }
  }

  private async deleteItem(colName: keyof DBState, docId: string) {
    if (!dbFirestore) {
      this.save();
      return;
    }
    try {
      await withTimeout(deleteDoc(doc(dbFirestore, colName, docId)), 3000, `deleteItem ${colName}/${docId}`);
    } catch (err) {
      console.error(`Failed to delete item ${colName}/${docId} from Firestore:`, err);
      this.save();
    }
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        try {
          fs.mkdirSync(DB_DIR, { recursive: true });
        } catch (dirErr) {
          console.warn("Read-only filesystem: unable to create data directory, using in-memory database:", dirErr);
        }
      }

      if (fs.existsSync(DB_FILE)) {
        try {
          const fileContent = fs.readFileSync(DB_FILE, "utf-8");
          this.state = JSON.parse(fileContent);
          // Quick verify arrays exist
          this.ensureArrays();
        } catch (readErr) {
          console.error("Failed to read database file, resetting to default:", readErr);
          this.state = DEFAULT_STATE();
          this.seed();
        }
      } else {
        this.state = DEFAULT_STATE();
        this.seed();
        this.save();
      }
    } catch (error) {
      console.error("Failed to initialize database, resetting to default:", error);
      this.state = DEFAULT_STATE();
      this.seed();
      this.save();
    }
  }

  private ensureArrays() {
    const keys: (keyof DBState)[] = [
      "users", "teams", "participants", "hackathons", "projects", 
      "githubAnalyses", "aiEvaluations", "judgeReviews", "comments", "certificates", "liveAnalyses"
    ];
    for (const key of keys) {
      if (!Array.isArray(this.state[key])) {
        (this.state as any)[key] = [];
      }
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), "utf-8");
    } catch (err) {
      console.warn("Failed to write to local database file (system is likely read-only / serverless):", err);
    }
  }

  private seed() {
    console.log("Seeding Database...");
    
    // 1. Users
    const salt = bcrypt.genSaltSync(10);
    const adminPass = bcrypt.hashSync("admin123", salt);
    const partPass = bcrypt.hashSync("part123", salt);
    
    const seededUsers: User[] = [
      {
        id: "usr_admin",
        email: "admin@hackathon.edu",
        passwordHash: adminPass,
        name: "Professor Angela Sterling",
        role: "Admin",
        createdAt: new Date().toISOString()
      },
      {
        id: "usr_part1",
        email: "alice@hackathon.edu",
        passwordHash: partPass,
        name: "Alice Johnson",
        role: "Participant",
        createdAt: new Date().toISOString()
      },
      {
        id: "usr_part2",
        email: "bob@hackathon.edu",
        passwordHash: partPass,
        name: "Bob Smith",
        role: "Participant",
        createdAt: new Date().toISOString()
      }
    ];

    // 2. Hackathons
    const seededHackathons: HackathonEvent[] = [
      {
        id: "hk_global_ai",
        name: "Global AI & Web Innovation 2026",
        description: "A premium university-wide hackathon focusing on creating high-impact AI agents, web integrations, and decentralized software utilities designed for the real world.",
        startDate: "2026-07-10",
        endDate: "2026-07-15",
        active: true
      },
      {
        id: "hk_retro_games",
        name: "Retro Gaming Revival Hackathon",
        description: "Build visual retro canvas games using pure HTML5 Canvas and local state management with zero external server dependencies.",
        startDate: "2026-02-12",
        endDate: "2026-02-14",
        active: false
      }
    ];

    // 3. Teams
    const seededTeams: Team[] = [
      {
        id: "team_green_earth",
        name: "GreenEarth Developers",
        members: "Alice Johnson, Bob Smith, Sarah Connor",
        createdAt: new Date().toISOString()
      },
      {
        id: "team_neural_learn",
        name: "NeuralLearn Systems",
        members: "David Miller, Frank Wright",
        createdAt: new Date().toISOString()
      }
    ];

    // 4. Participants
    const seededParticipants: Participant[] = [
      {
        id: "part_alice",
        userId: "usr_part1",
        teamId: "team_green_earth",
        college: "Stanford University",
        bio: "AI researcher interested in carbon credit modeling and full-stack web architectures."
      },
      {
        id: "part_bob",
        userId: "usr_part2",
        teamId: "team_green_earth",
        college: "UC Berkeley",
        bio: "Frontend engineer with a passion for beautiful, high-contrast, fully responsive UI dashboards."
      }
    ];

    // 5. Projects
    const seededProjects: ProjectSubmission[] = [
      {
        id: "proj_ecosphere",
        projectName: "EcoSphere: Intelligent Carbon Offset Router",
        teamName: "GreenEarth Developers",
        teamMembers: "Alice Johnson, Bob Smith, Sarah Connor",
        description: "EcoSphere is an intelligent carbon offset routing application. It maps local manufacturing metrics directly to certified carbon credits using machine learning. It features deep analytics of shipping routes, allowing companies to trace and systematically minimize their scope 3 emissions.",
        problemStatement: "Scope 3 shipping emissions are notoriously hard to measure and compensate for. Current corporate offset systems are slow, manual, and prone to greenwashing due to lack of public transparency.",
        githubUrl: "https://github.com/google/google-api-nodejs-client",
        aiStudioUrl: "https://ai.studio/build",
        liveUrl: "https://ecosphere.example.com",
        demoVideoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
        presentationDocName: "ecosphere_slide_deck.pdf",
        presentationDocUrl: "https://example.com/ecosphere_slide_deck.pdf",
        hackathonId: "hk_global_ai",
        createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), // 36 hours ago
        status: "evaluated"
      },
      {
        id: "proj_neural_learn",
        projectName: "EduPulse: AI Personal Tutor",
        teamName: "NeuralLearn Systems",
        teamMembers: "David Miller, Frank Wright",
        description: "EduPulse delivers real-time personalized quiz tracks, custom interactive worksheets, and synthetic audio flashcards using speech-to-text feedback loops. It adapts curriculum difficulty on the fly based on student stress/latency responses.",
        problemStatement: "Standard classrooms suffer from a single-speed teaching curriculum, leaving advanced students bored and struggling students left behind.",
        githubUrl: "https://github.com/expressjs/express",
        aiStudioUrl: "https://ai.studio/build",
        liveUrl: "https://edupulse-tutor.example.com",
        demoVideoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
        presentationDocName: "edupulse_v1.pptx",
        presentationDocUrl: "https://example.com/edupulse_v1.pptx",
        hackathonId: "hk_global_ai",
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), // 12 hours ago
        status: "pending"
      }
    ];

    // 6. GitHub Analyses
    const seededGitHubAnalyses: GitHubAnalysis[] = [
      {
        id: "gh_ecosphere",
        projectId: "proj_ecosphere",
        stars: 3420,
        forks: 582,
        contributors: 84,
        commits: 1102,
        languages: {
          "TypeScript": 78.4,
          "CSS": 12.1,
          "HTML": 5.5,
          "JavaScript": 4.0
        },
        readmeContent: "# EcoSphere Intelligent Router\nThis project provides premium carbon routing engines. Build with React + Vite and Google Maps platform.",
        repoStructure: ["src/", "src/components/", "src/main.tsx", "package.json", "vite.config.ts", "README.md", ".env.example"],
        analyzedAt: new Date(Date.now() - 35 * 3600 * 1000).toISOString(),
        commitFrequency: "Avg 24 commits/month",
        branches: ["main", "dev", "feature/maps"],
        pullRequests: { open: 3, closed: 42, total: 45 },
        issues: { open: 5, closed: 58, total: 63 },
        githubActions: { hasActions: true, workflows: ["ci.yml", "deploy.yml"] },
        license: "MIT",
        hasGitignore: true,
        readmeQuality: {
          score: 88,
          hasSetupGuide: true,
          hasPrerequisites: true,
          hasArchitectureSection: false,
          missingSections: ["Architecture Details"]
        },
        repoHealthScore: 92,
        developerPracticeScore: 85,
        codeQualityObservations: [
          "Robust workspace structure with modern Vite configurations.",
          "Clear separation of UI components and static pages.",
          "Secure environment variables handled via detailed .env.example templates."
        ],
        isPrivate: false,
        isEmpty: false,
        hasReadme: true,
        errorState: null
      }
    ];

    // 7. AI Evaluations
    const seededAIEvaluations: AIEvaluation[] = [
      {
        id: "ai_ecosphere",
        projectId: "proj_ecosphere",
        ideaScore: 92,
        innovationScore: 88,
        codeQualityScore: 90,
        readmeScore: 85,
        uiScore: 94,
        aiUsageScore: 86,
        technicalScore: 91,
        overallScore: 90.1,
        feedback: "EcoSphere is a brilliantly realized prototype. The integration of spatial mapping with emissions analysis is robust. The code structure shows elegant separation of concerns, featuring clean React components and modular API structures. The UI is clean, utilizing consistent off-white card container motifs with high-contrast active indicators.",
        evaluatedAt: new Date(Date.now() - 34 * 3600 * 1000).toISOString()
      }
    ];

    // 8. Judge Reviews
    const seededJudgeReviews: JudgeReview[] = [];

    // 9. Comments
    const seededComments: Comment[] = [
      {
        id: "comm_1",
        projectId: "proj_ecosphere",
        userId: "usr_admin",
        userName: "Professor Angela Sterling",
        userRole: "Admin",
        content: "Outstanding submission GreenEarth Developers! Your implementation of spatial carbon calculations is remarkable. The structure is highly polished.",
        createdAt: new Date(Date.now() - 23 * 3600 * 1000).toISOString()
      },
      {
        id: "comm_2",
        projectId: "proj_ecosphere",
        userId: "usr_part1",
        userName: "Alice Johnson",
        userRole: "Participant",
        content: "Thank you Professor Sterling! We added responsive details to highlight the spatial calculations you mentioned.",
        createdAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString()
      }
    ];

    // Populate State
    this.state.users = seededUsers;
    this.state.hackathons = seededHackathons;
    this.state.teams = seededTeams;
    this.state.participants = seededParticipants;
    this.state.projects = seededProjects;
    this.state.githubAnalyses = seededGitHubAnalyses;
    this.state.aiEvaluations = seededAIEvaluations;
    this.state.judgeReviews = seededJudgeReviews;
    this.state.comments = seededComments;
  }

  // --- GETTERS ---
  getUsers() { return this.state.users; }
  getTeams() { return this.state.teams; }
  getParticipants() { return this.state.participants; }
  getHackathons() { return this.state.hackathons; }
  getProjects() { return this.state.projects; }
  getGitHubAnalyses() { return this.state.githubAnalyses; }
  getAIEvaluations() { return this.state.aiEvaluations; }
  getJudgeReviews() { return this.state.judgeReviews; }
  getComments() { return this.state.comments; }
  getCertificates() { return this.state.certificates; }
  getLiveAnalyses() { return this.state.liveAnalyses || []; }

  async saveLiveAnalysis(analysis: LiveAnalysisResult): Promise<LiveAnalysisResult> {
    if (!this.state.liveAnalyses) {
      this.state.liveAnalyses = [];
    }
    this.state.liveAnalyses.unshift(analysis);
    if (this.state.liveAnalyses.length > 50) {
      this.state.liveAnalyses = this.state.liveAnalyses.slice(0, 50);
    }
    this.save();
    await this.persistItem("liveAnalyses", (analysis as any).id || (analysis as any).url || "default", analysis);
    return analysis;
  }

  // --- CRUD METHODS ---

  // USERS
  async createUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
    const newUser: User = {
      ...user,
      id: "usr_" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    this.state.users.push(newUser);
    this.save();
    await this.persistItem("users", newUser.id, newUser);
    return newUser;
  }

  async updateUserRole(userId: string, role: UserRole): Promise<User | null> {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return null;
    user.role = role;
    this.save();
    await this.persistItem("users", user.id, user);
    return user;
  }

  // HACKATHONS
  async createHackathon(hk: Omit<HackathonEvent, "id">): Promise<HackathonEvent> {
    const newHk: HackathonEvent = {
      ...hk,
      id: "hk_" + Math.random().toString(36).substr(2, 9)
    };
    this.state.hackathons.push(newHk);
    this.save();
    await this.persistItem("hackathons", newHk.id, newHk);
    return newHk;
  }

  async updateHackathon(id: string, updates: Partial<HackathonEvent>): Promise<HackathonEvent | null> {
    const index = this.state.hackathons.findIndex(h => h.id === id);
    if (index === -1) return null;
    
    // If active is set to true, set all other hackathons active to false
    if (updates.active) {
      for (const h of this.state.hackathons) {
        if (h.id !== id && h.active) {
          h.active = false;
          await this.persistItem("hackathons", h.id, h);
        }
      }
    }

    const updated = { ...this.state.hackathons[index], ...updates };
    this.state.hackathons[index] = updated;
    this.save();
    await this.persistItem("hackathons", updated.id, updated);
    return updated;
  }

  // TEAMS
  async createTeam(team: Omit<Team, "id" | "createdAt">): Promise<Team> {
    const newTeam: Team = {
      ...team,
      id: "team_" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    this.state.teams.push(newTeam);
    this.save();
    await this.persistItem("teams", newTeam.id, newTeam);
    return newTeam;
  }

  // PARTICIPANTS
  async createParticipant(part: Omit<Participant, "id">): Promise<Participant> {
    const newPart: Participant = {
      ...part,
      id: "part_" + Math.random().toString(36).substr(2, 9)
    };
    this.state.participants.push(newPart);
    this.save();
    await this.persistItem("participants", newPart.id, newPart);
    return newPart;
  }

  // PROJECTS
  async createProject(proj: Omit<ProjectSubmission, "id" | "createdAt" | "status">): Promise<ProjectSubmission> {
    const newProj: ProjectSubmission = {
      ...proj,
      id: "proj_" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: "pending"
    };
    this.state.projects.push(newProj);
    this.save();
    await this.persistItem("projects", newProj.id, newProj);
    return newProj;
  }

  async updateProject(id: string, updates: Partial<ProjectSubmission>): Promise<ProjectSubmission | null> {
    const index = this.state.projects.findIndex(p => p.id === id);
    if (index === -1) return null;
    const updated = { ...this.state.projects[index], ...updates };
    this.state.projects[index] = updated;
    this.save();
    await this.persistItem("projects", updated.id, updated);
    return updated;
  }

  // GITHUB ANALYSIS
  async upsertGitHubAnalysis(analysis: Omit<GitHubAnalysis, "id" | "analyzedAt">): Promise<GitHubAnalysis> {
    const existingIndex = this.state.githubAnalyses.findIndex(g => g.projectId === analysis.projectId);
    const item: GitHubAnalysis = {
      ...analysis,
      id: existingIndex !== -1 ? this.state.githubAnalyses[existingIndex].id : "gh_" + Math.random().toString(36).substr(2, 9),
      analyzedAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      this.state.githubAnalyses[existingIndex] = item;
    } else {
      this.state.githubAnalyses.push(item);
    }
    this.save();
    await this.persistItem("githubAnalyses", item.id, item);
    return item;
  }

  // AI EVALUATIONS
  async upsertAIEvaluation(evalu: Omit<AIEvaluation, "id" | "evaluatedAt">): Promise<AIEvaluation> {
    const existingIndex = this.state.aiEvaluations.findIndex(e => e.projectId === evalu.projectId);
    const item: AIEvaluation = {
      ...evalu,
      id: existingIndex !== -1 ? this.state.aiEvaluations[existingIndex].id : "ai_" + Math.random().toString(36).substr(2, 9),
      evaluatedAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      this.state.aiEvaluations[existingIndex] = item;
    } else {
      this.state.aiEvaluations.push(item);
    }

    // Also mark project as evaluated
    const projIndex = this.state.projects.findIndex(p => p.id === evalu.projectId);
    if (projIndex !== -1) {
      this.state.projects[projIndex].status = "evaluated";
    }

    this.save();
    await this.persistItem("aiEvaluations", item.id, item);
    if (projIndex !== -1) {
      await this.persistItem("projects", this.state.projects[projIndex].id, this.state.projects[projIndex]);
    }
    return item;
  }

  // JUDGE REVIEWS
  async addJudgeReview(review: Omit<JudgeReview, "id" | "submittedAt">): Promise<JudgeReview> {
    const newReview: JudgeReview = {
      ...review,
      id: "jr_" + Math.random().toString(36).substr(2, 9),
      submittedAt: new Date().toISOString()
    };
    
    // Check if this judge already reviewed this project, if so, overwrite
    const existingIndex = this.state.judgeReviews.findIndex(r => r.projectId === review.projectId && r.judgeId === review.judgeId);
    if (existingIndex !== -1) {
      newReview.id = this.state.judgeReviews[existingIndex].id;
      this.state.judgeReviews[existingIndex] = newReview;
    } else {
      this.state.judgeReviews.push(newReview);
    }
    this.save();
    await this.persistItem("judgeReviews", newReview.id, newReview);
    return newReview;
  }

  // COMMENTS
  async addComment(comment: Omit<Comment, "id" | "createdAt">): Promise<Comment> {
    const newComment: Comment = {
      ...comment,
      id: "comm_" + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    this.state.comments.push(newComment);
    this.save();
    await this.persistItem("comments", newComment.id, newComment);
    return newComment;
  }

  // CERTIFICATES
  async issueCertificate(cert: Omit<Certificate, "id" | "issuedAt" | "certificateCode">): Promise<Certificate> {
    const certificateCode = "CERT-" + Math.floor(100000 + Math.random() * 900000);
    const newCert: Certificate = {
      ...cert,
      id: "cert_" + Math.random().toString(36).substr(2, 9),
      issuedAt: new Date().toISOString(),
      certificateCode
    };
    this.state.certificates.push(newCert);
    this.save();
    await this.persistItem("certificates", newCert.id, newCert);
    return newCert;
  }

  // DELETE OPERATIONS FOR ADMINISTRATIVE CONTROL
  async deleteHackathon(id: string): Promise<boolean> {
    const initialLength = this.state.hackathons.length;
    this.state.hackathons = this.state.hackathons.filter(h => h.id !== id);
    if (this.state.hackathons.length === initialLength) return false;

    // Cascade deletion of projects and all dependent models
    const projectsToDelete = this.state.projects.filter(p => p.hackathonId === id).map(p => p.id);
    this.state.projects = this.state.projects.filter(p => p.hackathonId !== id);
    
    const githubAnalysesToDelete = this.state.githubAnalyses.filter(g => projectsToDelete.includes(g.projectId));
    this.state.githubAnalyses = this.state.githubAnalyses.filter(g => !projectsToDelete.includes(g.projectId));
    
    const aiEvaluationsToDelete = this.state.aiEvaluations.filter(e => projectsToDelete.includes(e.projectId));
    this.state.aiEvaluations = this.state.aiEvaluations.filter(e => !projectsToDelete.includes(e.projectId));
    
    const judgeReviewsToDelete = this.state.judgeReviews.filter(r => projectsToDelete.includes(r.projectId));
    this.state.judgeReviews = this.state.judgeReviews.filter(r => !projectsToDelete.includes(r.projectId));
    
    const commentsToDelete = this.state.comments.filter(c => projectsToDelete.includes(c.projectId));
    this.state.comments = this.state.comments.filter(c => !projectsToDelete.includes(c.projectId));
    
    const certificatesToDelete = this.state.certificates.filter(c => projectsToDelete.includes(c.projectId));
    this.state.certificates = this.state.certificates.filter(c => !projectsToDelete.includes(c.projectId));

    this.save();

    await this.deleteItem("hackathons", id);
    for (const pId of projectsToDelete) {
      await this.deleteItem("projects", pId);
    }
    for (const g of githubAnalysesToDelete) {
      await this.deleteItem("githubAnalyses", g.id);
    }
    for (const e of aiEvaluationsToDelete) {
      await this.deleteItem("aiEvaluations", e.id);
    }
    for (const r of judgeReviewsToDelete) {
      await this.deleteItem("judgeReviews", r.id);
    }
    for (const c of commentsToDelete) {
      await this.deleteItem("comments", c.id);
    }
    for (const c of certificatesToDelete) {
      await this.deleteItem("certificates", c.id);
    }
    return true;
  }

  async deleteProject(id: string): Promise<boolean> {
    const initialLength = this.state.projects.length;
    this.state.projects = this.state.projects.filter(p => p.id !== id);
    if (this.state.projects.length === initialLength) return false;

    // Cascade deletion of all dependent project models
    const githubAnalysesToDelete = this.state.githubAnalyses.filter(g => g.projectId === id);
    this.state.githubAnalyses = this.state.githubAnalyses.filter(g => g.projectId !== id);
    
    const aiEvaluationsToDelete = this.state.aiEvaluations.filter(e => e.projectId === id);
    this.state.aiEvaluations = this.state.aiEvaluations.filter(e => e.projectId !== id);
    
    const judgeReviewsToDelete = this.state.judgeReviews.filter(r => r.projectId === id);
    this.state.judgeReviews = this.state.judgeReviews.filter(r => r.projectId !== id);
    
    const commentsToDelete = this.state.comments.filter(c => c.projectId === id);
    this.state.comments = this.state.comments.filter(c => c.projectId !== id);
    
    const certificatesToDelete = this.state.certificates.filter(c => c.projectId === id);
    this.state.certificates = this.state.certificates.filter(c => c.projectId !== id);

    this.save();

    await this.deleteItem("projects", id);
    for (const g of githubAnalysesToDelete) {
      await this.deleteItem("githubAnalyses", g.id);
    }
    for (const e of aiEvaluationsToDelete) {
      await this.deleteItem("aiEvaluations", e.id);
    }
    for (const r of judgeReviewsToDelete) {
      await this.deleteItem("judgeReviews", r.id);
    }
    for (const c of commentsToDelete) {
      await this.deleteItem("comments", c.id);
    }
    for (const c of certificatesToDelete) {
      await this.deleteItem("certificates", c.id);
    }
    return true;
  }

  async deleteCertificate(id: string): Promise<boolean> {
    const initialLength = this.state.certificates.length;
    this.state.certificates = this.state.certificates.filter(c => c.id !== id);
    if (this.state.certificates.length === initialLength) return false;
    this.save();
    await this.deleteItem("certificates", id);
    return true;
  }

  // LEADERBOARD CALCULATOR
  getLeaderboard(hackathonId?: string): LeaderboardRanking[] {
    let filteredProjects = this.state.projects;
    if (hackathonId) {
      filteredProjects = filteredProjects.filter(proj => proj.hackathonId === hackathonId);
    }

    return filteredProjects.map(proj => {
      // Find AI evaluation
      const aiEval = this.state.aiEvaluations.find(e => e.projectId === proj.id);
      const aiScore = aiEval ? aiEval.overallScore : null;
      
      // Find Organizer/Judge reviews
      const reviews = this.state.judgeReviews.filter(r => r.projectId === proj.id);
      let judgeAvg: number | null = null;
      if (reviews.length > 0) {
        const sum = reviews.reduce((acc, r) => acc + r.overallScore, 0);
        judgeAvg = Number((sum / reviews.length).toFixed(1));
      }

      // Calculate combined score (40% AI, 60% Organizer if both exist)
      let combined = 0;
      if (aiScore !== null && judgeAvg !== null) {
        combined = Number((aiScore * 0.4 + judgeAvg * 0.6).toFixed(1));
      } else if (aiScore !== null) {
        combined = aiScore;
      } else if (judgeAvg !== null) {
        combined = judgeAvg;
      }

      return {
        projectId: proj.id,
        projectName: proj.projectName,
        teamName: proj.teamName,
        aiOverallScore: aiScore,
        judgeAverageScore: judgeAvg,
        combinedScore: combined,
        rank: 0 // Will be set after sorting
      };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
  }
}

export const db = new LocalDB();
export default db;
