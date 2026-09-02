import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bot, ExternalLink, Send, X } from "lucide-react";
import {
  RESEARCH_GLOSSARY,
  RESEARCH_HELP,
  researchHelpFor,
} from "../data/researchGuide";
import { TOP_28_PEPTIDES } from "../data/catalogFocus";
import { UD_LABEL_BRAND } from "../data/udLabelAssets";

const STARTER_MESSAGE = {
  role: "bot",
  text:
    "Hi — welcome to Undisclosed. Ask about a listed peptide’s molecular target, laboratory research focus, COA testing, or calculator labels.",
};

function normalized(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[+]/g, " plus ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findPeptide(question) {
  const q = normalized(question);
  const names = [...new Set([...TOP_28_PEPTIDES, ...Object.keys(RESEARCH_HELP)])]
    .sort((a, b) => b.length - a.length);
  return names.find((name) => {
    const key = normalized(name);
    if (q.includes(key)) return true;
    const compactQ = q.replace(/\s+/g, "");
    const compactKey = key.replace(/\s+/g, "");
    return compactKey.length >= 3 && compactQ.includes(compactKey);
  });
}

function answerQuestion(question) {
  const q = normalized(question);
  if (!q) return "Ask me about a peptide, COA term, or calculator label.";

  if (
    /\b(dose|dosage|inject|injection|take|cycle|stack|patient|treat|cure)\b/.test(q)
  ) {
    return (
      "I can explain research mechanisms and calculator-label math, but I can’t " +
      "recommend human dosing, administration, treatment, or clinical use. " +
      "Undisclosed products are for laboratory research only."
    );
  }

  const peptide = findPeptide(question);
  if (peptide) {
    return `${peptide}: ${researchHelpFor(peptide)} This is educational laboratory context, not medical advice.`;
  }

  const glossary = RESEARCH_GLOSSARY.find(({ term }) => {
    const key = normalized(term);
    return q.includes(key) || key.includes(q);
  });
  if (glossary) return `${glossary.term}: ${glossary.def}`;

  if (/\b(coa|certificate|purity|testing|test|hplc|mass fill)\b/.test(q)) {
    return (
      "A COA should identify the tested material, method, date, purity result, " +
      "and—when available—mass-fill or identity data. HPLC estimates purity and " +
      "quantity; independent third-party testing is preferable."
    );
  }

  if (/\b(label|calculator|reconstitution|bac water|concentration|range)\b/.test(q)) {
    return (
      "The calculator label displays diluent volume, calculated concentration, " +
      "and your editable minimum-to-maximum research range. It is laboratory " +
      "math, not manufacturer labeling or human-use guidance."
    );
  }

  if (/\b(list|catalog|available|peptides)\b/.test(q)) {
    return `The focused catalog currently covers ${TOP_28_PEPTIDES.length} compound families, including ${TOP_28_PEPTIDES.slice(0, 8).join(", ")}, and more. Use the catalog filters to browse all research areas.`;
  }

  return (
    "I don’t have a verified answer for that in the curated knowledge base yet. " +
    "Try a peptide name, COA, HPLC, mass fill, BAC water, concentration, or label range."
  );
}

export default function SentinelKnowledgeChat({
  open,
  onClose,
  onBrowseCatalog,
  onOpenCalculator,
  onHumanSupport,
}) {
  const [messages, setMessages] = useState([STARTER_MESSAGE]);
  const [input, setInput] = useState("");
  const inputRef = useRef(null);
  const logRef = useRef(null);
  const suggestions = useMemo(
    () => ["Retatrutide", "What does HPLC show?", "Explain label range"],
    []
  );

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages]);

  function ask(value) {
    const question = String(value || input).trim();
    if (!question) return;
    setMessages((current) => [
      ...current,
      { role: "user", text: question },
      { role: "bot", text: answerQuestion(question) },
    ]);
    setInput("");
  }

  if (!open) return null;

  return (
    <aside
      className="sentinel-chat"
      role="dialog"
      aria-modal="false"
      aria-label="Undisclosed chat"
    >
      <header className="sentinel-chat-head">
        <img
          src={UD_LABEL_BRAND.whiteTransparent}
          alt=""
          width={40}
          height={40}
        />
        <div>
          <span><i aria-hidden="true" /> Online now</span>
          <strong>Undisclosed</strong>
        </div>
        <button type="button" onClick={onClose} aria-label="Close chat">
          <X size={18} />
        </button>
      </header>

      <div className="sentinel-chat-log" ref={logRef} aria-live="polite">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`sentinel-message sentinel-message--${message.role}`}
          >
            {message.role === "bot" && <Bot size={14} aria-hidden="true" />}
            <p>{message.text}</p>
          </div>
        ))}
      </div>

      {messages.length === 1 && (
        <div className="sentinel-suggestions">
          {suggestions.map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              onClick={() => ask(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form
        className="sentinel-chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          ask();
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about peptide research…"
          aria-label="Ask a question"
        />
        <button type="submit" disabled={!input.trim()} aria-label="Send question">
          <Send size={17} />
        </button>
      </form>

      <nav className="sentinel-chat-tools" aria-label="Chat tools">
        <button type="button" onClick={onBrowseCatalog}>Browse catalog</button>
        <button type="button" onClick={onOpenCalculator}>Calculator</button>
        <button type="button" onClick={onHumanSupport}>
          Human support <ExternalLink size={12} />
        </button>
      </nav>
      <p className="sentinel-chat-disclaimer">
        Curated educational content · laboratory research only · no medical advice
      </p>
    </aside>
  );
}
