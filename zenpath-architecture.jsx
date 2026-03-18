import { useState } from "react";

const tabs = ["Overview", "Tech Stack", "Database Schema", "API Routes", "Folder Structure"];

const stackData = {
  frontend: [
    { name: "React Native", rec: true, reason: "Best for solo devs — one codebase for Android + iOS. Huge community, easier to hire/find help. Works well with Firebase.", when: "You want a mobile app on both platforms ASAP" },
    { name: "Flutter", rec: false, reason: "Beautiful UI, great performance. But Dart is a separate language to learn. Worth it if you enjoy UI work.", when: "You want pixel-perfect custom animations" },
    { name: "React (Web)", rec: false, reason: "Fastest to prototype, easiest deployment. Good starting point before going mobile.", when: "MVP/demo first, then go mobile later" },
  ],
  backend: [
    { name: "Firebase", rec: true, reason: "Auth, Firestore DB, Push Notifications, Storage — all in one. Free tier is generous. Perfect for solo founders.", when: "Fastest path to launch" },
    { name: "FastAPI (Python)", rec: true, reason: "Your AI coaching logic lives here. Python gives you easy access to OpenAI/Gemini APIs and ML libraries.", when: "Habit analysis, AI response generation" },
    { name: "Node.js + Express", rec: false, reason: "Good if you want everything in JS. But Python wins for AI tasks.", when: "If you prefer full JS stack" },
  ],
  ai: [
    { name: "Gemini 1.5 Flash", rec: true, reason: "Free tier, fast, multimodal. Google's API — integrates well if you're using Firebase.", when: "Motivational messages, habit analysis" },
    { name: "OpenAI GPT-4o-mini", rec: false, reason: "Reliable, widely documented. Slightly more expensive but very capable.", when: "If you need richer conversations" },
    { name: "Local LLM (Ollama)", rec: false, reason: "Privacy-first option. No API costs. Needs server to run.", when: "Future feature for premium users" },
  ],
};

const schema = {
  users: {
    color: "#6EE7B7",
    fields: [
      { name: "id", type: "UUID", pk: true },
      { name: "firebase_uid", type: "STRING", unique: true },
      { name: "display_name", type: "STRING" },
      { name: "email", type: "STRING" },
      { name: "avatar_url", type: "STRING", nullable: true },
      { name: "persona", type: "ENUM", note: "zen_monk | drill_sergeant | best_friend" },
      { name: "created_at", type: "TIMESTAMP" },
      { name: "onboarding_done", type: "BOOLEAN" },
    ]
  },
  habits: {
    color: "#93C5FD",
    fields: [
      { name: "id", type: "UUID", pk: true },
      { name: "user_id", type: "UUID", fk: "users.id" },
      { name: "name", type: "STRING" },
      { name: "category", type: "ENUM", note: "focus | sleep | screen | fitness | mindfulness" },
      { name: "frequency", type: "ENUM", note: "daily | weekly | custom" },
      { name: "target_value", type: "INTEGER", note: "e.g. 8 glasses, 30 mins" },
      { name: "unit", type: "STRING", note: "mins / count / hrs" },
      { name: "color", type: "STRING" },
      { name: "icon", type: "STRING" },
      { name: "is_active", type: "BOOLEAN" },
      { name: "created_at", type: "TIMESTAMP" },
    ]
  },
  habit_logs: {
    color: "#FCA5A5",
    fields: [
      { name: "id", type: "UUID", pk: true },
      { name: "habit_id", type: "UUID", fk: "habits.id" },
      { name: "user_id", type: "UUID", fk: "users.id" },
      { name: "logged_at", type: "DATE" },
      { name: "value", type: "FLOAT", note: "actual value completed" },
      { name: "note", type: "TEXT", nullable: true },
      { name: "mood", type: "INTEGER", note: "1-5 scale" },
    ]
  },
  streaks: {
    color: "#FCD34D",
    fields: [
      { name: "id", type: "UUID", pk: true },
      { name: "habit_id", type: "UUID", fk: "habits.id" },
      { name: "current_streak", type: "INTEGER" },
      { name: "longest_streak", type: "INTEGER" },
      { name: "last_completed", type: "DATE" },
      { name: "total_completions", type: "INTEGER" },
    ]
  },
  ai_insights: {
    color: "#C4B5FD",
    fields: [
      { name: "id", type: "UUID", pk: true },
      { name: "user_id", type: "UUID", fk: "users.id" },
      { name: "insight_type", type: "ENUM", note: "motivation | warning | achievement | tip" },
      { name: "content", type: "TEXT" },
      { name: "habit_ids", type: "JSON", note: "related habits" },
      { name: "generated_at", type: "TIMESTAMP" },
      { name: "was_helpful", type: "BOOLEAN", nullable: true },
    ]
  },
  focus_sessions: {
    color: "#86EFAC",
    fields: [
      { name: "id", type: "UUID", pk: true },
      { name: "user_id", type: "UUID", fk: "users.id" },
      { name: "duration_mins", type: "INTEGER" },
      { name: "technique", type: "ENUM", note: "pomodoro | deep_work | custom" },
      { name: "completed", type: "BOOLEAN" },
      { name: "distraction_count", type: "INTEGER" },
      { name: "started_at", type: "TIMESTAMP" },
    ]
  },
};

const apiRoutes = [
  { method: "POST", path: "/auth/register", desc: "Register via Firebase token", tag: "Auth" },
  { method: "GET", path: "/users/me", desc: "Get current user profile", tag: "Auth" },
  { method: "PATCH", path: "/users/me/persona", desc: "Update AI coach persona", tag: "Auth" },
  { method: "GET", path: "/habits", desc: "List all habits for user", tag: "Habits" },
  { method: "POST", path: "/habits", desc: "Create new habit", tag: "Habits" },
  { method: "PATCH", path: "/habits/:id", desc: "Edit habit settings", tag: "Habits" },
  { method: "DELETE", path: "/habits/:id", desc: "Archive a habit", tag: "Habits" },
  { method: "POST", path: "/habits/:id/log", desc: "Log habit completion", tag: "Logs" },
  { method: "GET", path: "/habits/:id/logs", desc: "Get habit log history", tag: "Logs" },
  { method: "GET", path: "/streaks", desc: "Get all current streaks", tag: "Streaks" },
  { method: "GET", path: "/focus/sessions", desc: "Get focus session history", tag: "Focus" },
  { method: "POST", path: "/focus/start", desc: "Start a focus session", tag: "Focus" },
  { method: "PATCH", path: "/focus/:id/end", desc: "End a focus session", tag: "Focus" },
  { method: "POST", path: "/ai/insight", desc: "Generate AI insight for user", tag: "AI" },
  { method: "POST", path: "/ai/chat", desc: "Chat with AI coach", tag: "AI" },
  { method: "GET", path: "/ai/insights", desc: "Get recent AI insights", tag: "AI" },
  { method: "GET", path: "/analytics/week", desc: "Weekly habit summary", tag: "Analytics" },
  { method: "GET", path: "/analytics/trends", desc: "Trend data for charts", tag: "Analytics" },
];

const folderStructure = `zenpath/
├── mobile/                    # React Native App
│   ├── src/
│   │   ├── screens/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── HabitDetail.tsx
│   │   │   ├── FocusTimer.tsx
│   │   │   ├── AICoach.tsx
│   │   │   └── Onboarding.tsx
│   │   ├── components/
│   │   │   ├── HabitCard.tsx
│   │   │   ├── StreakBadge.tsx
│   │   │   ├── MoodPicker.tsx
│   │   │   └── ChatBubble.tsx
│   │   ├── hooks/
│   │   │   ├── useHabits.ts
│   │   │   ├── useStreak.ts
│   │   │   └── useAICoach.ts
│   │   ├── store/             # Zustand state
│   │   ├── api/               # Axios API calls
│   │   └── firebase/          # Auth config
│   └── app.json
│
├── backend/                   # FastAPI Python
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── habits.py
│   │   │   ├── focus.py
│   │   │   ├── ai.py
│   │   │   └── analytics.py
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/
│   │   │   ├── ai_coach.py    # Gemini/OpenAI calls
│   │   │   └── analytics.py
│   │   └── db/
│   │       ├── base.py
│   │       └── session.py
│   ├── alembic/               # DB migrations
│   └── requirements.txt
│
└── shared/                    # Shared types/constants
    └── types.ts`;

const methodColor = {
  GET: "#6EE7B7",
  POST: "#93C5FD",
  PATCH: "#FCD34D",
  DELETE: "#FCA5A5",
};

const tagColor = {
  Auth: "#C4B5FD",
  Habits: "#93C5FD",
  Logs: "#FCA5A5",
  Streaks: "#FCD34D",
  Focus: "#86EFAC",
  AI: "#F9A8D4",
  Analytics: "#6EE7B7",
};

export default function ZenPathArchitecture() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedTable, setSelectedTable] = useState("habits");
  const [apiFilter, setApiFilter] = useState("All");

  const apiTags = ["All", ...Array.from(new Set(apiRoutes.map(r => r.tag)))];
  const filteredRoutes = apiFilter === "All" ? apiRoutes : apiRoutes.filter(r => r.tag === apiFilter);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0E1A",
      color: "#E8EBF4",
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      padding: "0",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0D1B2A 0%, #1A0D2E 100%)",
        borderBottom: "1px solid #1E2840",
        padding: "32px 40px 0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
          <div style={{
            width: 42, height: 42,
            background: "linear-gradient(135deg, #6EE7B7, #93C5FD)",
            borderRadius: "12px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "20px"
          }}>🧘</div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.5px", color: "#F0F4FF" }}>ZenPath</div>
            <div style={{ fontSize: "11px", color: "#6B7A9E", letterSpacing: "2px", textTransform: "uppercase" }}>System Architecture · v1.0</div>
          </div>
          <div style={{ marginLeft: "auto", background: "#1A2540", border: "1px solid #2A3555", borderRadius: "8px", padding: "6px 14px", fontSize: "11px", color: "#6EE7B7" }}>
            Step 1 of 4 · Architecture
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginTop: "24px" }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "10px 20px",
              background: activeTab === tab ? "#0A0E1A" : "transparent",
              border: "1px solid",
              borderColor: activeTab === tab ? "#2A3555" : "transparent",
              borderBottom: activeTab === tab ? "1px solid #0A0E1A" : "1px solid transparent",
              borderRadius: "8px 8px 0 0",
              color: activeTab === tab ? "#93C5FD" : "#6B7A9E",
              cursor: "pointer",
              fontSize: "12px",
              fontFamily: "inherit",
              fontWeight: activeTab === tab ? 600 : 400,
              marginBottom: activeTab === tab ? "-1px" : "0",
              transition: "all 0.15s",
            }}>{tab}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "32px 40px" }}>

        {/* OVERVIEW */}
        {activeTab === "Overview" && (
          <div>
            <p style={{ color: "#8B96B5", fontSize: "13px", marginBottom: "32px", lineHeight: 1.7 }}>
              ZenPath uses a <span style={{ color: "#6EE7B7" }}>decoupled architecture</span> — a mobile frontend, a Firebase auth layer, and a Python backend for AI logic. This keeps your app fast and your AI flexible.
            </p>

            {/* Architecture Diagram */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr", gap: "0", alignItems: "center", marginBottom: "40px" }}>
              {[
                { label: "Mobile App", sublabel: "React Native", icon: "📱", color: "#93C5FD", items: ["Dashboard", "Habit Tracker", "Focus Timer", "AI Chat"] },
                null,
                { label: "Firebase", sublabel: "BaaS Layer", icon: "🔥", color: "#FCD34D", items: ["Auth (JWT)", "Push Notifs", "File Storage", "Realtime DB"] },
                null,
                { label: "FastAPI", sublabel: "Python Backend", icon: "⚡", color: "#6EE7B7", items: ["Habit API", "AI Engine", "Analytics", "SQLite/Postgres"] },
              ].map((block, i) => block === null ? (
                <div key={i} style={{ textAlign: "center", padding: "0 8px" }}>
                  <div style={{ color: "#2A3555", fontSize: "24px" }}>⟶</div>
                  <div style={{ color: "#3A4565", fontSize: "9px", marginTop: "4px" }}>REST / JWT</div>
                </div>
              ) : (
                <div key={i} style={{
                  background: "#0D1525",
                  border: `1px solid ${block.color}30`,
                  borderTop: `3px solid ${block.color}`,
                  borderRadius: "12px",
                  padding: "20px",
                }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>{block.icon}</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: block.color }}>{block.label}</div>
                  <div style={{ fontSize: "10px", color: "#4A5570", marginBottom: "12px", letterSpacing: "1px" }}>{block.sublabel}</div>
                  {block.items.map(item => (
                    <div key={item} style={{ fontSize: "11px", color: "#6B7A9E", padding: "3px 0", borderBottom: "1px solid #151E30" }}>
                      · {item}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Key Decisions */}
            <div style={{ fontSize: "11px", color: "#4A5570", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "16px" }}>Key Architectural Decisions</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                { q: "Why separate Firebase + FastAPI?", a: "Firebase handles auth/notifications (complex infrastructure). FastAPI handles your AI logic in Python (much easier than Node.js for ML)." },
                { q: "SQLite vs Firestore for habits?", a: "SQLite on your FastAPI server gives you full SQL querying power for analytics. Use Firestore only for real-time features like streaks shown live." },
                { q: "Where does the AI run?", a: "AI calls happen in FastAPI (Python). The mobile app sends habit data → FastAPI analyzes → calls Gemini API → returns personalized text." },
                { q: "How does auth flow work?", a: "User logs in via Firebase → gets JWT token → sends token in every FastAPI request header → FastAPI verifies with Firebase Admin SDK." },
              ].map(({ q, a }) => (
                <div key={q} style={{ background: "#0D1525", border: "1px solid #1E2840", borderRadius: "10px", padding: "16px" }}>
                  <div style={{ fontSize: "12px", color: "#93C5FD", marginBottom: "8px", fontWeight: 600 }}>{q}</div>
                  <div style={{ fontSize: "12px", color: "#6B7A9E", lineHeight: 1.6 }}>{a}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TECH STACK */}
        {activeTab === "Tech Stack" && (
          <div>
            {Object.entries(stackData).map(([category, options]) => (
              <div key={category} style={{ marginBottom: "32px" }}>
                <div style={{ fontSize: "11px", color: "#4A5570", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>
                  {category === "frontend" ? "📱 Frontend" : category === "backend" ? "⚙️ Backend" : "🤖 AI Engine"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  {options.map(opt => (
                    <div key={opt.name} style={{
                      background: opt.rec ? "#0D1A2A" : "#0A0E1A",
                      border: `1px solid ${opt.rec ? "#6EE7B730" : "#1E2840"}`,
                      borderRadius: "12px",
                      padding: "20px",
                      position: "relative",
                    }}>
                      {opt.rec && (
                        <div style={{
                          position: "absolute", top: "12px", right: "12px",
                          background: "#6EE7B720", color: "#6EE7B7",
                          fontSize: "9px", padding: "2px 8px", borderRadius: "99px",
                          letterSpacing: "1px",
                        }}>✓ RECOMMENDED</div>
                      )}
                      <div style={{ fontSize: "15px", fontWeight: 700, color: opt.rec ? "#F0F4FF" : "#6B7A9E", marginBottom: "8px" }}>{opt.name}</div>
                      <div style={{ fontSize: "12px", color: "#5A6585", lineHeight: 1.6, marginBottom: "12px" }}>{opt.reason}</div>
                      <div style={{ fontSize: "11px", color: "#93C5FD", background: "#93C5FD10", padding: "6px 10px", borderRadius: "6px" }}>
                        Use when: {opt.when}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ background: "#0D1525", border: "1px solid #1E2840", borderRadius: "10px", padding: "16px", fontSize: "12px", color: "#6B7A9E", lineHeight: 1.7 }}>
              💡 <span style={{ color: "#FCD34D" }}>Recommendation for a solo CSE student:</span> Start with <span style={{ color: "#6EE7B7" }}>React Native + Firebase + FastAPI + Gemini Flash</span>. This gives you the fastest path from zero to a working app with real AI features.
            </div>
          </div>
        )}

        {/* DATABASE SCHEMA */}
        {activeTab === "Database Schema" && (
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "24px" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#4A5570", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>Tables</div>
              {Object.entries(schema).map(([name, data]) => (
                <button key={name} onClick={() => setSelectedTable(name)} style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "10px 14px", marginBottom: "6px",
                  background: selectedTable === name ? "#0D1A2A" : "transparent",
                  border: `1px solid ${selectedTable === name ? data.color + "50" : "#1E2840"}`,
                  borderLeft: `3px solid ${selectedTable === name ? data.color : "#1E2840"}`,
                  borderRadius: "6px",
                  color: selectedTable === name ? data.color : "#4A5570",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}>
                  {name}
                  <span style={{ float: "right", fontSize: "10px", opacity: 0.6 }}>{data.fields.length}</span>
                </button>
              ))}
            </div>

            <div>
              {selectedTable && (
                <div style={{ background: "#0D1525", border: `1px solid ${schema[selectedTable].color}30`, borderTop: `3px solid ${schema[selectedTable].color}`, borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid #1E2840", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: schema[selectedTable].color }}>{selectedTable}</div>
                    <div style={{ fontSize: "11px", color: "#4A5570" }}>{schema[selectedTable].fields.length} fields</div>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#0A0E1A" }}>
                        {["Field", "Type", "Flags", "Note"].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "10px", color: "#4A5570", letterSpacing: "1px", textTransform: "uppercase", borderBottom: "1px solid #1E2840" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {schema[selectedTable].fields.map((f, i) => (
                        <tr key={f.name} style={{ background: i % 2 === 0 ? "transparent" : "#0A0C15" }}>
                          <td style={{ padding: "10px 16px", fontSize: "12px", color: f.pk ? "#FCD34D" : "#C8D0E8" }}>{f.name}</td>
                          <td style={{ padding: "10px 16px", fontSize: "11px", color: "#6EE7B7", fontFamily: "monospace" }}>{f.type}</td>
                          <td style={{ padding: "10px 16px" }}>
                            {f.pk && <span style={{ fontSize: "9px", background: "#FCD34D20", color: "#FCD34D", padding: "2px 6px", borderRadius: "4px", marginRight: "4px" }}>PK</span>}
                            {f.fk && <span style={{ fontSize: "9px", background: "#93C5FD20", color: "#93C5FD", padding: "2px 6px", borderRadius: "4px", marginRight: "4px" }}>FK</span>}
                            {f.unique && <span style={{ fontSize: "9px", background: "#6EE7B720", color: "#6EE7B7", padding: "2px 6px", borderRadius: "4px", marginRight: "4px" }}>UNIQUE</span>}
                            {f.nullable && <span style={{ fontSize: "9px", background: "#4A556520", color: "#4A5565", padding: "2px 6px", borderRadius: "4px" }}>NULL</span>}
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: "11px", color: "#4A5570" }}>
                            {f.note || (f.fk ? `→ ${f.fk}` : "")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* API ROUTES */}
        {activeTab === "API Routes" && (
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
              {apiTags.map(tag => (
                <button key={tag} onClick={() => setApiFilter(tag)} style={{
                  padding: "6px 14px",
                  background: apiFilter === tag ? (tagColor[tag] ? tagColor[tag] + "30" : "#93C5FD30") : "transparent",
                  border: `1px solid ${apiFilter === tag ? (tagColor[tag] || "#93C5FD") + "50" : "#1E2840"}`,
                  borderRadius: "99px",
                  color: apiFilter === tag ? (tagColor[tag] || "#93C5FD") : "#4A5570",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}>{tag}</button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {filteredRoutes.map(route => (
                <div key={route.path} style={{
                  display: "grid", gridTemplateColumns: "70px 260px 1fr 80px",
                  alignItems: "center", gap: "16px",
                  background: "#0D1525", border: "1px solid #1E2840",
                  borderRadius: "8px", padding: "12px 16px",
                }}>
                  <span style={{
                    fontSize: "10px", fontWeight: 700, padding: "3px 8px",
                    background: (methodColor[route.method] || "#888") + "20",
                    color: methodColor[route.method] || "#888",
                    borderRadius: "4px", textAlign: "center",
                  }}>{route.method}</span>
                  <code style={{ fontSize: "12px", color: "#C8D0E8" }}>{route.path}</code>
                  <span style={{ fontSize: "12px", color: "#6B7A9E" }}>{route.desc}</span>
                  <span style={{
                    fontSize: "10px", padding: "2px 8px",
                    background: (tagColor[route.tag] || "#888") + "20",
                    color: tagColor[route.tag] || "#888",
                    borderRadius: "4px", textAlign: "center",
                  }}>{route.tag}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOLDER STRUCTURE */}
        {activeTab === "Folder Structure" && (
          <div>
            <div style={{ background: "#0D1525", border: "1px solid #1E2840", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
              <pre style={{ fontSize: "12px", color: "#8B96B5", lineHeight: 1.8, margin: 0, fontFamily: "inherit" }}>
                {folderStructure.split("\n").map((line, i) => {
                  const isDir = line.includes("/") && !line.includes("#");
                  const isComment = line.includes("#");
                  const isBold = line.match(/^(zenpath|mobile|backend)/) ;
                  return (
                    <div key={i} style={{
                      color: isBold ? "#F0F4FF" : isComment ? "#4A5570" : isDir ? "#93C5FD" : "#8B96B5",
                    }}>{line}</div>
                  );
                })}
              </pre>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              {[
                { dir: "services/ai_coach.py", note: "This is where your AI magic lives. All Gemini API calls, prompt templates, and response parsing go here.", color: "#C4B5FD" },
                { dir: "hooks/useHabits.ts", note: "Custom React hook for all habit CRUD. Keeps your screens clean. Pass this pattern to useStreak, useAICoach etc.", color: "#93C5FD" },
                { dir: "alembic/", note: "Database migration tool. Every schema change goes through Alembic — no manual SQL. Essential for a growing app.", color: "#6EE7B7" },
              ].map(({ dir, note, color }) => (
                <div key={dir} style={{ background: "#0D1525", border: `1px solid ${color}20`, borderRadius: "10px", padding: "16px" }}>
                  <code style={{ fontSize: "11px", color, display: "block", marginBottom: "8px" }}>{dir}</code>
                  <div style={{ fontSize: "11px", color: "#6B7A9E", lineHeight: 1.6 }}>{note}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "16px 40px", borderTop: "1px solid #1E2840", display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#3A4565" }}>
        <span>ZenPath Architecture · Step 1 complete</span>
        <span>Next: Step 2 → UI Design (Dashboard + Habit Cards)</span>
      </div>
    </div>
  );
}
