import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';

const HABITS_API = process.env.NODE_ENV === 'production' 
  ? 'https://api.zenpath.app'   // your future server
  : 'http://127.0.0.1:8000';

export default function Dashboard() {
  const [habits, setHabits] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [insight, setInsight] = useState('Keep showing up — every day counts. 🌿');
  const [timer, setTimer] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [chat, setChat] = useState('');
  const [reply, setReply] = useState('');
  const interval = useRef<any>(null);

  useEffect(() => {
    fetch(`${HABITS_API}/habits`).then(r => r.json()).then(setHabits).catch(() => {});
    fetch(`${HABITS_API}/analytics/week`).then(r => r.json()).then(setAnalytics).catch(() => {});
    fetch(`${HABITS_API}/ai/insight`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days_back: 7 }) })
      .then(r => r.json()).then(d => setInsight(d.insight)).catch(() => {});
  }, []);

  useEffect(() => {
    if (running) {
      interval.current = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
    } else clearInterval(interval.current);
    return () => clearInterval(interval.current);
  }, [running]);

  const logHabit = async (id: string) => {
    await fetch(`${HABITS_API}/habits/${id}/log`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 1, mood: 4 })
    });
    fetch(`${HABITS_API}/analytics/week`).then(r => r.json()).then(setAnalytics);
  };

  const sendChat = async () => {
    if (!chat.trim()) return;
    const res = await fetch(`${HABITS_API}/ai/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: chat, conversation_history: [] })
    });
    const d = await res.json();
    setReply(d.reply);
    setChat('');
  };

  const mins = String(Math.floor(timer / 60)).padStart(2, '0');
  const secs = String(timer % 60).padStart(2, '0');
  const rate = analytics?.overall_completion_rate ?? 0;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={s.title}>ZenPath 🌿</Text>

      {/* AI Insight */}
      <View style={s.card}>
        <Text style={s.label}>AI Coach</Text>
        <Text style={s.insight}>{insight}</Text>
      </View>

      {/* Weekly progress */}
      <View style={s.card}>
        <Text style={s.label}>This week: {rate}% complete</Text>
        <View style={s.barBg}>
          <View style={[s.barFill, { width: `${rate}%` }]} />
        </View>
      </View>

      {/* Habits */}
      <Text style={s.sectionTitle}>Your Habits</Text>
      {habits.length === 0 && (
        <Text style={s.empty}>No habits yet — add one at http://127.0.0.1:8000/docs</Text>
      )}
      {habits.map(h => (
        <TouchableOpacity key={h.id} style={s.habitCard} onPress={() => logHabit(h.id)}>
          <Text style={s.habitName}>{h.name}</Text>
          <Text style={s.habitSub}>{h.description} · tap to log</Text>
        </TouchableOpacity>
      ))}

      {/* Focus Timer */}
      <Text style={s.sectionTitle}>Focus Timer</Text>
      <View style={s.card}>
        <Text style={s.timerText}>{mins}:{secs}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
          <TouchableOpacity style={s.btn} onPress={() => setRunning(r => !r)}>
            <Text style={s.btnText}>{running ? 'Pause' : 'Start'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btn} onPress={() => { setRunning(false); setTimer(25 * 60); }}>
            <Text style={s.btnText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat */}
      <Text style={s.sectionTitle}>Chat with Coach</Text>
      <View style={s.card}>
        {reply ? <Text style={s.reply}>{reply}</Text> : null}
        <TextInput
          style={s.input}
          value={chat}
          onChangeText={setChat}
          placeholder="Ask your coach anything..."
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity style={s.btn} onPress={sendChat}>
          <Text style={s.btnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f0e8' },
  title: { fontSize: 28, fontWeight: '600', color: '#3a3a2e', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  label: { fontSize: 13, color: '#888', marginBottom: 6 },
  insight: { fontSize: 15, color: '#3a3a2e', lineHeight: 22 },
  barBg: { height: 8, backgroundColor: '#e8e4d9', borderRadius: 4, marginTop: 8 },
  barFill: { height: 8, backgroundColor: '#6b8f5e', borderRadius: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '500', color: '#3a3a2e', marginBottom: 12, marginTop: 4 },
  habitCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#6b8f5e' },
  habitName: { fontSize: 16, fontWeight: '500', color: '#3a3a2e' },
  habitSub: { fontSize: 13, color: '#888', marginTop: 4 },
  timerText: { fontSize: 48, fontWeight: '300', color: '#3a3a2e', textAlign: 'center' },
  btn: { backgroundColor: '#6b8f5e', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#e0dbd0', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 14, color: '#3a3a2e' },
  reply: { fontSize: 14, color: '#3a3a2e', marginBottom: 12, lineHeight: 20 },
  empty: { fontSize: 14, color: '#aaa', textAlign: 'center', marginBottom: 16 },
});