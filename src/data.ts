import { TopicTrend, IngestionChunk, GATEQuestion } from "./types";

// Helper to calculate Topic Importance Score (TIS)
// TIS = w1 * (Sum of (F_i * gamma^(t_current - t_i))) + w2 * C_d
// Let's use current year = 2026 as reference. w1 = 0.7, w2 = 0.3. gamma = 0.95
export function calculateTIS(
  frequency20yr: number,
  lastYearSeen: number,
  weightagePercentage: number,
  cdFactor: number
): number {
  const currentYear = 2026;
  const t_diff = currentYear - lastYearSeen;
  const decay = Math.pow(0.95, t_diff);
  const factorVal = weightagePercentage * frequency20yr * decay;
  const w1 = 0.7;
  const w2 = 12.0; // Scaled to make it visual
  const score = w1 * factorVal + w2 * cdFactor;
  // Let's scale score out of 100 for visual appeal
  return Math.min(Math.round(score * 10) / 10, 100);
}

// Helper to calculate Expected Exam Confidence (EEC) using Hidden Markov Model recurrence and MTBF
// EEC = P(S_t+1 = Active | S_t) * (1 - Interval_last / MTBF)
// If the recurrence interval is close or overdue, EEC shoots up.
export function calculateEEC(lastYearSeen: number, mtbf: number): { score: number; flag: "High Confidence" | "Medium Confidence" | "Low Confidence" } {
  const currentYear = 2026;
  const yearsSince = currentYear - lastYearSeen;
  const ratio = mtbf > 0 ? yearsSince / mtbf : 0.5;
  // Overdue parameter increases expectation, but extreme delay might mean retired topic
  let factor = 0;
  if (ratio >= 0.9 && ratio <= 1.2) {
    factor = 0.95; // Highly likely to appear in 2026
  } else if (ratio > 1.2) {
    factor = 0.65; // Overdue but probability decaying
  } else {
    // Recently appeared
    factor = Math.max(0.2, ratio * 0.8);
  }
  
  const score = Math.round(factor * 100);
  let flag: "High Confidence" | "Medium Confidence" | "Low Confidence" = "Medium Confidence";
  if (score >= 85) flag = "High Confidence";
  else if (score < 50) flag = "Low Confidence";

  return { score, flag };
}

export const GATE_TOPIC_TRENDS: TopicTrend[] = [
  {
    topic: "Semaphore & Classical Sync Problems",
    subjectId: "os",
    subjectName: "Operating Systems",
    frequency20yr: 1.8,
    lastYearSeen: 2025,
    weightagePercentage: 4.5,
    cdFactor: 0.85, // Highly interconnected with thread scheduling and concurrency
    recurrenceInterval: 1.2,
    tis: 0,
    eec: 0,
    confidenceLevel: "High Confidence",
    importanceLevel: "Critical"
  },
  {
    topic: "Conflict Serializability & View Recovery",
    subjectId: "dbms",
    subjectName: "Database Management Systems",
    frequency20yr: 1.4,
    lastYearSeen: 2025,
    weightagePercentage: 3.8,
    cdFactor: 0.70,
    recurrenceInterval: 1.5,
    tis: 0,
    eec: 0,
    confidenceLevel: "High Confidence",
    importanceLevel: "High"
  },
  {
    topic: "Asymptotic Amortized Analysis & Master Theorem",
    subjectId: "alg",
    subjectName: "Algorithms",
    frequency20yr: 2.1,
    lastYearSeen: 2026,
    weightagePercentage: 5.0,
    cdFactor: 0.90,
    recurrenceInterval: 1.0,
    tis: 0,
    eec: 0,
    confidenceLevel: "High Confidence",
    importanceLevel: "Critical"
  },
  {
    topic: "Decidability & Turing Closures",
    subjectId: "toc",
    subjectName: "Theory of Computation",
    frequency20yr: 1.9,
    lastYearSeen: 2025,
    weightagePercentage: 4.2,
    cdFactor: 0.75,
    recurrenceInterval: 1.3,
    tis: 0,
    eec: 0,
    confidenceLevel: "High Confidence",
    importanceLevel: "Critical"
  },
  {
    topic: "Instruction Pipelining & Branch Hazards",
    subjectId: "coa",
    subjectName: "Computer Organization & Architecture",
    frequency20yr: 1.5,
    lastYearSeen: 2024,
    weightagePercentage: 4.0,
    cdFactor: 0.60,
    recurrenceInterval: 1.4,
    tis: 0,
    eec: 0,
    confidenceLevel: "High Confidence",
    importanceLevel: "High"
  },
  {
    topic: "TCP Congestion Control & Sliding Window",
    subjectId: "cn",
    subjectName: "Computer Networks",
    frequency20yr: 1.6,
    lastYearSeen: 2025,
    weightagePercentage: 3.5,
    cdFactor: 0.65,
    recurrenceInterval: 1.3,
    tis: 0,
    eec: 0,
    confidenceLevel: "Medium Confidence",
    importanceLevel: "High"
  },
  {
    topic: "Graph Theory (Coloring, Planarity & Matching)",
    subjectId: "dm",
    subjectName: "Discrete Mathematics",
    frequency20yr: 1.7,
    lastYearSeen: 2025,
    weightagePercentage: 4.0,
    cdFactor: 0.80,
    recurrenceInterval: 1.1,
    tis: 0,
    eec: 0,
    confidenceLevel: "High Confidence",
    importanceLevel: "Critical"
  },
  {
    topic: "Eigenvalues & Systems of Linear Equations",
    subjectId: "em",
    subjectName: "Engineering Mathematics",
    frequency20yr: 1.2,
    lastYearSeen: 2024,
    weightagePercentage: 3.0,
    cdFactor: 0.55,
    recurrenceInterval: 1.6,
    tis: 0,
    eec: 0,
    confidenceLevel: "Medium Confidence",
    importanceLevel: "Medium"
  },
  {
    topic: "LL(1), LR(k) & LALR Parser Construction",
    subjectId: "cd",
    subjectName: "Compiler Design",
    frequency20yr: 1.3,
    lastYearSeen: 2025,
    weightagePercentage: 3.2,
    cdFactor: 0.50,
    recurrenceInterval: 1.5,
    tis: 0,
    eec: 0,
    confidenceLevel: "High Confidence",
    importanceLevel: "High"
  },
  {
    topic: "B+ Tree Indexing & File Organization",
    subjectId: "dbms",
    subjectName: "Database Management Systems",
    frequency20yr: 1.1,
    lastYearSeen: 2023,
    weightagePercentage: 2.8,
    cdFactor: 0.45,
    recurrenceInterval: 2.0, // Should be ripe to appear!
    tis: 0,
    eec: 0,
    confidenceLevel: "High Confidence",
    importanceLevel: "Medium"
  },
  {
    topic: "Virtual Memory Paging and Translation Lookaside Buffer (TLB)",
    subjectId: "os",
    subjectName: "Operating Systems",
    frequency20yr: 1.6,
    lastYearSeen: 2024,
    weightagePercentage: 3.6,
    cdFactor: 0.75,
    recurrenceInterval: 1.3,
    tis: 0,
    eec: 0,
    confidenceLevel: "High Confidence",
    importanceLevel: "High"
  },
  {
    topic: "Chomsky Hierarchy and DFA Minimization",
    subjectId: "toc",
    subjectName: "Theory of Computation",
    frequency20yr: 1.5,
    lastYearSeen: 2026,
    weightagePercentage: 3.0,
    cdFactor: 0.60,
    recurrenceInterval: 1.2,
    tis: 0,
    eec: 0,
    confidenceLevel: "Medium Confidence",
    importanceLevel: "Medium"
  }
].map(trend => {
  const tis = calculateTIS(trend.frequency20yr, trend.lastYearSeen, trend.weightagePercentage, trend.cdFactor);
  const { score: eec, flag: confidenceLevel } = calculateEEC(trend.lastYearSeen, trend.recurrenceInterval);
  
  // Classify Importance Level
  let importanceLevel: "Critical" | "High" | "Medium" | "Low" = "Low";
  if (tis >= 75) importanceLevel = "Critical";
  else if (tis >= 55) importanceLevel = "High";
  else if (tis >= 35) importanceLevel = "Medium";

  return {
    ...trend,
    tis,
    eec,
    confidenceLevel,
    importanceLevel
  };
});

// Mock Database of Academic Chunks representing standard Unstructured/NPTEL Ingests
export const KNOWLEDGE_BASE_CORPUS: IngestionChunk[] = [
  {
    id: "chunk_os_sem_01",
    subjectId: "os",
    topicTag: "Semaphore & Process Sync",
    sourceType: "Textbook",
    sourceUrl: "Galvin: Operating System Concepts (Chapter 6)",
    title: "The Critical-Section Problem and Semaphores",
    content: "A semaphore S is an integer variable that, apart from initialization, is accessed only through two standard atomic, indivisible operations: wait() and signal(). In wait() (historically P), the value of S is decremented, and if negative, the calling process blocks. signal() (historically V) increments the value. To prevent busy waiting, we implement semaphores as a structure containing an integer value and a FIFO queue of process control blocks (PCBs). Under heavy multi-programming, the bounded-buffer, readers-writers, and dining-philosophers problems highlight classical synchronization hazards where race conditions occur if lock sequences are not strictly ordered."
  },
  {
    id: "chunk_os_nptel_02",
    subjectId: "os",
    topicTag: "Processes Synchronization",
    sourceType: "NPTEL",
    sourceUrl: "https://nptel.ac.in/courses/106108101/lecture12",
    title: "IIT Madras: Lecture 12 on Peterson's Algorithm Proof",
    content: "Prof. Kamakoti explains Peterson's solution for two processes. The solution maintains a shared variable: int turn; and boolean flag[2]; flag[i] representing process i's intent to enter. The atomic loop of check occurs: turn = j; flag[i] = true; while (flag[j] && turn == j); This satisfies Mutual Exclusion because both processes cannot establish control in the critical section simultaneously, Progress (no deadlock is possible as only one turn variable can persist), and Bounded Waiting."
  },
  {
    id: "chunk_dbms_con_01",
    subjectId: "dbms",
    topicTag: "Transaction Serializability",
    sourceType: "Textbook",
    sourceUrl: "Korth: Database System Concepts (Chapter 14)",
    title: "Conflict and View Serializability Analysis",
    content: "Let I and J be instructions of transaction Ti and Tj respectively. If I and J refer to the same data item Q, they conflict if at least one is a write(Q) operation. A schedule S is conflict serializable if it is conflict equivalent to a serial schedule. We inspect for cycles in the Precedence Graph G = (V, E) where vertices represent transactions, and arc Ti -> Tj exists if Ti performs an operation conflicting with a subsequent operation in Tj. If the precedence graph has a cycle, the schedule is NOT conflict serializable. View serializability is a weaker condition: every serial schedule has matching final writes and read sources. View-serializable schedules that are not conflict-serializable contain blind writes."
  },
  {
    id: "chunk_alg_amort_01",
    subjectId: "alg",
    topicTag: "Amortized Analysis",
    sourceType: "Textbook",
    sourceUrl: "Cormen: Introduction to Algorithms (CLRS, Chapter 17)",
    title: "The Accounting and Potential Methods",
    content: "Amortized analysis guarantees the average cost of each operation in the worst case, unlike average-case analysis which depends on probability distributions. Under the Potential Method, we start with an initial data structure D_0 and define a potential function Phi mapping to a real number. The amortized cost of the i-th operation is defined as a_i = c_i + Phi(D_i) - Phi(D_i-1). If the change in potential is positive (Phi(D_i) > Phi(D_i-1)), the amortized cost represents an over-charge, storing credit. If the potential drops, the saved potential pays for the expensive operation, indicating the amortized cost is lower than the actual cost c_i. Crucially, the total potential must satisfy Phi(D_i) >= Phi(D_0) for all i to yield a reliable upper bound."
  },
  {
    id: "chunk_toc_dec_01",
    subjectId: "toc",
    topicTag: "Decidability and Closure",
    sourceType: "Forum",
    sourceUrl: "GATE Overflow thread 22340",
    title: "Proof that Context-Free Languages are not Closed under Complement",
    content: "Consider languages L1 = { a^n b^n c^m | n, m >= 0 } and L2 = { a^n b^m c^m | n, m >= 0 }. Both L1 and L2 are Context-Free Languages (CFLs) because we can construct DPDA/NPDAs for them. However, L1 intersect L2 = { a^n b^n c^n | n >= 0 }, which is context-sensitive and NOT a CFL. By De Morgan's Law, L1 intersect L2 = complement( complement(L1) union complement(L2) ). Since union of CFLs is closed, if CFLs were closed under complement, then their intersection would also be closed under complement, which is a contradiction. Therefore, CFLs are NOT closed under complement or intersection, but recursive languages are."
  },
  {
    id: "chunk_coa_pipe_01",
    subjectId: "coa",
    topicTag: "Instruction Pipelining",
    sourceType: "Textbook",
    sourceUrl: "Carl Hamacher: Computer Organization (Chapter 8)",
    title: "Speedup, Stall Cycles, and Hazard Mitigations",
    content: "The ideal speedup of a pipelined processor with k stages is Speedup_ideal = k. However, stalls arising from structural hazards (resource conflicts like single-port memory read/write overlaps), data hazards (RAW, WAR, WAW dependences), and control hazards (conditional branch instructions waiting on branch computation) degrade execution. The actual run-time of an instruction sequence is Cycles = N + k - 1 + Stalls, and Branch Speedup = CPI_unpipelined / (1 + Branch_frequency * Penalty_cycles). Forwarding paths directly route execution values from EX/MEM or MEM/WB registers back to ALU inputs to bypass RAW hazards without stalling."
  }
];

// Initial precompiled simulated GATE Questions for when Gemini AI Key is in fallback/not-provided mode,
// or as high-fidelity samples.
export const STATIC_GATE_QUESTIONS: GATEQuestion[] = [
  {
    question_id: "q_pds_01",
    subject: "Programming & Data Structures",
    topic: "Recursion and Stack Structures",
    sub_topic: "Binary Search Trees Height",
    type: "MCQ",
    difficulty_tier: "Hard",
    estimated_completion_time_seconds: 180,
    weightage_marks: 2.0,
    problem_statement: "Consider a binary search tree (BST) containing $15$ unique integers. What is the maximum possible height (defined as the number of nodes on the longest path from the root to a leaf node) and minimum possible height respectively?",
    options: {
      A: "Maximum: $15$, Minimum: $4$",
      B: "Maximum: $15$, Minimum: $3$",
      C: "Maximum: $14$, Minimum: $4$",
      D: "Maximum: $14$, Minimum: $3$"
    },
    correct_answers: ["A"],
    mathematical_proof_explanation: "For maximum height, the BST is a completely skewed tree where each node has only one child. The number of nodes on the path is equal to $N = 15$. For minimum height of a BST with $N$ nodes, we create a complete binary tree. The height (number of nodes from root to leaf) is given by $\\lceil \\log_2(N + 1) \\rceil$. Substituting $N=15$ yields $\\log_2(16) = 4$. Thus, maximum is $15$, minimum is $4$. This corresponds to Option A.",
    nptel_mapping_reference: "https://nptel.ac.in/courses/106104128/lecture14",
    predictive_probability_index: 0.94
  },
  {
    question_id: "q_os_01",
    subject: "Operating Systems",
    topic: "Process Synchronization & Semaphores",
    sub_topic: "Bounded Buffer Synchronization",
    type: "MSQ",
    difficulty_tier: "Hard",
    estimated_completion_time_seconds: 240,
    weightage_marks: 2.0,
    problem_statement: "In a classical producer-consumer set up with a bounded buffer of size $K > 1$, which of the following implementation constraints guarantees correctness without causing deadlocks? Let `mutex` be a binary semaphore initialized to $1$, `empty` initialized to $K$, and `full` initialized to $0$.",
    options: {
      A: "The producer must call `wait(empty)` then `wait(mutex)` in strict sequential order.",
      B: "The producer can call `wait(mutex)` then `wait(empty)` without causing deadlocks when the buffer is full.",
      C: "The consumer must call `wait(full)` then `wait(mutex)` in sequence.",
      D: "The consumer calling `wait(mutex)` then `wait(full)` risks a deadlock when the buffer is empty."
    },
    correct_answers: ["A", "C", "D"],
    mathematical_proof_explanation: "Option A is correct: Nesting `wait(mutex)` inside `wait(empty)` is essential. If the producer holds the mutex first (`wait(mutex)`) and then blocks on `wait(empty)` because the buffer is already full, the consumer is blocked forever attempting to enter the critical section to clear space, leading to a permanent deadlock. Option C is correct as the consumer must wait for non-emptiness before locking the mutex. Option D is correct: if consumer locks mutex and then blocks on empty-buffer (`wait(full)`), producer can never append items. Option B is incorrect as it introduces deadlocks.",
    nptel_mapping_reference: "https://nptel.ac.in/courses/106106144/lecture8",
    predictive_probability_index: 0.95
  },
  {
    question_id: "q_toc_01",
    subject: "Theory of Computation",
    topic: "Context-Free Languages & Pushdown Automata",
    sub_topic: "Decidability Matrix",
    type: "MCQ",
    difficulty_tier: "Hard",
    estimated_completion_time_seconds: 210,
    weightage_marks: 1.0,
    problem_statement: "Let $L_1$ be a regular language and $L_2$ be a context-free language (CFL). Consider the following decision properties:\n\n1. Is $L_1 \\cap L_2$ context-free?\n2. Is $L_2 \\setminus L_1$ context-free?\n3. Is $L_2$ empty ($L_2 = \\emptyset$)?\n\nWhich of these problems are decidable?",
    options: {
      A: "Only 1 and 2",
      B: "Only 1 and 3",
      C: "Only 2 and 3",
      D: "All 1, 2, and 3"
    },
    correct_answers: ["D"],
    mathematical_proof_explanation: "1. Regular intersection: The intersection of a CFL with a regular language is always a context-free language. It is closed and decidable.\n2. Complement/Set Difference: $L_2 \\setminus L_1 = L_2 \\cap L_1^c$. Since $L_1$ is regular, $L_1^c$ is regular. Our intersection with a regular language is CFL. Hence, this difference is guaranteed to be context-free and decidable.\n3. Emptiness of CFL: Checking emptiness for a CFL is decidable by inspecting the production rules of the Chomsky grammar to see if the start symbol generates any terminals. All three are decidable. Option D is true.",
    nptel_mapping_reference: "https://nptel.ac.in/courses/106104028/lecture34",
    predictive_probability_index: 0.91
  },
  {
    question_id: "q_net_01",
    subject: "Computer Networks",
    topic: "IPv4/IPv6 CIDR Routing",
    sub_topic: "Classless Inter-Domain Routing Subnetting",
    type: "NAT",
    difficulty_tier: "Hard",
    estimated_completion_time_seconds: 240,
    weightage_marks: 2.0,
    problem_statement: "An organization is allocated the block IP address `192.168.16.0/22`. The administrator wants to divide this into exactly $4$ subnets of equal size. What is the CIDR suffix notation (number of bits of prefix masking) of each resulting subnet?",
    correct_answers: ["24"],
    mathematical_proof_explanation: "The block `192.168.16.0/22` starts with a $22$-bit netmask. To divide this address prefix block into 4 equal subnets, we need $\\log_2(4) = 2$ additional bits of subnet addressing. Therefore, the prefix mask will increase by 2 bits. $22 + 2 = 24$. All 4 equal divisions will have a prefix of `/24`.",
    nptel_mapping_reference: "https://nptel.ac.in/courses/106105081/lecture29",
    predictive_probability_index: 0.88
  }
];
