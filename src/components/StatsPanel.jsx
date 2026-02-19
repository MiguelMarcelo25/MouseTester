const STAT_CARDS = [
  {
    key: "leftClicks",
    label: "Left Clicks",
    shortLabel: "LMB",
    color: "#6366f1",
    gradient:
      "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05))",
    border: "rgba(99,102,241,0.3)",
    icon: LeftClickIcon,
  },
  {
    key: "rightClicks",
    label: "Right Clicks",
    shortLabel: "RMB",
    color: "#ec4899",
    gradient:
      "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(236,72,153,0.05))",
    border: "rgba(236,72,153,0.3)",
    icon: RightClickIcon,
  },
  {
    key: "middleClicks",
    label: "Middle Clicks",
    shortLabel: "MMB",
    color: "#22d3ee",
    gradient:
      "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(34,211,238,0.05))",
    border: "rgba(34,211,238,0.3)",
    icon: MiddleClickIcon,
  },
  {
    key: "doubleClicks",
    label: "Double Clicks",
    shortLabel: "2×",
    color: "#f59e0b",
    gradient:
      "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))",
    border: "rgba(245,158,11,0.3)",
    icon: DoubleClickIcon,
  },
  {
    key: "scrollUp",
    label: "Scroll Up",
    shortLabel: "↑",
    color: "#10b981",
    gradient:
      "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))",
    border: "rgba(16,185,129,0.3)",
    icon: ScrollUpIcon,
  },
  {
    key: "scrollDown",
    label: "Scroll Down",
    shortLabel: "↓",
    color: "#f97316",
    gradient:
      "linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.05))",
    border: "rgba(249,115,22,0.3)",
    icon: ScrollDownIcon,
  },
];

export default function StatsPanel({ stats }) {
  const total = stats.totalEvents;

  return (
    <div
      className="glass rounded-2xl p-5 animate-fade-in-up"
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-slate-200">Statistics</h2>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          <span className="text-xs text-slate-500 font-mono">TOTAL</span>
          <span
            className="text-lg font-bold font-mono"
            style={{
              color: "#818cf8",
              textShadow: "0 0 10px rgba(99,102,241,0.5)",
            }}
          >
            {total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {STAT_CARDS.map((card) => (
          <StatCard
            key={card.key}
            card={card}
            value={stats[card.key]}
            total={total}
          />
        ))}
      </div>

      {/* Progress bars */}
      {total > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-xs text-slate-600 uppercase tracking-widest font-mono mb-3">
            Distribution
          </p>
          {STAT_CARDS.map((card) => {
            const value = stats[card.key];
            const pct = total > 0 ? (value / total) * 100 : 0;
            return (
              <div key={card.key} className="flex items-center gap-3">
                <span
                  className="text-xs font-mono w-8 text-right"
                  style={{ color: card.color }}
                >
                  {card.shortLabel}
                </span>
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: card.color,
                      boxShadow: `0 0 6px ${card.color}60`,
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-600 w-10 text-right">
                  {pct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ card, value, total }) {
  const Icon = card.icon;
  const pct = total > 0 ? ((value / total) * 100).toFixed(0) : 0;

  return (
    <div
      className="rounded-xl p-4 transition-all duration-200 hover:scale-105 cursor-default"
      style={{
        background: card.gradient,
        border: `1px solid ${card.border}`,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: `${card.color}20`,
            border: `1px solid ${card.color}30`,
          }}
        >
          <Icon color={card.color} />
        </div>
        {total > 0 && (
          <span
            className="text-xs font-mono"
            style={{ color: `${card.color}80` }}
          >
            {pct}%
          </span>
        )}
      </div>
      <div
        className="text-2xl font-bold font-mono mb-1"
        style={{
          color: card.color,
          textShadow: value > 0 ? `0 0 10px ${card.color}50` : "none",
        }}
      >
        {value.toLocaleString()}
      </div>
      <div className="text-xs text-slate-500">{card.label}</div>
    </div>
  );
}

// Icons
function LeftClickIcon({ color }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 2h7v10H5z" />
      <rect x="5" y="2" width="14" height="20" rx="7" />
    </svg>
  );
}

function RightClickIcon({ color }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2h7v10h-7z" />
      <rect x="5" y="2" width="14" height="20" rx="7" />
    </svg>
  );
}

function MiddleClickIcon({ color }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="2" width="14" height="20" rx="7" />
      <rect x="10" y="6" width="4" height="8" rx="2" />
    </svg>
  );
}

function DoubleClickIcon({ color }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2v10" />
      <path d="M8 5l5-3 5 3" />
      <path d="M8 19l5 3 5-3" />
    </svg>
  );
}

function ScrollUpIcon({ color }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function ScrollDownIcon({ color }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
