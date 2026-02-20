import { useState, useEffect, useCallback, useRef, useMemo } from "react";

const WORD_POOL = [
  "the",
  "be",
  "of",
  "and",
  "a",
  "to",
  "in",
  "he",
  "have",
  "it",
  "that",
  "for",
  "they",
  "with",
  "as",
  "not",
  "on",
  "she",
  "at",
  "by",
  "this",
  "we",
  "you",
  "do",
  "but",
  "from",
  "or",
  "which",
  "one",
  "would",
  "all",
  "will",
  "there",
  "say",
  "who",
  "make",
  "when",
  "can",
  "more",
  "if",
  "no",
  "man",
  "out",
  "other",
  "so",
  "what",
  "time",
  "up",
  "go",
  "about",
  "than",
  "into",
  "could",
  "state",
  "only",
  "new",
  "year",
  "some",
  "take",
  "come",
  "these",
  "know",
  "see",
  "use",
  "get",
  "like",
  "then",
  "first",
  "any",
  "work",
  "now",
  "may",
  "such",
  "give",
  "over",
  "think",
  "most",
  "even",
  "find",
  "day",
  "also",
  "after",
  "way",
  "many",
  "must",
  "look",
  "before",
  "great",
  "back",
  "through",
  "long",
  "where",
  "much",
  "should",
  "well",
  "people",
  "down",
  "own",
  "just",
  "because",
  "good",
  "each",
  "those",
  "feel",
  "seem",
  "how",
  "high",
  "too",
  "place",
  "little",
  "world",
  "very",
  "still",
  "nation",
  "hand",
  "old",
  "life",
  "tell",
  "write",
  "become",
  "here",
  "show",
  "house",
  "both",
  "between",
  "need",
  "mean",
  "call",
  "develop",
  "under",
  "last",
  "right",
  "move",
  "thing",
  "general",
  "school",
  "never",
  "same",
  "another",
  "begin",
  "while",
  "number",
  "part",
  "turn",
  "real",
  "leave",
  "might",
  "want",
  "point",
  "form",
  "off",
  "child",
  "few",
  "small",
  "since",
  "against",
  "ask",
  "late",
  "home",
  "interest",
  "large",
  "person",
  "end",
  "open",
  "public",
  "follow",
  "during",
  "present",
  "without",
  "again",
  "hold",
  "govern",
  "around",
  "possible",
  "head",
  "consider",
  "word",
  "program",
  "problem",
  "however",
  "lea",
  "system",
  "set",
  "order",
  "eye",
  "plan",
  "run",
  "keep",
  "face",
  "fact",
  "group",
  "play",
  "stand",
  "increase",
  "early",
  "course",
  "change",
  "help",
  "line",
];

function pickWords(count, withPunc, withCaps) {
  const words = [];
  for (let i = 0; i < count; i++) {
    let word = WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];

    // Random Capitalization
    if (withCaps && Math.random() < 0.2) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }

    // Random Punctuation (never on first word, force on last word if punc is on)
    if (withPunc) {
      if (i === count - 1) {
        word += ".";
      } else if (i > 0 && Math.random() < 0.1) {
        word += Math.random() < 0.5 ? "," : ".";
      }
    }

    words.push(word);
  }

  // Format consistent casing if caps is OFF (just in case pool has mixed)
  if (!withCaps) {
    return words.map((w) => w.toLowerCase());
  }

  return words;
}

const WORD_OPTIONS = [10, 15, 30, 40];

export default function TypingTest() {
  const [wordCount, setWordCount] = useState(30);
  const [usePunctuation, setUsePunctuation] = useState(false);
  const [useCapitals, setUseCapitals] = useState(false);
  const [words, setWords] = useState(() => pickWords(30, false, false));
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | running | done
  const [elapsed, setElapsed] = useState(0);
  const [wpmHistory, setWpmHistory] = useState([]);
  const [finalStats, setFinalStats] = useState(null);
  const [caretVisible, setCaretVisible] = useState(true);
  const [focused, setFocused] = useState(false);
  const [liveWpm, setLiveWpm] = useState(0);

  const textareaRef = useRef(null);
  const wordsRef = useRef(null);
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const lastSecRef = useRef(0);

  // ── Derived from raw input ─────────────────────────────────────────────────
  const typedWords = useMemo(() => input.split(" "), [input]);
  const wordIdx = Math.min(typedWords.length - 1, words.length - 1);
  const charIdx = typedWords[wordIdx]?.length ?? 0;
  const completedCount = typedWords.length - 1; // words submitted (space pressed)

  // ── Caret blink ───────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setCaretVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);
  const resetCaret = useCallback(() => setCaretVisible(true), []);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== "running") return;
    timerRef.current = setInterval(() => {
      const sec = (Date.now() - startRef.current) / 1000;
      setElapsed(Math.round(sec));

      // per-second WPM snapshot
      const s = Math.floor(sec);
      if (s > lastSecRef.current) {
        lastSecRef.current = s;
        const snap = textareaRef.current?.value ?? "";
        const snapWords = snap.split(" ");
        const correct = snapWords
          .slice(0, -1)
          .filter((w, i) => w === words[i]).length;
        const wpm = sec > 0 ? Math.round((correct / sec) * 60) : 0;
        setLiveWpm(wpm);
        setWpmHistory((prev) => [...prev, { sec: s, wpm }]);
      }
    }, 100);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ── Finish ────────────────────────────────────────────────────────────────
  // Accepts the current input string directly so we don't race with textarea ref
  const finishTest = useCallback(
    (currentInput) => {
      clearInterval(timerRef.current);
      const sec = (Date.now() - startRef.current) / 1000;
      const snap = currentInput ?? textareaRef.current?.value ?? "";
      const snapWords = snap.split(" ");
      // Use words.length (actual sentence) NOT wordCount (selected option)
      const completed = snapWords.slice(0, words.length);
      const correct = completed.filter((w, i) => w === words[i]).length;
      const wrong = completed.length - correct;

      let correctChars = 0,
        totalChars = 0;
      completed.forEach((w, i) => {
        const target = words[i] ?? "";
        totalChars += w.length;
        for (let c = 0; c < w.length; c++) {
          if (w[c] === target[c]) correctChars++;
        }
      });
      const acc =
        totalChars > 0
          ? Math.min(100, Math.round((correctChars / totalChars) * 100))
          : 100;
      const netWpm = sec > 0 ? Math.round((correct / sec) * 60) : 0;
      const rawWpm = sec > 0 ? Math.round((completed.length / sec) * 60) : 0;

      setWpmHistory((prev) => [...prev, { sec: Math.round(sec), wpm: netWpm }]);
      setFinalStats({
        netWpm,
        rawWpm,
        acc,
        correct,
        wrong,
        elapsed: Math.round(sec),
      });
      setStatus("done");
    },
    [words],
  );

  // ── Restart (same word count) ─────────────────────────────────────────────
  const restart = useCallback(() => {
    clearInterval(timerRef.current);
    setWords(pickWords(wordCount, usePunctuation, useCapitals));
    setInput("");
    setStatus("idle");
    setElapsed(0);
    setLiveWpm(0);
    setWpmHistory([]);
    setFinalStats(null);
    startRef.current = null;
    lastSecRef.current = 0;
    if (wordsRef.current) wordsRef.current.scrollTop = 0;
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [wordCount, usePunctuation, useCapitals]);

  // ── Change word count ─────────────────────────────────────────────────────
  const changeWordCount = useCallback((n) => setWordCount(n), []);

  // ── Toggle settings (Caps/Punc) ──────────────────────────────────────────
  const togglePunctuation = useCallback(() => setUsePunctuation((p) => !p), []);
  const toggleCapitals = useCallback(() => setUseCapitals((c) => !c), []);

  // ── Auto-restart when settings change ─────────────────────────────────────
  useEffect(() => {
    restart();
  }, [restart]);

  // ── Input handler ─────────────────────────────────────────────────────────
  const handleChange = useCallback(
    (e) => {
      if (status === "done") return;
      resetCaret();
      const val = e.target.value;

      if (status === "idle" && val.length > 0) {
        startRef.current = Date.now();
        lastSecRef.current = 0;
        setWpmHistory([]);
        setStatus("running");
      }

      const parts = val.split(" ");
      const spacesTyped = parts.length - 1;
      const totalWords = words.length; // actual sentence length, NOT wordCount

      // Path A: user pressed space after the last word
      if (spacesTyped >= totalWords) {
        setInput(val);
        finishTest(val);
        return;
      }

      setInput(val);

      // Path B: last word typed completely and correctly — no space needed
      const currentWordIdx = Math.min(spacesTyped, totalWords - 1);
      const currentTyped = parts[currentWordIdx] ?? "";
      const targetWord = words[currentWordIdx] ?? "";
      if (
        currentWordIdx === totalWords - 1 && // on the actual last word
        currentTyped.length === targetWord.length && // same length
        currentTyped === targetWord // exact match
      ) {
        finishTest(val);
        return;
      }

      // Auto-scroll to keep current word visible
      requestAnimationFrame(() => {
        const container = wordsRef.current;
        if (!container) return;
        const active = container.querySelector(".word-active");
        if (active) {
          const containerTop = container.getBoundingClientRect().top;
          const wordTop = active.getBoundingClientRect().top;
          if (wordTop - containerTop >= 48 * 2) container.scrollTop += 48;
        }
      });
    },
    [status, wordCount, words, finishTest, resetCaret],
  );

  const handleKeyDown = useCallback(
    (e) => {
      resetCaret();
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        restart();
        return;
      }
      // Block backspace at word boundary
      if (e.key === "Backspace") {
        const val = textareaRef.current?.value ?? "";
        if (val.endsWith(" ")) {
          e.preventDefault();
          return;
        }
      }
      if (e.key === "Tab") e.preventDefault();
    },
    [resetCaret, restart],
  );

  const isDone = status === "done";
  const isRunning = status === "running";
  const isIdle = status === "idle";
  // Include partial progress of the current word being typed (char-level)
  // Force 1.0 when done so the bar always reaches the end
  const currentWordProgress = isDone
    ? 1
    : wordCount > 0 && words[wordIdx]?.length > 0
      ? (completedCount + charIdx / words[wordIdx].length) / wordCount
      : completedCount / wordCount;
  const progress = Math.min(isDone ? 1 : currentWordProgress, 1);

  // ── Global Shortcut ──
  useGlobalShortcut(restart);

  return (
    <div className="flex flex-col gap-5" style={{ cursor: "text" }}>
      {/* ── Settings Bar (MonkeyType style) ── */}
      <div className="flex items-center justify-between bg-black/20 rounded-xl p-2 px-4 backdrop-blur-sm border border-white/5">
        <div className="flex items-center gap-6">
          {/* Settings Group: Punctuation & Caps */}
          <div className="flex items-center gap-1">
            <button
              onClick={togglePunctuation}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                usePunctuation
                  ? "text-indigo-400 bg-indigo-500/10"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className="opacity-70">@</span>
              <span className="hidden sm:inline">punctuation</span>
            </button>
            <button
              onClick={toggleCapitals}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                useCapitals
                  ? "text-indigo-400 bg-indigo-500/10"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className="opacity-70">Aa</span>
              <span className="hidden sm:inline">caps</span>
            </button>
          </div>

          <div className="w-px h-4 bg-white/10" />

          {/* Word Count Selector */}
          <div className="flex items-center gap-1">
            {WORD_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => changeWordCount(n)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  wordCount === n
                    ? "text-indigo-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {n}
              </button>
            ))}
            <span className="text-xs text-slate-600 ml-1 font-mono">words</span>
          </div>
        </div>

        {/* Timer / WPM Display */}
        <div className="flex items-center gap-4">
          {isRunning && (
            <div className="text-2xl font-black text-indigo-500 leading-none">
              {liveWpm}
            </div>
          )}
          {!isRunning && status === "idle" && (
            <div className="text-xs text-slate-600 font-mono">
              start typing...
            </div>
          )}
        </div>
      </div>

      {/* ── Word display ── */}
      <div
        ref={wordsRef}
        onClick={() => textareaRef.current?.focus()}
        className="relative overflow-hidden rounded-xl"
        style={{ height: 144, lineHeight: "48px" }}
      >
        {/* Unfocused overlay */}
        {!focused && !isDone && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-xl backdrop-blur-sm"
            style={{ background: "rgba(15,23,42,0.75)" }}
          >
            <span className="text-sm font-mono" style={{ color: "#6366f199" }}>
              click to focus
            </span>
          </div>
        )}

        {/* Fade top/bottom */}
        <div
          className="absolute inset-x-0 top-0 h-4 z-[5] pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(15,23,42,1), transparent)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-4 z-[5] pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(15,23,42,1), transparent)",
          }}
        />

        <div
          className="flex flex-wrap content-start gap-x-3"
          style={{ padding: "0 2px" }}
        >
          {words.map((word, wi) => {
            const typedWord = typedWords[wi] ?? "";
            const isCompleted = wi < wordIdx;
            const isCurrent = wi === wordIdx;
            const isPending = wi > wordIdx;

            return (
              <span
                key={wi}
                className={isCurrent ? "word-active" : ""}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  position: "relative",
                  height: 48,
                }}
              >
                {/* Characters */}
                {word.split("").map((ch, ci) => {
                  let color;
                  if (isPending) {
                    color = "#334155";
                  } else if (isCompleted) {
                    color = typedWord[ci] === ch ? "#94a3b8" : "#ef4444";
                  } else {
                    if (ci < typedWord.length) {
                      color = typedWord[ci] === ch ? "#e2e8f0" : "#ef4444";
                    } else {
                      color = "#475569";
                    }
                  }
                  const showCaret =
                    isCurrent && ci === charIdx && caretVisible && focused;
                  return (
                    <span key={ci} style={{ position: "relative" }}>
                      {showCaret && (
                        <span
                          style={{
                            position: "absolute",
                            left: -1.5,
                            top: 8,
                            bottom: 8,
                            width: 2,
                            borderRadius: 1,
                            background: "#6366f1",
                            boxShadow: "0 0 8px #6366f1",
                          }}
                        />
                      )}
                      <span
                        style={{
                          color,
                          fontFamily: "JetBrains Mono, Consolas, monospace",
                          fontSize: 20,
                        }}
                      >
                        {ch}
                      </span>
                    </span>
                  );
                })}

                {/* Extra characters */}
                {isCurrent &&
                  typedWord.length > word.length &&
                  typedWord
                    .slice(word.length)
                    .split("")
                    .map((ch, ei) => (
                      <span
                        key={`x${ei}`}
                        style={{
                          color: "#dc2626",
                          fontFamily: "JetBrains Mono, Consolas, monospace",
                          fontSize: 20,
                          background: "rgba(220,38,38,0.12)",
                          borderRadius: 2,
                        }}
                      >
                        {ch}
                      </span>
                    ))}

                {/* Caret at end */}
                {isCurrent &&
                  charIdx >= word.length &&
                  caretVisible &&
                  focused && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: 26,
                        borderRadius: 1,
                        marginLeft: 1,
                        verticalAlign: "middle",
                        background: "#6366f1",
                        boxShadow: "0 0 8px #6366f1",
                      }}
                    />
                  )}

                {/* Wrong-word underline */}
                {isCompleted && typedWord !== word && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 8,
                      left: 0,
                      right: 0,
                      height: 2,
                      borderRadius: 1,
                      background: "#ef44444d",
                    }}
                  />
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* Hidden textarea */}
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={isDone}
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
          width: 1,
          height: 1,
        }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />

      {/* ── Progress bar ── */}
      {!isDone && (
        <div
          className="h-0.5 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{
              width: `${progress * 100}%`,
              background: "linear-gradient(90deg,#6366f1,#22d3ee)",
            }}
          />
        </div>
      )}

      {/* ── Result Modal (on top of everything) ── */}
      {isDone && finalStats && (
        <ResultModal
          stats={finalStats}
          wpmHistory={wpmHistory}
          wordCount={wordCount}
          onRestart={restart}
        />
      )}

      {/* ── Hint ── */}
      {!isDone && (
        <p
          className="text-center text-xs font-mono"
          style={{ color: "#6366f122" }}
        >
          <kbd
            style={{
              padding: "1px 5px",
              borderRadius: 4,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#6366f155",
              fontSize: 10,
            }}
          >
            Ctrl
          </kbd>
          {" + "}
          <kbd
            style={{
              padding: "1px 5px",
              borderRadius: 4,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#6366f155",
              fontSize: 10,
            }}
          >
            Enter
          </kbd>
          {" to restart"}
        </p>
      )}
    </div>
  );
}

// ── Result card ───────────────────────────────────────────────────────────────
// ── Global Shortcut Hook ────────────────────────────────────────────────────
function useGlobalShortcut(onRestart) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        onRestart();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onRestart]);
}

// ── Result Modal ──────────────────────────────────────────────────────────────
function ResultModal({ stats, wpmHistory, wordCount, onRestart }) {
  const { netWpm, rawWpm, acc, correct, wrong, elapsed } = stats;
  // Calculate max WPM for scaling, with a minimum of 10 to avoid flat lines
  const maxWpm = Math.max(...wpmHistory.map((p) => p.wpm), 10);
  const chartHeight = 120;
  const chartWidth = 500;

  // Generate points for the graph
  const points = wpmHistory
    .map((p, i) => {
      const x = (i / (wpmHistory.length - 1 || 1)) * chartWidth;
      const y = chartHeight - (p.wpm / maxWpm) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  // Generate grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = chartHeight * ratio;
    const val = Math.round(maxWpm * (1 - ratio));
    return (
      <g key={ratio}>
        <line
          x1="0"
          y1={y}
          x2={chartWidth}
          y2={y}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
        <text
          x="-10"
          y={y + 3}
          textAnchor="end"
          fontSize="10"
          fill="rgba(255,255,255,0.3)"
          fontFamily="monospace"
        >
          {val}
        </text>
      </g>
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-[#0f172a] rounded-2xl border border-indigo-500/20 shadow-2xl overflow-hidden p-8 flex flex-col gap-8 animate-scale-in"
        style={{ boxShadow: "0 0 50px rgba(99,102,241,0.15)" }}
      >
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-white">Test Complete</h2>
            <div
              className="inline-block px-3 py-1 rounded-full text-xs font-bold w-fit"
              style={{
                background:
                  netWpm >= 80
                    ? "rgba(16,185,129,0.15)"
                    : netWpm >= 60
                      ? "rgba(245,158,11,0.15)"
                      : "rgba(99,102,241,0.15)",
                color:
                  netWpm >= 80
                    ? "#34d399"
                    : netWpm >= 60
                      ? "#fbbf24"
                      : "#818cf8",
              }}
            >
              {netWpm >= 100
                ? "🚀 Expert"
                : netWpm >= 80
                  ? "⚡ Fast"
                  : netWpm >= 60
                    ? "✅ Good"
                    : "📈 Keep Going"}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono uppercase tracking-widest text-indigo-400/50 mb-1">
              net wpm
            </div>
            <div className="text-6xl font-black font-mono text-indigo-100 leading-none">
              {netWpm}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-4">
          <Stat label="raw" value={rawWpm} />
          <Stat
            label="acc"
            value={`${acc}%`}
            color={acc >= 95 ? "#34d399" : acc >= 80 ? "#fbbf24" : "#f87171"}
          />
          <Stat label="correct" value={correct} color="#34d399" />
          <Stat
            label="wrong"
            value={wrong}
            color={wrong > 0 ? "#f87171" : "#4b5563"}
          />
          <Stat label="time" value={`${elapsed}s`} />
        </div>

        {/* Graph */}
        {wpmHistory.length > 1 && (
          <div className="pl-6 pt-2">
            <div className="text-xs font-mono mb-2 text-indigo-400/40">
              wpm history
            </div>
            <svg
              width="100%"
              height={chartHeight}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ overflow: "visible" }}
            >
              {gridLines}
              <defs>
                <linearGradient id="wpmFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon
                points={`0,${chartHeight} ${points} ${chartWidth},${chartHeight}`}
                fill="url(#wpmFill)"
              />
              <polyline
                points={points}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Dots for each point */}
              {wpmHistory.map((p, i) => {
                const x = (i / (wpmHistory.length - 1 || 1)) * chartWidth;
                const y = chartHeight - (p.wpm / maxWpm) * chartHeight;
                return <circle key={i} cx={x} cy={y} r="1.5" fill="#818cf8" />;
              })}
            </svg>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-center gap-4 mt-2">
          <button
            onClick={onRestart}
            className="group relative px-6 py-3 rounded-xl font-bold text-sm bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 hover:scale-105 active:scale-95 transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-500/50"
            autoFocus
          >
            <span>🔄 Try Again</span>
            <div className="absolute inset-0 rounded-xl ring-1 ring-white/10 group-hover:ring-white/20" />
          </button>
          <div className="flex items-center gap-1.5 text-xs font-mono text-indigo-400/40">
            press{" "}
            <kbd className="px-1.5 py-0.5 roundedElement bg-white/5 border border-white/10 text-indigo-300/60">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="px-1.5 py-0.5 roundedElement bg-white/5 border border-white/10 text-indigo-300/60">
              Enter
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color = "#64748b" }) {
  return (
    <div className="bg-white/5 rounded-lg p-3 border border-white/5 flex flex-col items-center">
      <div className="text-[10px] font-mono uppercase tracking-widest text-indigo-300/40 mb-1">
        {label}
      </div>
      <div className="text-xl font-bold font-mono" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
