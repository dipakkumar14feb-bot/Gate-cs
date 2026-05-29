import React, { useState, useEffect } from "react";
import { GATEQuestion, QuestionType } from "../types";
import { STATIC_GATE_QUESTIONS } from "../data";
import { LaTeXRenderer } from "./LaTeXRenderer";
import {
  Sparkles,
  HelpCircle,
  Clock,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  Calculator,
  ExternalLink,
  ChevronRight,
  Cpu
} from "lucide-react";

interface TestPlatformProps {
  onUpdateReadiness: (subjectId: string, correct: boolean) => void;
  onUpdateTheta: (newTheta: number, airBracket: string) => void;
  onAddActivityLog: (log: string) => void;
  estimatedTheta: number;
}

export const TestPlatform: React.FC<TestPlatformProps> = ({
  onUpdateReadiness,
  onUpdateTheta,
  onAddActivityLog,
  estimatedTheta
}) => {
  // Current active compiled question
  const [currentQuestion, setCurrentQuestion] = useState<GATEQuestion>(STATIC_GATE_QUESTIONS[0]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Selector controls
  const [selectedSubject, setSelectedSubject] = useState("Operating Systems");
  const [selectedType, setSelectedType] = useState<QuestionType>("MCQ");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"Easy" | "Medium" | "Hard">("Hard");

  // User responses state
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]); // For MCQ/MSQ
  const [natAnswer, setNatAnswer] = useState(""); // For NAT text box/numeric entry
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [marksDeducted, setMarksDeducted] = useState(0);

  // Chronometer elapsed clock
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(true);

  useEffect(() => {
    let interval: any = null;
    if (timerActive && !isSubmitted) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, isSubmitted]);

  // Request Express server to synthesize a fresh question dynamically
  const compileFreshQuestion = async () => {
    setIsGenerating(true);
    setIsSubmitted(false);
    setSelectedOptions([]);
    setNatAnswer("");
    setSecondsElapsed(0);
    setTimerActive(true);

    try {
      const resp = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectName: selectedSubject,
          difficultyTier: selectedDifficulty,
          type: selectedType
        })
      });

      if (!resp.ok) {
        throw new Error("Server compile node busy");
      }

      const data = await resp.json();
      setCurrentQuestion(data.question);
      onAddActivityLog(`Synthesized new GATE ${selectedType} of type "${selectedSubject}"`);
    } catch (err) {
      console.error(err);
      // Select random static question as fallback
      const filtered = STATIC_GATE_QUESTIONS.filter(q => q.type === selectedType);
      const randomFallback = filtered.length > 0
        ? filtered[Math.floor(Math.random() * filtered.length)]
        : STATIC_GATE_QUESTIONS[Math.floor(Math.random() * STATIC_GATE_QUESTIONS.length)];
      setCurrentQuestion(randomFallback);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptionToggle = (opt: string) => {
    if (isSubmitted) return;

    if (currentQuestion.type === "MCQ") {
      setSelectedOptions([opt]);
    } else if (currentQuestion.type === "MSQ") {
      if (selectedOptions.includes(opt)) {
        setSelectedOptions((prev) => prev.filter((item) => item !== opt));
      } else {
        setSelectedOptions((prev) => [...prev, opt]);
      }
    }
  };

  // Grade user performance using standard rubrics and IRT Ability modifications
  const handleSubmitTest = () => {
    if (isSubmitted) return;
    setTimerActive(false);

    let gradedCorrect = false;

    if (currentQuestion.type === "MCQ" || currentQuestion.type === "MSQ") {
      // Sort and compare option lists
      const sortedUser = [...selectedOptions].sort().join(",");
      const sortedCorrect = [...currentQuestion.correct_answers].sort().join(",");
      gradedCorrect = sortedUser === sortedCorrect;
    } else if (currentQuestion.type === "NAT") {
      // String boundary comparison (float with 0.05 absolute margins)
      const userValue = parseFloat(natAnswer);
      const correctValues = currentQuestion.correct_answers.map(parseFloat);
      
      const matched = correctValues.find(correctVal => {
        if (isNaN(userValue) || isNaN(correctVal)) return false;
        return Math.abs(userValue - correctVal) <= 0.05;
      });
      
      // Fallback for string matches (e.g. ranges or exact match)
      gradedCorrect = !!matched || currentQuestion.correct_answers.includes(natAnswer.trim());
    }

    setIsCorrect(gradedCorrect);
    setIsSubmitted(true);

    // Calculate negative markings strictly based on GATE guidelines
    // MCQ negative marks: -1/3 for 1 mark, -2/3 for 2 marks. Nil for MSQ & NAT.
    let penalty = 0;
    if (!gradedCorrect && currentQuestion.type === "MCQ") {
      penalty = currentQuestion.weightage_marks === 1.0 ? 0.33 : 0.67;
    }
    setMarksDeducted(penalty);

    // 1. Update subject readiness trackers on mother app
    // We map current subject name to subject ID
    const subMap: { [key: string]: string } = {
      "Operating Systems": "os",
      "Theory of Computation": "toc",
      "Database Management Systems": "dbms",
      "Programming & Data Structures": "pds",
      "Computer Networks": "cn",
      "Discrete Mathematics": "dm",
      "Engineering Mathematics": "em",
      "Algorithms": "alg",
      "Compiler Design": "cd"
    };

    const sId = subMap[currentQuestion.subject] || "os";
    onUpdateReadiness(sId, gradedCorrect);

    // 2. Perform 2-Parameter Item Response Theory (IRT) calculations
    // Formula: P(Correct | theta) = 1 / (1 + e^-alpha(theta - beta))
    // Alpha = discrimination (Easy: 1.0, Medium: 1.5, Hard: 2.2)
    // Beta = difficulty (Easy: -1.0, Medium: 0.5, Hard: 2.0)
    let alpha = 1.5;
    let beta = 0.5;
    if (currentQuestion.difficulty_tier === "Easy") {
      alpha = 1.0; beta = -1.0;
    } else if (currentQuestion.difficulty_tier === "Hard") {
      alpha = 2.2; beta = 2.0;
    }

    // Adjust latent ability score (theta)
    let localTheta = estimatedTheta;
    if (gradedCorrect) {
      // Getting a question correct scales theta up. Higher difficulty yields larger leaps
      localTheta += (0.15 * alpha * (beta - localTheta > 0 ? (beta - localTheta) * 0.5 + 0.5 : 1));
    } else {
      // Incorrect reduces theta slightly. Hard question drops theta less than easy question.
      localTheta -= (0.08 / alpha);
    }

    // Clamp theta between -4.0 and +4.0
    localTheta = Math.max(-4.0, Math.min(4.0, localTheta));

    // Map calculated latent parameter (theta) to estimated AIR (All India Rank) brackets
    let airBracket = "5000+";
    if (localTheta >= 2.8) airBracket = "AIR < 50";
    else if (localTheta >= 1.9) airBracket = "AIR 50-200";
    else if (localTheta >= 1.0) airBracket = "AIR 201-500";
    else if (localTheta >= 0.2) airBracket = "AIR 501-1500";
    else if (localTheta >= -0.8) airBracket = "AIR 1501-3000";

    onUpdateTheta(localTheta, airBracket);

    onAddActivityLog(`Graded GATE ${currentQuestion.type}: ${gradedCorrect ? "+Correct" : "-Incorrect"} (${currentQuestion.weightage_marks} Marks). Accuracy Theta updated to: ${localTheta.toFixed(2)}`);
  };

  const formattedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-1 min-h-[calc(100vh-14rem)]" id="test-platform-playground">
      {/* Question Compilation Settings Sidebar */}
      <div className="space-y-6 flex flex-col justify-between h-full">
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">AI Test Compilation Control</span>
              <h3 className="text-zinc-200 font-sans font-semibold text-xs leading-none mt-0.5">Synthesis Controls</h3>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-zinc-500 uppercase">Syllabus Subject Domain</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg p-2.5 outline-none font-mono cursor-pointer"
              >
                <option value="Operating Systems">Operating Systems</option>
                <option value="Theory of Computation">Theory of Computation</option>
                <option value="Database Management Systems">Database Management Systems</option>
                <option value="Programming & Data Structures">Programming & Data Structures</option>
                <option value="Computer Networks">Computer Networks</option>
                <option value="Discrete Mathematics">Discrete Mathematics</option>
                <option value="Engineering Mathematics">Engineering Mathematics</option>
                <option value="Algorithms">Algorithms</option>
                <option value="Compiler Design">Compiler Design</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] text-zinc-500 uppercase">Evaluation Format</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as QuestionType)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg p-2 outline-none cursor-pointer"
                >
                  <option value="MCQ">MCQ (Single)</option>
                  <option value="MSQ">MSQ (Multi)</option>
                  <option value="NAT">NAT (Numeric)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-zinc-500 uppercase">Difficulty Tier</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg p-2 outline-none cursor-pointer"
                >
                  <option value="Easy">Easy (θ=-1.0)</option>
                  <option value="Medium">Medium (θ=+0.5)</option>
                  <option value="Hard">Hard (θ=+2.0)</option>
                </select>
              </div>
            </div>

            <button
              onClick={compileFreshQuestion}
              disabled={isGenerating}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-850 disabled:text-zinc-600 text-zinc-950 font-bold font-mono text-xs rounded-lg transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer mt-4"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? "Compiling Syllabus Parameters..." : "Synthesize GATE Question"}</span>
            </button>
          </div>
        </div>

        {/* Dynamic score matrix parameters */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">Chronometer Counter</span>
          </div>
          
          <div className="flex justify-between items-center bg-zinc-900/40 p-3 rounded-lg border border-zinc-850">
            <div className="text-xl font-mono font-bold text-zinc-100">
              {formattedTime(secondsElapsed)}
            </div>
            <button
              onClick={() => {
                setSecondsElapsed(0);
                setTimerActive(true);
              }}
              className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Time
            </button>
          </div>

          <div className="p-3 bg-rose-500/5 text-[10px] font-mono text-rose-400 border border-rose-500/10 rounded-lg space-y-1 leading-relaxed">
            <div className="flex items-center gap-1 font-semibold text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>GATE NEGATIVE SCATTER POLICIES</span>
            </div>
            <p>
               MCQ: 1-Mark = $-1/3$ deduction, 2-Mark = $-2/3$ deduction. MSQ and NAT formats do not penalize wrong coordinates.
            </p>
          </div>
        </div>
      </div>

      {/* Main Active Question & Examination Workspace */}
      <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col justify-between h-full overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-zinc-900 bg-zinc-900/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-zinc-200 font-sans font-semibold text-xs truncate max-w-xs block">
              IIT CSE Exam compilation #{currentQuestion.question_id.replace("q_", "")}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 text-[9px] font-mono tracking-wider font-semibold uppercase rounded border ${
              currentQuestion.difficulty_tier === "Hard"
                ? "bg-rose-500/10 text-rose-400 border-rose-500/10"
                : currentQuestion.difficulty_tier === "Medium"
                ? "bg-indigo-505/10 text-indigo-400 border-indigo-505/10"
                : "bg-emerald-505/10 text-emerald-400 border-emerald-505/10"
            }`}>
              {currentQuestion.difficulty_tier}
            </span>

            <span className="px-2 py-0.5 text-[9px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-800 rounded">
              {currentQuestion.weightage_marks.toFixed(1)} Marks
            </span>
          </div>
        </div>

        {/* Question Display Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <Cpu className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs font-mono text-zinc-400">Synthesizing GATE questions via Gemini AI Key...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Subject Tag */}
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase">
                <span>Subject:</span>
                <span className="text-emerald-400 font-semibold">{currentQuestion.subject}</span>
                <span>/</span>
                <span>Topic:</span>
                <span className="text-indigo-400 font-semibold">{currentQuestion.topic}</span>
              </div>

              {/* Question problems */}
              <div className="text-sm text-zinc-200 leading-relaxed font-sans prose prose-invert font-medium">
                <LaTeXRenderer text={currentQuestion.problem_statement} />
              </div>

              {/* Options selectors / inputs */}
              {currentQuestion.type === "NAT" ? (
                <div className="space-y-2 p-4 bg-zinc-900/30 border border-zinc-850 rounded-xl max-w-md">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block font-semibold mb-1">
                    NUMERICAL ANSWER VALUE INPUT (Decimals accepted)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      disabled={isSubmitted}
                      value={natAnswer}
                      onChange={(e) => setNatAnswer(e.target.value)}
                      placeholder="Calculate and input numeric value..."
                      className="bg-zinc-950 text-zinc-100 border border-zinc-800 focus:border-emerald-500 rounded-lg px-4 py-2.5 outline-none font-mono text-xs flex-1 transition-colors"
                    />
                    <span className="bg-zinc-900 text-zinc-500 text-xs px-3 py-2.5 rounded-lg border border-zinc-800 font-mono flex items-center bg-zinc-900">
                      R
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="options-selectors-grid">
                  {currentQuestion.options &&
                    Object.entries(currentQuestion.options).map(([key, label]) => {
                      const isOptionSelected = selectedOptions.includes(key);
                      const isOptionCorrect = currentQuestion.correct_answers.includes(key);
                      
                      let cardStyle = "bg-zinc-950 border-zinc-900/80 text-zinc-300 hover:border-zinc-800";
                      if (isOptionSelected) cardStyle = "bg-emerald-500/5 text-emerald-400 border-emerald-500/40";
                      
                      // Highlight after submission
                      if (isSubmitted) {
                        if (isOptionCorrect) {
                          cardStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-400";
                        } else if (isOptionSelected) {
                          cardStyle = "bg-rose-500/10 text-rose-400 border-rose-400/60";
                        } else {
                          cardStyle = "bg-zinc-950 border-zinc-900 text-zinc-500 opacity-60";
                        }
                      }

                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() => handleOptionToggle(key)}
                          className={`w-full text-left p-4 rounded-xl border transition-all flex gap-3 items-start select-none disabled:pointer-events-none group cursor-pointer ${cardStyle}`}
                        >
                          <span className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5 border ${
                            isOptionSelected 
                              ? "bg-emerald-500 border-emerald-400 text-zinc-950" 
                              : "bg-zinc-900 border-zinc-800 text-zinc-400"
                          }`}>
                            {key}
                          </span>
                          <span className="text-xs font-sans align-middle leading-relaxed font-medium">
                            {/* Make sure LaTeX maps nicely in option cards! */}
                            <LaTeXRenderer text={label} />
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}

              {/* Explanation of results after submission */}
              {isSubmitted && (
                <div className="p-5 bg-zinc-900/60 border border-zinc-850 rounded-xl space-y-4 shadow-inner">
                  <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                    <div className="flex items-center gap-1.5">
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-400 font-mono">
                            SOLUTION MATCHED (+{currentQuestion.weightage_marks.toFixed(1)} Marks)
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-rose-400" />
                          <span className="text-xs font-semibold text-rose-400 font-mono">
                            SOLUTION INACCURATE {marksDeducted > 0 ? `(-${marksDeducted.toFixed(2)} Penalt)` : ""}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="text-[10px] font-mono text-zinc-500">
                      Answer Target: <span className="text-emerald-400 font-semibold">{currentQuestion.correct_answers.join(", ")}</span>
                    </div>
                  </div>

                  {/* Step by step formulas */}
                  <div className="space-y-2 text-xs text-zinc-300">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase font-semibold block">IIT Mathematical Theorem Explanation</span>
                    <LaTeXRenderer text={currentQuestion.mathematical_proof_explanation} />
                  </div>

                  {/* Remote references */}
                  <div className="pt-3 border-t border-zinc-850 flex items-center justify-between gap-4 text-[10px] font-mono text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <span>NPTEL Lecture Video Mapping:</span>
                    </div>
                    <a
                      href={currentQuestion.nptel_mapping_reference}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <span>Retrieve Core Video</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit action panel */}
        <div className="p-4 border-t border-zinc-900/80 bg-zinc-950 flex items-center justify-between gap-4">
          <div>
            {!isSubmitted ? (
              <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-zinc-500" />
                <span>Mark choices carefully</span>
              </span>
            ) : (
              <button
                onClick={compileFreshQuestion}
                className="flex items-center gap-1.5 text-xs text-emerald-400 hover:underline font-mono"
              >
                <span>Compile Next Problem</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={isSubmitted || isGenerating || (currentQuestion.type === "NAT" ? !natAnswer.trim() : selectedOptions.length === 0)}
            onClick={handleSubmitTest}
            className="px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-650 disabled:border-zinc-950 text-zinc-950 border border-zinc-800/80 font-bold font-mono text-xs rounded-lg transition-all shadow-md shrink-0 cursor-pointer"
          >
            Submit Answer Sheets
          </button>
        </div>
      </div>
    </div>
  );
};
