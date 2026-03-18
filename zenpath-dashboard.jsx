import { useState, useEffect, useRef } from "react";

const habits = [
  { id: 1, name: "Morning Meditation", icon: "🧘", streak: 12, target: 20, unit: "mins", done: true, value: 20, color: "#7C9E8A" },
  { id: 2, name: "No Phone Before 9AM", icon: "📵", streak: 7, target: 1, unit: "days", done: true, value: 1, color: "#C4956A" },
  { id: 3, name: "Read 30 Minutes", icon: "📖", streak: 4, target: 30, unit: "mins", done: false, value: 12, color: "#8A7EC4" },
  { id: 4, name: "Drink 8 Glasses", icon: "💧", streak: 19, target: 8, unit: "glasses", done: false, value: 5, color: "#6AAEC4" },
  { id: 5, name: "Evening Walk", icon: "🚶", streak: 3, target: 30, unit: "mins", done: false, value: 0, color: "#C47E8A" },
];

const weekDays = ["M", "T", "W", "T", "F", "S", "S"];
const weekData = [true, true, true, true, false, true, false];

const aiMessages = [
  "You've meditated 12 days straight. Your focus sessions are 40% longer than last week. Keep this momentum — you're building something real. 🌿",
  "Your screen-free mornings are working. You logged 3 deep focus sessions before noon this week.",
  "Missing your evening walk today? Even 10 minutes resets your nervous system more than you'd think.",
];

function CircleProgress({ value, max, color, size = 64, stroke = 5 }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = circ * (1 - pct);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8E0D4" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

function FocusTimer() {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(25 * 60);
  const [phase, setPhase] = useState("focus"); // focus | break
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setPhase(p => p === "focus" ? "break" : "focus");
            return p => p === "focus" ? 5 * 60 : 25 * 60;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  const total = phase === "focus" ? 25 * 60 : 5 * 60;
  const progress = (total - seconds) / total;
  const circumference = 2 * Math.PI * 54;

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: 130, height: 130, margin: "0 auto 16px" }}>
        <svg width={130} height={130} style={{ transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 }}>
          <circle cx={65} cy={65} r={54} fill="none" stroke="#E8E0D4" strokeWidth={6} />
          <circle
            cx={65} cy={65} r={54} fill="none"
            stroke={phase === "focus" ? "#7C9E8A" : "#C4956A"}
            strokeWidth={6}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
        }}>
          <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "26px", color: "#3D3530", lineHeight: 1 }}>{mins}:{secs}</div>
          <div style={{ fontSize: "9px", color: "#A09080", letterSpacing: "1.5px", textTransform: "uppercase", marginTop: "2px" }}>{phase}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
        <button onClick={() => setRunning(r => !r)} style={{
          padding: "8px 24px",
          background: running ? "#E8E0D4" : "#7C9E8A",
          color: running ? "#7C9E8A" : "#fff",
          border: "none", borderRadius: "99px",
          fontSize: "12px", cursor: "pointer",
          fontFamily: "inherit", fontWeight: 600,
          transition: "all 0.2s",
        }}>
          {running ? "Pause" : "Start"}
        </button>
        <button onClick={() => { setRunning(false); setSeconds(phase === "focus" ? 25 * 60 : 5 * 60); }} style={{
          padding: "8px 16px",
          background: "transparent", color: "#A09080",
          border: "1px solid #D8D0C4", borderRadius: "99px",
          fontSize: "12px", cursor: "pointer",
          fontFamily: "inherit",
        }}>Reset</button>
      </div>

      <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginTop: "12px" }}>
        {["focus", "break"].map(p => (
          <button key={p} onClick={() => { setPhase(p); setRunning(false); setSeconds(p === "focus" ? 25 * 60 : 5 * 60); }} style={{
            fontSize: "10px", padding: "3px 12px",
            background: phase === p ? (p === "focus" ? "#7C9E8A20" : "#C4956A20") : "transparent",
            color: phase === p ? (p === "focus" ? "#7C9E8A" : "#C4956A") : "#B0A898",
            border: `1px solid ${phase === p ? (p === "focus" ? "#7C9E8A40" : "#C4956A40") : "#E0D8CC"}`,
            borderRadius: "99px", cursor: "pointer", fontFamily: "inherit",
            textTransform: "capitalize",
          }}>{p === "focus" ? "25 min" : "5 min"}</button>
        ))}
      </div>
    </div>
  );
}

export default function ZenPathDashboard() {
  const [aiIdx, setAiIdx] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: "ai", text: aiMessages[0] }
  ]);
  const [habitStates, setHabitStates] = useState(habits.map(h => ({ ...h })));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  const completedToday = habitStates.filter(h => h.done).length;
  const totalHabits = habitStates.length;

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const responses = [
      "Based on your data, your most consistent habit is morning meditation. Want me to suggest a complementary evening ritual?",
      "Your streak drops on Sundays — it's pattern. Try reducing targets by 50% on weekends to maintain consistency.",
      "You're in the top 20% of focus session duration. The next level is reducing distractions logged per session.",
    ];
    setChatHistory(h => [...h,
      { role: "user", text: chatInput },
      { role: "ai", text: responses[Math.floor(Math.random() * responses.length)] }
    ]);
    setChatInput("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F5F0E8",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Noise texture overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
        opacity: 0.4,
      }} />

      {/* Soft background blobs */}
      <div style={{ position: "fixed", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, #C8D8BE40, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, #D4B89640, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>

        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: "32px",
          opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(12px)",
          transition: "all 0.5s ease",
        }}>
          <div>
            <div style={{ fontSize: "11px", color: "#A09080", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>
              Wednesday, March 11
            </div>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "32px", color: "#2A2420", lineHeight: 1.1 }}>
              Good morning,<br /><span style={{ color: "#7C9E8A" }}>Arjun</span> 🌿
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: "#A09080", marginBottom: "4px" }}>Today's score</div>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "36px", color: "#2A2420" }}>
              {completedToday}<span style={{ fontSize: "20px", color: "#C8B8A8" }}>/{totalHabits}</span>
            </div>
            <div style={{ fontSize: "11px", color: "#7C9E8A" }}>habits complete</div>
          </div>
        </div>

        {/* Week streak bar */}
        <div style={{
          background: "#EDE7DC", borderRadius: "16px", padding: "16px 20px",
          marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px",
          opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(12px)",
          transition: "all 0.5s ease 0.1s",
        }}>
          <div>
            <div style={{ fontSize: "11px", color: "#A09080", letterSpacing: "1px", textTransform: "uppercase" }}>Weekly</div>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "22px", color: "#2A2420" }}>5 day streak 🔥</div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
            {weekDays.map((d, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: weekData[i] ? "#7C9E8A" : "#D8D0C4",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px", marginBottom: "4px",
                  boxShadow: weekData[i] ? "0 2px 8px #7C9E8A40" : "none",
                  transition: "all 0.3s",
                }}>{weekData[i] ? "✓" : ""}</div>
                <div style={{ fontSize: "9px", color: "#A09080" }}>{d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px" }}>

          {/* Left: Habits */}
          <div>
            <div style={{ fontSize: "11px", color: "#A09080", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>Today's Habits</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {habitStates.map((habit, i) => (
                <div key={habit.id} style={{
                  background: habit.done ? "#EDE7DC" : "#FDFAF5",
                  borderRadius: "16px",
                  padding: "16px 20px",
                  display: "flex", alignItems: "center", gap: "16px",
                  border: `1px solid ${habit.done ? "#D8D0C4" : "#EDE7DC"}`,
                  cursor: "pointer",
                  opacity: loaded ? 1 : 0,
                  transform: loaded ? "translateX(0)" : "translateX(-16px)",
                  transition: `all 0.5s ease ${0.15 + i * 0.07}s`,
                }} onClick={() => {
                  setHabitStates(hs => hs.map(h => h.id === habit.id ? { ...h, done: !h.done, value: h.done ? 0 : h.target } : h));
                }}>
                  <div style={{ fontSize: "24px" }}>{habit.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: habit.done ? "#6A5E54" : "#2A2420", marginBottom: "6px" }}>
                      {habit.name}
                    </div>
                    <div style={{ height: 4, background: "#E0D8CC", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${(habit.value / habit.target) * 100}%`,
                        background: habit.color,
                        borderRadius: "2px",
                        transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
                      }} />
                    </div>
                    <div style={{ fontSize: "11px", color: "#A09080", marginTop: "4px" }}>
                      {habit.value} / {habit.target} {habit.unit}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <CircleProgress value={habit.value} max={habit.target} color={habit.color} size={52} stroke={4} />
                    <div style={{ fontSize: "10px", color: "#A09080", marginTop: "2px" }}>🔥 {habit.streak}</div>
                  </div>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: habit.done ? habit.color : "transparent",
                    border: `2px solid ${habit.done ? habit.color : "#D0C8BC"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: "13px",
                    transition: "all 0.3s",
                    flexShrink: 0,
                  }}>{habit.done ? "✓" : ""}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Focus Timer */}
            <div style={{
              background: "#FDFAF5", borderRadius: "20px", padding: "24px",
              border: "1px solid #EDE7DC",
              opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(12px)",
              transition: "all 0.5s ease 0.2s",
            }}>
              <div style={{ fontSize: "11px", color: "#A09080", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "16px" }}>Focus Timer</div>
              <FocusTimer />
            </div>

            {/* AI Coach bubble */}
            <div style={{
              background: "linear-gradient(135deg, #EEF4EB, #F5EEDE)",
              borderRadius: "20px", padding: "20px",
              border: "1px solid #D8E4D0",
              opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(12px)",
              transition: "all 0.5s ease 0.3s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", color: "#A09080", letterSpacing: "2px", textTransform: "uppercase" }}>AI Coach</div>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7C9E8A", boxShadow: "0 0 6px #7C9E8A" }} />
              </div>

              {!chatOpen ? (
                <>
                  <div style={{ fontSize: "13px", color: "#3D3530", lineHeight: 1.7, marginBottom: "16px" }}>
                    {aiMessages[aiIdx]}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => setChatOpen(true)} style={{
                      flex: 1, padding: "8px",
                      background: "#7C9E8A", color: "#fff",
                      border: "none", borderRadius: "10px",
                      fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
                    }}>Chat with Coach</button>
                    <button onClick={() => setAiIdx(i => (i + 1) % aiMessages.length)} style={{
                      padding: "8px 12px",
                      background: "transparent", color: "#A09080",
                      border: "1px solid #D0C8BC", borderRadius: "10px",
                      fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
                    }}>↻</button>
                  </div>
                </>
              ) : (
                <div>
                  <div style={{ maxHeight: 180, overflowY: "auto", marginBottom: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {chatHistory.map((msg, i) => (
                      <div key={i} style={{
                        alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                        background: msg.role === "user" ? "#7C9E8A" : "#fff",
                        color: msg.role === "user" ? "#fff" : "#3D3530",
                        padding: "8px 12px",
                        borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                        fontSize: "12px", lineHeight: 1.5,
                        maxWidth: "90%",
                        boxShadow: "0 1px 4px #0001",
                      }}>{msg.text}</div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendChat()}
                      placeholder="Ask your coach..."
                      style={{
                        flex: 1, padding: "8px 12px",
                        background: "#fff", border: "1px solid #D8D0C4",
                        borderRadius: "10px", fontSize: "12px",
                        fontFamily: "inherit", color: "#2A2420",
                        outline: "none",
                      }}
                    />
                    <button onClick={sendChat} style={{
                      padding: "8px 12px", background: "#7C9E8A", color: "#fff",
                      border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "14px",
                    }}>↑</button>
                  </div>
                  <button onClick={() => setChatOpen(false)} style={{
                    marginTop: "6px", fontSize: "11px", color: "#A09080",
                    background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                  }}>← Back</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom nav hint */}
        <div style={{
          display: "flex", justifyContent: "center", gap: "32px",
          marginTop: "32px", paddingTop: "24px",
          borderTop: "1px solid #E8E0D4",
          opacity: loaded ? 1 : 0, transition: "opacity 0.5s ease 0.5s",
        }}>
          {[["🏠", "Home"], ["📊", "Insights"], ["⏱", "Focus"], ["🤖", "Coach"], ["⚙️", "Settings"]].map(([icon, label]) => (
            <div key={label} style={{ textAlign: "center", cursor: "pointer", opacity: label === "Home" ? 1 : 0.4 }}>
              <div style={{ fontSize: "18px" }}>{icon}</div>
              <div style={{ fontSize: "10px", color: label === "Home" ? "#7C9E8A" : "#A09080", marginTop: "2px" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
