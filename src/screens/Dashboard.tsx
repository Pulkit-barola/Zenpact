import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Modal } from 'react-native';

const HABITS_API = 'https://zenpact-production.up.railway.app';

export default function Dashboard() {
  const [habits, setHabits] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [insight, setInsight] = useState('Keep showing up — every day counts. 🌿');
  const [timer, setTimer] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [chat, setChat] = useState('');
  const [reply, setReply] = useState('');
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDesc, setNewHabitDesc] = useState('');
  const [adding, setAdding] = useState(false);
  const interval = useRef<any>(null);

  const loadData = () => {
    fetch(`${HABITS_API}/habits`).then(r => r.json()).then(setHabits).catch(() => {});
    fetch(`${HABITS_API}/analytics/week`).then(r => r.json()).then(setAnalytics).catch(() => {});
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
    await fetch(`${HABITS_API}/habits/${id}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 1, mood: 4 })
    });
    loadData();
  };

  const addHabit = async () => {
    if (!newHabitName.trim()) return;
    setAdding(true);
    try {
      const response = await fetch(`${HABITS_API}/habits`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newHabitName,
          description: newHabitDesc || '',
          target_value: 1,
          unit: 'times'
        })
      });
      if (response.ok) {
        setNewHabitName('');
        setNewHabitDesc('');
        setShowAddHabit(false);  // ← modal band karo
        loadData();              // ← list refresh karo
      } else {
        alert('Error adding habit. Try again!');
        setShowAddHabit(false);
      }
    } catch (error) {
      alert('Network error! Check connection.');
      setShowAddHabit(false);
    } finally {
      setAdding(false);
    }
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

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={s.container} contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={s.title}>ZenPath 🌿</Text>
          <TouchableOpacity style={s.addBtn} onPress={() => setShowAddHabit(true)}>
            <Text style={s.addBtnText}>+ Add Habit</Text>
          </TouchableOpacity>
        </View>

        {/* AI Insight */}
        <View style={s.card}>
          <Text style={s.label}>AI Coach</Text>
          <Text style={s.insight}>{insight}</Text>
        </View>

        {/* Weekly progress */}
        <View style={s.card}>
          <Text style={s.label}>This week: {rate}% complete</Text>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${rate}%` as any }]} />
          </View>
        </View>

        {/* Habits */}
        <Text style={s.sectionTitle}>Your Habits</Text>
        {habits.length === 0 && (
          <Text style={s.empty}>No habits yet — tap "+ Add Habit" to start!</Text>
        )}
        {habits.map(h => (
          <TouchableOpacity key={h.id} style={s.habitCard} onPress={() => logHabit(h.id)}>
            <Text style={s.habitName}>{h.name}</Text>
            <Text style={s.habitSub}>{h.description} · tap to log ✓</Text>
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

      {/* Add Habit Modal */}
      <Modal visible={showAddHabit} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>New Habit 🌱</Text>
            <TextInput
              style={s.input}
              placeholder="Habit name (e.g. Morning Meditation)"
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
            <TouchableOpacity style={s.btn} onPress={addHabit}>
              <Text style={s.btnText}>{adding ? 'Adding...' : 'Add Habit'}</Text>
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
  container: { flex: 1, backgroundColor: '#f5f0e8' },
  title: { fontSize: 28, fontWeight: '600', color: '#3a3a2e' },
  addBtn: { backgroundColor: '#6b8f5e', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  addBtnText: { color: '#fff', fontWeight: '500', fontSize: 14 },
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
  btn: { backgroundColor: '#6b8f5e', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center', marginBottom: 8 },
  btnText: { color: '#fff', fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#e0dbd0', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 14, color: '#3a3a2e' },
  reply: { fontSize: 14, color: '#3a3a2e', marginBottom: 12, lineHeight: 20 },
  empty: { fontSize: 14, color: '#aaa', textAlign: 'center', marginBottom: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#f5f0e8', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: '600', color: '#3a3a2e', marginBottom: 20 },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelText: { color: '#888', fontSize: 15 },
});