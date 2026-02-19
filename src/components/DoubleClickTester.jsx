import { useState, useRef, useCallback, useEffect } from "react";

function microtime() {
  return new Date().getTime() / 1000;
}

const DC_THRESHOLD = 0.08;
const MIN_CLICKS_FOR_VERDICT = 20;

// ── Per-button state factory ──────────────────────────────────────────────────
function makeButtonState() {
  return {
    clicks: 0,
    dcCount: 0,
    intervals: [],
    prevTime: microtime(),
  };
}

export default function DoubleClickTester() {
  // Separate state for left (0) and right (2)
  const [btnState, setBtnState] = useState({
    0: makeButtonState(),
    2: makeButtonState(),
  });
  const [flashState, setFlashState] = useState({ 0: "idle", 2: "idle" });
  const [flashKey, setFlashKey] = useState({ 0: 0, 2: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [cps, setCps] = useState(0);

  const prevTimeRef = useRef({ 0: microtime(), 2: microtime() });
  const statusTimerRef = useRef({ 0: null, 2: null });
  const sessionTimerRef = useRef(null);
  const clickTimestampsRef = useRef([]);

  // Session timer
  useEffect(() => {
    if (isRunning) {
      sessionTimerRef.current = setInterval(
        () => setSessionTime((p) => p + 1),
        1000,
      );
    }
    return () => clearInterval(sessionTimerRef.current);
  }, [isRunning]);

  // CPS ticker
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      clickTimestampsRef.current = clickTimestampsRef.current.filter(
        (t) => now - t < 1000,
      );
      setCps(clickTimestampsRef.current.length);
    }, 100);
    return () => clearInterval(id);
  }, []);

  // ── Core click logic (same microtime diff as original) ────────────────────
  const clickEvent = useCallback((button) => {
    const clickTime = microtime();
    const diff = clickTime - prevTimeRef.current[button];
    const isDc = prevTimeRef.current[button] !== 0 && diff <= DC_THRESHOLD;

    setBtnState((prev) => {
      const b = prev[button];
      const newIntervals =
        b.clicks > 0 ? [...b.intervals.slice(-99), diff] : b.intervals;
      return {
        ...prev,
        [button]: {
          ...b,
          clicks: b.clicks + 1,
          dcCount: isDc ? b.dcCount + 1 : b.dcCount,
          intervals: newIntervals,
        },
      };
    });

    setFlashState((prev) => ({ ...prev, [button]: isDc ? "dc" : "ok" }));
    if (isDc) setFlashKey((prev) => ({ ...prev, [button]: prev[button] + 1 }));

    prevTimeRef.current[button] = clickTime;
    clickTimestampsRef.current.push(Date.now());

    if (statusTimerRef.current[button])
      clearTimeout(statusTimerRef.current[button]);
    statusTimerRef.current[button] = setTimeout(
      () => setFlashState((prev) => ({ ...prev, [button]: "idle" })),
      700,
    );
  }, []);

  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isRunning) setIsRunning(true);
      if (e.button === 0 || e.button === 2) {
        clickEvent(e.button);
      }
    },
    [isRunning, clickEvent],
  );

  const handleContextMenu = useCallback((e) => e.preventDefault(), []);

  const handleReset = useCallback((e) => {
    e?.stopPropagation();
    setBtnState({ 0: makeButtonState(), 2: makeButtonState() });
    setFlashState({ 0: "idle", 2: "idle" });
    setFlashKey({ 0: 0, 2: 0 });
    setIsRunning(false);
    setSessionTime(0);
    setCps(0);
    clickTimestampsRef.current = [];
    prevTimeRef.current = { 0: microtime(), 2: microtime() };
    clearTimeout(statusTimerRef.current[0]);
    clearTimeout(statusTimerRef.current[2]);
    clearInterval(sessionTimerRef.current);
  }, []);

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const totalClicks = btnState[0].clicks + btnState[2].clicks;
  const totalDc = btnState[0].dcCount + btnState[2].dcCount;

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* ── How to use ── */}
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-xl"
        style={{
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.2)",
        }}
      >
        <span className="text-lg mt-0.5">💡</span>
        <div>
          <p className="text-xs font-semibold text-indigo-300 mb-0.5">
            How to use
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Click each zone{" "}
            <strong className="text-slate-400">one click at a time</strong>,
            slowly and deliberately. If a click fires twice within{" "}
            <strong className="text-slate-400">80ms</strong>, it's flagged as a
            hardware double-click.
          </p>
        </div>
      </div>

      {/* ── Global stats ── */}
      <div className="grid grid-cols-4 gap-3">
        <MiniStat label="Total Clicks" value={totalClicks} color="#818cf8" />
        <MiniStat
          label="Total Doubles"
          value={totalDc}
          color={totalDc > 0 ? "#ef4444" : "#4b5563"}
          alert={totalDc > 0}
        />
        <MiniStat label="CPS" value={cps} color="#f59e0b" />
        <MiniStat
          label="Session"
          value={isRunning ? formatTime(sessionTime) : "--:--"}
          color="#22d3ee"
        />
      </div>

      {/* ── Two click zones side by side ── */}
      <div className="grid grid-cols-2 gap-4">
        <ButtonZone
          label="Left Button"
          button={0}
          accent="#6366f1"
          accentLight="#818cf8"
          icon="🖱️"
          btnState={btnState[0]}
          flash={flashState[0]}
          flashKey={flashKey[0]}
          onMouseDown={handleMouseDown}
          onContextMenu={handleContextMenu}
        />
        <ButtonZone
          label="Right Button"
          button={2}
          accent="#ec4899"
          accentLight="#f472b6"
          icon="🖱️"
          btnState={btnState[2]}
          flash={flashState[2]}
          flashKey={flashKey[2]}
          onMouseDown={handleMouseDown}
          onContextMenu={handleContextMenu}
        />
      </div>

      {/* ── Verdict cards side by side ── */}
      <div className="grid grid-cols-2 gap-4">
        {[0, 2].map((btn) => {
          const b = btnState[btn];
          const errorRate = b.clicks > 0 ? (b.dcCount / b.clicks) * 100 : 0;
          const hasEnoughData = b.clicks >= MIN_CLICKS_FOR_VERDICT;
          const verdict = getVerdict(b.dcCount, errorRate, hasEnoughData);
          const progress = Math.min(
            (b.clicks / MIN_CLICKS_FOR_VERDICT) * 100,
            100,
          );
          return (
            <VerdictCard
              key={btn}
              label={btn === 0 ? "Left Button" : "Right Button"}
              verdict={verdict}
              dcCount={b.dcCount}
              clicks={b.clicks}
              errorRate={errorRate}
              hasEnoughData={hasEnoughData}
              progress={progress}
            />
          );
        })}
      </div>

      {/* ── Interval logs side by side ── */}
      {(btnState[0].intervals.length > 0 ||
        btnState[2].intervals.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {[0, 2].map((btn) => (
            <IntervalLog
              key={btn}
              label={btn === 0 ? "Left Intervals" : "Right Intervals"}
              intervals={btnState[btn].intervals}
              threshold={DC_THRESHOLD}
            />
          ))}
        </div>
      )}

      {/* ── Charts side by side ── */}
      {(btnState[0].intervals.length > 2 ||
        btnState[2].intervals.length > 2) && (
        <div className="grid grid-cols-2 gap-4">
          {[0, 2].map(
            (btn) =>
              btnState[btn].intervals.length > 2 && (
                <IntervalChart
                  key={btn}
                  label={btn === 0 ? "Left Chart" : "Right Chart"}
                  intervals={btnState[btn].intervals}
                  threshold={DC_THRESHOLD}
                  accent={btn === 0 ? "#6366f1" : "#ec4899"}
                />
              ),
          )}
        </div>
      )}

      {/* Reset */}
      <button
        id="dc-reset-btn"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleReset}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] btn-press"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#64748b",
        }}
      >
        Reset Test
      </button>
    </div>
  );
}

// ── Click zone for one button ─────────────────────────────────────────────────
function ButtonZone({
  label,
  button,
  accent,
  accentLight,
  btnState,
  flash,
  flashKey,
  onMouseDown,
  onContextMenu,
}) {
  const isOk = flash === "ok";
  const isDc = flash === "dc";

  const errorRate =
    btnState.clicks > 0 ? (btnState.dcCount / btnState.clicks) * 100 : 0;

  return (
    <div
      key={flashKey}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
      className="relative flex flex-col items-center justify-center rounded-2xl cursor-pointer select-none overflow-hidden"
      style={{
        minHeight: 180,
        transition: "background 0.1s, border-color 0.1s, box-shadow 0.1s",
        background: isDc
          ? "linear-gradient(135deg, rgba(239,68,68,0.22), rgba(239,68,68,0.08))"
          : isOk
            ? `linear-gradient(135deg, ${accent}28, ${accent}0a)`
            : `linear-gradient(135deg, ${accent}14, ${accent}05)`,
        border: `2px solid ${isDc ? "#ef4444" : isOk ? accent : `${accent}40`}`,
        boxShadow: isDc
          ? "0 0 40px rgba(239,68,68,0.3)"
          : isOk
            ? `0 0 24px ${accent}40`
            : `0 0 12px ${accent}15`,
        transform: isOk ? "scale(0.997)" : "scale(1)",
      }}
    >
      {isDc && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            border: "3px solid #ef4444",
            animation: "ripple-border 0.55s ease-out forwards",
          }}
        />
      )}

      {/* Label badge */}
      <div
        className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold font-mono"
        style={{
          background: `${accent}20`,
          border: `1px solid ${accent}50`,
          color: accentLight,
        }}
      >
        {label}
      </div>

      {/* Click count badge */}
      <div
        className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-mono"
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#64748b",
        }}
      >
        {btnState.clicks} clicks
      </div>

      <div
        className="text-4xl mb-2 transition-all duration-100"
        style={{
          filter: isDc
            ? "drop-shadow(0 0 14px #ef4444)"
            : isOk
              ? `drop-shadow(0 0 10px ${accent})`
              : "none",
          transform: isDc ? "scale(1.12)" : isOk ? "scale(0.9)" : "scale(1)",
        }}
      >
        {isDc ? "🔴" : isOk ? "🟢" : button === 0 ? "◀" : "▶"}
      </div>

      <p
        className="text-base font-bold transition-all duration-100"
        style={{
          color: isDc ? "#f87171" : isOk ? accentLight : accentLight,
          textShadow: isDc
            ? "0 0 16px rgba(239,68,68,0.7)"
            : isOk
              ? `0 0 12px ${accent}`
              : "none",
          opacity: isOk || isDc ? 1 : 0.6,
        }}
      >
        {isDc ? "⚡ Double-Click!" : isOk ? "✓ Single Click" : `Click ${label}`}
      </p>

      {/* DC counter pill */}
      {btnState.dcCount > 0 && (
        <div
          className="mt-2 px-3 py-1 rounded-full text-xs font-mono font-bold"
          style={{
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.35)",
            color: "#f87171",
          }}
        >
          {btnState.dcCount} double-click{btnState.dcCount !== 1 ? "s" : ""} ·{" "}
          {errorRate.toFixed(1)}% err
        </div>
      )}
    </div>
  );
}

// ── Verdict card ──────────────────────────────────────────────────────────────
function getVerdict(dcCount, errorRate, hasEnoughData) {
  if (!hasEnoughData)
    return {
      status: "testing",
      label: "Keep clicking...",
      color: "#6366f1",
      bg: "rgba(99,102,241,0.08)",
      border: "rgba(99,102,241,0.2)",
    };
  if (dcCount === 0)
    return {
      status: "healthy",
      label: "✅ Healthy",
      color: "#10b981",
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.25)",
      detail: "No double-clicks detected.",
    };
  if (errorRate < 5)
    return {
      status: "minor",
      label: "⚠️ Minor Issue",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.25)",
      detail: "Occasional misfires. Early switch wear.",
    };
  if (errorRate < 20)
    return {
      status: "moderate",
      label: "🔶 Moderate",
      color: "#f97316",
      bg: "rgba(249,115,22,0.08)",
      border: "rgba(249,115,22,0.25)",
      detail: "Frequent misfires. Switch is worn out.",
    };
  return {
    status: "broken",
    label: "❌ Switch Failed",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.3)",
    detail: "Severe double-clicking. Replace the switch.",
  };
}

function VerdictCard({
  label,
  verdict,
  dcCount,
  clicks,
  errorRate,
  hasEnoughData,
  progress,
}) {
  const isTesting = verdict.status === "testing";
  return (
    <div
      className="rounded-2xl p-4 transition-all duration-500"
      style={{ background: verdict.bg, border: `1px solid ${verdict.border}` }}
    >
      <p
        className="text-xs font-mono uppercase tracking-widest mb-1"
        style={{ color: `${verdict.color}77` }}
      >
        {label}
      </p>
      <p className="text-base font-bold mb-1" style={{ color: verdict.color }}>
        {verdict.label}
      </p>
      {verdict.detail && (
        <p
          className="text-xs leading-relaxed mb-2"
          style={{ color: `${verdict.color}99` }}
        >
          {verdict.detail}
        </p>
      )}

      {isTesting ? (
        <>
          <p className="text-xs mb-1.5" style={{ color: "#6366f155" }}>
            {Math.max(0, MIN_CLICKS_FOR_VERDICT - clicks)} more clicks needed
          </p>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "rgba(99,102,241,0.12)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
              }}
            />
          </div>
        </>
      ) : (
        <div
          className="flex gap-4 flex-wrap pt-2"
          style={{ borderTop: `1px solid ${verdict.border}` }}
        >
          {[
            { label: "Error", value: `${errorRate.toFixed(1)}%` },
            { label: "DCs", value: dcCount },
            { label: "Total", value: clicks },
          ].map((s) => (
            <div key={s.label}>
              <div
                className="text-sm font-bold font-mono"
                style={{ color: verdict.color }}
              >
                {s.value}
              </div>
              <div className="text-xs" style={{ color: `${verdict.color}55` }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Interval log ──────────────────────────────────────────────────────────────
function IntervalLog({ label, intervals, threshold }) {
  const recent = [...intervals].reverse().slice(0, 10);
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <p className="text-xs font-mono text-slate-600">{label}</p>
        <span className="text-xs font-mono text-slate-700">
          {intervals.length}
        </span>
      </div>
      <div className="max-h-32 overflow-y-auto">
        {recent.length === 0 ? (
          <p className="text-xs text-slate-700 text-center py-4">No data yet</p>
        ) : (
          recent.map((diff, i) => {
            const ms = (diff * 1000).toFixed(1);
            const isDc = diff <= threshold;
            return (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-1"
                style={{
                  background: isDc ? "rgba(239,68,68,0.06)" : "transparent",
                  borderBottom: "1px solid rgba(255,255,255,0.02)",
                }}
              >
                <span
                  className="font-mono text-xs"
                  style={{ color: isDc ? "#f87171" : "#475569" }}
                >
                  {isDc ? "⚡ " : "   "}
                  {diff.toFixed(4)}s
                </span>
                <span
                  className="font-mono text-xs font-bold"
                  style={{ color: isDc ? "#f87171" : "#64748b" }}
                >
                  {ms}ms{isDc ? " DC!" : ""}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Bar chart ─────────────────────────────────────────────────────────────────
function IntervalChart({ label, intervals, threshold, accent }) {
  const recent = intervals.slice(-30);
  const maxVal = Math.max(...recent, threshold * 3);
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <p className="text-xs font-mono text-slate-600 mb-2">{label}</p>
      <div className="relative flex items-end gap-0.5" style={{ height: 52 }}>
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            bottom: `${(threshold / maxVal) * 100}%`,
            borderTop: "1px dashed rgba(239,68,68,0.4)",
            zIndex: 1,
          }}
        >
          <span
            className="absolute right-0 text-xs font-mono"
            style={{ color: "#ef444455", top: -13 }}
          >
            {threshold * 1000}ms
          </span>
        </div>
        {recent.map((diff, i) => {
          const isDc = diff <= threshold;
          const h = Math.max(4, (diff / maxVal) * 100);
          return (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${h}%`,
                minWidth: 4,
                background: isDc ? "#ef4444" : accent,
                opacity: 0.4 + (i / recent.length) * 0.6,
                boxShadow: isDc ? "0 0 4px #ef444480" : "none",
              }}
              title={`${(diff * 1000).toFixed(1)}ms`}
            />
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color, alert }) {
  return (
    <div
      className="rounded-xl p-3 text-center transition-all duration-300"
      style={{
        background: alert ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${alert ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.07)"}`,
        boxShadow: alert ? "0 0 14px rgba(239,68,68,0.12)" : "none",
      }}
    >
      <div
        className="text-xl font-bold font-mono mb-0.5"
        style={{ color, textShadow: `0 0 10px ${color}55` }}
      >
        {value}
      </div>
      <div className="text-xs text-slate-600">{label}</div>
    </div>
  );
}
