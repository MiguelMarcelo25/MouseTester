import { useRef, useEffect } from "react";

const EVENT_ICONS = {
  "left-click": "🖱️",
  "right-click": "🖱️",
  "middle-click": "🖱️",
  "double-click": "⚡",
  "scroll-up": "⬆️",
  "scroll-down": "⬇️",
};

const EVENT_BADGES = {
  "left-click": "LMB",
  "right-click": "RMB",
  "middle-click": "MMB",
  "double-click": "2×",
  "scroll-up": "↑",
  "scroll-down": "↓",
};

export default function EventLog({ events, onClear }) {
  const listRef = useRef(null);

  return (
    <div
      className="glass rounded-2xl p-5 h-full flex flex-col animate-fade-in-up"
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        minHeight: 500,
        maxHeight: 700,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: events.length > 0 ? "#10b981" : "#374151",
              boxShadow: events.length > 0 ? "0 0 6px #10b981" : "none",
              animation: events.length > 0 ? "pulse-glow 2s infinite" : "none",
            }}
          />
          <h2 className="text-lg font-bold text-slate-200">Event Log</h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-mono px-2 py-0.5 rounded-full"
            style={{
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.3)",
              color: "#818cf8",
            }}
          >
            {events.length}
          </span>
        </div>
      </div>

      {/* Events list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto space-y-2 pr-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {events.length === 0 ? (
          <EmptyState />
        ) : (
          events.map((event, index) => (
            <EventItem key={event.id} event={event} index={index} />
          ))
        )}
      </div>
    </div>
  );
}

function EventItem({ event, index }) {
  const badge = EVENT_BADGES[event.type] || "?";
  const isNew = index === 0;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${isNew ? "animate-slide-in-right" : ""}`}
      style={{
        background: `linear-gradient(135deg, ${event.color}10, transparent)`,
        border: `1px solid ${event.color}25`,
      }}
    >
      {/* Badge */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs"
        style={{
          background: `${event.color}20`,
          border: `1px solid ${event.color}40`,
          color: event.color,
          boxShadow: isNew ? `0 0 10px ${event.color}30` : "none",
        }}
      >
        {badge}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: event.color }}
        >
          {event.label}
        </p>
        <p className="text-xs text-slate-600 font-mono">
          {event.timestamp.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
          <span className="ml-1 text-slate-700">
            .{String(event.timestamp.getMilliseconds()).padStart(3, "0")}
          </span>
        </p>
      </div>

      {/* Indicator dot */}
      {isNew && (
        <div
          className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
          style={{
            background: event.color,
            boxShadow: `0 0 6px ${event.color}`,
          }}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 gap-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          background: "rgba(99,102,241,0.1)",
          border: "1px solid rgba(99,102,241,0.2)",
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="2" width="14" height="20" rx="7" />
          <path d="M12 2v8" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-slate-400 font-medium text-sm">No events yet</p>
        <p className="text-slate-600 text-xs mt-1">
          Click, scroll, or interact with your mouse
        </p>
      </div>
      <div className="flex gap-2 mt-2">
        {["LMB", "MMB", "RMB", "↑", "↓"].map((key) => (
          <span
            key={key}
            className="text-xs font-mono px-2 py-1 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#4b5563",
            }}
          >
            {key}
          </span>
        ))}
      </div>
    </div>
  );
}
