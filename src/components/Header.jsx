import { useState, useEffect } from "react";

export default function Header({ mousePos, onClear }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-white/10 mb-8">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: "0 0 20px rgba(99,102,241,0.5)",
              }}
            >
              <MouseIcon />
            </div>
            <div
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
              style={{ background: "#10b981", boxShadow: "0 0 8px #10b981" }}
            />
          </div>
          <div>
            <h1
              className="text-xl font-bold neon-text"
              style={{
                background: "linear-gradient(135deg, #6366f1, #22d3ee)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              MouseTester Pro
            </h1>
            <p className="text-xs text-slate-500 font-mono">v1.0 · React 19</p>
          </div>
        </div>

        {/* Center - Mouse position */}
        <div className="hidden md:flex items-center gap-2 glass rounded-xl px-4 py-2">
          <span className="text-slate-500 text-xs font-mono">CURSOR</span>
          <span className="text-indigo-400 font-mono text-sm font-bold">
            X: {mousePos.x.toString().padStart(4, " ")}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-cyan-400 font-mono text-sm font-bold">
            Y: {mousePos.y.toString().padStart(4, " ")}
          </span>
        </div>

        {/* Right - Time + Clear */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-slate-300 font-mono text-sm">
              {time.toLocaleTimeString()}
            </p>
            <p className="text-slate-600 text-xs">
              {time.toLocaleDateString()}
            </p>
          </div>
          <button
            id="clear-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="btn-press px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105"
            style={{
              background:
                "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            Clear All
          </button>
        </div>
      </div>
    </header>
  );
}

function MouseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="2" width="14" height="20" rx="7" />
      <path d="M12 2v8" />
    </svg>
  );
}
