import { useState, useEffect, useRef } from "react";

export default function MouseVisualizer({
  activeButtons,
  lastScrollDir,
  events,
}) {
  const [ripples, setRipples] = useState([]);
  const [floatingLabels, setFloatingLabels] = useState([]);
  const rippleIdRef = useRef(0);
  const labelIdRef = useRef(0);

  // Trigger ripple and floating label on new events
  useEffect(() => {
    if (events.length === 0) return;
    const latest = events[0];

    // Add ripple
    const rid = ++rippleIdRef.current;
    const colors = {
      "left-click": "#6366f1",
      "right-click": "#ec4899",
      "middle-click": "#22d3ee",
      "double-click": "#f59e0b",
      "scroll-up": "#10b981",
      "scroll-down": "#f97316",
    };
    const color = colors[latest.type] || "#6366f1";

    setRipples((prev) => [...prev, { id: rid, color }]);
    setTimeout(
      () => setRipples((prev) => prev.filter((r) => r.id !== rid)),
      700,
    );

    // Add floating label
    const lid = ++labelIdRef.current;
    setFloatingLabels((prev) => [
      ...prev,
      { id: lid, label: latest.label, color },
    ]);
    setTimeout(
      () => setFloatingLabels((prev) => prev.filter((l) => l.id !== lid)),
      900,
    );
  }, [events]);

  const isAnyActive =
    activeButtons.left ||
    activeButtons.right ||
    activeButtons.middle ||
    activeButtons.sideBack ||
    activeButtons.sideForward;

  return (
    <div
      className="glass rounded-2xl p-6 animate-fade-in-up"
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-200">Mouse Visualizer</h2>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: isAnyActive ? "#10b981" : "#374151",
              boxShadow: isAnyActive ? "0 0 8px #10b981" : "none",
              transition: "all 0.2s",
            }}
          />
          <span className="text-xs text-slate-500">
            {isAnyActive ? "ACTIVE" : "IDLE"}
          </span>
        </div>
      </div>

      {/* Mouse Body SVG */}
      <div className="flex flex-col items-center gap-8">
        <div
          className="relative flex items-center justify-center"
          style={{ width: 280, height: 340 }}
        >
          {/* Ripple effects */}
          {ripples.map((r) => (
            <div
              key={r.id}
              className="ripple-effect"
              style={{
                width: 60,
                height: 60,
                background: `radial-gradient(circle, ${r.color}80, transparent)`,
                position: "absolute",
                top: "50%",
                left: "50%",
                marginTop: -30,
                marginLeft: -30,
              }}
            />
          ))}

          {/* Floating labels */}
          {floatingLabels.map((fl, i) => (
            <div
              key={fl.id}
              className="animate-float-up absolute font-bold text-sm pointer-events-none"
              style={{
                color: fl.color,
                top: "30%",
                left: "50%",
                transform: "translateX(-50%)",
                textShadow: `0 0 10px ${fl.color}`,
                zIndex: 10,
                whiteSpace: "nowrap",
              }}
            >
              {fl.label}
            </div>
          ))}

          {/* Mouse SVG */}
          <MouseSVG
            activeButtons={activeButtons}
            lastScrollDir={lastScrollDir}
          />
        </div>

        {/* Button labels below */}
        <div className="flex items-center gap-4 w-full justify-center flex-wrap">
          <ButtonLabel
            label="Left Click"
            active={activeButtons.left}
            color="#6366f1"
            shortcut="LMB"
          />
          <ButtonLabel
            label="Middle"
            active={activeButtons.middle}
            color="#22d3ee"
            shortcut="MMB"
          />
          <ButtonLabel
            label="Right Click"
            active={activeButtons.right}
            color="#ec4899"
            shortcut="RMB"
          />
          <ButtonLabel
            label="Forward"
            active={activeButtons.sideForward}
            color="#f97316"
            shortcut="X2"
          />
          <ButtonLabel
            label="Back"
            active={activeButtons.sideBack}
            color="#10b981"
            shortcut="X1"
          />
        </div>

        {/* Scroll indicator */}
        <ScrollIndicator direction={lastScrollDir} />
      </div>
    </div>
  );
}

function MouseSVG({ activeButtons, lastScrollDir }) {
  const leftColor = activeButtons.left ? "#6366f1" : "#1e1e3a";
  const rightColor = activeButtons.right ? "#ec4899" : "#1e1e3a";
  const middleColor = activeButtons.middle ? "#22d3ee" : "#374151";
  const scrollColor =
    lastScrollDir === "up"
      ? "#10b981"
      : lastScrollDir === "down"
        ? "#f97316"
        : "#4b5563";

  const glowLeft = activeButtons.left
    ? "0 0 20px #6366f1, 0 0 40px rgba(99,102,241,0.5)"
    : "none";
  const glowRight = activeButtons.right
    ? "0 0 20px #ec4899, 0 0 40px rgba(236,72,153,0.5)"
    : "none";
  const glowMiddle = activeButtons.middle ? "0 0 15px #22d3ee" : "none";

  return (
    <svg
      width="220"
      height="320"
      viewBox="0 0 220 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 0 30px rgba(99,102,241,0.15))" }}
    >
      {/* Mouse body outline */}
      <rect
        x="10"
        y="10"
        width="200"
        height="300"
        rx="100"
        fill="#111827"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1.5"
      />

      {/* Left button */}
      <path
        d="M10,110 L10,110 Q10,10 110,10 L110,110 Z"
        fill={leftColor}
        style={{
          filter:
            glowLeft !== "none" ? `drop-shadow(0 0 12px #6366f1)` : "none",
          transition: "fill 0.1s, filter 0.1s",
        }}
      />

      {/* Right button */}
      <path
        d="M110,10 Q210,10 210,110 L210,110 L110,110 Z"
        fill={rightColor}
        style={{
          filter:
            glowRight !== "none" ? `drop-shadow(0 0 12px #ec4899)` : "none",
          transition: "fill 0.1s, filter 0.1s",
        }}
      />

      {/* Divider line */}
      <line
        x1="110"
        y1="10"
        x2="110"
        y2="110"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
      />

      {/* Horizontal divider between buttons and body */}
      <line
        x1="10"
        y1="110"
        x2="210"
        y2="110"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
      />

      {/* Scroll wheel */}
      <rect
        x="90"
        y="40"
        width="40"
        height="60"
        rx="20"
        fill={middleColor}
        style={{
          filter:
            glowMiddle !== "none" ? `drop-shadow(0 0 8px #22d3ee)` : "none",
          transition: "fill 0.1s, filter 0.1s",
        }}
      />

      {/* Scroll wheel lines */}
      <line
        x1="110"
        y1="52"
        x2="110"
        y2="88"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Scroll up arrow on wheel */}
      {lastScrollDir === "up" && (
        <path
          d="M103,62 L110,52 L117,62"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 0 4px #10b981)" }}
        />
      )}

      {/* Scroll down arrow on wheel */}
      {lastScrollDir === "down" && (
        <path
          d="M103,78 L110,88 L117,78"
          stroke="#f97316"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 0 4px #f97316)" }}
        />
      )}

      {/* Body lower section */}
      <rect
        x="10"
        y="110"
        width="200"
        height="200"
        rx="0"
        fill="#0f172a"
        style={{ borderRadius: "0 0 100px 100px" }}
      />
      <path
        d="M10,110 L10,260 Q10,310 110,310 Q210,310 210,260 L210,110 Z"
        fill="#0f172a"
      />

      {/* Body detail lines */}
      <path
        d="M50,160 Q110,180 170,160"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M40,200 Q110,225 180,200"
        stroke="rgba(255,255,255,0.04)"
        strokeWidth="1"
        fill="none"
      />

      {/* Left-side side buttons (Superlight layout) */}
      {/* Front button (Forward / X2) */}
      <rect
        x="8"
        y="130"
        width="10"
        height="28"
        rx="5"
        fill={activeButtons.sideForward ? "#f97316" : "rgba(255,255,255,0.07)"}
        style={{
          filter: activeButtons.sideForward
            ? "drop-shadow(0 0 8px #f97316)"
            : "none",
          transition: "fill 0.1s, filter 0.1s",
        }}
      />
      {/* Forward icon */}
      <path
        d="M13,140 L13,134 M10,137 L13,134 L16,137"
        stroke={activeButtons.sideForward ? "#fff" : "rgba(255,255,255,0.3)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Rear button (Back / X1) */}
      <rect
        x="8"
        y="166"
        width="10"
        height="28"
        rx="5"
        fill={activeButtons.sideBack ? "#10b981" : "rgba(255,255,255,0.07)"}
        style={{
          filter: activeButtons.sideBack
            ? "drop-shadow(0 0 8px #10b981)"
            : "none",
          transition: "fill 0.1s, filter 0.1s",
        }}
      />
      {/* Back icon */}
      <path
        d="M13,170 L13,176 M10,173 L13,176 L16,173"
        stroke={activeButtons.sideBack ? "#fff" : "rgba(255,255,255,0.3)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* LED indicator at bottom */}
      <circle
        cx="110"
        cy="280"
        r="6"
        fill={
          activeButtons.left || activeButtons.right || activeButtons.middle
            ? "#6366f1"
            : "#1e293b"
        }
        style={{
          filter:
            activeButtons.left || activeButtons.right || activeButtons.middle
              ? "drop-shadow(0 0 6px #6366f1)"
              : "none",
          transition: "all 0.2s",
        }}
      />
    </svg>
  );
}

function ButtonLabel({ label, active, color, shortcut }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-150"
        style={{
          background: active ? `${color}20` : "rgba(255,255,255,0.04)",
          border: `1px solid ${active ? color : "rgba(255,255,255,0.08)"}`,
          color: active ? color : "#6b7280",
          boxShadow: active ? `0 0 12px ${color}40` : "none",
          transform: active ? "scale(1.05)" : "scale(1)",
        }}
      >
        {shortcut}
      </div>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

function ScrollIndicator({ direction }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs text-slate-600 uppercase tracking-widest font-mono">
        Scroll
      </p>
      <div className="flex flex-col items-center gap-1">
        {/* Up arrow */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{
            background:
              direction === "up"
                ? "rgba(16,185,129,0.2)"
                : "rgba(255,255,255,0.04)",
            border: `1px solid ${direction === "up" ? "#10b981" : "rgba(255,255,255,0.08)"}`,
            boxShadow:
              direction === "up" ? "0 0 12px rgba(16,185,129,0.4)" : "none",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={direction === "up" ? "#10b981" : "#4b5563"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </div>
        {/* Down arrow */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
          style={{
            background:
              direction === "down"
                ? "rgba(249,115,22,0.2)"
                : "rgba(255,255,255,0.04)",
            border: `1px solid ${direction === "down" ? "#f97316" : "rgba(255,255,255,0.08)"}`,
            boxShadow:
              direction === "down" ? "0 0 12px rgba(249,115,22,0.4)" : "none",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={direction === "down" ? "#f97316" : "#4b5563"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </div>
  );
}
