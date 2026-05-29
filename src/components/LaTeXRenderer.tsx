import React from "react";

interface LaTeXRendererProps {
  text: string;
}

/**
 * A robust, reliable inline and block LaTeX-to-HTML formatting parser.
 * It identifies inline math ($...$) and block math ($$...$$) 
 * and styles them into elegant LaTeX-like high-contrast mathematical notation.
 */
export const LaTeXRenderer: React.FC<LaTeXRendererProps> = ({ text }) => {
  if (!text) return null;

  // Split content into blocks to identify $$...$$ first, then $...$
  const parseBlocks = (str: string): React.ReactNode[] => {
    // Regex to split by block math $$...$$
    const blockParts = str.split(/(\$\$.*?\$\$)/gs);
    
    return blockParts.map((blockPart, blockIdx) => {
      if (blockPart.startsWith("$$") && blockPart.endsWith("$$")) {
        const mathContent = blockPart.slice(2, -2).trim();
        return (
          <div
            key={`block-${blockIdx}`}
            className="my-4 p-4 text-center overflow-x-auto bg-zinc-900/50 rounded-lg border border-zinc-800 font-mono text-emerald-400 font-semibold text-sm leading-relaxed whitespace-pre-wrap md:text-base"
          >
            {/* Clean up escaped sequences for better reading */}
            {mathContent
              .replace(/\\{2}/g, "\n")
              .replace(/\\quad/g, "   ")
              .replace(/\\mid/g, " | ")
              .replace(/\\in/g, " ∈ ")
              .replace(/\\subseteq/g, " ⊆ ")
              .replace(/\\union/g, " ∪ ")
              .replace(/\\intersect/g, " ∩ ")
              .replace(/\\mathcal/g, " ")
              .replace(/\\Sigma/g, "Σ")
              .replace(/\\emptyset/g, "Ø")
              .replace(/\\lceil/g, "⌈")
              .replace(/\\rceil/g, "⌉")
              .replace(/\\log_2/g, "log₂")
              .replace(/\\log/g, "log")
              .replace(/\\ge/g, "≥")
              .replace(/\\le/g, "≤")
              .replace(/\\vdash/g, " ⊢ ")
              .replace(/\\times/g, " × ")
              .replace(/\\theta/g, "θ")
              .replace(/\\alpha/g, "α")
              .replace(/\\beta/g, "β")
              .replace(/\\gamma/g, "γ")
              .replace(/\\sum/g, "Σ")}
          </div>
        );
      }

      // Inside normal block, search for inline math $...$
      const inlineParts = blockPart.split(/(\$.*?\$)/g);
      return (
        <span key={`text-${blockIdx}`}>
          {inlineParts.map((inlinePart, inlineIdx) => {
            if (inlinePart.startsWith("$") && inlinePart.endsWith("$")) {
              const inlineMath = inlinePart.slice(1, -1).trim();
              return (
                <code
                  key={`inline-${inlineIdx}`}
                  className="px-1.5 py-0.5 mx-1 font-mono text-emerald-300 bg-zinc-900 rounded border border-zinc-800/80 font-bold text-xs"
                >
                  {inlineMath
                    .replace(/\\in/g, "∈")
                    .replace(/\\subseteq/g, "⊆")
                    .replace(/\\union/g, "∪")
                    .replace(/\\intersect/g, "∩")
                    .replace(/\\mid/g, "|")
                    .replace(/\\le/g, "≤")
                    .replace(/\\ge/g, "≥")
                    .replace(/\\log_2/g, "log₂")
                    .replace(/\\theta/g, "θ")
                    .replace(/\\alpha/g, "α")
                    .replace(/\\beta/g, "β")
                    .replace(/\\gamma/g, "γ")
                    .replace(/\\times/g, "×")}
                </code>
              );
            }
            
            // Render normal text chunk with simple line break matching
            return inlinePart.split("\n").map((line, lineIdx, arr) => (
              <React.Fragment key={`line-${inlineIdx}-${lineIdx}`}>
                {line}
                {lineIdx < arr.length - 1 && <br />}
              </React.Fragment>
            ));
          })}
        </span>
      );
    });
  };

  return <p className="leading-relaxed whitespace-pre-wrap">{parseBlocks(text)}</p>;
};
