import { useState } from "react";

const tabs = [
  { id: "overview", label: "How It Connects", icon: "🔗" },
  { id: "auth", label: "Auth Flow", icon: "🔐" },
  { id: "api", label: "API Client", icon: "📡" },
  { id: "hooks", label: "React Hooks", icon: "🪝" },
  { id: "screens", label: "Screen Code", icon: "📱" },
  { id: "checklist", label: "Launch Checklist", icon: "✅" },
];

const codeFiles = {
  apiClient: {
    filename: "src/api/client.ts",
    code: `// src/api/client.ts
import axios from "axios";
import auth from "@react-native-firebase/auth";

const BASE_URL = __DEV__
  ? "http://localhost:8000"       // Local dev
  : "https://api.zenpath.app";   // Production

const api = axios.create({ baseURL: BASE_URL });

// ── Attach Firebase JWT to every request ──────────────────
api.interceptors.request.use(async (config) => {
  const user = auth().currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

// ── Auto-retry on 401 (token expired) ─────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const user = auth().currentUser;
      if (user) {
        const token = await user.getIdToken(true); // force refresh
        error.config.headers.Authorization = \`Bearer \${token}\`;
        return api.request(error.config);
      }
    }
    return Promise.reject(error);
  }
);

export default api;`,
  },
  habitApi: {
    filename: "src/api/habits.ts",
    code: `// src/api/habits.ts
import api from "./client";

export const habitsApi = {
  // Log a habit completion
  logHabit: (habitId: string, value: number, mood: number, note?: string) =>
    api.post(\`/habits/\${habitId}/log\`, { value, mood, note }),

  // Get weekly analytics
  getWeeklyAnalytics: () =>
    api.get("/analytics/week"),

  // Get AI insight (motivation | warning | achievement | tip)
  getInsight: (type = "motivation", daysBack = 7) =>
    api.post("/ai/insight", { days_back: daysBack }, {
      params: { insight_type: type }
    }),

  // Chat with AI coach
  chatWithCoach: (message: string, history: ChatMessage[]) =>
    api.post("/ai/chat", {
      message,
      conversation_history: history,
    }),

  // Get recent AI insights
  getRecentInsights: (limit = 5) =>
    api.get("/ai/insights", { params: { limit } }),

  // Mark insight helpful
  markInsightHelpful: (insightId: string, helpful: boolean) =>
    api.patch(\`/ai/insights/\${insightId}/feedback\`, null, {
      params: { helpful }
    }),
};`,
  },
  useHabits: {
    filename: "src/hooks/useHabits.ts",
    code: `// src/hooks/useHabits.ts
import { useState, useEffect, useCallback } from "react";
import { habitsApi } from "../api/habits";

export function useWeeklyAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await habitsApi.getWeeklyAnalytics();
      setData(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, []);

  return { data, loading, error, refetch: fetch };
}

export function useLogHabit() {
  const [logging, setLogging] = useState(false);

  const logHabit = async (
    habitId: string,
    value: number,
    mood: number,
    note?: string
  ) => {
    setLogging(true);
    try {
      const res = await habitsApi.logHabit(habitId, value, mood, note);
      return res.data; // { log_id, streak, message }
    } catch (e) {
      throw e;
    } finally {
      setLogging(false);
    }
  };

  return { logHabit, logging };
}`,
  },
  useAICoach: {
    filename: "src/hooks/useAICoach.ts",
    code: `// src/hooks/useAICoach.ts
import { useState, useEffect } from "react";
import { habitsApi } from "../api/habits";

export function useAICoach() {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Load motivational insight on mount
  useEffect(() => {
    loadInsight("motivation");
  }, []);

  const loadInsight = async (type = "motivation") => {
    setLoading(true);
    try {
      const res = await habitsApi.getInsight(type);
      setInsight(res.data.content);
    } catch (e) {
      setInsight("Keep showing up — every day counts. 🌿");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    const userMsg = { role: "user", content: text };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);

    setLoading(true);
    try {
      const res = await habitsApi.chatWithCoach(text, messages);
      const aiMsg = { role: "assistant", content: res.data.reply };
      setMessages([...updatedHistory, aiMsg]);
      return res.data.reply;
    } finally {
      setLoading(false);
    }
  };

  return { insight, messages, loading, loadInsight, sendMessage };
}`,
  },
  dashboardScreen: {
    filename: "src/screens/Dashboard.tsx",
    code: `// src/screens/Dashboard.tsx
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useWeeklyAnalytics, useLogHabit } from "../hooks/useHabits";
import { useAICoach } from "../hooks/useAICoach";

export default function Dashboard() {
  const { data, loading, refetch } = useWeeklyAnalytics();
  const { logHabit, logging } = useLogHabit();
  const { insight } = useAICoach();

  const handleLog = async (habitId: string) => {
    const result = await logHabit(habitId, 1, 4);
    console.log(\`Streak: \${result.streak} 🔥\`);
    refetch(); // refresh analytics after logging
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F5F0E8" }}>
      {/* AI Coach Bubble */}
      <View style={{
        margin: 16, padding: 16,
        backgroundColor: "#EEF4EB",
        borderRadius: 16,
      }}>
        <Text style={{ fontSize: 13, color: "#3D3530", lineHeight: 20 }}>
          {insight ?? "Loading your insight..."}
        </Text>
      </View>

      {/* Habit List */}
      {data?.habit_stats?.map((habit) => (
        <TouchableOpacity
          key={habit.habit_id}
          onPress={() => handleLog(habit.habit_id)}
          style={{
            marginHorizontal: 16, marginBottom: 10,
            padding: 16, backgroundColor: "#FDFAF5",
            borderRadius: 16, flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#2A2420" }}>
              {habit.habit_name}
            </Text>
            <Text style={{ fontSize: 12, color: "#A09080", marginTop: 2 }}>
              🔥 {habit.current_streak} day streak
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: "#7C9E8A", fontWeight: "700" }}>
            {Math.round(habit.completion_rate * 100)}%
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}`,
  },
};

const authSteps = [
  { step: "1", title: "User opens app", desc: "React Native checks if Firebase session exists", code: `const user = auth().currentUser;\nif (user) navigate("Dashboard");\nelse navigate("Login");` },
  { step: "2", title: "User signs in", desc: "Firebase handles Google/email auth, returns user object", code: `await auth().signInWithEmailAndPassword(email, pass);\n// or Google:\nconst { idToken } = await GoogleSignin.signIn();\nconst cred = GoogleAuthProvider.credential(idToken);\nawait auth().signInWithCredential(cred);` },
  { step: "3", title: "Get JWT token", desc: "Firebase mints a signed JWT for your backend", code: `const token = await auth().currentUser.getIdToken();\n// token looks like: "eyJhbGciOiJSUzI1NiIs..."\n// Valid for 1 hour, auto-refreshed by interceptor` },
  { step: "4", title: "Backend verifies", desc: "FastAPI checks the token with Firebase Admin SDK", code: `# In your FastAPI auth dependency:\nfrom firebase_admin import auth\ndecoded = auth.verify_id_token(token)\nuser_id = decoded["uid"]  # "firebase_xyz123"` },
];

const checklistItems = [
  { cat: "Firebase Setup", items: ["Create Firebase project at console.firebase.google.com", "Enable Email/Password + Google auth providers", "Download google-services.json → android/app/", "Download GoogleService-Info.plist → ios/"] },
  { cat: "React Native", items: ["npm install @react-native-firebase/app @react-native-firebase/auth", "npm install axios", "Set BASE_URL in api/client.ts", "Test auth flow with a real device/emulator"] },
  { cat: "FastAPI Backend", items: ["pip install firebase-admin", "Download Firebase service account key JSON", "Replace mock auth with real verify_id_token()", "Deploy to Railway / Render / EC2 (or keep local for dev)"] },
  { cat: "Go Live Checklist", items: ["Switch BASE_URL from localhost to production URL", "Set CORS origin to your app domain only", "Enable HTTPS on your backend", "Add rate limiting (slowapi) to AI endpoints"] },
];

function CodeBlock({ code, filename }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #2A2010" }}>
      {filename && (
        <div style={{ background: "#2A2010", padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#8A7A5A", fontFamily: "monospace" }}>{filename}</span>
          <button onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ background: "none", border: "none", color: copied ? "#7C9E8A" : "#6A5A3A", fontSize: "10px", cursor: "pointer", fontFamily: "inherit" }}>
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      )}
      <div style={{ background: "#1A1208", padding: "16px 20px", overflowX: "auto" }}>
        <pre style={{ margin: 0, fontSize: "12px", lineHeight: 1.75, color: "#C8B89A", fontFamily: "'IBM Plex Mono', 'Courier New', monospace", whiteSpace: "pre" }}>{code}</pre>
      </div>
    </div>
  );
}

export default function ZenPathIntegration() {
  const [active, setActive] = useState("overview");
  const [selectedFile, setSelectedFile] = useState("apiClient");

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0E8", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0E1A12, #1A120E)", padding: "28px 36px 0", borderBottom: "1px solid #2A3A2A" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "6px" }}>
          <div style={{ fontSize: "28px" }}>🔗</div>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "22px", color: "#F5EED8" }}>ZenPath Integration</div>
            <div style={{ fontSize: "11px", color: "#4A6A4A", letterSpacing: "2px", textTransform: "uppercase" }}>Step 4 · React Native ↔ FastAPI</div>
          </div>
          <div style={{ marginLeft: "auto", background: "#7C9E8A20", border: "1px solid #7C9E8A40", borderRadius: "8px", padding: "5px 14px", fontSize: "11px", color: "#7C9E8A" }}>
            Final Step · Ship It 🚀
          </div>
        </div>
        <div style={{ display: "flex", gap: "2px", marginTop: "20px" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)} style={{
              padding: "10px 16px", background: active === t.id ? "#F5F0E8" : "transparent",
              border: "none", borderRadius: "8px 8px 0 0",
              color: active === t.id ? "#2A1E12" : "#5A6A5A",
              cursor: "pointer", fontSize: "12px", fontFamily: "inherit",
              fontWeight: active === t.id ? 600 : 400, transition: "all 0.15s",
            }}>{t.icon} {t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "32px 36px" }}>

        {/* HOW IT CONNECTS */}
        {active === "overview" && (
          <div>
            <p style={{ color: "#6A5A4A", fontSize: "14px", lineHeight: 1.7, marginBottom: "28px" }}>
              The integration has <strong style={{ color: "#2A1E12" }}>three layers</strong>: a Firebase auth interceptor that auto-attaches JWT tokens, an API client module, and React hooks that wrap each endpoint. Your screens never talk to the API directly.
            </p>

            {/* Architecture diagram */}
            <div style={{ background: "#1A1208", borderRadius: "16px", padding: "28px", marginBottom: "28px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 1fr 40px 1fr 40px 1fr", alignItems: "center", gap: "4px" }}>
                {[
                  { label: "Screen", sub: "Dashboard.tsx", icon: "📱", color: "#6A9EC4" },
                  "→",
                  { label: "Hook", sub: "useHabits.ts", icon: "🪝", color: "#C4956A" },
                  "→",
                  { label: "API Client", sub: "axios + JWT", icon: "📡", color: "#7C9E8A" },
                  "→",
                  { label: "FastAPI", sub: "Python backend", icon: "⚡", color: "#C4A84A" },
                ].map((item, i) => typeof item === "string" ? (
                  <div key={i} style={{ textAlign: "center", color: "#3A3020", fontSize: "20px" }}>→</div>
                ) : (
                  <div key={i} style={{ background: "#2A2010", border: `1px solid ${item.color}30`, borderTop: `2px solid ${item.color}`, borderRadius: "10px", padding: "14px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: "20px", marginBottom: "6px" }}>{item.icon}</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: item.color }}>{item.label}</div>
                    <div style={{ fontSize: "10px", color: "#5A4A2A", marginTop: "2px", fontFamily: "monospace" }}>{item.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                {[
                  { title: "Screen knows nothing about HTTP", desc: "Screens just call hook functions like logHabit() and read data. No axios, no tokens, no URLs." },
                  { title: "Hooks own data state", desc: "Each hook manages loading, error, and data state. Screens get clean reactive values." },
                  { title: "API client auto-attaches auth", desc: "Firebase JWT is grabbed and attached before every request via axios interceptor. Zero boilerplate per call." },
                ].map(item => (
                  <div key={item.title} style={{ background: "#2A2010", borderRadius: "8px", padding: "12px 14px" }}>
                    <div style={{ fontSize: "11px", color: "#7C9E8A", fontWeight: 600, marginBottom: "5px" }}>{item.title}</div>
                    <div style={{ fontSize: "11px", color: "#6A5A3A", lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Folder structure */}
            <div style={{ background: "#FDFAF5", border: "1px solid #E8E0D0", borderRadius: "14px", padding: "20px 24px" }}>
              <div style={{ fontSize: "11px", color: "#A09080", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "14px" }}>Files you'll create (mobile/src/)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { file: "api/client.ts", desc: "Axios instance + Firebase JWT interceptor", color: "#7C9E8A" },
                  { file: "api/habits.ts", desc: "All endpoint functions (logHabit, getInsight…)", color: "#7C9E8A" },
                  { file: "hooks/useHabits.ts", desc: "Analytics data + logHabit() with state", color: "#C4956A" },
                  { file: "hooks/useAICoach.ts", desc: "Insight + chat state management", color: "#C4956A" },
                  { file: "screens/Dashboard.tsx", desc: "Uses hooks, renders UI, zero API code", color: "#6A9EC4" },
                  { file: "screens/AICoach.tsx", desc: "Chat interface using useAICoach hook", color: "#6A9EC4" },
                ].map(f => (
                  <div key={f.file} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px", background: "#F5F0E8", borderRadius: "8px" }}>
                    <div style={{ width: 3, borderRadius: "2px", alignSelf: "stretch", background: f.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#2A1E12" }}>{f.file}</div>
                      <div style={{ fontSize: "11px", color: "#A09080", marginTop: "2px" }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AUTH FLOW */}
        {active === "auth" && (
          <div>
            <p style={{ color: "#6A5A4A", fontSize: "14px", lineHeight: 1.7, marginBottom: "24px" }}>
              Firebase handles the hard part — login UI, token management, session persistence. Your FastAPI backend just needs to verify the token using Firebase Admin SDK.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {authSteps.map(step => (
                <div key={step.step} style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: "16px", background: "#FDFAF5", border: "1px solid #E8E0D0", borderRadius: "14px", padding: "18px 20px" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#7C9E8A", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "16px", flexShrink: 0 }}>{step.step}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#2A1E12", marginBottom: "3px" }}>{step.title}</div>
                    <div style={{ fontSize: "12px", color: "#8A7A6A", marginBottom: "10px" }}>{step.desc}</div>
                    <CodeBlock code={step.code} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "16px", background: "#EEF4EB", border: "1px solid #C8D8BE", borderRadius: "12px", padding: "14px 18px", fontSize: "13px", color: "#4A6A54" }}>
              🌿 The axios interceptor in <code style={{ background: "#C8D8BE50", padding: "1px 5px", borderRadius: "4px" }}>api/client.ts</code> handles token refresh automatically — you never need to worry about expired tokens in your screen code.
            </div>
          </div>
        )}

        {/* API CLIENT */}
        {active === "api" && (
          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
              {Object.entries(codeFiles).map(([key, file]) => (
                <button key={key} onClick={() => setSelectedFile(key)} style={{
                  padding: "7px 16px",
                  background: selectedFile === key ? "#7C9E8A20" : "transparent",
                  border: `1px solid ${selectedFile === key ? "#7C9E8A50" : "#E0D8CC"}`,
                  borderRadius: "99px", color: selectedFile === key ? "#7C9E8A" : "#8A7A6A",
                  cursor: "pointer", fontSize: "11px", fontFamily: "monospace",
                  transition: "all 0.15s",
                }}>{codeFiles[key].filename.split("/").pop()}</button>
              ))}
            </div>
            <CodeBlock code={codeFiles[selectedFile].code} filename={codeFiles[selectedFile].filename} />
          </div>
        )}

        {/* HOOKS */}
        {active === "hooks" && (
          <div>
            <p style={{ color: "#6A5A4A", fontSize: "14px", lineHeight: 1.7, marginBottom: "20px" }}>
              Custom hooks are the bridge between your screens and the API. They own all loading/error state so your screens stay clean.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <CodeBlock code={codeFiles.useHabits.code} filename={codeFiles.useHabits.filename} />
              <CodeBlock code={codeFiles.useAICoach.code} filename={codeFiles.useAICoach.filename} />
            </div>
          </div>
        )}

        {/* SCREEN CODE */}
        {active === "screens" && (
          <div>
            <p style={{ color: "#6A5A4A", fontSize: "14px", lineHeight: 1.7, marginBottom: "20px" }}>
              The Dashboard screen is the integration in action — it uses three hooks and has zero direct API calls or token logic.
            </p>
            <CodeBlock code={codeFiles.dashboardScreen.code} filename={codeFiles.dashboardScreen.filename} />
            <div style={{ marginTop: "16px", background: "#FDFAF5", border: "1px solid #E8E0D0", borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#2A1E12", marginBottom: "10px" }}>What each hook does in this screen:</div>
              {[
                { hook: "useWeeklyAnalytics()", returns: "habit_stats[] with streaks + completion rates", color: "#C4956A" },
                { hook: "useLogHabit()", returns: "logHabit() function + logging boolean", color: "#7C9E8A" },
                { hook: "useAICoach()", returns: "insight string, auto-fetched on mount", color: "#6A9EC4" },
              ].map(h => (
                <div key={h.hook} style={{ display: "flex", gap: "12px", padding: "8px 0", borderBottom: "1px solid #F0E8DC", alignItems: "flex-start" }}>
                  <code style={{ fontSize: "12px", color: h.color, fontFamily: "monospace", whiteSpace: "nowrap" }}>{h.hook}</code>
                  <div style={{ fontSize: "12px", color: "#8A7A6A" }}>→ {h.returns}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LAUNCH CHECKLIST */}
        {active === "checklist" && (
          <div>
            <p style={{ color: "#6A5A4A", fontSize: "14px", lineHeight: 1.7, marginBottom: "24px" }}>
              Everything you need to go from local dev to a real app on a real phone.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {checklistItems.map((section, si) => (
                <div key={section.cat} style={{ background: "#FDFAF5", border: "1px solid #E8E0D0", borderRadius: "14px", padding: "20px" }}>
                  <div style={{ fontWeight: 700, color: "#2A1E12", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: ["#6A9EC4","#7C9E8A","#C4956A","#C4A84A"][si] }} />
                    {section.cat}
                  </div>
                  {section.items.map(item => (
                    <label key={item} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "10px", cursor: "pointer" }}>
                      <CheckItem label={item} />
                    </label>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ marginTop: "20px", background: "linear-gradient(135deg, #EEF4EB, #E8F0E8)", border: "1px solid #C8D8BE", borderRadius: "14px", padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", marginBottom: "10px" }}>🌿</div>
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "22px", color: "#2A3A2A", marginBottom: "8px" }}>All 4 steps complete.</div>
              <div style={{ fontSize: "13px", color: "#4A6A4A", lineHeight: 1.7 }}>
                Architecture → UI → Backend → Integration.<br />
                You have everything to build and ship ZenPath.
              </div>
              <div style={{ marginTop: "16px", display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                {["Step 2: Run beta at Poornima College", "Step 3: Content-led growth (Reels)", "Step 4: Add Guild feature"].map(next => (
                  <div key={next} style={{ background: "#7C9E8A20", border: "1px solid #7C9E8A40", borderRadius: "99px", padding: "6px 14px", fontSize: "11px", color: "#5A7A64" }}>
                    → {next}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "14px 36px", borderTop: "1px solid #E8E0D0", display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#A09080" }}>
        <span>Step 4 complete · Full integration</span>
        <span>ZenPath is ready to build 🌿</span>
      </div>
    </div>
  );
}

function CheckItem({ label }) {
  const [checked, setChecked] = useState(false);
  return (
    <>
      <div onClick={() => setChecked(c => !c)} style={{
        width: 18, height: 18, borderRadius: "5px", flexShrink: 0,
        border: `2px solid ${checked ? "#7C9E8A" : "#D0C8BC"}`,
        background: checked ? "#7C9E8A" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s", marginTop: "1px",
        cursor: "pointer",
      }}>
        {checked && <span style={{ color: "#fff", fontSize: "11px", lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{ fontSize: "12px", color: checked ? "#A09080" : "#4A3A2A", textDecoration: checked ? "line-through" : "none", lineHeight: 1.5, transition: "all 0.2s" }}>
        {label}
      </span>
    </>
  );
}
