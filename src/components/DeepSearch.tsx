import React, { useState } from "react";
import { IngestionChunk, SubjectModule, CORE_SUBJECTS } from "../types";
import { KNOWLEDGE_BASE_CORPUS } from "../data";
import { LaTeXRenderer } from "./LaTeXRenderer";
import { Search, Database, Plus, CheckCircle, FileText, Globe, Link2, Terminal, HelpCircle } from "lucide-react";

interface DeepSearchProps {
  onAddActivityLog: (log: string) => void;
}

export const DeepSearch: React.FC<DeepSearchProps> = ({ onAddActivityLog }) => {
  const [query, setQuery] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("ALL");
  const [isSearching, setIsSearching] = useState(false);
  const [corpus, setCorpus] = useState<IngestionChunk[]>(KNOWLEDGE_BASE_CORPUS);
  const [searchResults, setSearchResults] = useState<IngestionChunk[]>(KNOWLEDGE_BASE_CORPUS.slice(0, 3));
  const [synthesizedAnswer, setSynthesizedAnswer] = useState<string>(
    `### Ingested Local Knowledge Base

Search for a topic above (e.g., *Peterson's Algorithm*, *Amortized analysis*, *Conflict serialization*) to query the vectorised OCR textbook corpus. 
The system will run a **hybrid BM25 + dense search** on active chunks and leverage *Gemini 3.5-flash* to compile an academic brief complete with LaTeX theorem proofs.`
  );

  // Custom Ingestion upload state
  const [showIngestForm, setShowIngestForm] = useState(false);
  const [ingestTitle, setIngestTitle] = useState("");
  const [ingestSource, setIngestSource] = useState("");
  const [ingestContent, setIngestContent] = useState("");
  const [ingestSubject, setIngestSubject] = useState("os");
  const [ingestType, setIngestType] = useState<"NPTEL" | "PYQ" | "Textbook" | "Forum">("Textbook");
  const [ingestSuccess, setIngestSuccess] = useState(false);

  // Search logic calling back to Express full-stack endpoint
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const resp = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          subjectId: selectedSubjectId === "ALL" ? "" : selectedSubjectId
        })
      });

      if (!resp.ok) {
        throw new Error("Search cluster timed out");
      }

      const data = await resp.json();
      
      // Combine query search results with locally simulated custom inserts
      let matchingLocals = corpus.filter(item => {
        const isNotOriginal = !KNOWLEDGE_BASE_CORPUS.find(orig => orig.id === item.id);
        const textMatch = (item.title + " " + item.content).toLowerCase().includes(query.toLowerCase());
        const subMatch = selectedSubjectId === "ALL" || item.subjectId === selectedSubjectId;
        return isNotOriginal && textMatch && subMatch;
      });

      setSearchResults([...matchingLocals, ...data.results]);
      setSynthesizedAnswer(data.answer);
      onAddActivityLog(`Performed vector-RAG search: "${query}"`);
    } catch (err: any) {
      console.error(err);
      // Fallback
      setSynthesizedAnswer(`### RAG Synthesis Stalled\n\nFailed to reach the full semantic generation layer (*"${err.message}"*). Showing matching static corpus fragments instead.`);
    } finally {
      setIsSearching(false);
    }
  };

  // Custom Ingestion manual insert
  const handleIngestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestTitle.trim() || !ingestContent.trim() || !ingestSource.trim()) return;

    const newChunk: IngestionChunk = {
      id: `custom_chunk_${Date.now()}`,
      subjectId: ingestSubject,
      topicTag: "Custom Syllabus OCR Upload",
      sourceType: ingestType,
      sourceUrl: ingestSource,
      title: ingestTitle,
      content: ingestContent
    };

    setCorpus(prev => [newChunk, ...prev]);
    setIngestSuccess(true);
    onAddActivityLog(`Ingested custom textbook node: "${ingestTitle.slice(0, 20)}..."`);

    // Reset fields
    setTimeout(() => {
      setIngestTitle("");
      setIngestContent("");
      setIngestSource("");
      setShowIngestForm(false);
      setIngestSuccess(false);
    }, 1500);
  };

  const getSourceBadgeColor = (type: string) => {
    switch (type) {
      case "NPTEL":
        return "bg-amber-500/10 text-amber-400 border-amber-500/25";
      case "Textbook":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
      case "Forum":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-505/25";
      default:
        return "bg-rose-500/10 text-rose-400 border-rose-500/25";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-1 min-h-[calc(100vh-14rem)] bg-[#0B0F1A]" id="deep-search-workspace">
      {/* Search filters and crawler control */}
      <div className="lg:col-span-2 space-y-6 flex flex-col justify-between h-full">
        <div className="space-y-6">
          {/* Main search card */}
          <div className="bg-[#0D121F] border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <span className="text-[10px] font-mono text-sky-400 uppercase tracking-widest block">Textbook OCR & NPTEL Index</span>
              <h3 className="text-slate-200 font-sans font-semibold text-sm leading-none mt-1">Syllabus Query Center</h3>
            </div>

            <form onSubmit={handleSearch} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Query Peterson's, B+ Trees, Pumping Lemma..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 focus:border-sky-500 placeholder-slate-500 text-xs px-3.5 py-2.5 pl-9 rounded-lg outline-none font-mono"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-2 outline-none font-mono flex-1 cursor-pointer"
                >
                  <option value="ALL">All Course Nodes</option>
                  {CORE_SUBJECTS.map(s => (
                    <option key={s.id} value={s.id}>{s.name.replace(" Mathematics", " Math")}</option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={!query.trim() || isSearching}
                  className="bg-sky-500 hover:bg-sky-600 text-slate-950 disabled:bg-[#0D121F] disabled:text-slate-500 px-4 py-2 font-mono text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer border border-sky-455/10"
                >
                  <span>Query Index</span>
                </button>
              </div>
            </form>
          </div>

          {/* crawler dynamic list results */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">INDEX MATCHED FRAGMENTS ({searchResults.length})</span>
              <button
                onClick={() => setShowIngestForm(!showIngestForm)}
                className="text-[10px] font-mono text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Ingest Custom Document
              </button>
            </div>

            {showIngestForm ? (
              <form onSubmit={handleIngestSubmit} className="bg-[#0D121F] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-mono text-indigo-400 font-semibold uppercase">OCR PDF / Syllabus Ingestion Node</span>
                  <button
                    type="button"
                    onClick={() => setShowIngestForm(false)}
                    className="text-[10px] font-mono text-slate-500 hover:text-slate-300"
                  >
                    Cancel
                  </button>
                </div>
                
                {ingestSuccess ? (
                  <div className="py-4 text-center text-sky-450 text-xs font-mono flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 animate-bounce" />
                    <span>Indexing chunk in semantic matrix...</span>
                  </div>
                ) : (
                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Document Title"
                        required
                        value={ingestTitle}
                        onChange={(e) => setIngestTitle(e.target.value)}
                        className="bg-slate-900 border border-slate-805 text-slate-200 p-2 rounded outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Source / Mapping Url"
                        required
                        value={ingestSource}
                        onChange={(e) => setIngestSource(e.target.value)}
                        className="bg-slate-900 border border-slate-805 text-slate-200 p-2 rounded outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={ingestSubject}
                        onChange={(e) => setIngestSubject(e.target.value)}
                        className="bg-slate-900 border border-slate-805 text-slate-350 p-1.5 rounded outline-none"
                      >
                        {CORE_SUBJECTS.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <select
                        value={ingestType}
                        onChange={(e) => setIngestType(e.target.value as any)}
                        className="bg-slate-900 border border-slate-805 text-slate-35 p-1.5 rounded outline-none"
                      >
                        <option value="Textbook">Textbook Chapter</option>
                        <option value="NPTEL">NPTEL Transcript</option>
                        <option value="Forum">GATE Overflow thread</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Paste unstructured notes text here to feed semantic queries..."
                      value={ingestContent}
                      required
                      onChange={(e) => setIngestContent(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-805 text-slate-200 p-2 rounded outline-none resize-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-1.5 bg-sky-505 bg-sky-500 hover:bg-sky-605 font-semibold text-slate-950 font-sans text-xs rounded transition-all cursor-pointer"
                    >
                      Crawl & Ingest Chunks
                    </button>
                  </div>
                )}
              </form>
            ) : (
              <div className="space-y-2 max-h-[22rem] overflow-y-auto pr-1">
                {searchResults.map((chunk, chunkIdx) => (
                  <div
                    key={chunkIdx}
                    className="bg-[#0D121F] hover:bg-slate-900/60 transition-all border border-slate-850 hover:border-slate-800 rounded-lg p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-mono text-sky-400 border border-sky-500/20 bg-sky-500/5 px-2 py-0.5 rounded truncate">
                        {chunk.topicTag}
                      </span>
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 border rounded uppercase tracking-wider ${getSourceBadgeColor(chunk.sourceType)}`}>
                        {chunk.sourceType}
                      </span>
                    </div>

                    <h4 className="text-xs font-sans font-semibold text-slate-200 truncate leading-none">
                      {chunk.title}
                    </h4>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-mono">
                      {chunk.content}
                    </p>

                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono pt-1.5 border-t border-slate-800/40">
                      <Link2 className="w-3 h-3 text-slate-600 shrink-0" />
                      <span className="truncate text-slate-500">{chunk.sourceUrl}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900/10 rounded-lg p-3 border border-slate-800/60 text-[10px] text-slate-500 font-mono flex items-start gap-1.5 shadow-inner">
          <Database className="w-3.5 h-3.5 text-slate-450 shrink-0 mt-0.5" />
          <span>OCR engine slices text files using a sliding overlap of 10% with bge-large semantic embeds model mapping logical structures.</span>
        </div>
      </div>

      {/* Synthesized study manual block */}
      <div className="lg:col-span-3 bg-[#0D121F] border border-slate-800 rounded-xl flex flex-col justify-between h-full overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-slate-905/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-400" />
            <h3 className="text-slate-200 font-sans font-semibold text-xs leading-none">
              Vector Synthesized Pedagogical Digest
            </h3>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 bg-slate-950/60 text-slate-500 uppercase tracking-widest border border-slate-800 rounded text-sky-450">
            RAG Pipeline Node
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isSearching ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
              <Terminal className="w-8 h-8 text-sky-400 animate-pulse" />
              <div className="space-y-2">
                <p className="text-sm font-mono text-slate-300">Executing semantic search matrix lookup...</p>
                <p className="text-xs font-mono text-slate-505">Querying hybrid pgvector HN-SW cache and compiling context vectors</p>
              </div>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-slate-300 text-xs md:text-sm font-normal">
              <LaTeXRenderer text={synthesizedAnswer} />
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-950/40 border-t border-slate-800 text-center text-[10px] font-mono text-slate-600 flex items-center justify-center gap-1">
          <span>LaTeX syntax supported. Delimiters matched:</span>
          <code className="px-1.5 py-0.5 text-slate-400 bg-slate-900 border border-slate-800 font-bold">$...$</code>
          <span>and</span>
          <code className="px-1.5 py-0.5 text-slate-400 bg-slate-900 border border-slate-800 font-bold">$$...$$</code>
        </div>
      </div>
    </div>
  );
};
