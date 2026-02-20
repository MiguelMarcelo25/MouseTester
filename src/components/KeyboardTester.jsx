import { useState, useEffect, useCallback, useRef } from "react";
import TypingTest from "./TypingTest";

// ─────────────────────────────────────────────────────────────────────────────
// KEY UNIT = 1u = 44px. All widths are multiples of this.
// Layout mirrors a real 104-key ANSI keyboard exactly.
// ─────────────────────────────────────────────────────────────────────────────
const U = 44; // 1u in px
const GAP = 5; // gap between keys

// Helper to compute pixel width from units
const uw = (units) => units * U + (units - 1) * GAP;

// ─── Main keyboard section rows ───────────────────────────────────────────────
const MAIN_ROWS = [
  // Row 0 – Function row
  [
    { code: "Escape", label: "Esc", w: 1 },
    null, // gap
    { code: "F1", label: "F1", w: 1 },
    { code: "F2", label: "F2", w: 1 },
    { code: "F3", label: "F3", w: 1 },
    { code: "F4", label: "F4", w: 1 },
    null,
    { code: "F5", label: "F5", w: 1 },
    { code: "F6", label: "F6", w: 1 },
    { code: "F7", label: "F7", w: 1 },
    { code: "F8", label: "F8", w: 1 },
    null,
    { code: "F9", label: "F9", w: 1 },
    { code: "F10", label: "F10", w: 1 },
    { code: "F11", label: "F11", w: 1 },
    { code: "F12", label: "F12", w: 1 },
  ],
  // Row 1 – Number row
  [
    { code: "Backquote", label: "`~", w: 1 },
    { code: "Digit1", label: "1", w: 1 },
    { code: "Digit2", label: "2", w: 1 },
    { code: "Digit3", label: "3", w: 1 },
    { code: "Digit4", label: "4", w: 1 },
    { code: "Digit5", label: "5", w: 1 },
    { code: "Digit6", label: "6", w: 1 },
    { code: "Digit7", label: "7", w: 1 },
    { code: "Digit8", label: "8", w: 1 },
    { code: "Digit9", label: "9", w: 1 },
    { code: "Digit0", label: "0", w: 1 },
    { code: "Minus", label: "-_", w: 1 },
    { code: "Equal", label: "=+", w: 1 },
    { code: "Backspace", label: "⌫ Backspace", w: 2 },
  ],
  // Row 2 – QWERTY
  [
    { code: "Tab", label: "Tab ⇥", w: 1.5 },
    { code: "KeyQ", label: "Q", w: 1 },
    { code: "KeyW", label: "W", w: 1 },
    { code: "KeyE", label: "E", w: 1 },
    { code: "KeyR", label: "R", w: 1 },
    { code: "KeyT", label: "T", w: 1 },
    { code: "KeyY", label: "Y", w: 1 },
    { code: "KeyU", label: "U", w: 1 },
    { code: "KeyI", label: "I", w: 1 },
    { code: "KeyO", label: "O", w: 1 },
    { code: "KeyP", label: "P", w: 1 },
    { code: "BracketLeft", label: "[{", w: 1 },
    { code: "BracketRight", label: "]}", w: 1 },
    { code: "Backslash", label: "\\|", w: 1.5 },
  ],
  // Row 3 – Home row
  [
    { code: "CapsLock", label: "Caps Lock", w: 1.75 },
    { code: "KeyA", label: "A", w: 1 },
    { code: "KeyS", label: "S", w: 1 },
    { code: "KeyD", label: "D", w: 1 },
    { code: "KeyF", label: "F", w: 1 },
    { code: "KeyG", label: "G", w: 1 },
    { code: "KeyH", label: "H", w: 1 },
    { code: "KeyJ", label: "J", w: 1 },
    { code: "KeyK", label: "K", w: 1 },
    { code: "KeyL", label: "L", w: 1 },
    { code: "Semicolon", label: ";:", w: 1 },
    { code: "Quote", label: `'"`, w: 1 },
    { code: "Enter", label: "Enter ↵", w: 2.25 },
  ],
  // Row 4 – Shift row
  [
    { code: "ShiftLeft", label: "⇧ Shift", w: 2.25 },
    { code: "KeyZ", label: "Z", w: 1 },
    { code: "KeyX", label: "X", w: 1 },
    { code: "KeyC", label: "C", w: 1 },
    { code: "KeyV", label: "V", w: 1 },
    { code: "KeyB", label: "B", w: 1 },
    { code: "KeyN", label: "N", w: 1 },
    { code: "KeyM", label: "M", w: 1 },
    { code: "Comma", label: ",<", w: 1 },
    { code: "Period", label: ".>", w: 1 },
    { code: "Slash", label: "/?", w: 1 },
    { code: "ShiftRight", label: "⇧ Shift", w: 2.75 },
  ],
  // Row 5 – Bottom row
  [
    { code: "ControlLeft", label: "Ctrl", w: 1.25 },
    { code: "MetaLeft", label: "⊞ Win", w: 1.25 },
    { code: "AltLeft", label: "Alt", w: 1.25 },
    { code: "Space", label: "", w: 6.25 },
    { code: "AltRight", label: "Alt", w: 1.25 },
    { code: "MetaRight", label: "⊞ Win", w: 1.25 },
    { code: "ContextMenu", label: "☰", w: 1.25 },
    { code: "ControlRight", label: "Ctrl", w: 1.25 },
  ],
];

// ─── Navigation cluster (between main and numpad) ─────────────────────────────
// Row 0: PrtSc / ScrLk / Pause
// Row 1: Ins / Home / PgUp
// Row 2: Del / End  / PgDn
// Row 3: (empty)
// Row 4: (empty) / Up / (empty)
// Row 5: Left / Down / Right
const NAV_ROWS = [
  [
    { code: "PrintScreen", label: "PrtSc", w: 1 },
    { code: "ScrollLock", label: "ScrLk", w: 1 },
    { code: "Pause", label: "Pause", w: 1 },
  ],
  [
    { code: "Insert", label: "Ins", w: 1 },
    { code: "Home", label: "Home", w: 1 },
    { code: "PageUp", label: "PgUp", w: 1 },
  ],
  [
    { code: "Delete", label: "Del", w: 1 },
    { code: "End", label: "End", w: 1 },
    { code: "PageDown", label: "PgDn", w: 1 },
  ],
  [], // blank row to align with shift row
  [null, { code: "ArrowUp", label: "↑", w: 1 }, null],
  [
    { code: "ArrowLeft", label: "←", w: 1 },
    { code: "ArrowDown", label: "↓", w: 1 },
    { code: "ArrowRight", label: "→", w: 1 },
  ],
];

// ─── Numpad ───────────────────────────────────────────────────────────────────
// Flat list with explicit grid column/row positions (1-indexed CSS grid)
// Grid is 4 columns × 5 rows. Tall keys use rowSpan=2, wide keys use colSpan=2.
const NUMPAD_KEYS = [
  { code: "NumLock", label: "Num", col: 1, row: 1, colSpan: 1, rowSpan: 1 },
  { code: "NumpadDivide", label: "/", col: 2, row: 1, colSpan: 1, rowSpan: 1 },
  {
    code: "NumpadMultiply",
    label: "*",
    col: 3,
    row: 1,
    colSpan: 1,
    rowSpan: 1,
  },
  {
    code: "NumpadSubtract",
    label: "−",
    col: 4,
    row: 1,
    colSpan: 1,
    rowSpan: 1,
  },
  { code: "Numpad7", label: "7", col: 1, row: 2, colSpan: 1, rowSpan: 1 },
  { code: "Numpad8", label: "8", col: 2, row: 2, colSpan: 1, rowSpan: 1 },
  { code: "Numpad9", label: "9", col: 3, row: 2, colSpan: 1, rowSpan: 1 },
  { code: "NumpadAdd", label: "+", col: 4, row: 2, colSpan: 1, rowSpan: 2 }, // tall
  { code: "Numpad4", label: "4", col: 1, row: 3, colSpan: 1, rowSpan: 1 },
  { code: "Numpad5", label: "5", col: 2, row: 3, colSpan: 1, rowSpan: 1 },
  { code: "Numpad6", label: "6", col: 3, row: 3, colSpan: 1, rowSpan: 1 },
  { code: "Numpad1", label: "1", col: 1, row: 4, colSpan: 1, rowSpan: 1 },
  { code: "Numpad2", label: "2", col: 2, row: 4, colSpan: 1, rowSpan: 1 },
  { code: "Numpad3", label: "3", col: 3, row: 4, colSpan: 1, rowSpan: 1 },
  {
    code: "NumpadEnter",
    label: "Enter",
    col: 4,
    row: 4,
    colSpan: 1,
    rowSpan: 2,
  }, // tall
  { code: "Numpad0", label: "0", col: 1, row: 5, colSpan: 2, rowSpan: 1 }, // wide
  { code: "NumpadDecimal", label: ".", col: 3, row: 5, colSpan: 1, rowSpan: 1 },
];

export default function KeyboardTester() {
  const [subTab, setSubTab] = useState("tester"); // 'tester' | 'typing'
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const [testedKeys, setTestedKeys] = useState(new Set());
  const [keyLog, setKeyLog] = useState([]);
  const [totalPresses, setTotalPresses] = useState(0);
  const logIdRef = useRef(0);

  // Count testable keys
  const allKeys = [
    ...MAIN_ROWS.flat(),
    ...NAV_ROWS.flat(),
    ...NUMPAD_KEYS,
  ].filter((k) => k && k.code);
  const totalKeys = allKeys.length;
  const testedCount = testedKeys.size;
  const coverage =
    totalKeys > 0 ? Math.round((testedCount / totalKeys) * 100) : 0;

  const handleKeyDown = useCallback((e) => {
    e.preventDefault();
    const code = e.code;
    setPressedKeys((prev) => new Set([...prev, code]));
    setTestedKeys((prev) => new Set([...prev, code]));
    setTotalPresses((p) => p + 1);
    const id = ++logIdRef.current;
    setKeyLog((prev) =>
      [{ id, code, key: e.key, ts: new Date() }, ...prev].slice(0, 80),
    );
  }, []);

  const handleKeyUp = useCallback((e) => {
    e.preventDefault();
    setPressedKeys((prev) => {
      const n = new Set(prev);
      n.delete(e.code);
      return n;
    });
  }, []);

  // Clear stuck keys if window loses focus (common with Win key)
  const handleBlur = useCallback(() => {
    setPressedKeys(new Set());
  }, []);

  useEffect(() => {
    if (subTab !== "tester") return;
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [handleKeyDown, handleKeyUp, handleBlur, subTab]);

  const reset = useCallback(() => {
    setPressedKeys(new Set());
    setTestedKeys(new Set());
    setKeyLog([]);
    setTotalPresses(0);
  }, []);

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* ── Sub-tab switcher ── */}
      <div className="flex gap-2">
        {[
          { id: "tester", label: "⌨️ Key Tester" },
          { id: "typing", label: "📝 Typing Test" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className="px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02]"
            style={{
              background:
                subTab === t.id
                  ? "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(99,102,241,0.1))"
                  : "rgba(255,255,255,0.04)",
              border: `1px solid ${subTab === t.id ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`,
              color: subTab === t.id ? "#818cf8" : "#6b7280",
              boxShadow:
                subTab === t.id ? "0 0 16px rgba(99,102,241,0.2)" : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Typing Test ── */}
      {subTab === "typing" && <TypingTest />}

      {/* ── Key Tester ── */}
      {subTab === "tester" && (
        <>
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: "Keys Tested",
                value: `${testedCount}/${totalKeys}`,
                color: "#818cf8",
              },
              {
                label: "Coverage",
                value: `${coverage}%`,
                color: coverage === 100 ? "#10b981" : "#6366f1",
              },
              { label: "Total Presses", value: totalPresses, color: "#22d3ee" },
              {
                label: "Held",
                value: pressedKeys.size,
                color: pressedKeys.size > 0 ? "#f59e0b" : "#4b5563",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-3 text-center"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="text-xl font-bold font-mono"
                  style={{ color: s.color }}
                >
                  {s.value}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Coverage bar ── */}
          <div className="glass rounded-xl px-4 py-3">
            <div
              className="flex justify-between text-xs font-mono mb-2"
              style={{ color: "#6366f155" }}
            >
              <span>Keyboard Coverage</span>
              <span style={{ color: coverage === 100 ? "#10b981" : "#818cf8" }}>
                {testedCount} / {totalKeys} keys
                {coverage === 100 ? " 🎉 All keys tested!" : ""}
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${coverage}%`,
                  background:
                    coverage === 100
                      ? "linear-gradient(90deg,#10b981,#34d399)"
                      : "linear-gradient(90deg,#6366f1,#8b5cf6)",
                  boxShadow: `0 0 8px ${coverage === 100 ? "#10b98180" : "#6366f180"}`,
                }}
              />
            </div>
          </div>

          {/* ── Keyboard ── */}
          <div className="glass rounded-2xl p-5 overflow-x-auto">
            <div style={{ minWidth: 980 }}>
              {/* Function row */}
              <FnRow
                row={MAIN_ROWS[0]}
                pressedKeys={pressedKeys}
                testedKeys={testedKeys}
              />

              {/* Gap between fn row and main block */}
              <div style={{ height: 10 }} />

              {/* Main block + Nav cluster + Numpad side by side */}
              <div className="flex gap-4">
                {/* Main block (rows 1–5) */}
                <div className="flex flex-col gap-1.5">
                  {MAIN_ROWS.slice(1).map((row, i) => (
                    <KeyRow
                      key={i}
                      row={row}
                      pressedKeys={pressedKeys}
                      testedKeys={testedKeys}
                    />
                  ))}
                </div>

                {/* Nav cluster */}
                <div
                  className="flex flex-col gap-1.5"
                  style={{ marginLeft: 8 }}
                >
                  {NAV_ROWS.map((row, i) => (
                    <NavRow
                      key={i}
                      row={row}
                      pressedKeys={pressedKeys}
                      testedKeys={testedKeys}
                    />
                  ))}
                </div>

                {/* Numpad — CSS Grid with row/col spans */}
                <Numpad pressedKeys={pressedKeys} testedKeys={testedKeys} />
              </div>
            </div>

            {/* Legend */}
            <div
              className="flex items-center gap-6 mt-5 pt-4 flex-wrap"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              {[
                {
                  color: "#6366f1",
                  shadow: "0 0 10px #6366f1",
                  label: "Pressed",
                },
                { color: "#10b981", shadow: "none", label: "Tested" },
                {
                  color: "#1e293b",
                  shadow: "none",
                  label: "Untested",
                  border: "rgba(255,255,255,0.08)",
                },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded"
                    style={{
                      background: l.color,
                      border: `1px solid ${l.border || l.color}`,
                      boxShadow: l.shadow,
                    }}
                  />
                  <span className="text-xs text-slate-500">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Last key + log ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LastKey keyLog={keyLog} pressedKeys={pressedKeys} />
            <KeyLog keyLog={keyLog} />
          </div>

          {/* Reset */}
          <button
            id="kb-reset-btn"
            onClick={reset}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] btn-press"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#64748b",
            }}
          >
            Reset Test
          </button>
        </>
      )}
    </div>
  );
}

// ─── Row renderers ────────────────────────────────────────────────────────────

// Function row has gaps between F1-F4 / F5-F8 / F9-F12 groups
function FnRow({ row, pressedKeys, testedKeys }) {
  return (
    <div className="flex items-center" style={{ gap: GAP }}>
      {row.map((k, i) => {
        if (k === null) return <div key={i} style={{ width: U * 0.5 }} />;
        return (
          <Key
            key={k.code}
            def={k}
            pressed={pressedKeys.has(k.code)}
            tested={testedKeys.has(k.code)}
          />
        );
      })}
    </div>
  );
}

function KeyRow({ row, pressedKeys, testedKeys }) {
  return (
    <div className="flex items-center" style={{ gap: GAP }}>
      {row.map((k, i) => (
        <Key
          key={k.code + i}
          def={k}
          pressed={pressedKeys.has(k.code)}
          tested={testedKeys.has(k.code)}
        />
      ))}
    </div>
  );
}

function NavRow({ row, pressedKeys, testedKeys }) {
  // 3-wide grid, nulls become blank spacers
  return (
    <div className="flex items-center" style={{ gap: GAP }}>
      {row.map((k, i) => {
        if (!k)
          return (
            <div
              key={i}
              style={{ width: uw(1), height: U - 4, flexShrink: 0 }}
            />
          );
        return (
          <Key
            key={k.code}
            def={k}
            pressed={pressedKeys.has(k.code)}
            tested={testedKeys.has(k.code)}
          />
        );
      })}
    </div>
  );
}

function Numpad({ pressedKeys, testedKeys }) {
  // CSS Grid: 4 equal columns, 5 rows, each cell = U px, gap = GAP px
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(4, ${U}px)`,
        gridTemplateRows: `repeat(5, ${U}px)`,
        gap: GAP,
      }}
    >
      {NUMPAD_KEYS.map((k) => {
        const pressed = pressedKeys.has(k.code);
        const tested = testedKeys.has(k.code);

        let bg, borderColor, textColor, shadow, translateY;
        if (pressed) {
          bg = "linear-gradient(160deg, #818cf8, #6366f1)";
          borderColor = "#6366f1";
          textColor = "#fff";
          shadow = "0 0 14px rgba(99,102,241,0.8), 0 1px 0 rgba(0,0,0,0.6)";
          translateY = 2;
        } else if (tested) {
          bg =
            "linear-gradient(160deg, rgba(16,185,129,0.3), rgba(16,185,129,0.12))";
          borderColor = "rgba(16,185,129,0.55)";
          textColor = "#34d399";
          shadow = "0 0 6px rgba(16,185,129,0.25), 0 2px 0 rgba(0,0,0,0.5)";
          translateY = 0;
        } else {
          bg = "linear-gradient(160deg, #1e293b, #0f172a)";
          borderColor = "rgba(255,255,255,0.09)";
          textColor = "#475569";
          shadow = "0 2px 0 rgba(0,0,0,0.6)";
          translateY = 0;
        }

        return (
          <div
            key={k.code}
            className="flex items-center justify-center rounded-lg select-none transition-all duration-75"
            style={{
              gridColumn: `${k.col} / span ${k.colSpan}`,
              gridRow: `${k.row} / span ${k.rowSpan}`,
              background: bg,
              border: `1px solid ${borderColor}`,
              color: textColor,
              fontSize: k.colSpan > 1 ? 10 : 11,
              fontWeight: pressed ? 700 : 500,
              fontFamily: "JetBrains Mono, monospace",
              boxShadow: shadow,
              transform: `translateY(${translateY}px)`,
              cursor: "default",
              textAlign: "center",
            }}
          >
            {k.label}
          </div>
        );
      })}
    </div>
  );
}

// ─── Single Key ───────────────────────────────────────────────────────────────
function Key({ def, pressed, tested }) {
  const width = uw(def.w);
  const height = def.tall ? uw(1) * 2 + GAP : U - 4;

  let bg, borderColor, textColor, shadow, translateY;
  if (pressed) {
    bg = "linear-gradient(160deg, #818cf8, #6366f1)";
    borderColor = "#6366f1";
    textColor = "#fff";
    shadow = "0 0 14px rgba(99,102,241,0.8), 0 1px 0 rgba(0,0,0,0.6)";
    translateY = 2;
  } else if (tested) {
    bg = "linear-gradient(160deg, rgba(16,185,129,0.3), rgba(16,185,129,0.12))";
    borderColor = "rgba(16,185,129,0.55)";
    textColor = "#34d399";
    shadow = "0 0 6px rgba(16,185,129,0.25), 0 2px 0 rgba(0,0,0,0.5)";
    translateY = 0;
  } else {
    bg = "linear-gradient(160deg, #1e293b, #0f172a)";
    borderColor = "rgba(255,255,255,0.09)";
    textColor = "#475569";
    shadow = "0 2px 0 rgba(0,0,0,0.6)";
    translateY = 0;
  }

  // Font size based on label length and key width
  const labelLen = def.label.length;
  const fontSize = def.w >= 2 ? 9 : labelLen > 5 ? 8 : labelLen > 3 ? 9 : 11;

  return (
    <div
      className="flex items-center justify-center rounded-lg select-none flex-shrink-0 transition-all duration-75"
      style={{
        width,
        height,
        background: bg,
        border: `1px solid ${borderColor}`,
        color: textColor,
        fontSize,
        fontWeight: pressed ? 700 : 500,
        fontFamily: "JetBrains Mono, monospace",
        boxShadow: shadow,
        transform: `translateY(${translateY}px)`,
        letterSpacing: "0.02em",
        lineHeight: 1.2,
        padding: "2px 4px",
        textAlign: "center",
        wordBreak: "break-word",
        cursor: "default",
      }}
    >
      {def.label}
    </div>
  );
}

// ─── Last key display ─────────────────────────────────────────────────────────
function LastKey({ keyLog, pressedKeys }) {
  const last = keyLog[0];
  return (
    <div
      className="glass rounded-xl p-4 flex flex-col gap-3"
      style={{ minHeight: 200 }}
    >
      <p className="text-xs font-mono text-slate-600 uppercase tracking-widest">
        Last Key Pressed
      </p>
      {last ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-2">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center font-mono font-bold text-2xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.06))",
              border: "2px solid rgba(99,102,241,0.4)",
              color: "#818cf8",
              boxShadow: "0 0 20px rgba(99,102,241,0.2)",
            }}
          >
            {last.key === " "
              ? "␣"
              : last.key.length === 1
                ? last.key.toUpperCase()
                : last.key.slice(0, 4)}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-300">
              {last.key === " " ? "Space" : last.key}
            </p>
            <p className="text-xs font-mono text-slate-600">{last.code}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 py-6">
          <div className="text-4xl opacity-20">⌨️</div>
          <p className="text-xs text-slate-600">Press any key</p>
        </div>
      )}
      {pressedKeys.size > 0 && (
        <div>
          <p className="text-xs font-mono text-slate-600 mb-1.5">Held:</p>
          <div className="flex flex-wrap gap-1.5">
            {[...pressedKeys].map((code) => (
              <span
                key={code}
                className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold"
                style={{
                  background: "rgba(99,102,241,0.18)",
                  border: "1px solid rgba(99,102,241,0.4)",
                  color: "#818cf8",
                }}
              >
                {code}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Key log ──────────────────────────────────────────────────────────────────
function KeyLog({ keyLog }) {
  return (
    <div
      className="glass rounded-xl p-4 flex flex-col gap-3"
      style={{ maxHeight: 260 }}
    >
      <div className="flex items-center justify-between flex-shrink-0">
        <p className="text-xs font-mono text-slate-600 uppercase tracking-widest">
          Key Log
        </p>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.2)",
            color: "#818cf8",
          }}
        >
          {keyLog.length}
        </span>
      </div>
      <div className="overflow-y-auto flex flex-col gap-1 flex-1">
        {keyLog.length === 0 ? (
          <p className="text-xs text-slate-700 text-center py-8">
            No keys pressed yet
          </p>
        ) : (
          keyLog.map((e, i) => (
            <div
              key={e.id}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${i === 0 ? "animate-slide-in-left" : ""}`}
              style={{
                background: "rgba(99,102,241,0.05)",
                border: "1px solid rgba(99,102,241,0.1)",
              }}
            >
              <span
                className="font-mono font-bold text-xs px-1.5 py-0.5 rounded"
                style={{
                  background: "rgba(99,102,241,0.15)",
                  color: "#818cf8",
                  minWidth: 32,
                  textAlign: "center",
                }}
              >
                {e.key === " "
                  ? "SPC"
                  : e.key.length === 1
                    ? e.key.toUpperCase()
                    : e.key.slice(0, 5)}
              </span>
              <span className="text-xs text-slate-500 flex-1 font-mono truncate">
                {e.code}
              </span>
              <span className="text-xs font-mono text-slate-700 flex-shrink-0">
                {e.ts.toLocaleTimeString("en-US", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
