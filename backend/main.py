from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import os
import json
import datetime
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ZenPath API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "zenpath.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS habits (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            target_value REAL DEFAULT 1,
            unit TEXT DEFAULT 'times',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS habit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            habit_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            value REAL NOT NULL,
            mood INTEGER DEFAULT 3,
            note TEXT,
            logged_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS focus_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL,
            session_type TEXT DEFAULT 'focus',
            completed_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    conn.close()

init_db()

# --- Models ---
class HabitCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    target_value: float = 1
    unit: str = "times"

class HabitLog(BaseModel):
    value: float
    mood: int = 3
    note: Optional[str] = ""

class ChatMessage(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = []

class InsightRequest(BaseModel):
    days_back: int = 7

class FocusSession(BaseModel):
    duration_minutes: int
    session_type: str = "focus"

# --- Helper ---
def get_user_id(authorization: Optional[str] = None) -> str:
    if not authorization:
        return "demo_user"
    return "demo_user"

def call_gemini(prompt: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "Keep showing up — every day counts. 🌿 (Add GEMINI_API_KEY to .env for real AI coaching)"
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Stay consistent — small steps compound. 🌿"

# --- Routes ---
@app.get("/")
def root():
    return {"status": "ZenPath API running", "version": "1.0"}

@app.get("/habits")
def get_habits(authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)
    conn = get_db()
    habits = conn.execute(
        "SELECT * FROM habits WHERE user_id = ?", (user_id,)
    ).fetchall()
    conn.close()
    return [dict(h) for h in habits]

@app.post("/habits")
def create_habit(habit: HabitCreate, authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)
    import uuid
    habit_id = str(uuid.uuid4())
    conn = get_db()
    conn.execute(
        "INSERT INTO habits (id, user_id, name, description, target_value, unit) VALUES (?,?,?,?,?,?)",
        (habit_id, user_id, habit.name, habit.description, habit.target_value, habit.unit)
    )
    conn.commit()
    conn.close()
    return {"id": habit_id, "name": habit.name, "message": "Habit created!"}

@app.post("/habits/{habit_id}/log")
def log_habit(habit_id: str, log: HabitLog, authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)
    conn = get_db()
    conn.execute(
        "INSERT INTO habit_logs (habit_id, user_id, value, mood, note) VALUES (?,?,?,?,?)",
        (habit_id, user_id, log.value, log.mood, log.note)
    )
    conn.commit()
    streak = conn.execute(
        "SELECT COUNT(*) as cnt FROM habit_logs WHERE habit_id=? AND user_id=?",
        (habit_id, user_id)
    ).fetchone()["cnt"]
    conn.close()
    return {"log_id": habit_id, "streak": streak, "message": "Logged! Keep going 🔥"}

@app.get("/analytics/week")
def weekly_analytics(authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)
    conn = get_db()
    habits = conn.execute("SELECT * FROM habits WHERE user_id=?", (user_id,)).fetchall()
    logs = conn.execute(
        "SELECT * FROM habit_logs WHERE user_id=? AND logged_at >= date('now','-7 days')",
        (user_id,)
    ).fetchall()
    conn.close()

    total = len(habits) * 7
    completed = len(logs)
    rate = round((completed / total * 100) if total > 0 else 0)

    habit_stats = []
    for h in habits:
        h_logs = [l for l in logs if l["habit_id"] == h["id"]]
        habit_stats.append({
            "habit_id": h["id"],
            "name": h["name"],
            "completions": len(h_logs),
            "target": 7,
            "completion_rate": round(len(h_logs) / 7 * 100)
        })

    return {
        "overall_completion_rate": rate,
        "total_logs": completed,
        "habit_stats": habit_stats,
        "period": "last_7_days"
    }

@app.post("/ai/insight")
def get_insight(req: InsightRequest, authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)
    conn = get_db()
    logs = conn.execute(
        "SELECT COUNT(*) as cnt FROM habit_logs WHERE user_id=? AND logged_at >= date('now',?)",
        (user_id, f"-{req.days_back} days")
    ).fetchone()["cnt"]
    conn.close()
    prompt = f"You are ZenPath's AI coach. The user completed {logs} habit logs in the last {req.days_back} days. Give a short (2-3 sentence) motivational insight. Be warm, specific, and encouraging."
    return {"insight": call_gemini(prompt), "logs_analyzed": logs}

@app.post("/ai/chat")
def chat_with_coach(msg: ChatMessage, authorization: Optional[str] = Header(None)):
    prompt = f"You are ZenPath's AI habit coach. Be warm, concise, and motivating. User says: {msg.message}"
    return {"reply": call_gemini(prompt)}

@app.post("/focus/session")
def log_focus(session: FocusSession, authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)
    conn = get_db()
    conn.execute(
        "INSERT INTO focus_sessions (user_id, duration_minutes, session_type) VALUES (?,?,?)",
        (user_id, session.duration_minutes, session.session_type)
    )
    conn.commit()
    conn.close()
    return {"message": f"Focus session of {session.duration_minutes}min logged!"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)