import { useState, useEffect, useRef, useCallback } from "react";
import MouseVisualizer from "./components/MouseVisualizer";
import EventLog from "./components/EventLog";
import StatsPanel from "./components/StatsPanel";
import Header from "./components/Header";
import DoubleClickTester from "./components/DoubleClickTester";
import KeyboardTester from "./components/KeyboardTester";

const MAX_LOG_ENTRIES = 50;
const DOUBLE_CLICK_THRESHOLD = 300;

export default function App() {
  const [activeTab, setActiveTab] = useState("mouse"); // 'mouse' | 'doubleclick' | 'keyboard'

  // ── Mouse tester state ──
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    leftClicks: 0,
    rightClicks: 0,
    middleClicks: 0,
    doubleClicks: 0,
    scrollUp: 0,
    scrollDown: 0,
    totalEvents: 0,
  });
  const [activeButtons, setActiveButtons] = useState({
    left: false,
    right: false,
    middle: false,
    sideBack: false,
    sideForward: false,
  });
  const [lastScrollDir, setLastScrollDir] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const eventIdRef = useRef(0);
  const lastLeftDownTimeRef = useRef(0);

  const addEvent = useCallback((type, label, color) => {
    const id = ++eventIdRef.current;
    const timestamp = new Date();
    setEvents((prev) => {
      const newEvents = [{ id, type, label, color, timestamp }, ...prev];
      return newEvents.slice(0, MAX_LOG_ENTRIES);
    });
    setStats((prev) => ({ ...prev, totalEvents: prev.totalEvents + 1 }));
  }, []);

  const handleMouseDown = useCallback(
    (e) => {
      // Don't intercept clicks on the double-click tab
      if (activeTab === "doubleclick") return;
      e.preventDefault();
      const button = e.button;

      if (button === 0) {
        setActiveButtons((prev) => ({ ...prev, left: true }));
        const now = Date.now();
        const timeSinceLast = now - lastLeftDownTimeRef.current;
        lastLeftDownTimeRef.current = now;

        if (timeSinceLast < DOUBLE_CLICK_THRESHOLD) {
          // Undo the previous single-click
          setStats((prev) => ({
            ...prev,
            leftClicks: Math.max(0, prev.leftClicks - 1),
            totalEvents: Math.max(0, prev.totalEvents - 1),
          }));
          setEvents((prev) => {
            const idx = prev.findIndex((ev) => ev.type === "left-click");
            if (idx === -1) return prev;
            return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
          });
          setStats((prev) => ({
            ...prev,
            doubleClicks: prev.doubleClicks + 1,
          }));
          addEvent("double-click", "Double Click ⚡", "#f59e0b");
          lastLeftDownTimeRef.current = 0;
        } else {
          setStats((prev) => ({ ...prev, leftClicks: prev.leftClicks + 1 }));
          addEvent("left-click", "Left Click", "#6366f1");
        }
      } else if (button === 1) {
        setActiveButtons((prev) => ({ ...prev, middle: true }));
        setStats((prev) => ({ ...prev, middleClicks: prev.middleClicks + 1 }));
        addEvent("middle-click", "Middle Click", "#22d3ee");
      } else if (button === 2) {
        setActiveButtons((prev) => ({ ...prev, right: true }));
        setStats((prev) => ({ ...prev, rightClicks: prev.rightClicks + 1 }));
        addEvent("right-click", "Right Click", "#ec4899");
      } else if (button === 3) {
        // Rear side button (Back)
        setActiveButtons((prev) => ({ ...prev, sideBack: true }));
        addEvent("side-back", "Back Button (X1)", "#10b981");
      } else if (button === 4) {
        // Front side button (Forward)
        setActiveButtons((prev) => ({ ...prev, sideForward: true }));
        addEvent("side-forward", "Forward Button (X2)", "#f97316");
      }
    },
    [addEvent, activeTab],
  );

  const handleMouseUp = useCallback(
    (e) => {
      if (activeTab === "doubleclick") return;
      const button = e.button;
      if (button === 0) setActiveButtons((prev) => ({ ...prev, left: false }));
      else if (button === 1)
        setActiveButtons((prev) => ({ ...prev, middle: false }));
      else if (button === 2)
        setActiveButtons((prev) => ({ ...prev, right: false }));
      else if (button === 3)
        setActiveButtons((prev) => ({ ...prev, sideBack: false }));
      else if (button === 4)
        setActiveButtons((prev) => ({ ...prev, sideForward: false }));
    },
    [activeTab],
  );

  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleWheel = useCallback(
    (e) => {
      if (activeTab === "doubleclick") return;
      e.preventDefault();
      if (e.deltaY < 0) {
        setLastScrollDir("up");
        setStats((prev) => ({ ...prev, scrollUp: prev.scrollUp + 1 }));
        addEvent("scroll-up", "Scroll Up ↑", "#10b981");
      } else if (e.deltaY > 0) {
        setLastScrollDir("down");
        setStats((prev) => ({ ...prev, scrollDown: prev.scrollDown + 1 }));
        addEvent("scroll-down", "Scroll Down ↓", "#f97316");
      }
      setTimeout(() => setLastScrollDir(null), 600);
    },
    [addEvent, activeTab],
  );

  const handleMouseMove = useCallback((e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const clearAll = useCallback(() => {
    lastLeftDownTimeRef.current = 0;
    setEvents([]);
    setStats({
      leftClicks: 0,
      rightClicks: 0,
      middleClicks: 0,
      doubleClicks: 0,
      scrollUp: 0,
      scrollDown: 0,
      totalEvents: 0,
    });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div
      className="min-h-screen no-select"
      style={{
        background:
          "radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(34,211,238,0.06) 0%, transparent 60%), radial-gradient(ellipse at 60% 80%, rgba(236,72,153,0.05) 0%, transparent 60%), #0a0a0f",
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onWheel={handleWheel}
    >
      <Header mousePos={mousePos} onClear={clearAll} />

      <main className="max-w-7xl mx-auto px-4 pb-10">
        {/* Tab switcher */}
        <div className="flex gap-2 mb-6">
          <TabButton
            id="tab-mouse"
            label="🖱️ Mouse Tester"
            active={activeTab === "mouse"}
            onClick={() => setActiveTab("mouse")}
            accent="#6366f1"
          />
          <TabButton
            id="tab-doubleclick"
            label="⚡ Double Click Test"
            active={activeTab === "doubleclick"}
            onClick={() => setActiveTab("doubleclick")}
            accent="#ef4444"
          />
          <TabButton
            id="tab-keyboard"
            label="⌨️ Keyboard Tester"
            active={activeTab === "keyboard"}
            onClick={() => setActiveTab("keyboard")}
            accent="#10b981"
          />
        </div>

        {/* Tab content */}
        {activeTab === "mouse" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <MouseVisualizer
                activeButtons={activeButtons}
                lastScrollDir={lastScrollDir}
                events={events}
              />
              <StatsPanel stats={stats} />
            </div>
            <div className="lg:col-span-1">
              <EventLog events={events} onClear={clearAll} />
            </div>
          </div>
        )}
        {activeTab === "doubleclick" && (
          <div className="max-w-2xl mx-auto">
            <DoubleClickTester />
          </div>
        )}
        {activeTab === "keyboard" && <KeyboardTester />}
      </main>
    </div>
  );
}

function TabButton({ id, label, active, onClick, accent = "#6366f1" }) {
  const activeColor =
    accent === "#ef4444"
      ? "#f87171"
      : accent === "#10b981"
        ? "#34d399"
        : "#818cf8";
  return (
    <button
      id={id}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.03] btn-press"
      style={{
        background: active
          ? `linear-gradient(135deg, ${accent}30, ${accent}15)`
          : "rgba(255,255,255,0.04)",
        border: `1px solid ${active ? accent + "60" : "rgba(255,255,255,0.08)"}`,
        color: active ? activeColor : "#6b7280",
        boxShadow: active ? `0 0 20px ${accent}25` : "none",
      }}
    >
      {label}
    </button>
  );
}
