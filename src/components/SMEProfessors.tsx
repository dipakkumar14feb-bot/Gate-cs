import React, { useState, useRef, useEffect } from "react";
import { CORE_SUBJECTS, ChatMessage, SubjectModule } from "../types";
import { LaTeXRenderer } from "./LaTeXRenderer";
import { Send, User, Award, Shield, Cpu, BookOpen, AlertCircle, RefreshCw } from "lucide-react";

interface SMEProfessorsProps {
  onAddActivityLog: (log: string) => void;
}

export const SMEProfessors: React.FC<SMEProfessorsProps> = ({ onAddActivityLog }) => {
  const [selectedProfSubject, setSelectedProfSubject] = useState<SubjectModule>(CORE_SUBJECTS[2]); // Default to Operating Systems
  const [chats, setChats] = useState<{ [subjectId: string]: ChatMessage[] }>({
    os: [
      {
        id: "sys_init_os",
        sender: "professor",
        text: "Greetings. I am **Prof. Arvind Varma**. I run process scheduling research here at IIT Bombay. What concurrency problem or memory management proof are you reviewing today?",
        timestamp: "11:38 AM",
        professorId: "os"
      }
    ]
  });
  
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom of message tray on updates
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chats, selectedProfSubject.id]);

  const activeChat = chats[selectedProfSubject.id] || [
    {
      id: "sys_init",
      sender: "professor",
      text: `Welcome candidate. I am ${selectedProfSubject.professorName}, specializing in ${selectedProfSubject.name}. Let us investigate core mathematical foundations or architectural bounds of this domain.`,
      timestamp: "Just Now",
      professorId: selectedProfSubject.id
    }
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      professorId: selectedProfSubject.id
    };

    // Update active chat with User text
    const updatedHistory = [...activeChat, userMsg];
    setChats(prev => ({
      ...prev,
      [selectedProfSubject.id]: updatedHistory
    }));
    setInputText("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          subjectId: selectedProfSubject.id,
          history: updatedHistory.slice(-6) // Keep only recent turns for high-speed context
        })
      });

      if (!response.ok) {
        throw new Error("SME orchestrator network channel busy");
      }

      const data = await response.json();
      
      const profMsg: ChatMessage = {
        id: `prof_${Date.now()}`,
        sender: "professor",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        professorId: selectedProfSubject.id
      };

      setChats(prev => ({
        ...prev,
        [selectedProfSubject.id]: [...updatedHistory, profMsg]
      }));

      onAddActivityLog(`Queried Prof. ${selectedProfSubject.professorName.split(". ")[1]} on: "${textToSend.slice(0, 30)}..."`);
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: "professor",
        text: `### Channel Execution Stall\n\nI was unable to retrieve context metrics due to: *"${err.message}"*. Please verify server configuration connectivity rules.`,
        timestamp: "Err",
        professorId: selectedProfSubject.id
      };
      setChats(prev => ({
        ...prev,
        [selectedProfSubject.id]: [...updatedHistory, errMsg]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const getSmartSuggestions = (subjId: string) => {
    switch (subjId) {
      case "os":
        return [
          "Explain Peterson's algorithm mutual exclusion proof step-by-step.",
          "Prove why 4 conditions are mutually non-separable for Deadlocks to occur.",
          "Why do we suffer from internal fragmentation in Paging as opposed to Segmentation?"
        ];
      case "dbms":
        return [
          "Validate how Conflict Serializability differs from View Serializability with blind writes.",
          "Describe Third Normal Form vs BCNF dependency constraints with equations.",
          "Derive the node capacity equation determining B+ Tree indexing branch factor."
        ];
      case "toc":
        return [
          "Prove why Context-Free Languages are not closed under intersection.",
          "Explain the Halting Problem proof of TM undecidability.",
          "Minimize this DFA state transition table layout mathematically."
        ];
      case "alg":
        return [
          "Apply the Potential Method of amortized analysis on a dynamic array expansion.",
          "Solve recurrences where Master Theorem fails due to logarithmic density.",
          "Briefly define NP-Completeness and prove 3-SAT to CLIQUE reduction."
        ];
      case "cn":
        return [
          "Solve IP addresses boundary allocation CIDR subnets blocks for 192.168.0.0/22.",
          "How does the TCP Sliding Window control congestion via additive-increase/multiplicative-decrease?",
          "Examine distance vector routing count-to-infinity loop resolution."
        ];
      default:
        return [
          `Formulate the core research paradigm defining ${selectedProfSubject.name}.`,
          `Are there typical 2-mark GATE questions in ${selectedProfSubject.name} with equations?`,
          `Recommend standard NPTEL lecture series mappings for studying ${selectedProfSubject.name}.`
        ];
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 p-1 h-[calc(100vh-14rem)] bg-[#0B0F1A]" id="sme-professors-tray">
      {/* 12 Professors panel lists */}
      <div className="xl:col-span-1 bg-[#0D121F] border border-slate-800 rounded-xl p-4 flex flex-col justify-between h-full overflow-y-auto">
        <div className="space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider block">IIT Madras, Bombay, Delhi Faculty</span>
            <h3 className="text-slate-200 font-sans font-semibold text-xs leading-none mt-1">SME Orchestration Board</h3>
          </div>
          
          <div className="space-y-2 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1">
            {CORE_SUBJECTS.map((subj) => {
              const isSelected = selectedProfSubject.id === subj.id;
              return (
                <button
                  key={subj.id}
                  onClick={() => setSelectedProfSubject(subj)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex gap-3 items-center group ${
                    isSelected
                      ? "bg-sky-500/10 border-sky-500/40 shadow-sky-500/5 shadow-lg"
                      : "bg-slate-900/30 hover:bg-slate-900 border-slate-800/60"
                  }`}
                >
                  <img
                    src={subj.professorAvatar}
                    alt={subj.professorName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover grayscale brightness-90 border border-slate-800 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold truncate transition-colors ${isSelected ? "text-sky-400" : "text-slate-200 group-hover:text-sky-300"}`}>
                      {subj.professorName.split(". ")[1]}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{subj.name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-800/80 text-[10px] text-slate-500 font-mono flex items-start gap-1.5 mt-2 shadow-inner">
          <Shield className="w-3.5 h-3.5 text-slate-405 shrink-0 mt-0.5" />
          <span>Each advisor agent is formatted with direct IIT-style research heuristics to give rigorous proofs.</span>
        </div>
      </div>

      {/* Interactive Chat Board */}
      <div className="xl:col-span-3 bg-[#0D121F] border border-slate-800 rounded-xl flex flex-col justify-between h-full overflow-hidden">
        {/* Professor Card Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/15 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={selectedProfSubject.professorAvatar}
              alt={selectedProfSubject.professorName}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-xl object-cover grayscale border border-slate-800"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-slate-100 font-sans font-semibold text-sm leading-none">
                  {selectedProfSubject.professorName}
                </h3>
                <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase bg-sky-500/15 text-sky-400 border border-sky-500/20 rounded">
                  IIT Faculty
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono tracking-tight">
                {selectedProfSubject.professorTitle}
              </p>
            </div>
          </div>
          
          <div className="hidden md:block text-right">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">Curriculum Node</span>
            <span className="text-xs font-semibold text-sky-450 font-mono mt-0.5 inline-block">
              {selectedProfSubject.name}
            </span>
          </div>
        </div>

        {/* Message board area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-[#0D121F] via-[#0D121F] to-slate-950/20"
        >
          {activeChat.map((msg, index) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id || index}
                className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar Icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                  isUser 
                    ? "bg-slate-900 border-slate-700 text-slate-300" 
                    : "bg-sky-950/20 border-sky-900 text-sky-400"
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                </div>

                {/* Message Box */}
                <div className={`p-4 rounded-xl border text-sm leading-relaxed ${
                  isUser
                    ? "bg-slate-900 text-slate-100 border-slate-800"
                    : "bg-[#0D121F]/80 text-slate-200 border-slate-800 shadow-md font-sans"
                }`}>
                  {!isUser && (
                    <div className="text-[9px] font-mono text-sky-400/80 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-sky-400" />
                      <span>{selectedProfSubject.professorName.split(". ")[1]} Heuristics Node</span>
                    </div>
                  )}
                  <LaTeXRenderer text={msg.text} />
                  <span className="block text-[9px] font-mono text-slate-505 text-right mt-2 self-end">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 mr-auto items-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border bg-sky-950/20 border-sky-900 text-sky-400">
                <Cpu className="w-4 h-4 animate-pulse" />
              </div>
              <div className="py-2.5 px-4 rounded-xl bg-slate-905/50 border border-slate-800/80 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                <span className="text-xs font-mono text-slate-400">IIT Professor deriving proofs over neural networks...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggestion Chips and Custom Input Tray */}
        <div className="p-4 border-t border-slate-800 bg-[#0D121F]">
          {/* Quick chips suggestions */}
          <div className="flex flex-wrap gap-2 mb-3">
            {getSmartSuggestions(selectedProfSubject.id).map((chip, chipIdx) => (
              <button
                key={chipIdx}
                disabled={isLoading}
                onClick={() => handleSendMessage(chip)}
                className="text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 px-2.5 py-1 rounded transition-colors text-left max-w-full truncate disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Form input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Inquire Prof. ${selectedProfSubject.professorName.split(". ")[1]} regarding complex formulas, proofs or theorems...`}
              disabled={isLoading}
              className="flex-1 bg-slate-900 text-slate-100 border border-slate-800 focus:border-sky-500 placeholder-slate-500 rounded-lg px-4 py-2.5 outline-none text-xs text-sm font-sans font-medium transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="bg-sky-500 hover:bg-sky-600 disabled:bg-slate-800 disabled:text-slate-500 border border-sky-400/25 px-4 py-2.5 text-zinc-950 font-semibold text-xs font-mono rounded-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Transmit</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
