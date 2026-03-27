from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import os
import uuid
from dotenv import load_dotenv
import httpx

load_dotenv()

app = FastAPI(title="ZenPath API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
    user_name: Optional[str] = "Friend"

class InsightRequest(BaseModel):
    days_back: int = 7

class FocusSession(BaseModel):
    duration_minutes: int
    session_type: str = "focus"

# --- Helper ---
def get_user_id(authorization: Optional[str] = None) -> str:
    return "demo_user"

def call_groq(prompt: str, system: str = "") -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return "Keep showing up — every day counts. 🌿 (Add GROQ_API_KEY to Render environment)"
    try:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama3-8b-8192",
                "messages": messages,
                "max_tokens": 250,
                "temperature": 0.7
            },
            timeout=15
        )
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Stay consistent — small steps compound. 🌿"

# --- Routes ---
@app.get("/")
def root():
    return {"status": "ZenPath API running", "version": "2.0"}

@app.get("/habits")
def get_habits(authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)
    conn = get_db()
    habits = conn.execute("SELECT * FROM habits WHERE user_id = ?", (user_id,)).fetchall()
    conn.close()
    return [dict(h) for h in habits]

@app.post("/habits")
def create_habit(habit: HabitCreate, authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)
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

    system = "You are ZenPath's AI habit coach. Be warm, concise, and motivating."
    prompt = f"The user completed {logs} habit logs in the last {req.days_back} days. Give a 2-3 sentence motivational insight. Be specific and encouraging."

    return {"insight": call_groq(prompt, system), "logs_analyzed": logs}

@app.post("/ai/chat")
def chat_with_coach(msg: ChatMessage, authorization: Optional[str] = Header(None)):
    system = f"""You are ZenPath's personal AI habit coach for {msg.user_name or 'the user'}.
You are warm, motivating, and concise. You remember conversation context.
You help users build better habits, stay consistent, and achieve their goals.
Keep responses under 3-4 sentences unless asked for more.
Never repeat generic responses — always be specific to what the user says."""

    full_prompt = ""
    if msg.conversation_history:
        for turn in msg.conversation_history[-8:]:
            role = "User" if turn.get("role") == "user" else "Coach"
            content = turn.get("content", "")
            if content:
                full_prompt += f"{role}: {content}\n"

    full_prompt += f"User: {msg.message}\nCoach:"

    return {"reply": call_groq(full_prompt, system)}

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

@app.delete("/habits/{habit_id}")
def delete_habit(habit_id: str, authorization: Optional[str] = Header(None)):
    user_id = get_user_id(authorization)
    conn = get_db()
    conn.execute("DELETE FROM habits WHERE id=? AND user_id=?", (habit_id, user_id))
    conn.execute("DELETE FROM habit_logs WHERE habit_id=?", (habit_id,))
    conn.commit()
    conn.close()
    return {"message": "Habit deleted!"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
