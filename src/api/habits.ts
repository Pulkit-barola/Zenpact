// ============================================================
// src/api/habits.ts — All API endpoint functions

import api from "./client";

export const habitsApi = {
  logHabit: (habitId: string, value: number, mood: number, note?: string) =>
    api.post(`/habits/${habitId}/log`, { value, mood, note }),

  getWeeklyAnalytics: () =>
    api.get("/analytics/week"),

  getTrends: (days = 30) =>
    api.get("/analytics/trends", { params: { days } }),

  getInsight: (type = "motivation", daysBack = 7) =>
    api.post("/ai/insight", { days_back: daysBack }, {
      params: { insight_type: type }
    }),

  chatWithCoach: (message: string, history: { role: string; content: string }[]) =>
    api.post("/ai/chat", { message, conversation_history: history }),

  getRecentInsights: (limit = 5) =>
    api.get("/ai/insights", { params: { limit } }),

  markInsightHelpful: (insightId: string, helpful: boolean) =>
    api.patch(`/ai/insights/${insightId}/feedback`, null, { params: { helpful } }),
};
