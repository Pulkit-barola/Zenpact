import { useState, useEffect, useCallback } from "react";
import { habitsApi } from "../api/habits";

export function useWeeklyAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await habitsApi.getWeeklyAnalytics();
      setData(res.data);
    } catch (e: any) {
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

  const logHabit = async (habitId: string, value: number, mood: number, note?: string) => {
    setLogging(true);
    try {
      const res = await habitsApi.logHabit(habitId, value, mood, note);
      return res.data;
    } finally {
      setLogging(false);
    }
  };

  return { logHabit, logging };
}