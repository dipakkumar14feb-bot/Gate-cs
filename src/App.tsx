import { useState, useEffect } from "react";
import { IntelligentMatrix } from "./components/IntelligentMatrix";
import { SMEProfessors } from "./components/SMEProfessors";
import { DeepSearch } from "./components/DeepSearch";
import { TestPlatform } from "./components/TestPlatform";
import {
  TrendingUp,
  MessageSquare,
  Search,
  BookOpen,
  Cpu,
  Clock,
  ShieldCheck,
  Award,
  BookMarked,
  Layers,
  Activity,
  CheckCircle2,
  Terminal,
  HelpCircle
} from "lucide-react";

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"matrix" | "classroom" | "search" | "test">("matrix");

  // UTC Time clock state
  const [utcTime, setUtcTime] = useState("");

  // Live Accuracy counters mapped by Subject ID: { correct: number, total: number, accuracy: number }
  const [subjectReadiness, setSubjectReadiness] = useState<{
    [subjectId: string]: { correct: number; total: number; accuracy: number };
  }>({
    os: { correct: 1, total: 2, accuracy: 0.5 },
    toc: { correct: 1, total: 1, accuracy: 1.0 },
    dbms: { correct: 0, total: 1, accuracy: 0.0 },
    alg: { correct: 2, total: 2, accuracy: 1.0 },
    dm: { correct: 1, total: 1, accuracy: 1.0 }
  });

  // 2-Parameter IRT estimated capability metrics (initially -0.15 representing standard baseline)
  const [theta, setTheta] = useState(-0.15);
  const [airBracket, setAirBracket] = useState("AIR 1501-3000");

  // Background pipeline crawl logs console
  const [systemLogs, setSystemLogs] = useState<string[]>([
    "Syllabus pre-flight parsed (2006-2026 dataset coverage index).",
    "Linked semantic index: bge-large-en-v1.5 embeddings catalog.",
    "Decay coefficients loaded: gamma parameter sets to 0.95 mathematically.",
    "12 IIT distinguished subject prof engines initialized."
  ]);

  // Clock updating loop
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const addSystemLog = (log: string) => {
    setSystemLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${log}`,
      ...prev.slice(0, 15) // Limit to recent 15 lines
    ]);
  };

  // Callback to update subject performance and recalculate dynamic weights
  const handleUpdateReadiness = (subjectId: string, correct: boolean) => {
    setSubjectReadiness((prev) => {
      const current = prev[subjectId] || { correct: 0, total: 0, accuracy: 0.0 };
      const newCorrect = current.correct + (correct ? 1 : 0);
      const newTotal = current.total + 1;
      return {
        ...prev,
        [subjectId]: {
          correct: newCorrect,
          total: newTotal,
          accuracy: newCorrect / newTotal
        }
      };
    });
  };

  const handleUpdateThetaAndAIR = (newTheta: number, calculatedAIR: string) => {
    setTheta(newTheta);
    setAirBracket(calculatedAIR);
    addSystemLog(`Psychometric IRT recalculated. Theta: ${newTheta > 0 ? `+${newTheta.toFixed(2)}` : newTheta.toFixed(2)} | Bracket Updated to: ${calculatedAIR}`);
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-300 font-sans flex flex-col md:flex-row overflow-hidden select-none selection:bg-sky-500/20 selection:text-sky-300">
      
      {/* Sidebar navigation corresponding to mock - layout matches aesthetic exactly */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0 bg-[#0D121F]">
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-500 rounded flex items-center justify-center text-white font-bold select-none text-base">G</div>
            <h1 className="font-bold tracking-tight text-white font-sans text-sm">
              GATE CSE <span className="text-sky-400 font-bold uppercase text-xs tracking-wider">Smart</span>
            </h1>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold px-3 mb-2.5">
              Control Engines
            </p>
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("matrix");
                    addSystemLog("Navigated to Syllabus Trend & Importance Matrix.");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono font-medium tracking-tight transition-all cursor-pointer ${
                    activeTab === "matrix"
                      ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <TrendingUp className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "matrix" ? "text-sky-400" : "text-slate-500"}`} />
                  <span>Syllabus Trend Matrix</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("classroom");
                    addSystemLog("Navigated to SME Professors classroom panel.");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono font-medium tracking-tight transition-all cursor-pointer ${
                    activeTab === "classroom"
                      ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <MessageSquare className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "classroom" ? "text-sky-400" : "text-slate-500"}`} />
                  <span>IIT Faculty Chat</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("search");
                    addSystemLog("Navigated to textbook vector lookup database.");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono font-medium tracking-tight transition-all cursor-pointer ${
                    activeTab === "search"
                      ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <Search className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "search" ? "text-sky-400" : "text-slate-500"}`} />
                  <span>RAG Knowledge Search</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("test");
                    addSystemLog("Opened GATE Adaptive Testing Suite.");
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono font-medium tracking-tight transition-all cursor-pointer ${
                    activeTab === "test"
                      ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <BookOpen className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "test" ? "text-sky-400" : "text-slate-500"}`} />
                  <span>Adaptive Testing</span>
                </button>
              </li>
            </ul>
          </div>

          <div className="pt-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold px-3 mb-2.5">
              Domain Coverage Indices
            </p>
            <ul className="space-y-1.5 px-3">
              {[
                { name: "Math Foundations", acc: subjectReadiness.dm?.accuracy ?? 1.0 },
                { name: "Operating Systems", acc: subjectReadiness.os?.accuracy ?? 0.5 },
                { name: "Algorithms & DS", acc: subjectReadiness.alg?.accuracy ?? 1.0 },
                { name: "Theory of Comp", acc: subjectReadiness.toc?.accuracy ?? 1.0 }
              ].map((item, idx) => (
                <li key={idx} className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.acc >= 0.8 ? "bg-emerald-400" : "bg-sky-400"}`}></span> 
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">{(item.acc * 100).toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 bg-slate-900/50 p-2.5 rounded-lg border border-slate-850/60">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0 select-none">JD</div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-white truncate">John Doe (Aspirant)</p>
              <p className="text-[10px] text-slate-500">Prep Stage: Premium</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#0B0F1A]">
        
        {/* Top Header which contains real stats values matching style */}
        <header className="h-16 border-b border-slate-800/80 flex items-center justify-between px-6 md:px-8 bg-[#0B0F1A] shrink-0">
          <div className="flex gap-6 md:gap-8 items-center">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Latent Ability (θ)</span>
              <span className="text-sm md:text-lg font-mono font-bold text-white flex items-center gap-1.5 leading-none mt-0.5">
                {theta.toFixed(3)}
                <span className="text-[10px] font-normal text-emerald-400 tracking-normal inline-block">
                  {theta >= 0 ? "+delta" : "-baseline"}
                </span>
              </span>
            </div>
            
            <div className="w-px h-8 bg-slate-800"></div>
            
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Estimated Bracket</span>
              <span className="text-xs md:text-sm font-mono font-bold text-sky-400 tracking-tighter uppercase leading-none mt-1">
                {airBracket}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
              <span className="text-[10px] font-mono font-medium text-slate-400">Systems Secured</span>
            </div>

            <div className="text-right text-[11px] font-mono text-slate-500 hidden md:block">
              <span className="text-emerald-400 mr-1.5">●</span>
              {utcTime ? utcTime.split(" ").slice(4, 5).join("") : "UTC clock"}
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="p-4 md:p-8 flex-1 overflow-y-auto">
          {activeTab === "matrix" && (
            <IntelligentMatrix
              userAccuracyBySubject={subjectReadiness}
              estimatedTheta={theta}
              estimatedAIR={airBracket}
            />
          )}
          {activeTab === "classroom" && (
            <SMEProfessors onAddActivityLog={addSystemLog} />
          )}
          {activeTab === "search" && (
            <DeepSearch onAddActivityLog={addSystemLog} />
          )}
          {activeTab === "test" && (
            <TestPlatform
              onUpdateReadiness={handleUpdateReadiness}
              onUpdateTheta={handleUpdateThetaAndAIR}
              onAddActivityLog={addSystemLog}
              estimatedTheta={theta}
            />
          )}
        </div>

        {/* Action stream / logger */}
        <footer className="border-t border-slate-800/80 bg-[#0D121F] py-2.5 px-6 flex flex-col md:flex-row md:items-center justify-between gap-2 font-mono text-[10px] text-slate-500 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-sky-400 font-bold uppercase tracking-widest shrink-0">VECTOR RUNTIME LOGS:</span>
            <span className="truncate text-slate-400 italic font-mono">
              {systemLogs[0] || "Active matrix node ready."}
            </span>
          </div>
          <div className="text-[9px] text-slate-500 shrink-0">
            20-Year Dataset Coverage (2006-2026)
          </div>
        </footer>

      </div>

    </div>
  );
}
