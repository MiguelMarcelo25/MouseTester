import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ── Sentence pool grouped by approximate word count ───────────────────────────
const SENTENCES = {
  10: [
    "the quick brown fox jumps over the lazy dog",
    "she sells sea shells by the sea shore",
    "all good things must come to an end",
    "a journey of a thousand miles begins with one step",
    "every cloud has a silver lining inside it",
    "actions speak louder than words ever could",
    "practice makes perfect no matter what you do",
    "time flies when you are having fun today",
    "do not judge a book by its cover",
    "an apple a day keeps the doctor away",
  ],
  15: [
    "the best way to predict the future is to create it yourself",
    "you miss one hundred percent of the shots you do not take",
    "in the middle of every difficulty lies a great opportunity for growth",
    "it does not matter how slowly you go as long as you do not stop",
    "success is not final and failure is not fatal it is the courage to continue",
    "the only way to do great work is to love what you do each day",
    "life is what happens to you while you are busy making other plans for yourself",
    "the greatest glory in living lies not in never falling but in rising every time",
    "your time is limited so do not waste it living someone else life instead",
    "the future belongs to those who believe in the beauty of their own dreams today",
  ],
  30: [
    "the quick brown fox jumps over the lazy dog near the river bank on a warm and sunny afternoon in the middle of summer",
    "she opened the old wooden door and stepped into a room filled with warm golden light that made her feel safe and welcome at home",
    "learning to type faster takes daily practice and a strong desire to improve your skills over time so never give up on yourself",
    "the stars above the quiet mountain village glowed brightly on the cold and clear winter night while everyone was asleep inside",
    "he packed his bags early in the morning and set off on a long journey across the country to see his family again",
    "every morning she would sit by the window drink her coffee and watch the world slowly wake up before starting her busy day",
    "writing clean and readable code is one of the most important skills any software developer can have and it takes years to master",
    "the children played in the park all afternoon laughing and chasing each other through the green grass while their parents watched nearby",
    "technology has changed the way people communicate work and spend their free time over the past two decades in ways nobody expected",
    "the old clock on the wall ticked steadily as the afternoon sun cast long shadows across the floor of the quiet empty room",
  ],
  40: [
    "the quick brown fox jumps over the lazy dog near the river bank on a warm and sunny afternoon in the middle of summer while the birds sing loudly in the tall trees above and a gentle breeze moves through the long green grass",
    "she opened the old wooden door and stepped into a room filled with warm golden light that made her feel safe and welcome and right away she knew that this was the place she had been searching for her entire life",
    "learning to type faster takes daily practice patience and a strong desire to improve your skills over time and if you commit to practicing every single day you will be amazed at how much progress you can make in just a few weeks",
    "the stars above the quiet mountain village glowed brightly on the cold and clear winter night while everyone was asleep inside their homes dreaming of warmer days and the first green signs of spring that would soon come to the valley",
    "he packed his bags early in the morning and set off on a long journey across the country to see his family again after being away for more than three years working in a city far from the place where he grew up",
    "every morning she would sit by the window drink her coffee and watch the world slowly wake up around her before starting her busy day filled with meetings calls and the thousand small decisions that made up the rhythm of her working life",
    "writing clean and readable code is one of the most important skills any software developer can have and it takes years of practice and careful attention to detail to develop the habits and instincts that make a truly great programmer stand out from the rest",
    "the children played in the park all afternoon laughing and chasing each other through the green grass while their parents sat nearby on wooden benches talking quietly and watching the sun begin its slow descent toward the horizon at the end of the day",
    "technology has changed the way people communicate work and spend their free time over the past two decades in ways that nobody could have predicted and the pace of change shows no sign of slowing down as new tools and ideas emerge every single year",
    "the old clock on the wall ticked steadily as the afternoon sun cast long shadows across the floor of the quiet empty room and outside the window the leaves of the tall oak trees rustled softly in a warm and gentle wind from the south",
  ],
};

function pickWords(n) {
  const bucket = SENTENCES[n] ?? SENTENCES[30];
  const sentence = bucket[Math.floor(Math.random() * bucket.length)];
  return sentence.split(" ");
}

const WORD_OPTIONS = [10, 15, 30, 40];

export default function TypingTest() {
  const [wordCount, setWordCount] = useState(30);
  const [words, setWords] = useState(() => pickWords(30));
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

  // ── Change word count ─────────────────────────────────────────────────────
  const changeWordCount = useCallback((n) => {
    clearInterval(timerRef.current);
    setWordCount(n);
    setWords(pickWords(n));
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
  }, []);

  // ── Restart (same word count) ─────────────────────────────────────────────
  const restart = useCallback(() => {
    clearInterval(timerRef.current);
    setWords(pickWords(wordCount));
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
  }, [wordCount]);

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

  return (
    <div className="flex flex-col gap-5" style={{ cursor: "text" }}>
      {/* ── Word count selector ── */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono mr-1" style={{ color: "#6366f144" }}>
          words
        </span>
        {WORD_OPTIONS.map((n) => (
          <button
            key={n}
            onClick={() => changeWordCount(n)}
            className="px-3 py-1 rounded-lg font-mono text-sm transition-all duration-150 hover:scale-105"
            style={{
              background:
                wordCount === n ? "rgba(99,102,241,0.2)" : "transparent",
              color: wordCount === n ? "#818cf8" : "#475569",
              border: `1px solid ${wordCount === n ? "rgba(99,102,241,0.4)" : "transparent"}`,
              fontWeight: wordCount === n ? 700 : 400,
            }}
          >
            {n}
          </button>
        ))}

        {/* Spacer + timer/WPM */}
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          {isRunning && (
            <span
              className="font-mono text-sm tabular-nums"
              style={{ color: "#6366f166" }}
            >
              {liveWpm} wpm
            </span>
          )}
          <span
            className="font-mono font-bold text-xl tabular-nums"
            style={{ color: isRunning ? "#6366f1" : "#6366f133", minWidth: 36 }}
          >
            {elapsed}s
          </span>
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

      {/* ── Result card ── */}
      {isDone && finalStats && (
        <ResultCard
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
function ResultCard({ stats, wpmHistory, wordCount, onRestart }) {
  const { netWpm, rawWpm, acc, correct, wrong, elapsed } = stats;
  const maxWpm = Math.max(...wpmHistory.map((p) => p.wpm), 1);

  return (
    <div
      className="animate-fade-in-up flex flex-col gap-5 rounded-2xl p-6"
      style={{
        background: "rgba(99,102,241,0.06)",
        border: "1px solid rgba(99,102,241,0.18)",
      }}
    >
      {/* Stats row */}
      <div className="flex items-end gap-10 flex-wrap">
        <div>
          <div
            className="text-xs font-mono uppercase tracking-widest mb-1"
            style={{ color: "#6366f166" }}
          >
            wpm
          </div>
          <div
            className="text-7xl font-black font-mono leading-none"
            style={{ color: "#e2e8f0" }}
          >
            {netWpm}
          </div>
        </div>
        <div className="flex gap-8 pb-2 flex-wrap">
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
          <Stat label="words" value={wordCount} />
        </div>
      </div>

      {/* WPM sparkline */}
      {wpmHistory.length > 1 && (
        <div>
          <div
            className="text-xs font-mono mb-2"
            style={{ color: "#6366f144" }}
          >
            wpm history
          </div>
          <svg
            width="100%"
            height="64"
            style={{ overflow: "visible" }}
            viewBox={`0 0 ${wpmHistory.length} 64`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="wpmFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>
            {(() => {
              const pts = wpmHistory.map(
                (p, i) => `${i},${64 - (p.wpm / maxWpm) * 58}`,
              );
              return (
                <>
                  <polygon
                    points={`0,64 ${pts.join(" ")} ${wpmHistory.length - 1},64`}
                    fill="url(#wpmFill)"
                  />
                  <polyline
                    points={pts.join(" ")}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  {wpmHistory.map((p, i) => (
                    <circle
                      key={i}
                      cx={i}
                      cy={64 - (p.wpm / maxWpm) * 58}
                      r="1.2"
                      fill="#818cf8"
                    />
                  ))}
                </>
              );
            })()}
          </svg>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 flex-wrap">
        <div
          className="inline-block px-4 py-1.5 rounded-full text-sm font-bold"
          style={{
            background:
              netWpm >= 80
                ? "rgba(16,185,129,0.12)"
                : netWpm >= 60
                  ? "rgba(245,158,11,0.12)"
                  : "rgba(99,102,241,0.12)",
            border: `1px solid ${netWpm >= 80 ? "rgba(16,185,129,0.35)" : netWpm >= 60 ? "rgba(245,158,11,0.35)" : "rgba(99,102,241,0.35)"}`,
            color:
              netWpm >= 80 ? "#34d399" : netWpm >= 60 ? "#fbbf24" : "#818cf8",
          }}
        >
          {netWpm >= 100
            ? "🚀 Expert"
            : netWpm >= 80
              ? "⚡ Fast"
              : netWpm >= 60
                ? "✅ Good"
                : netWpm >= 40
                  ? "📈 Average"
                  : "🐢 Keep Going"}
        </div>
        <button
          onClick={onRestart}
          className="px-5 py-2 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.03] btn-press"
          style={{
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.28)",
            color: "#818cf8",
          }}
        >
          🔄 Try Again
        </button>
        <span className="text-xs font-mono" style={{ color: "#6366f133" }}>
          <kbd
            style={{
              padding: "1px 4px",
              borderRadius: 3,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 10,
            }}
          >
            Ctrl+Enter
          </kbd>
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value, color = "#64748b" }) {
  return (
    <div>
      <div
        className="text-xs font-mono uppercase tracking-widest mb-0.5"
        style={{ color: "#6366f155" }}
      >
        {label}
      </div>
      <div className="text-2xl font-bold font-mono" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
