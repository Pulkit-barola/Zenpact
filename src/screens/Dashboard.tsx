import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Modal } from 'react-native';

const HABITS_API = 'https://zenpact.onrender.com';
const HABIT_ICONS = ['🧘', '🚶', '📚', '💪', '🥗', '💧', '🏃', '✍️', '🎯', '😴'];

export default function Dashboard() {
  const [habits, setHabits] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [insight, setInsight] = useState('Stay consistent — small steps compound. 🌿');
  const [timer, setTimer] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [chat, setChat] = useState('');
  const [reply, setReply] = useState('');
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDesc, setNewHabitDesc] = useState('');
  const [dailyTarget, setDailyTarget] = useState('1');
  const [weeklyTarget, setWeeklyTarget] = useState('5');
  const [adding, setAdding] = useState(false);
  const [loggedToday, setLoggedToday] = useState<string[]>([]);
  const [celebrating, setCelebrating] = useState(false);
  const interval = useRef<any>(null);

  const loadData = () => {
    fetch(`${HABITS_API}/habits`).then(r => r.json()).then(setHabits).catch(() => {});
    fetch(`${HABITS_API}/analytics/week`).then(r => r.json()).then(data => {
      setAnalytics(data);
    }).catch(() => {});
    fetch(`${HABITS_API}/ai/insight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days_back: 7 })
    }).then(r => r.json()).then(d => setInsight(d.insight)).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (running) {
      interval.current = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
    } else clearInterval(interval.current);
    return () => clearInterval(interval.current);
  }, [running]);

  const logHabit = async (id: string) => {
    if (loggedToday.includes(id)) return;
    await fetch(`${HABITS_API}/habits/${id}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 1, mood: 4 })
    });
    const newLogged = [...loggedToday, id];
    setLoggedToday(newLogged);
    loadData();
    if (newLogged.length === habits.length) {
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 4000);
    }
  };

  const unlogHabit = (id: string) => {
    if ((window as any).confirm('Undo this habit check?')) {
      setLoggedToday(prev => prev.filter(h => h !== id));
    }
  };

  const deleteHabit = (id: string, name: string) => {
    if ((window as any).confirm(`Delete "${name}" permanently?`)) {
      fetch(`${HABITS_API}/habits/${id}`, { method: 'DELETE' });
      setTimeout(() => loadData(), 500);
    }
  };

  const addHabit = async () => {
    if (!newHabitName.trim()) return;
    setAdding(true);
    try {
      await fetch(`${HABITS_API}/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newHabitName,
          description: newHabitDesc || '',
          target_value: parseInt(dailyTarget) || 1,
          unit: 'times'
        })
      });
      setNewHabitName(''); setNewHabitDesc('');
      setDailyTarget('1'); setWeeklyTarget('5');
      setShowAddHabit(false);
      loadData();
    } finally { setAdding(false); }
  };

  const sendChat = async () => {
    if (!chat.trim()) return;
    const res = await fetch(`${HABITS_API}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: chat, conversation_history: [] })
    });
    const d = await res.json();
    setReply(d.reply);
    setChat('');
  };

  const mins = String(Math.floor(timer / 60)).padStart(2, '0');
  const secs = String(timer % 60).padStart(2, '0');
  const rate = analytics?.overall_completion_rate ?? 0;
  const totalLogs = analytics?.total_logs ?? 0;
  const weeklyStats = analytics?.habit_stats ?? [];

  return (
    <View style={{ flex: 1 }}>
      {celebrating && (
        <View style={s.celebration}>
          <Text style={s.celebrationText}>🎉 All habits done today! Amazing! 🎉</Text>
        </View>
      )}

      <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Good morning 🌿</Text>
            <Text style={s.headerName}>ZenPath</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => setShowAddHabit(true)}>
            <Text style={s.addBtnText}>+ Add Habit</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNum}>{habits.length}</Text>
            <Text style={s.statLabel}>Habits</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{rate}%</Text>
            <Text style={s.statLabel}>This week</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{totalLogs}🔥</Text>
            <Text style={s.statLabel}>Total logs</Text>
          </View>
        </View>

        <View style={s.content}>

          {/* AI Coach */}
          <View style={s.insightCard}>
            <Text style={s.insightLabel}>AI COACH</Text>
            <Text style={s.insightText}>{insight}</Text>
          </View>

          {/* Daily Habits */}
          <Text style={s.sectionTitle}>Today's Habits</Text>
          <Text style={s.sectionSub}>Tap to log · Hold to delete · Tick to undo</Text>
          {habits.length === 0 && (
            <Text style={s.empty}>No habits yet — tap "+ Add Habit" to start!</Text>
          )}
          {habits.map((h, i) => {
            const done = loggedToday.includes(h.id);
            return (
              <View key={h.id} style={[s.habitCard, done && s.habitDone]}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}
                  onPress={() => !done && logHabit(h.id)}
                  onLongPress={() => deleteHabit(h.id, h.name)}
                >
                  <View style={[s.habitIcon, { backgroundColor: done ? '#e8f5e9' : '#f5f5f5' }]}>
                    <Text style={{ fontSize: 22 }}>{HABIT_ICONS[i % HABIT_ICONS.length]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.habitName, done && { color: '#888' }]}>{h.name}</Text>
                    <Text style={s.habitSub}>{done ? '✓ Done today!' : (h.description || 'Tap to log')}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.checkCircle, done && s.checkDone]}
                  onPress={() => done ? unlogHabit(h.id) : logHabit(h.id)}
                >
                  <Text style={{ color: done ? '#fff' : '#ccc', fontSize: 16 }}>
                    {done ? '✓' : '○'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Weekly Progress */}
          <Text style={[s.sectionTitle, { marginTop: 8 }]}>Weekly Progress</Text>
          {weeklyStats.map((stat: any) => (
            <View key={stat.habit_id} style={s.weeklyCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={s.weeklyName}>{stat.name}</Text>
                <Text style={s.weeklyPercent}>{stat.completion_rate}%</Text>
              </View>
              <View style={s.progressBg}>
                <View style={[s.progressFill, { width: `${stat.completion_rate}%` as any }]} />
              </View>
              <Text style={s.weeklyMeta}>{stat.completions} / 7 days completed</Text>
            </View>
          ))}

          {/* Focus Timer */}
          <Text style={[s.sectionTitle, { marginTop: 8 }]}>Focus Timer</Text>
          <View style={s.timerCard}>
            <Text style={s.timerText}>{mins}:{secs}</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity style={s.timerBtn} onPress={() => setRunning(r => !r)}>
                <Text style={s.timerBtnText}>{running ? 'Pause' : 'Start'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.timerBtnOutline} onPress={() => { setRunning(false); setTimer(25 * 60); }}>
                <Text style={s.timerBtnOutlineText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Chat */}
          <Text style={[s.sectionTitle, { marginTop: 8 }]}>Chat with Coach</Text>
          <View style={s.chatCard}>
            {reply ? (
              <View style={s.replyBox}>
                <Text style={s.replyText}>{reply}</Text>
              </View>
            ) : null}
            <TextInput
              style={s.input}
              value={chat}
              onChangeText={setChat}
              placeholder="Ask your coach anything..."
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity style={s.sendBtn} onPress={sendChat}>
              <Text style={s.sendBtnText}>Send</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* Add Habit Modal */}
      <Modal visible={showAddHabit} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>New Habit 🌱</Text>
            <TextInput
              style={s.input}
              placeholder="Habit name"
              placeholderTextColor="#aaa"
              value={newHabitName}
              onChangeText={setNewHabitName}
            />
            <TextInput
              style={s.input}
              placeholder="Description (optional)"
              placeholderTextColor="#aaa"
              value={newHabitDesc}
              onChangeText={setNewHabitDesc}
            />

            <View style={s.targetRow}>
              <View style={s.targetBox}>
                <Text style={s.targetLabel}>Daily Target</Text>
                <TextInput
                  style={s.targetInput}
                  value={dailyTarget}
                  onChangeText={setDailyTarget}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor="#aaa"
                />
                <Text style={s.targetUnit}>times/day</Text>
              </View>
              <View style={s.targetBox}>
                <Text style={s.targetLabel}>Weekly Target</Text>
                <TextInput
                  style={s.targetInput}
                  value={weeklyTarget}
                  onChangeText={setWeeklyTarget}
                  keyboardType="numeric"
                  placeholder="5"
                  placeholderTextColor="#aaa"
                />
                <Text style={s.targetUnit}>days/week</Text>
              </View>
            </View>

            <TouchableOpacity style={s.sendBtn} onPress={addHabit}>
              <Text style={s.sendBtnText}>{adding ? 'Adding...' : 'Add Habit'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowAddHabit(false)}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  celebration: { backgroundColor: '#4a8f3f', padding: 16, alignItems: 'center' },
  celebrationText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  header: { backgroundColor: '#2d5a27', paddingTop: 50, paddingBottom: 70, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  headerName: { fontSize: 24, fontWeight: '600', color: '#fff' },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: -30, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: 14, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '500', color: '#2d5a27' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  content: { paddingHorizontal: 16 },
  insightCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#4a8f3f' },
  insightLabel: { fontSize: 11, color: '#4a8f3f', fontWeight: '500', letterSpacing: 0.8, marginBottom: 8 },
  insightText: { fontSize: 14, color: '#2d2d2d', lineHeight: 22 },
  sectionTitle: { fontSize: 17, fontWeight: '500', color: '#2d2d2d', marginBottom: 4 },
  sectionSub: { fontSize: 12, color: '#aaa', marginBottom: 12 },
  habitCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  habitDone: { opacity: 0.7, backgroundColor: '#f9fff9' },
  habitIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  habitName: { fontSize: 15, fontWeight: '500', color: '#2d2d2d' },
  habitSub: { fontSize: 12, color: '#aaa', marginTop: 2 },
  checkCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  checkDone: { backgroundColor: '#4a8f3f' },
  weeklyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10 },
  weeklyName: { fontSize: 14, fontWeight: '500', color: '#2d2d2d' },
  weeklyPercent: { fontSize: 14, fontWeight: '500', color: '#4a8f3f' },
  progressBg: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, marginBottom: 6 },
  progressFill: { height: 8, backgroundColor: '#4a8f3f', borderRadius: 4 },
  weeklyMeta: { fontSize: 12, color: '#aaa' },
  timerCard: { backgroundColor: '#1a3a16', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  timerText: { fontSize: 52, fontWeight: '300', color: '#fff', letterSpacing: 2 },
  timerBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 28 },
  timerBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  timerBtnOutline: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 28 },
  timerBtnOutlineText: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },
  chatCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20 },
  replyBox: { backgroundColor: '#f0f7ee', borderRadius: 10, padding: 12, marginBottom: 12 },
  replyText: { fontSize: 14, color: '#2d5a27', lineHeight: 20 },
  input: { borderWidth: 1.5, borderColor: '#e8e4d9', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 14, color: '#2d2d2d' },
  sendBtn: { backgroundColor: '#2d5a27', borderRadius: 10, padding: 14, alignItems: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '500', fontSize: 15 },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelText: { color: '#888', fontSize: 15 },
  empty: { fontSize: 14, color: '#aaa', textAlign: 'center', marginBottom: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: '600', color: '#2d2d2d', marginBottom: 20 },
  targetRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  targetBox: { flex: 1, backgroundColor: '#f8f8f8', borderRadius: 12, padding: 12 },
  targetLabel: { fontSize: 12, color: '#888', marginBottom: 8 },
  targetInput: { borderWidth: 1.5, borderColor: '#e8e4d9', borderRadius: 8, padding: 10, fontSize: 18, fontWeight: '500', color: '#2d5a27', textAlign: 'center', marginBottom: 6 },
  targetUnit: { fontSize: 11, color: '#aaa', textAlign: 'center' },
});