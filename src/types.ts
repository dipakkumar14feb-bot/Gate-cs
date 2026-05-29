/**
 * GATE CSE Smart Prep Platform - Structural Types & Formulations
 * Aligned with IIT CS Master Curriculum & GATE CSE Syllabus
 */

export enum SubjectDomain {
  MATH = "Mathematical Foundations",
  SYSTEMS = "Core Systems",
  SOFTWARE = "Software & Data",
  THEORY = "Theoretical Computer Science",
  APTITUDE = "General Aptitude"
}

export interface SubjectModule {
  id: string;
  name: string;
  domain: SubjectDomain;
  professorName: string;
  professorTitle: string;
  professorAvatar: string;
  topics: string[];
}

export interface TopicTrend {
  topic: string;
  subjectId: string;
  subjectName: string;
  frequency20yr: number; // average times it appears
  lastYearSeen: number;
  weightagePercentage: number; // raw marks weightage
  cdFactor: number; // cross-disciplinary density factor (0.0 to 1.0)
  tis: number; // Topic Importance Score (calculated)
  eec: number; // Expected Exam Confidence (calculated)
  confidenceLevel: "High Confidence" | "Medium Confidence" | "Low Confidence";
  importanceLevel: "Critical" | "High" | "Medium" | "Low";
  recurrenceInterval: number; // MTBF (Mean Time Between appearances in years)
}

export interface IngestionChunk {
  id: string;
  subjectId: string;
  topicTag: string;
  sourceType: "NPTEL" | "PYQ" | "Textbook" | "Forum";
  sourceUrl: string;
  title: string;
  content: string;
  timestamp?: string; // For NPTEL video segments
}

export type QuestionType = "MCQ" | "MSQ" | "NAT";

export interface GATEQuestion {
  question_id: string;
  subject: string;
  topic: string;
  sub_topic: string;
  type: QuestionType;
  difficulty_tier: "Easy" | "Medium" | "Hard";
  estimated_completion_time_seconds: number;
  weightage_marks: 1.0 | 2.0;
  problem_statement: string; // Markdown text (LaTeX inside)
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answers: string[]; // Options for MCQ/MSQ (e.g. ["A", "D"]) or numeric array/range for NAT (e.g. ["42"] or ["2.5"])
  mathematical_proof_explanation: string; // Markdown explanation with LaTeX
  nptel_mapping_reference: string;
  predictive_probability_index: number;
}

export interface UserTestState {
  questions: GATEQuestion[];
  userAnswers: { [questionId: string]: string[] }; // MSQ can have multiple answers, MCQ single index, NAT string text input
  isSubmitted: boolean;
  score: number;
  timeSpentSeconds: number;
  latentAbilityTheta: number; // IRT parameter
  estimatedAIRBracket: string;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "professor";
  text: string;
  timestamp: string;
  professorId: string;
}

// 12 Core Academic Subject Matter Expert Professors (IIT Faculty Roles)
export const CORE_SUBJECTS: SubjectModule[] = [
  {
    id: "dm",
    name: "Discrete Mathematics",
    domain: SubjectDomain.MATH,
    professorName: "Prof. S. Ramanujan Acharya",
    professorTitle: "IIT Madras, Chair of Discrete Mathematics & Graph Theory",
    professorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    topics: ["Propositional Logic", "Sets, Relations & Functions", "Graph Theory (Coloring, Matching)", "Combinatorics", "Group Theory"]
  },
  {
    id: "em",
    name: "Engineering Mathematics",
    domain: SubjectDomain.MATH,
    professorName: "Prof. Devika Bandopadhyay",
    professorTitle: "IIT Kharagpur, Professor of Applied Algebra & Calculus",
    professorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    topics: ["Linear Algebra (Eigenvalues, Systems)", "Calculus (Limits, Integration)", "Probability (Bayes Theorem, Distributions)", "Linear Programming"]
  },
  {
    id: "os",
    name: "Operating Systems",
    domain: SubjectDomain.SYSTEMS,
    professorName: "Prof. Arvind Varma",
    professorTitle: "IIT Bombay, Distinguished Faculty in Kernel Design & Virtualization",
    professorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    topics: ["Process Synchronization & Semaphores", "CPU Scheduling (RTOS & Fair)", "Memory Management & Paging", "File Systems & Disk Allocation", "Deadlocks"]
  },
  {
    id: "coa",
    name: "Computer Organization & Architecture",
    domain: SubjectDomain.SYSTEMS,
    professorName: "Prof. Homi J. Bhabha-Iyer",
    professorTitle: "IIT Madras, Chief Architect of High-Performance Processors",
    professorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    topics: ["Instruction Pipelining & Hazards", "Cache Coherence & Memory Hierarchy", "Floating-Point Representation (IEEE-754)", "I/O Interface & DMA"]
  },
  {
    id: "cn",
    name: "Computer Networks",
    domain: SubjectDomain.SYSTEMS,
    professorName: "Prof. Pritha Chakraborty",
    professorTitle: "IIT Roorkee, Leader in Wireless Networks & Protocol Engineering",
    professorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    topics: ["TCP Congestion Control & Sliding Window", "IPv4/IPv6 CIDR Routing", "Routing Protocols (OSPF, BGP)", "Cryptography & Network Security", "MAC Sublayer Protocols"]
  },
  {
    id: "pds",
    name: "Programming & Data Structures",
    domain: SubjectDomain.SOFTWARE,
    professorName: "Prof. Vikram Sarabhai-Sen",
    professorTitle: "IIT Kanpur, Professor of Algorithmic Architectures",
    professorAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    topics: ["Recursion and Stack Structures", "Trees & Binary Search Trees", "Heaps and Graph Representations", "Pointers & Dynamic Memory"]
  },
  {
    id: "alg",
    name: "Algorithms",
    domain: SubjectDomain.SOFTWARE,
    professorName: "Prof. Sandip Sen-Gupta",
    professorTitle: "IIT Delhi, ACM Fellow in Approximation & Randomized Algorithms",
    professorAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    topics: ["Asymptotic Complexity & Amortized Analysis", "Divide and Conquer (Master Theorem)", "Greedy and Dynamic Programming", "Shortest Paths (Dijkstra, Floyd-Warshall)", "NP-Completeness (Reduction)"]
  },
  {
    id: "dbms",
    name: "Database Management Systems",
    domain: SubjectDomain.SOFTWARE,
    professorName: "Prof. Rajeshwari Murthy",
    professorTitle: "IIT Bombay, Lead Researcher of Concurrent Storage Engines",
    professorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    topics: ["Relational Algebra & Calculus", "SQL and Key Constraints", "Normalization & Normal Forms (3NF, BCNF)", "Conflict and View Serializability", "Concurrency Control & Indexing (B+ Trees)"]
  },
  {
    id: "toc",
    name: "Theory of Computation",
    domain: SubjectDomain.THEORY,
    professorName: "Prof. Kanika Ghoshal",
    professorTitle: "IIT IISc Bangalore, Chair of Automata Theory & Complexity Classes",
    professorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
    topics: ["Regular Languages & DFA Minimization", "Context-Free Languages & Pushdown Automata", "Turing Machines & Decidability (Halting)", "Chomsky Hierarchy & Closure Properties"]
  },
  {
    id: "cd",
    name: "Compiler Design",
    domain: SubjectDomain.THEORY,
    professorName: "Prof. Swarnendu Goswamy",
    professorTitle: "IIT Guwahati, Specialist in Code Optimization & Parsers",
    professorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    topics: ["Lexical Analysis & Tokenization", "LL(1), LR(1), LALR Parsers", "Syntax Directed Translation (SDD/SDT)", "Intermediate Code Generation (DAG)", "Code Optimization & Register Allocation"]
  },
  {
    id: "ga",
    name: "General Aptitude",
    domain: SubjectDomain.APTITUDE,
    professorName: "Prof. Amit Verma",
    professorTitle: "IIT Delhi, Chair of Cognitive and Logical Reasoning",
    professorAvatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=150",
    topics: ["Quantitative Aptitude (Ratio, Progressions)", "Analytical Reasoning (Logical puzzles)", "Spatial Aptitude (Rotation, Paper Folding)", "Verbal Ability (Grammar, Contextual Fillers)"]
  }
];
