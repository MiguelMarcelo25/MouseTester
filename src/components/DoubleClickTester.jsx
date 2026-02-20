import { useState, useRef, useCallback, useEffect } from "react";

function microtime() {
  return new Date().getTime() / 1000;
}

const DC_THRESHOLD = 0.08;
const MIN_CLICKS_FOR_VERDICT = 20;

function makeButtonState() {
  return {
    clicks: 0,
    dcCount: 0,
    intervals: [],
    prevTime: microtime(),
  };
}

export default function DoubleClickTester() {
  const [btnState, setBtnState] = useState({
    0: makeButtonState(),
    1: makeButtonState(),
    2: makeButtonState(),
    3: makeButtonState(),
    4: makeButtonState(),
  });
  const [flashState, setFlashState] = useState({
    0: "idle",
    1: "idle",
    2: "idle",
    3: "idle",
    4: "idle",
  });
  const [isRunning, setIsRunning] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [cps, setCps] = useState(0);

  const prevTimeRef = useRef({
    0: microtime(),
    1: microtime(),
    2: microtime(),
    3: microtime(),
    4: microtime(),
  });
  const statusTimerRef = useRef({
    0: null,
    1: null,
    2: null,
    3: null,
    4: null,
  });
  const sessionTimerRef = useRef(null);
  const clickTimestampsRef = useRef([]);

  useEffect(() => {
    if (isRunning) {
      sessionTimerRef.current = setInterval(
        () => setSessionTime((p) => p + 1),
        1000,
      );
    }
    return () => clearInterval(sessionTimerRef.current);
  }, [isRunning]);

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

  const clickEvent = useCallback((button) => {
    const clickTime = microtime();
    const diff = clickTime - prevTimeRef.current[button];
    const isDc = prevTimeRef.current[button] !== 0 && diff <= DC_THRESHOLD;

    setBtnState((prev) => {
      const b = prev[button];
      const newIntervals =
        b.clicks > 0 ? [...b.intervals.slice(-49), diff] : b.intervals;
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
    prevTimeRef.current[button] = clickTime;
    clickTimestampsRef.current.push(Date.now());

    if (statusTimerRef.current[button])
      clearTimeout(statusTimerRef.current[button]);
    statusTimerRef.current[button] = setTimeout(
      () => setFlashState((prev) => ({ ...prev, [button]: "idle" })),
      400,
    );
  }, []);

  const handleMouseDown = useCallback(
    (e) => {
      if ([0, 1, 2, 3, 4].includes(e.button)) {
        if (!isRunning) setIsRunning(true);
        clickEvent(e.button);
      }
    },
    [isRunning, clickEvent],
  );

  const handleReset = useCallback(() => {
    setBtnState({
      0: makeButtonState(),
      1: makeButtonState(),
      2: makeButtonState(),
      3: makeButtonState(),
      4: makeButtonState(),
    });
    setFlashState({ 0: "idle", 1: "idle", 2: "idle", 3: "idle", 4: "idle" });
    setIsRunning(false);
    setSessionTime(0);
    setCps(0);
    clickTimestampsRef.current = [];
    prevTimeRef.current = {
      0: microtime(),
      1: microtime(),
      2: microtime(),
      3: microtime(),
      4: microtime(),
    };
  }, []);

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const totalClicks = Object.values(btnState).reduce(
    (acc, s) => acc + s.clicks,
    0,
  );

  return (
    <div className="flex flex-col gap-10 animate-fade-in py-4">
      {/* ── Header Area ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
            Double Click Analyzer
          </h2>
          <p className="text-sm text-slate-500 max-w-md">
            Detect hardware failures in your mouse switches. If two clicks occur
            within <span className="text-indigo-400 font-mono">80ms</span>, it's
            a misfire.
          </p>
        </div>
        <div className="flex gap-4">
          <HeaderStat
            label="Session Time"
            value={isRunning ? formatTime(sessionTime) : "0:00"}
            color="#6366f1"
          />
          <HeaderStat label="Live CPS" value={cps} color="#f59e0b" />
          <HeaderStat
            label="Total Volume"
            value={totalClicks}
            color="#22d3ee"
          />
        </div>
      </div>

      {/* ── Main Testing Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <ButtonCard
          id={0}
          label="Left Click"
          icon="🖱️"
          accent="#6366f1"
          state={btnState[0]}
          flash={flashState[0]}
          onMouseDown={handleMouseDown}
        />
        <ButtonCard
          id={1}
          label="Middle Click"
          icon="🖱️"
          accent="#22d3ee"
          state={btnState[1]}
          flash={flashState[1]}
          onMouseDown={handleMouseDown}
        />
        <ButtonCard
          id={2}
          label="Right Click"
          icon="🖱️"
          accent="#ec4899"
          state={btnState[2]}
          flash={flashState[2]}
          onMouseDown={handleMouseDown}
        />
        <ButtonCard
          id={3}
          label="Back (X1)"
          icon="🔙"
          accent="#10b981"
          state={btnState[3]}
          flash={flashState[3]}
          onMouseDown={handleMouseDown}
        />
        <ButtonCard
          id={4}
          label="Forward (X2)"
          icon="🔜"
          accent="#f59e0b"
          state={btnState[4]}
          flash={flashState[4]}
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between border-t border-white/5 pt-8 px-2">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Real-time analysis active
        </div>
        <button
          onClick={handleReset}
          className="px-8 py-3 rounded-xl font-bold text-sm bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all active:scale-95"
        >
          Reset Statistics
        </button>
      </div>
    </div>
  );
}

function ButtonCard({ id, label, icon, accent, state, flash, onMouseDown }) {
  const isOk = flash === "ok";
  const isDc = flash === "dc";
  const errorRate = state.clicks > 0 ? (state.dcCount / state.clicks) * 100 : 0;
  const hasEnoughData = state.clicks >= MIN_CLICKS_FOR_VERDICT;

  // Custom Verdict Logic
  let verdict = "Healthy";
  let verdictColor = "#34d399";
  if (!hasEnoughData) {
    verdict = "Calibrating...";
    verdictColor = "#64748b";
  } else if (state.dcCount > 0) {
    if (errorRate > 15) {
      verdict = "Defective";
      verdictColor = "#ef4444";
    } else {
      verdict = "Worn Out";
      verdictColor = "#f59e0b";
    }
  }

  return (
    <div
      onMouseDown={onMouseDown}
      className={`relative group flex flex-col rounded-[24px] border transition-all duration-300 overflow-hidden cursor-pointer select-none bg-slate-900/40 backdrop-blur-md ${
        isDc
          ? "border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.15)]"
          : isOk
            ? `border-[${accent}] shadow-[0_0_30px_${accent}20]`
            : "border-white/5 hover:border-white/10"
      }`}
      style={{
        borderColor: isDc
          ? "#ef4444"
          : isOk
            ? accent
            : "rgba(255,255,255,0.05)",
        boxShadow: isDc
          ? "0 0 50px rgba(239,68,68,0.2)"
          : isOk
            ? `0 0 30px ${accent}30`
            : "none",
      }}
    >
      {/* Click Area */}
      <div className="flex flex-col items-center justify-center p-8 pb-4">
        <div
          className={`text-5xl mb-4 transition-transform duration-100 ${isOk || isDc ? "scale-90" : "group-hover:scale-110"}`}
        >
          {isDc ? "⚡" : isOk ? "✅" : icon}
        </div>
        <div className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">
          {label}
        </div>
      </div>

      {/* Stats Divider */}
      <div className="flex-1 flex flex-col p-6 pt-2 gap-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded-xl p-2 text-center">
            <div className="text-[10px] uppercase font-mono text-slate-600">
              Clicks
            </div>
            <div className="text-lg font-black text-slate-300 font-mono">
              {state.clicks}
            </div>
          </div>
          <div
            className={`rounded-xl p-2 text-center ${state.dcCount > 0 ? "bg-red-500/10" : "bg-white/5"}`}
          >
            <div className="text-[10px] uppercase font-mono text-slate-600">
              Doubles
            </div>
            <div
              className="text-lg font-black font-mono"
              style={{ color: state.dcCount > 0 ? "#f87171" : "#475569" }}
            >
              {state.dcCount}
            </div>
          </div>
        </div>

        {/* Small Graph */}
        <div className="h-10 bg-black/20 rounded-lg overflow-hidden flex items-end px-1 gap-px">
          {state.intervals.slice(-20).map((val, i) => {
            const h = Math.min(100, (val / DC_THRESHOLD) * 50);
            const dc = val <= DC_THRESHOLD;
            return (
              <div
                key={i}
                className="flex-1 rounded-t-sm"
                style={{
                  height: `${Math.max(10, h)}%`,
                  background: dc ? "#ef4444" : accent,
                  opacity: 0.3 + (i / 20) * 0.7,
                }}
              />
            );
          })}
          {state.intervals.length === 0 && (
            <div className="w-full text-[9px] text-center mb-1 text-slate-700 font-mono">
              no data
            </div>
          )}
        </div>

        {/* Verdict */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600">
              Verdict
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {errorRate.toFixed(1)}% error
            </span>
          </div>
          <div
            className="w-full py-2 rounded-lg text-center text-xs font-black uppercase tracking-tighter"
            style={{
              background: `${verdictColor}15`,
              color: verdictColor,
              border: `1px solid ${verdictColor}30`,
            }}
          >
            {verdict}
          </div>
        </div>
      </div>

      {/* Side Color Strip */}
      <div
        className="absolute top-0 bottom-0 left-0 w-1"
        style={{ background: accent }}
      />
    </div>
  );
}

function HeaderStat({ label, value, color }) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-2xl px-5 py-3 flex flex-col items-center min-w-[120px]">
      <div className="text-[10px] uppercase font-bold tracking-widest text-slate-600 mb-1">
        {label}
      </div>
      <div
        className="text-2xl font-black font-mono leading-none"
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}
