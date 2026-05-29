import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { CORE_SUBJECTS, GATEQuestion, QuestionType } from "./src/types";
import { STATIC_GATE_QUESTIONS, KNOWLEDGE_BASE_CORPUS } from "./src/data";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization helper for Gemini SDK to prevent server crash if key is undefined
let geminiClient: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY || "";

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && API_KEY) {
    try {
      geminiClient = new GoogleGenAI({
        apiKey: API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Successfully initialized GoogleGenAI client with server security structures");
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI client:", e);
    }
  }
  return geminiClient;
}

// REST Api Endpoints

// Server API health monitor
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    ai_enabled: !!API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// SME Agent Orchestrator Chat Endpoint
// Direct dialogue with matching professor profile
app.post("/api/chat", async (req: Request, res: Response) => {
  const { query, subjectId, history } = req.body;
  
  const currentSubject = CORE_SUBJECTS.find(sub => sub.id === subjectId) || CORE_SUBJECTS[0];
  const professorName = currentSubject.professorName;
  const professorTitle = currentSubject.professorTitle;
  
  const systemInstruction = `You are ${professorName}, holding the prestigious chair: ${professorTitle}.
You are an eminent computer science researcher and professor at an IIT (Indian Institute of Technology).
You advise GATE CSE candidates with strict mathematical rigor, outstanding pedagogy, and deep domain experience.

Guidelines:
1. When answering, dive straight into the technical details and academic principles. Show mathematical derivations, state assumptions, and use standard LaTeX notation surrounded by '$' and '$$' delimiters where applicable.
2. Maintain your esteemed IIT character. Be authoritative, academic, helpful, and highly analytical. Mention common misconceptions and pitfalls typical of GATE exams.
3. Keep your explanation structured using clean markdown, equations, and code blocks where necessary.
4. Try to write a short illustrative numerical example or mathematical proof if a concept is theoretical.`;

  const ai = getGeminiClient();

  if (!ai) {
    // Graceful fallback simulation
    console.log(`[Simulation Mode] Chat query for ${professorName} in ${currentSubject.name}: "${query}"`);
    setTimeout(() => {
      res.json({
        text: `### Response from ${professorName} (IIT-Faculty Core Agent Sim)

Thank you for your inquiry regarding **${currentSubject.name}**. Since the live Gemini API is simulated, I am utilizing my local analytical models to answer your question.

You asked: *"${query}"*

In **GATE CSE**, this area requires a robust mastery of underlying formulations. Specifically, note the following critical insights:

1. **Rigorous Proof Mapping**: Standard results assume strict edge properties. For instance, in relation to closure properties, ensure you verify empty and infinite string boundary conditions.
2. **Typical Gate Pitfalls**: Many students mistake context-free constraints for recursive structures because they bypass parsing trees. Ensure you double-check deterministic versus non-deterministic equivalence limits.
3. **Formal Verification Math**:
   $$L(M) = \\{ w \\in \\Sigma^* \\mid q_0 w \\vdash^* q_f \\}$$
   In the next section, construct a deterministic boundary matrix.

Let me know if you would like to solve a curated GATE numerical sample on this topic!`,
        simulated: true,
      });
    }, 700);
    return;
  }

  try {
    const formattedMessages = (history || []).map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));
    
    // Add the current user query
    formattedMessages.push({
      role: "user",
      parts: [{ text: query }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedMessages,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({
      text: response.text || "I was unable to formulate a response.",
      simulated: false,
    });
  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    res.status(500).json({
      error: error.message || "An error occurred with the AI professor agent orchestration layer",
    });
  }
});

// Dynamic AI Question synthesis
app.post("/api/generate-question", async (req: Request, res: Response) => {
  const { subjectName, topicName, difficultyTier, type } = req.body;

  const targetDifficulty = difficultyTier || "Hard";
  const targetType = type || "MCQ";
  const ai = getGeminiClient();

  if (!ai) {
    // Select from our high-fidelity precompiled bank
    const filtered = STATIC_GATE_QUESTIONS.filter(q => 
      (!subjectName || q.subject.toLowerCase().includes(subjectName.toLowerCase())) &&
      (!type || q.type === type)
    );
    const selected = filtered.length > 0 
      ? filtered[Math.floor(Math.random() * filtered.length)]
      : STATIC_GATE_QUESTIONS[Math.floor(Math.random() * STATIC_GATE_QUESTIONS.length)];

    res.json({
      question: selected,
      simulated: true,
    });
    return;
  }

  try {
    const prompt = `Generate exactly ONE highly challenging, original GATE CSE exam question.
Topic requirements:
- Subject: ${subjectName || "Theory of Computation"}
- Topic/Theme: ${topicName || "Context-Free Languages"}
- Format Type: ${targetType} (Must be MCQ, MSQ, or NAT)
- Difficulty Level: ${targetDifficulty}

Rigorous constraints:
1. Maintain strict academic vocabulary of IIT-level exam sheets. No easy/trivial questions.
2. Format must match GATE parameters:
   - MCQ: exactly 4 options (A, B, C, D) with exactly 1 correct option.
   - MSQ: exactly 4 options (A, B, C, D) with 2, 3, or 4 correct options.
   - NAT: No options, correct_answers is a numeric array or string specifying the exact integer or range.
3. Use premium mathematical notation in LaTeX inside problem statements and proofs, enclosed in '$' or '$$' (e.g. $O(n \\log n)$, $L_1 \\cap L_2$).
4. Return pure JSON matching this TypeScript type:
{
  "question_id": string,
  "subject": string,
  "topic": string,
  "sub_topic": string,
  "type": "MCQ" | "MSQ" | "NAT",
  "difficulty_tier": "Easy" | "Medium" | "Hard",
  "estimated_completion_time_seconds": number,
  "weightage_marks": 1.0 | 2.0,
  "problem_statement": string,
  "options": {
    "A": string,
    "B": string,
    "C": string,
    "D": string
  } [Mandatory for MCQ/MSQ, omit for NAT],
  "correct_answers": string[], [Options indices (e.g. ["A", "C"]) for MCQ/MSQ, or a single numerical string (e.g. ["25"] or ["0.4"]) for NAT],
  "mathematical_proof_explanation": string,
  "nptel_mapping_reference": string,
  "predictive_probability_index": number
}

Ensure the output is valid JSON. Return ONLY the raw JSON block without markdown wrappers like \`\`\`json.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question_id: { type: Type.STRING },
            subject: { type: Type.STRING },
            topic: { type: Type.STRING },
            sub_topic: { type: Type.STRING },
            type: { type: Type.STRING, description: "Must be MCQ, MSQ or NAT" },
            difficulty_tier: { type: Type.STRING },
            estimated_completion_time_seconds: { type: Type.INTEGER },
            weightage_marks: { type: Type.NUMBER },
            problem_statement: { type: Type.STRING },
            options: {
              type: Type.OBJECT,
              properties: {
                A: { type: Type.STRING },
                B: { type: Type.STRING },
                C: { type: Type.STRING },
                D: { type: Type.STRING },
              }
            },
            correct_answers: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            mathematical_proof_explanation: { type: Type.STRING },
            nptel_mapping_reference: { type: Type.STRING },
            predictive_probability_index: { type: Type.NUMBER }
          },
          required: ["question_id", "subject", "topic", "type", "difficulty_tier", "problem_statement", "correct_answers", "mathematical_proof_explanation", "nptel_mapping_reference"]
        },
        temperature: 0.8,
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json({
      question: parsedData as GATEQuestion,
      simulated: false,
    });
  } catch (error: any) {
    console.error("Gemini Question Generator Error:", error);
    // select fallback
    const fallback = STATIC_GATE_QUESTIONS[Math.floor(Math.random() * STATIC_GATE_QUESTIONS.length)];
    res.json({
      question: fallback,
      simulated: true,
      error_notice: "Fitted mock fallback question due to API state: " + error.message,
    });
  }
});

// Autonomous search across textbook databases, scraping segments, NPTEL API metadata
app.post("/api/search", async (req: Request, res: Response) => {
  const { query, subjectId } = req.body;
  const lowercaseQuery = (query || "").toLowerCase();

  // 1. Core corpus filter
  let results = KNOWLEDGE_BASE_CORPUS.filter(chunk => {
    const matchText = (chunk.title + " " + chunk.content + " " + chunk.topicTag).toLowerCase();
    const matchesSubject = !subjectId || chunk.subjectId === subjectId;
    return matchesSubject && matchText.includes(lowercaseQuery);
  });

  // If search returns nothing, pull general values
  if (results.length === 0) {
    results = KNOWLEDGE_BASE_CORPUS.slice(0, 3);
  }

  const ai = getGeminiClient();
  if (!ai) {
    res.json({
      results,
      answer: `### Ingested Local Analysis

Based on the ingested **GATE CSE Syllabus Knowledge Base** corpus, here is a localized index of resources related to *"${query}"*:

* We retrieved ${results.length} related reference entries, including textbook excerpts and NPTEL transcript logs.
* Direct Mathematical Formula match:
  $$P(X) = \\sum P(X \\mid Y_i) P(Y_i)$$

Try querying live topics to generate customized answers from the underlying LLM!`,
      simulated: true
    });
    return;
  }

  try {
    const contextText = results.map(r => `Source: ${r.sourceUrl} (${r.title})\nContent: ${r.content}`).join("\n\n");
    const prompt = `You are the GATE Knowledge Engine RAG Node.
Analyze the user's search query: "${query}" in the context of GATE CSE training.
Review these vectorised database chunks of NPTEL scripts, textbooks and notes:
${contextText}

Generate a concise, academically sound 2-3 paragraph answer summarizing the key details, stating theorems/formulas in LaTeX notation, and referencing the sources. Explain the context clearly and structured. Use Markdown.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
      }
    });

    res.json({
      results,
      answer: response.text || "No synthesis available.",
      simulated: false,
    });
  } catch (error: any) {
    console.error("Knowledge Engine Search API Error:", error);
    res.json({
      results,
      answer: `Found references but could not execute LLM synthesis because of an error: ${error.message}`,
      simulated: true
    });
  }
});


// Booting App and Dev Environment
async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite developmental engine connected to Express middlewares successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving pre-compiled static assets in Production Sandbox environment.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[GATE CSE SMART PREP] Running securely on port ${PORT}`);
  });
}

startServer();
