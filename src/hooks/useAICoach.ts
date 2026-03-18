// ============================================================
// src/hooks/useAICoach.ts

import { useState, useEffect } from "react";
import { habitsApi } from "../api/habits";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function useAICoach() {
  const [insight, setInsight] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadInsight("motivation"); }, []);

  const loadInsight = async (type = "motivation") => {
    setLoading(true);
    try {
      const res = await habitsApi.getInsight(type);
      setInsight(res.data.content);
    } catch {
      setInsight("Keep showing up — every day counts. 🌿");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    const userMsg: ChatMessage = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);
    try {
      const res = await habitsApi.chatWithCoach(text, messages);
      const aiMsg: ChatMessage = { role: "assistant", content: res.data.reply };
      setMessages([...updated, aiMsg]);
      return res.data.reply;
    } finally {
      setLoading(false);
    }
  };

  return { insight, messages, loading, loadInsight, sendMessage };
}
