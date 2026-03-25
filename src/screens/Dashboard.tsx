import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Modal } from 'react-native';

const HABITS_API = 'https://zenpact.onrender.com';

const getIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('meditat')) return '🧘';
  if (n.includes('phone') || n.includes('screen')) return '📵';
  if (n.includes('read')) return '📚';
  if (n.includes('water') || n.includes('drink')) return '💧';
  if (n.includes('walk')) return '🚶';
  if (n.includes('exercise') || n.includes('gym')) return '💪';
  if (n.includes('sleep')) return '😴';
  if (n.includes('study') || n.includes('dsa')) return '📖';
  return '🎯';
};

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const THEMES = {
  light: { bg: '#f7f8fa', card: '#ffffff', text: '#1a1a2e', sub: '#8892a4', border: '#eaedf2', green: '#2d5a27', greenLight: '#e8f5e9', sidebar: '#ffffff' },
  dark:  { bg: '#0f0f13', card: '#1a1a24', text: '#e8eaf0', sub: '#5a6072', border: '#252535', green: '#4a9f3f', greenLight: '#1a2e1a', sidebar: '#14141e' },
};

const NAV_ITEMS = [
  { id: 'home',     icon: '🏠', label: 'Home' },
  { id: 'insights', icon: '📊', label: 'Insights' },
  { id: 'focus',    icon: '🎯', label: 'Focus' },
  { id: 'coach',    icon: '🤖', label: 'Coach' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

export default function Dashboard({ userName = 'Friend' }: { userName?: string }) {
  const [activeTab, setActiveTab] = useState('home');
  const [habits, setHabits] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [insight, setInsight] = useState('Stay consistent — small steps compound. 🌿');
  const [timer, setTimer] = useState(25 * 60);
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [running, setRunning] = useState(false);
  const [focusTopic, setFocusTopic] = useState('');
  const [focusSessions, setFocusSessions] = useState<any[]>([]);
  const [graphPeriod, setGraphPeriod] = useState('Week');
  const [notifTime, setNotifTime] = useState(25);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [chat, setChat] = useState('');
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDesc, setNewHabitDesc] = useState('');
  const [dailyTarget, setDailyTarget] = useState('1');
  const [weeklyTarget, setWeeklyTarget] = useState('5');
  const [adding, setAdding] = useState(false);
  const [loggedToday, setLoggedToday] = useState<string[]>([]);
  const [celebrating, setCelebrating] = useState(false);
  const [toast, setToast] = useState('');
  const [serverReady, setServerReady] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const interval = useRef<any>(null);
  const chatScrollRef = useRef<any>(null);
  const T = THEMES[theme];

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const playAlarm = () => {
    try {
      const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      [0, 0.4, 0.8].forEach(delay => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880; osc.type = 'sine';
        gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.5);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.5);
      });
    } catch (e) {}
  };

  const saveSession = (minsOverride?: number) => {
    const minsSpent = minsOverride ?? (notifTime - Math.floor(timer / 60));
    if (minsSpent < 1) return;
    const newSession = {
      topic: focusTopic || 'Focus Session', mins: minsSpent,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
    };
    setFocusSessions(prev => {
      const updated = [...prev, newSession];
      localStorage.setItem('zenpath_sessions', JSON.stringify(updated));
      return updated;
    });
    setTimer(notifTime * 60); setRunning(false);
    showToast(`💾 ${minsSpent} min session saved!`);
  };

  const getGraphData = () => {
    const now = Date.now(); const day = 86400000;
    if (graphPeriod === 'Today') {
      return Array.from({ length: 6 }, (_, i) => {
        const start = new Date(); start.setHours(i * 4, 0, 0, 0);
        const s = focusSessions.filter(s => s.timestamp >= start.getTime() && s.timestamp < start.getTime() + 4 * 3600000);
        return { label: `${i * 4}h`, mins: s.reduce((a, x) => a + x.mins, 0) };
      });
    }
    if (graphPeriod === 'Week') {
      return DAYS.map((label, i) => {
        const start = now - (6 - i) * day;
        const s = focusSessions.filter(s => s.timestamp >= start && s.timestamp < start + day);
        return { label, mins: s.reduce((a, x) => a + x.mins, 0) };
      });
    }
    if (graphPeriod === 'Month') {
      return Array.from({ length: 4 }, (_, i) => {
        const start = now - (3 - i) * 7 * day;
        const s = focusSessions.filter(s => s.timestamp >= start && s.timestamp < start + 7 * day);
        return { label: `W${i + 1}`, mins: s.reduce((a, x) => a + x.mins, 0) };
      });
    }
    return Array.from({ length: 6 }, (_, i) => {
      const start = now - (5 - i) * 30 * day;
      const s = focusSessions.filter(s => s.timestamp >= start && s.timestamp < start + 30 * day);
      return { label: `M${i + 1}`, mins: s.reduce((a, x) => a + x.mins, 0) };
    });
  };

  const scheduleReminder = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const r = new Date(); r.setHours(20, 0, 0, 0);
      const delay = r.getTime() - Date.now();
      if (delay > 0) setTimeout(() => new Notification('ZenPath 🌿', { body: 'Time to log your habits! 🔥' }), delay);
    }
  };

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) { showToast('❌ Not supported'); return; }
    if (Notification.permission === 'granted') { showToast('🔔 Already enabled!'); return; }
    if (Notification.permission === 'denied') { showToast('❌ Blocked — enable in browser settings'); return; }
    const p = await Notification.requestPermission();
    if (p === 'granted') { showToast('🔔 Enabled! Reminder at 8 PM.'); scheduleReminder(); }
  };

  const pingServer = () => fetch(`${HABITS_API}/`).catch(() => {});

  const loadData = () => {
    pingServer();
    fetch(`${HABITS_API}/habits`).then(r => r.json()).then(data => { setHabits(data); setServerReady(true); }).catch(() => {});
    fetch(`${HABITS_API}/analytics/week`).then(r => r.json()).then(setAnalytics).catch(() => {});
    fetch(`${HABITS_API}/ai/insight`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ days_back: 7 }) })
      .then(r => r.json()).then(d => setInsight(d.insight)).catch(() => {});
  };

  useEffect(() => {
    pingServer(); setTimeout(loadData, 800);
    const keepAlive = setInterval(pingServer, 10 * 60 * 1000);
    if ('Notification' in window && Notification.permission === 'granted') scheduleReminder();
    const saved = localStorage.getItem('zenpath_sessions');
    if (saved) setFocusSessions(JSON.parse(saved));
    const savedTheme = localStorage.getItem('zenpath_theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
    const savedTime = localStorage.getItem('zenpath_notif_time');
    if (savedTime) setNotifTime(parseInt(savedTime));
    return () => clearInterval(keepAlive);
  }, []);

  useEffect(() => {
    if (running) {
      interval.current = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            setRunning(false); playAlarm(); showToast('🎉 Session complete!');
            if ('Notification' in window && Notification.permission === 'granted')
              new Notification('ZenPath 🎯', { body: 'Focus session complete!' });
            saveSession(notifTime);
            return timerMode === 'focus' ? notifTime * 60 : 5 * 60;
          }
          return t - 1;
        });
      }, 1000);
    } else clearInterval(interval.current);
    return () => clearInterval(interval.current);
  }, [running, timerMode, notifTime]);

  const logHabit = async (id: string) => {
    if (loggedToday.includes(id)) return;
    await fetch(`${HABITS_API}/habits/${id}/log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: 1, mood: 4 }) });
    const newLogged = [...loggedToday, id];
    setLoggedToday(newLogged); loadData(); showToast('✅ Logged!');
    if (newLogged.length === habits.length) { setCelebrating(true); setTimeout(() => setCelebrating(false), 4000); }
  };

  const unlogHabit = (id: string) => {
    if ((window as any).confirm('Undo this habit?')) { setLoggedToday(prev => prev.filter(h => h !== id)); showToast('↩️ Undone!'); }
  };

  const deleteHabit = (id: string, name: string) => {
    if ((window as any).confirm(`Delete "${name}"?`)) {
      fetch(`${HABITS_API}/habits/${id}`, { method: 'DELETE' });
      setTimeout(() => loadData(), 400); showToast('🗑️ Deleted!');
    }
  };

  const addHabit = async () => {
    if (!newHabitName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`${HABITS_API}/habits`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newHabitName, description: newHabitDesc || '', target_value: parseInt(dailyTarget) || 1, unit: 'times' }) });
      if (res.ok) { setNewHabitName(''); setNewHabitDesc(''); setDailyTarget('1'); setWeeklyTarget('5'); setShowAddHabit(false); loadData(); showToast('🌱 Habit added!'); }
      else showToast('❌ Failed. Try again!');
    } catch { showToast('❌ Server error!'); }
    finally { setAdding(false); }
  };

  const sendChat = async () => {
    if (!chat.trim() || chatLoading) return;
    const userMsg = chat;
    const newMessages = [...messages, { role: 'user', text: userMsg }];
    setMessages(newMessages); setChat(''); setChatLoading(true);
    const history = newMessages.slice(-8).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
    try {
      const res = await fetch(`${HABITS_API}/ai/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg, conversation_history: history }) });
      const d = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: d.reply }]);
    } catch { setMessages(prev => [...prev, { role: 'ai', text: 'Connection error. Try again!' }]); }
    finally { setChatLoading(false); }
  };

  const mins = String(Math.floor(timer / 60)).padStart(2, '0');
  const secs = String(timer % 60).padStart(2, '0');
  const rate = analytics?.overall_completion_rate ?? 0;
  const totalLogs = analytics?.total_logs ?? 0;
  const weeklyStats = analytics?.habit_stats ?? [];
  const today = new Date().getDay();
  const dayIndex = today === 0 ? 6 : today - 1;
  const graphData = getGraphData();
  const maxMins = Math.max(...graphData.map((d: any) => d.mins), 1);
  const totalFocusMins = focusSessions.reduce((a, s) => a + s.mins, 0);

  // ── HOME ──
  const renderHome = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 28, paddingBottom: 40 }}>
      {/* Welcome */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <View>
          <Text style={{ fontSize: 13, color: T.sub, letterSpacing: 0.5, marginBottom: 4 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
          </Text>
          <Text style={{ fontSize: 28, fontWeight: '600', color: T.text }}>Good morning, {userName} 🌿</Text>
          <Text style={{ fontSize: 15, color: T.sub, marginTop: 4 }}>
            {loggedToday.length === 0 ? "Let's build some habits today" : `${loggedToday.length} of ${habits.length} habits done`}
          </Text>
        </View>
        <TouchableOpacity style={[s.addBigBtn, { backgroundColor: T.green }]} onPress={() => setShowAddHabit(true)}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>+ Add Habit</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={{ flexDirection: 'row', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Habits', value: habits.length, icon: '📋' },
          { label: 'This week', value: `${rate}%`, icon: '📈' },
          { label: 'Total logs', value: totalLogs, icon: '🔥' },
          { label: 'Focus mins', value: totalFocusMins, icon: '🎯' },
        ].map((item, i) => (
          <View key={i} style={[s.statBig, { backgroundColor: T.card, borderColor: T.border }]}>
            <Text style={{ fontSize: 20 }}>{item.icon}</Text>
            <Text style={{ fontSize: 22, fontWeight: '600', color: T.text, marginTop: 6 }}>{item.value}</Text>
            <Text style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* AI Insight */}
      <View style={[s.insightBig, { backgroundColor: T.greenLight, borderColor: T.green }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Text style={{ fontSize: 16 }}>🤖</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: T.green, letterSpacing: 0.8 }}>AI COACH INSIGHT</Text>
        </View>
        <Text style={{ fontSize: 15, color: T.text, lineHeight: 22 }}>{insight}</Text>
      </View>

      {/* Streak Week */}
      <View style={[s.card, { backgroundColor: T.card, borderColor: T.border, marginBottom: 20 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ fontSize: 15, fontWeight: '500', color: T.text }}>🔥 Weekly Streak</Text>
          <TouchableOpacity onPress={requestNotifPermission}>
            <Text style={{ fontSize: 20 }}>{'Notification' in window && Notification.permission === 'granted' ? '🔔' : '🔕'}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {DAYS.map((d, i) => (
            <View key={i} style={{ alignItems: 'center', gap: 6 }}>
              <View style={[s.dayDot, { backgroundColor: i < dayIndex ? T.green : i === dayIndex ? T.green : T.border }]}>
                {i <= dayIndex && <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 11, color: i <= dayIndex ? T.green : T.sub }}>{d}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Habits */}
      {!serverReady && <Text style={{ color: T.sub, textAlign: 'center', marginBottom: 16, fontSize: 13 }}>⏳ Loading habits...</Text>}
      {serverReady && habits.length === 0 && (
        <View style={[s.card, { backgroundColor: T.card, borderColor: T.border, alignItems: 'center', paddingVertical: 32 }]}>
          <Text style={{ fontSize: 32, marginBottom: 10 }}>🌱</Text>
          <Text style={{ fontSize: 16, fontWeight: '500', color: T.text, marginBottom: 6 }}>No habits yet</Text>
          <Text style={{ fontSize: 14, color: T.sub }}>Tap "+ Add Habit" to get started!</Text>
        </View>
      )}

      {habits.map((h) => {
        const done = loggedToday.includes(h.id);
        const stat = weeklyStats.find((w: any) => w.habit_id === h.id);
        return (
          <TouchableOpacity key={h.id} style={[s.habitBig, { backgroundColor: T.card, borderColor: done ? T.green : T.border }]}
            onPress={() => !done && logHabit(h.id)} onLongPress={() => deleteHabit(h.id, h.name)}>
            <View style={[s.habitIconBox, { backgroundColor: done ? T.greenLight : T.bg }]}>
              <Text style={{ fontSize: 24 }}>{getIcon(h.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: done ? T.sub : T.text, textDecorationLine: done ? 'line-through' : 'none' }}>{h.name}</Text>
              <Text style={{ fontSize: 12, color: T.sub, marginTop: 3 }}>
                {done ? '✓ Done today!' : (h.description || 'Tap to log · Hold to delete')}
              </Text>
              <View style={[s.habitProgress, { backgroundColor: T.border, marginTop: 8 }]}>
                <View style={{ height: 4, borderRadius: 2, width: done ? '100%' : `${((stat?.completions ?? 0) / 7) * 100}%`, backgroundColor: done ? T.green : '#e8a838' }} />
              </View>
              <Text style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>🔥 {stat?.completions ?? 0}/7 days this week</Text>
            </View>
            <TouchableOpacity style={[s.checkBig, { borderColor: done ? T.green : T.border, backgroundColor: done ? T.green : 'transparent' }]}
              onPress={() => done ? unlogHabit(h.id) : logHabit(h.id)}>
              {done && <Text style={{ color: '#fff', fontSize: 16 }}>✓</Text>}
            </TouchableOpacity>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  // ── INSIGHTS ──
  const renderInsights = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 28, paddingBottom: 40 }}>
      <Text style={{ fontSize: 24, fontWeight: '600', color: T.text, marginBottom: 20 }}>Weekly Insights 📊</Text>
      <View style={[s.insightBig, { backgroundColor: T.greenLight, borderColor: T.green, marginBottom: 20 }]}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: T.green, letterSpacing: 0.8, marginBottom: 8 }}>AI COACH</Text>
        <Text style={{ fontSize: 15, color: T.text, lineHeight: 22 }}>{insight}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 14, marginBottom: 24 }}>
        {[{ n: habits.length, l: 'Total Habits' }, { n: `${rate}%`, l: 'Completion' }, { n: `${totalLogs}`, l: 'Total Logs' }].map((item, i) => (
          <View key={i} style={[s.statBig, { backgroundColor: T.card, borderColor: T.border }]}>
            <Text style={{ fontSize: 26, fontWeight: '600', color: T.green }}>{item.n}</Text>
            <Text style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>{item.l}</Text>
          </View>
        ))}
      </View>
      {weeklyStats.map((stat: any) => (
        <View key={stat.habit_id} style={[s.card, { backgroundColor: T.card, borderColor: T.border, marginBottom: 12 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: '500', color: T.text }}>{getIcon(stat.name)} {stat.name}</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: T.green }}>{stat.completion_rate}%</Text>
          </View>
          <View style={[s.habitProgress, { backgroundColor: T.border }]}>
            <View style={{ height: 8, borderRadius: 4, width: `${stat.completion_rate}%`, backgroundColor: T.green }} />
          </View>
          <Text style={{ fontSize: 12, color: T.sub, marginTop: 8 }}>{stat.completions} / 7 days completed this week</Text>
        </View>
      ))}
    </ScrollView>
  );

  // ── FOCUS ──
  const renderFocus = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 28, paddingBottom: 40 }}>
      <Text style={{ fontSize: 24, fontWeight: '600', color: T.text, marginBottom: 20 }}>Focus Timer 🎯</Text>
      <View style={{ flexDirection: 'row', gap: 20 }}>
        {/* Left: Timer */}
        <View style={{ flex: 1 }}>
          <View style={[s.card, { backgroundColor: T.card, borderColor: T.border, alignItems: 'center', paddingVertical: 32, marginBottom: 16 }]}>
            <TextInput style={[s.topicInput, { color: T.text, borderColor: T.border, width: '100%', marginBottom: 24 }]}
              value={focusTopic} onChangeText={setFocusTopic}
              placeholder="What are you working on?" placeholderTextColor={T.sub} />
            <View style={[s.timerRing, { borderColor: running ? T.green : T.border }]}>
              <Text style={{ fontSize: 48, fontWeight: '300', color: T.text }}>{mins}:{secs}</Text>
              <Text style={{ fontSize: 12, color: T.sub, letterSpacing: 2, marginTop: 4 }}>{timerMode.toUpperCase()}</Text>
              {focusTopic ? <Text style={{ fontSize: 11, color: T.green, marginTop: 6 }} numberOfLines={1}>{focusTopic}</Text> : null}
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
              <TouchableOpacity style={[s.addBigBtn, { backgroundColor: T.green, paddingHorizontal: 28 }]} onPress={() => setRunning(r => !r)}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>{running ? '⏸ Pause' : '▶ Start'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.outlineBtn, { borderColor: T.border }]} onPress={() => { setRunning(false); setTimer(notifTime * 60); }}>
                <Text style={{ color: T.text, fontSize: 14 }}>↺ Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.outlineBtn, { borderColor: T.green }]} onPress={() => saveSession()}>
                <Text style={{ color: T.green, fontSize: 14 }}>💾 Save</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              {(['focus', 'break'] as const).map(mode => (
                <TouchableOpacity key={mode} style={[s.pill, { borderColor: T.border }, timerMode === mode && { backgroundColor: T.green, borderColor: T.green }]}
                  onPress={() => { setTimerMode(mode); setTimer(mode === 'focus' ? notifTime * 60 : 5 * 60); setRunning(false); }}>
                  <Text style={{ fontSize: 13, color: timerMode === mode ? '#fff' : T.sub }}>
                    {mode === 'focus' ? `${notifTime} min` : '5 min break'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Right: Graph */}
        <View style={{ flex: 1 }}>
          <View style={[s.card, { backgroundColor: T.card, borderColor: T.border }]}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: T.text, marginBottom: 12 }}>Focus Sessions</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {['Today', 'Week', 'Month', '6 Months'].map(p => (
                <TouchableOpacity key={p} style={[s.pill, { borderColor: T.border }, graphPeriod === p && { backgroundColor: T.green, borderColor: T.green }]}
                  onPress={() => setGraphPeriod(p)}>
                  <Text style={{ fontSize: 12, color: graphPeriod === p ? '#fff' : T.sub }}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {focusSessions.length === 0 ? (
              <Text style={{ color: T.sub, fontSize: 13, textAlign: 'center', paddingVertical: 20 }}>No sessions yet</Text>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 4, marginBottom: 8 }}>
                  {graphData.map((item: any, i: number) => (
                    <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                      <View style={{ width: '100%', height: Math.max(3, (item.mins / maxMins) * 90), backgroundColor: T.green, borderRadius: 3, opacity: item.mins > 0 ? 1 : 0.15 }} />
                      <Text style={{ fontSize: 9, color: T.sub, marginTop: 4 }}>{item.label}</Text>
                    </View>
                  ))}
                </View>
                <Text style={{ fontSize: 12, color: T.sub, textAlign: 'center' }}>Total: {totalFocusMins} mins · {focusSessions.length} sessions</Text>
              </>
            )}
          </View>

          {/* Recent sessions */}
          {[...focusSessions].reverse().slice(0, 4).map((session: any, i: number) => (
            <View key={i} style={[s.card, { backgroundColor: T.card, borderColor: T.border, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: T.text }}>📖 {session.topic}</Text>
                <Text style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{session.date}</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: T.green }}>{session.mins}m</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // ── COACH ──
  const renderCoach = () => (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 28, paddingBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '600', color: T.text }}>AI Coach 🤖</Text>
        <Text style={{ fontSize: 14, color: T.sub, marginTop: 4 }}>Remembers your conversation context</Text>
      </View>
      <ScrollView ref={chatScrollRef} style={{ flex: 1, paddingHorizontal: 28 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}>
        {messages.length === 0 && (
          <View style={[s.insightBig, { backgroundColor: T.greenLight, borderColor: T.green, marginBottom: 16 }]}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: T.green, letterSpacing: 0.8, marginBottom: 8 }}>TODAY'S INSIGHT</Text>
            <Text style={{ fontSize: 15, color: T.text, lineHeight: 22 }}>{insight}</Text>
          </View>
        )}
        {messages.length === 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['How can I build better habits?', 'I need motivation today', 'Review my week', 'Tips for consistency'].map(q => (
              <TouchableOpacity key={q} style={[s.pill, { borderColor: T.border }]}
                onPress={() => { setChat(q); }}>
                <Text style={{ fontSize: 13, color: T.sub }}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {messages.map((m, i) => (
          <View key={i} style={{ marginBottom: 12, alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'ai' && <Text style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>🤖 Coach</Text>}
            <View style={[s.bubble, { backgroundColor: m.role === 'user' ? T.green : T.card, borderColor: T.border, maxWidth: '70%' }]}>
              <Text style={{ fontSize: 15, color: m.role === 'user' ? '#fff' : T.text, lineHeight: 22 }}>{m.text}</Text>
            </View>
          </View>
        ))}
        {chatLoading && (
          <View style={{ alignItems: 'flex-start', marginBottom: 12 }}>
            <Text style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>🤖 Coach</Text>
            <View style={[s.bubble, { backgroundColor: T.card, borderColor: T.border }]}>
              <Text style={{ fontSize: 15, color: T.sub }}>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>
      <View style={[s.chatBar, { backgroundColor: T.card, borderTopColor: T.border }]}>
        <TextInput style={[s.chatIn, { backgroundColor: T.bg, color: T.text, borderColor: T.border }]}
          value={chat} onChangeText={setChat} placeholder="Ask your coach..."
          placeholderTextColor={T.sub} onSubmitEditing={sendChat} returnKeyType="send" />
        <TouchableOpacity style={[s.sendBtn, { backgroundColor: chatLoading ? T.sub : T.green }]} onPress={sendChat} disabled={chatLoading}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── SETTINGS ──
  const renderSettings = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 28, paddingBottom: 40 }}>
      <Text style={{ fontSize: 24, fontWeight: '600', color: T.text, marginBottom: 20 }}>Settings ⚙️</Text>
      <View style={[s.card, { backgroundColor: T.card, borderColor: T.border, marginBottom: 16 }]}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: T.text, marginBottom: 14 }}>🎨 Theme</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {(['light', 'dark'] as const).map(t => (
            <TouchableOpacity key={t} style={[s.pill, { flex: 1, justifyContent: 'center', borderColor: T.border }, theme === t && { backgroundColor: T.green, borderColor: T.green }]}
              onPress={() => { setTheme(t); localStorage.setItem('zenpath_theme', t); showToast(`${t === 'dark' ? '🌙' : '☀️'} ${t} mode!`); }}>
              <Text style={{ fontSize: 14, textAlign: 'center', color: theme === t ? '#fff' : T.sub }}>{t === 'light' ? '☀️ Light' : '🌙 Dark'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={[s.card, { backgroundColor: T.card, borderColor: T.border, marginBottom: 16 }]}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: T.text, marginBottom: 6 }}>⏱️ Focus Timer</Text>
        <Text style={{ fontSize: 13, color: T.sub, marginBottom: 14 }}>Current: {notifTime} minutes</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {[15, 20, 25, 30, 45, 60].map(t => (
            <TouchableOpacity key={t} style={[s.pill, { borderColor: T.border }, notifTime === t && { backgroundColor: T.green, borderColor: T.green }]}
              onPress={() => { setNotifTime(t); setTimer(t * 60); localStorage.setItem('zenpath_notif_time', String(t)); showToast(`⏱️ ${t} min`); }}>
              <Text style={{ fontSize: 13, color: notifTime === t ? '#fff' : T.sub }}>{t} min</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={[s.card, { backgroundColor: T.card, borderColor: T.border, marginBottom: 16 }]}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: T.text, marginBottom: 6 }}>🔔 Notifications</Text>
        <Text style={{ fontSize: 13, color: T.sub, marginBottom: 14 }}>Status: {'Notification' in window ? Notification.permission : 'not supported'}</Text>
        <TouchableOpacity style={[s.addBigBtn, { backgroundColor: T.green }]} onPress={requestNotifPermission}>
          <Text style={{ color: '#fff', fontWeight: '500' }}>{'Notification' in window && Notification.permission === 'granted' ? '✅ Enabled — 8 PM daily' : '🔔 Enable Reminders'}</Text>
        </TouchableOpacity>
      </View>
      <View style={[s.card, { backgroundColor: T.card, borderColor: T.border }]}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: T.text, marginBottom: 12 }}>👤 Profile</Text>
        {[`Logged in as: ${userName}`, `Total habits: ${habits.length}`, `Weekly completion: ${rate}%`, `Focus sessions: ${focusSessions.length}`, `Total focus: ${totalFocusMins} mins`, `Server: ${serverReady ? '🟢 Online' : '🟡 Waking up...'}`]
          .map((info, i) => <Text key={i} style={{ fontSize: 14, color: T.sub, marginBottom: 8 }}>{info}</Text>)}
        <TouchableOpacity style={[s.addBigBtn, { backgroundColor: '#888', marginTop: 4 }]} onPress={loadData}>
          <Text style={{ color: '#fff', fontWeight: '500' }}>🔄 Refresh Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ── MAIN ──
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: T.bg }}>
      {/* Sidebar */}
      <View style={[s.sidebar, { backgroundColor: T.sidebar, borderRightColor: T.border }]}>
        <View style={{ padding: 20, paddingBottom: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: T.green }}>🌿</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: T.text, marginTop: 4 }}>ZenPath</Text>
        </View>
        {NAV_ITEMS.map(item => (
          <TouchableOpacity key={item.id} style={[s.navBtn, activeTab === item.id && { backgroundColor: T.greenLight }]}
            onPress={() => setActiveTab(item.id)}>
            <Text style={{ fontSize: 18 }}>{item.icon}</Text>
            <Text style={{ fontSize: 13, fontWeight: activeTab === item.id ? '600' : '400', color: activeTab === item.id ? T.green : T.sub, marginTop: 4 }}>{item.label}</Text>
          </TouchableOpacity>
        ))}
        <View style={{ flex: 1 }} />
        <View style={{ padding: 16, borderTopWidth: 0.5, borderTopColor: T.border }}>
          <Text style={{ fontSize: 11, color: T.sub }} numberOfLines={1}>{userName}</Text>
          <Text style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{serverReady ? '🟢 Online' : '🟡 Loading...'}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        {toast ? <View style={s.toast}><Text style={s.toastText}>{toast}</Text></View> : null}
        {celebrating && <View style={s.celebration}><Text style={s.celebrationText}>🎉 All habits done! Amazing! 🎉</Text></View>}
        {activeTab === 'home'     && renderHome()}
        {activeTab === 'insights' && renderInsights()}
        {activeTab === 'focus'    && renderFocus()}
        {activeTab === 'coach'    && renderCoach()}
        {activeTab === 'settings' && renderSettings()}
      </View>

      {/* Add Habit Modal */}
      <Modal visible={showAddHabit} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { backgroundColor: T.card }]}>
            <Text style={{ fontSize: 20, fontWeight: '600', color: T.text, marginBottom: 20 }}>New Habit 🌱</Text>
            <TextInput style={[s.inp, { color: T.text, borderColor: T.border }]} placeholder="Habit name" placeholderTextColor={T.sub} value={newHabitName} onChangeText={setNewHabitName} />
            <TextInput style={[s.inp, { color: T.text, borderColor: T.border }]} placeholder="Description (optional)" placeholderTextColor={T.sub} value={newHabitDesc} onChangeText={setNewHabitDesc} />
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}>Daily Target</Text>
                <TextInput style={[s.inp, { color: T.text, borderColor: T.border, textAlign: 'center', fontSize: 18, fontWeight: '500' }]} value={dailyTarget} onChangeText={setDailyTarget} keyboardType="numeric" />
                <Text style={{ fontSize: 11, color: T.sub, textAlign: 'center', marginTop: 4 }}>times/day</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}>Weekly Target</Text>
                <TextInput style={[s.inp, { color: T.text, borderColor: T.border, textAlign: 'center', fontSize: 18, fontWeight: '500' }]} value={weeklyTarget} onChangeText={setWeeklyTarget} keyboardType="numeric" />
                <Text style={{ fontSize: 11, color: T.sub, textAlign: 'center', marginTop: 4 }}>days/week</Text>
              </View>
            </View>
            <TouchableOpacity style={[s.addBigBtn, { backgroundColor: T.green }, adding && { opacity: 0.7 }]} onPress={addHabit} disabled={adding}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>{adding ? '⏳ Adding...' : 'Add Habit'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ alignItems: 'center', padding: 12 }} onPress={() => setShowAddHabit(false)}>
              <Text style={{ color: T.sub, fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  sidebar: { width: 90, borderRightWidth: 0.5, alignItems: 'center' },
  navBtn: { width: '100%', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, borderRadius: 0 },
  toast: { position: 'absolute', top: 16, right: 16, backgroundColor: '#2d5a27', borderRadius: 10, padding: 12, zIndex: 999 },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  celebration: { backgroundColor: '#4a8f3f', padding: 14, alignItems: 'center', zIndex: 998 },
  celebrationText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  statBig: { flex: 1, borderRadius: 14, padding: 16, borderWidth: 0.5, alignItems: 'center' },
  card: { borderRadius: 14, padding: 18, borderWidth: 0.5, marginBottom: 14 },
  insightBig: { borderRadius: 14, padding: 18, borderWidth: 1, marginBottom: 20 },
  addBigBtn: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center' },
  outlineBtn: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, alignItems: 'center' },
  pill: { borderWidth: 1, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
  dayDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  habitBig: { borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14 },
  habitIconBox: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  habitProgress: { height: 4, borderRadius: 2 },
  checkBig: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  timerRing: { width: 200, height: 200, borderRadius: 100, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  topicInput: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 14 },
  bubble: { borderRadius: 14, padding: 14, borderWidth: 0.5 },
  chatBar: { flexDirection: 'row', padding: 16, gap: 10, borderTopWidth: 0.5 },
  chatIn: { flex: 1, borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 14 },
  sendBtn: { borderRadius: 10, paddingHorizontal: 20, justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: 420, borderRadius: 20, padding: 28 },
  inp: { borderWidth: 1.5, borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 14 },
});