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
  light: { bg: '#f5f0e8', card: '#fff', text: '#2d2d2d', sub: '#999', border: '#e0dbd0', header: '#f5f0e8', green: '#2d5a27' },
  dark:  { bg: '#121212', card: '#1e1e1e', text: '#f0f0f0', sub: '#777', border: '#333', header: '#1a1a1a', green: '#4a8f3f' },
};

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
  const interval = useRef<any>(null);
  const chatScrollRef = useRef<any>(null);
  const T = THEMES[theme];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const playAlarm = () => {
    try {
      const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      [0, 0.4, 0.8].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.5);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.5);
      });
    } catch (e) {}
  };

  const saveSession = (minsOverride?: number) => {
    const minsSpent = minsOverride ?? (notifTime - Math.floor(timer / 60));
    if (minsSpent < 1) return;
    const newSession = {
      topic: focusTopic || 'Focus Session',
      mins: minsSpent,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
    };
    setFocusSessions(prev => {
      const updated = [...prev, newSession];
      localStorage.setItem('zenpath_sessions', JSON.stringify(updated));
      return updated;
    });
    setTimer(notifTime * 60);
    setRunning(false);
    showToast(`💾 ${minsSpent} min session saved!`);
  };

  const getGraphData = () => {
    const now = Date.now();
    const day = 86400000;
    if (graphPeriod === 'Today') {
      return Array.from({ length: 6 }, (_, i) => {
        const start = new Date(); start.setHours(i * 4, 0, 0, 0);
        const sessions = focusSessions.filter(s => s.timestamp >= start.getTime() && s.timestamp < start.getTime() + 4 * 3600000);
        return { label: `${i * 4}h`, mins: sessions.reduce((a, s) => a + s.mins, 0) };
      });
    }
    if (graphPeriod === 'Week') {
      return ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => {
        const start = now - (6 - i) * day;
        const sessions = focusSessions.filter(s => s.timestamp >= start && s.timestamp < start + day);
        return { label, mins: sessions.reduce((a, s) => a + s.mins, 0) };
      });
    }
    if (graphPeriod === 'Month') {
      return Array.from({ length: 4 }, (_, i) => {
        const start = now - (3 - i) * 7 * day;
        const sessions = focusSessions.filter(s => s.timestamp >= start && s.timestamp < start + 7 * day);
        return { label: `W${i + 1}`, mins: sessions.reduce((a, s) => a + s.mins, 0) };
      });
    }
    if (graphPeriod === '3 Months') {
      return Array.from({ length: 3 }, (_, i) => {
        const start = now - (2 - i) * 30 * day;
        const sessions = focusSessions.filter(s => s.timestamp >= start && s.timestamp < start + 30 * day);
        return { label: `M${i + 1}`, mins: sessions.reduce((a, s) => a + s.mins, 0) };
      });
    }
    return Array.from({ length: 6 }, (_, i) => {
      const start = now - (5 - i) * 30 * day;
      const sessions = focusSessions.filter(s => s.timestamp >= start && s.timestamp < start + 30 * day);
      return { label: `M${i + 1}`, mins: sessions.reduce((a, s) => a + s.mins, 0) };
    });
  };

  const scheduleReminder = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const reminderTime = new Date();
      reminderTime.setHours(20, 0, 0, 0);
      const delay = reminderTime.getTime() - Date.now();
      if (delay > 0) {
        setTimeout(() => {
          new Notification('ZenPath Reminder 🌿', { body: 'Time to log your habits! Keep your streak going! 🔥' });
        }, delay);
      }
    }
  };

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) { showToast('❌ Browser does not support notifications'); return; }
    if (Notification.permission === 'granted') { showToast('🔔 Already enabled!'); scheduleReminder(); return; }
    if (Notification.permission === 'denied') { showToast('❌ Blocked! Enable in browser settings 🔒'); return; }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      showToast('🔔 Notifications enabled! Reminder at 8 PM.');
      new Notification('ZenPath 🌿', { body: 'Daily reminders enabled at 8 PM!' });
      scheduleReminder();
    }
  };

  const pingServer = () => fetch(`${HABITS_API}/`).catch(() => {});

  const loadData = () => {
    pingServer();
    fetch(`${HABITS_API}/habits`).then(r => r.json()).then(data => { setHabits(data); setServerReady(true); }).catch(() => {});
    fetch(`${HABITS_API}/analytics/week`).then(r => r.json()).then(setAnalytics).catch(() => {});
    fetch(`${HABITS_API}/ai/insight`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days_back: 7 })
    }).then(r => r.json()).then(d => setInsight(d.insight)).catch(() => {});
  };

  useEffect(() => {
    pingServer();
    setTimeout(loadData, 1000);
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
            setRunning(false);
            playAlarm();
            showToast('🎉 Session complete!');
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('ZenPath 🎯', { body: 'Focus session complete! Great work!' });
            }
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
    await fetch(`${HABITS_API}/habits/${id}/log`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 1, mood: 4 })
    });
    const newLogged = [...loggedToday, id];
    setLoggedToday(newLogged);
    loadData();
    showToast('✅ Logged! Keep it up!');
    if (newLogged.length === habits.length) {
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 4000);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('ZenPath 🎉', { body: 'All habits done today! Amazing!' });
      }
    }
  };

  const unlogHabit = (id: string) => {
    if ((window as any).confirm('Undo this habit check?')) {
      setLoggedToday(prev => prev.filter(h => h !== id));
      showToast('↩️ Undone!');
    }
  };

  const deleteHabit = (id: string, name: string) => {
    if ((window as any).confirm(`Delete "${name}" permanently?`)) {
      fetch(`${HABITS_API}/habits/${id}`, { method: 'DELETE' });
      setTimeout(() => loadData(), 500);
      showToast('🗑️ Deleted!');
    }
  };

  const addHabit = async () => {
    if (!newHabitName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`${HABITS_API}/habits`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newHabitName, description: newHabitDesc || '', target_value: parseInt(dailyTarget) || 1, unit: 'times' })
      });
      if (res.ok) {
        setNewHabitName(''); setNewHabitDesc(''); setDailyTarget('1'); setWeeklyTarget('5');
        setShowAddHabit(false); loadData(); showToast('🌱 Habit added!');
      } else { showToast('❌ Failed. Try again!'); }
    } catch { showToast('❌ Server error!'); }
    finally { setAdding(false); }
  };

  const sendChat = async () => {
    if (!chat.trim()) return;
    const userMsg = chat;
    const newMessages = [...messages, { role: 'user', text: userMsg }];
    setMessages(newMessages);
    setChat('');
    const history = newMessages.slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
    try {
      const res = await fetch(`${HABITS_API}/ai/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, conversation_history: history })
      });
      const d = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: d.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Could not reach coach. Check connection!' }]);
    }
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

  // ─── RENDER HOME ───
  const renderHome = () => (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg }} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={[s.header, { backgroundColor: T.header }]}>
        <View>
          <Text style={[s.dateText, { color: T.sub }]}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</Text>
          <Text style={[s.greeting, { color: T.text }]}>Good morning,</Text>
          <Text style={[s.userName, { color: T.green }]}>{userName} 🌿</Text>
        </View>
        <View style={s.scoreBox}>
          <Text style={[s.scoreNum, { color: T.text }]}>{loggedToday.length}<Text style={[s.scoreTotal, { color: T.sub }]}>/{habits.length}</Text></Text>
          <Text style={[s.scoreLabel, { color: T.sub }]}>done today</Text>
        </View>
      </View>

      {!serverReady && (
        <View style={s.serverBanner}>
          <Text style={s.serverBannerText}>⏳ Server waking up... 20-30 sec</Text>
        </View>
      )}

      <View style={[s.streakCard, { backgroundColor: T.card }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={[s.streakText, { color: T.text }]}>🔥 {totalLogs} total logs</Text>
          <TouchableOpacity onPress={requestNotifPermission}>
            <Text style={{ fontSize: 20 }}>{'Notification' in window && Notification.permission === 'granted' ? '🔔' : '🔕'}</Text>
          </TouchableOpacity>
        </View>
        <View style={s.daysRow}>
          {DAYS.map((d, i) => (
            <View key={i} style={[s.dayCircle, { backgroundColor: T.border }, i < dayIndex && s.dayDone, i === dayIndex && { backgroundColor: T.green }]}>
              <Text style={[s.dayLabel, { color: T.sub }, i <= dayIndex && { color: '#fff' }]}>{d}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: T.sub }]}>TODAY'S HABITS</Text>
          <TouchableOpacity style={[s.addHabitBtn, { backgroundColor: T.green }]} onPress={() => setShowAddHabit(true)}>
            <Text style={s.addHabitBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {!serverReady && <Text style={[s.empty, { color: T.sub }]}>Loading habits...</Text>}
        {serverReady && habits.length === 0 && <Text style={[s.empty, { color: T.sub }]}>No habits yet — tap "+ Add"!</Text>}

        {habits.map((h) => {
          const done = loggedToday.includes(h.id);
          const stat = weeklyStats.find((w: any) => w.habit_id === h.id);
          return (
            <TouchableOpacity key={h.id} style={[s.habitCard, { backgroundColor: T.card }, done && { opacity: 0.75 }]}
              onPress={() => !done && logHabit(h.id)} onLongPress={() => deleteHabit(h.id, h.name)}>
              <View style={s.habitLeft}>
                <Text style={s.habitEmoji}>{getIcon(h.name)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.habitName, { color: T.text }, done && { textDecorationLine: 'line-through', color: T.sub }]}>{h.name}</Text>
                  <View style={[s.progressBar, { backgroundColor: T.border }]}>
                    <View style={[s.progressFill, { width: done ? '100%' : '0%', backgroundColor: done ? '#4a8f3f' : '#e8a838' }]} />
                  </View>
                  <Text style={[s.habitMeta, { color: T.sub }]}>🔥 {stat?.completions ?? 0} this week · hold to delete</Text>
                </View>
              </View>
              <TouchableOpacity style={[s.checkBtn, { borderColor: T.border }, done && s.checkBtnDone]}
                onPress={() => done ? unlogHabit(h.id) : logHabit(h.id)}>
                {done && <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>}
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  // ─── RENDER INSIGHTS ───
  const renderInsights = () => (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={[s.pageTitle, { color: T.text }]}>Insights 📊</Text>
      <View style={[s.insightCard, { backgroundColor: T.card }]}>
        <Text style={s.insightLabel}>AI COACH</Text>
        <Text style={[s.insightText, { color: T.text }]}>{insight}</Text>
      </View>
      <View style={s.statsRow}>
        {[{ n: habits.length, l: 'Habits' }, { n: `${rate}%`, l: 'This week' }, { n: `${totalLogs}🔥`, l: 'Total logs' }].map((item, i) => (
          <View key={i} style={[s.statCard, { backgroundColor: T.card }]}>
            <Text style={[s.statNum, { color: T.green }]}>{item.n}</Text>
            <Text style={[s.statLabel, { color: T.sub }]}>{item.l}</Text>
          </View>
        ))}
      </View>
      {weeklyStats.length === 0 && <Text style={[s.empty, { color: T.sub }]}>No data yet!</Text>}
      {weeklyStats.map((stat: any) => (
        <View key={stat.habit_id} style={[s.weeklyCard, { backgroundColor: T.card }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={[s.weeklyName, { color: T.text }]}>{stat.name}</Text>
            <Text style={[s.weeklyPercent]}>{stat.completion_rate}%</Text>
          </View>
          <View style={[s.progressBar, { backgroundColor: T.border }]}>
            <View style={[s.progressFill, { width: `${stat.completion_rate}%` as any, backgroundColor: '#4a8f3f' }]} />
          </View>
          <Text style={[s.weeklyMeta, { color: T.sub }]}>{stat.completions} / 7 days</Text>
        </View>
      ))}
    </ScrollView>
  );

  // ─── RENDER FOCUS ───
  const renderFocus = () => (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={[s.pageTitle, { color: T.text }]}>Focus Timer 🎯</Text>

      {/* Topic */}
      <View style={[s.weeklyCard, { backgroundColor: T.card, marginBottom: 16 }]}>
        <Text style={[s.sectionTitle, { color: T.sub, marginBottom: 8 }]}>WHAT ARE YOU WORKING ON?</Text>
        <TextInput
          style={[s.topicInput, { color: T.text, borderColor: T.border }]}
          value={focusTopic}
          onChangeText={setFocusTopic}
          placeholder="e.g. DSA, Math, Reading..."
          placeholderTextColor={T.sub}
        />
      </View>

      {/* Timer Circle */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={[s.timerCircle, { borderColor: running ? '#4a8f3f' : T.border }]}>
          <Text style={[s.timerText, { color: T.text }]}>{mins}:{secs}</Text>
          <Text style={[s.timerMode, { color: T.sub }]}>{timerMode === 'focus' ? 'FOCUS' : 'BREAK'}</Text>
          {focusTopic ? <Text style={{ fontSize: 11, color: '#4a8f3f', marginTop: 4 }} numberOfLines={1}>{focusTopic}</Text> : null}
        </View>
      </View>

      {/* Controls */}
      <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center', marginBottom: 12 }}>
        <TouchableOpacity style={[s.timerBtn, { backgroundColor: T.green }]} onPress={() => setRunning(r => !r)}>
          <Text style={s.timerBtnText}>{running ? '⏸ Pause' : '▶ Start'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.timerBtnOutline, { borderColor: T.border }]} onPress={() => { setRunning(false); setTimer(notifTime * 60); }}>
          <Text style={[s.timerBtnOutlineText, { color: T.text }]}>↺ Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.timerBtnOutline, { borderColor: '#4a8f3f' }]} onPress={() => saveSession()}>
          <Text style={{ color: '#4a8f3f', fontSize: 15 }}>💾 Save</Text>
        </TouchableOpacity>
      </View>

      {/* Mode Pills */}
      <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
        {(['focus', 'break'] as const).map(mode => (
          <TouchableOpacity key={mode} style={[s.modePill, { borderColor: T.border }, timerMode === mode && s.modePillActive]}
            onPress={() => { setTimerMode(mode); setTimer(mode === 'focus' ? notifTime * 60 : 5 * 60); setRunning(false); }}>
            <Text style={[s.modePillText, { color: T.sub }, timerMode === mode && { color: '#fff' }]}>
              {mode === 'focus' ? `${notifTime} Min Focus` : '5 Min Break'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Graph */}
      <Text style={[s.sectionTitle, { color: T.sub, marginBottom: 10 }]}>FOCUS SESSIONS</Text>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {['Today', 'Week', 'Month', '3 Months', '6 Months'].map(p => (
          <TouchableOpacity key={p} style={[s.modePill, { borderColor: T.border, paddingHorizontal: 10 }, graphPeriod === p && s.modePillActive]}
            onPress={() => setGraphPeriod(p)}>
            <Text style={[s.modePillText, { color: T.sub }, graphPeriod === p && { color: '#fff' }]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[s.weeklyCard, { backgroundColor: T.card, marginBottom: 16 }]}>
        {focusSessions.length === 0 ? (
          <Text style={[s.empty, { color: T.sub }]}>No sessions yet — start your first!</Text>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: 4, marginBottom: 8 }}>
              {graphData.map((item: any, i: number) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                  <View style={{
                    width: '100%',
                    height: Math.max(4, (item.mins / maxMins) * 80),
                    backgroundColor: '#4a8f3f',
                    borderRadius: 4,
                    opacity: item.mins > 0 ? 1 : 0.2,
                  }} />
                  <Text style={{ fontSize: 9, color: T.sub, marginTop: 4 }}>{item.label}</Text>
                </View>
              ))}
            </View>
            <Text style={{ fontSize: 12, color: T.sub, textAlign: 'center' }}>
              Total: {totalFocusMins} mins · {focusSessions.length} sessions
            </Text>
          </>
        )}
      </View>

      {/* Recent Sessions */}
      {focusSessions.length > 0 && (
        <>
          <Text style={[s.sectionTitle, { color: T.sub, marginBottom: 10 }]}>RECENT SESSIONS</Text>
          {[...focusSessions].reverse().slice(0, 5).map((session: any, i: number) => (
            <View key={i} style={[s.weeklyCard, { backgroundColor: T.card, marginBottom: 8 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[s.weeklyName, { color: T.text }]}>📖 {session.topic}</Text>
                <Text style={{ color: '#4a8f3f', fontWeight: '500' }}>{session.mins} min</Text>
              </View>
              <Text style={[s.weeklyMeta, { color: T.sub }]}>{session.date}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );

  // ─── RENDER COACH ───
  const renderCoach = () => (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <Text style={[s.pageTitle, { color: T.text, padding: 20, paddingBottom: 8 }]}>AI Coach 🤖</Text>
      <ScrollView ref={chatScrollRef} style={{ flex: 1, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}>
        {messages.length === 0 && (
          <>
            <View style={[s.insightCard, { backgroundColor: T.card }]}>
              <Text style={s.insightLabel}>TODAY'S INSIGHT</Text>
              <Text style={[s.insightText, { color: T.text }]}>{insight}</Text>
            </View>
            <Text style={[s.empty, { color: T.sub }]}>Ask your coach anything — habits, motivation, goals!</Text>
          </>
        )}
        {messages.map((m, i) => (
          <View key={i} style={[s.chatBubble, m.role === 'user' ? { backgroundColor: T.green, alignSelf: 'flex-end' } : { backgroundColor: T.card, alignSelf: 'flex-start' }]}>
            <Text style={[s.chatText, { color: m.role === 'user' ? '#fff' : T.text }]}>{m.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={[s.chatInputRow, { backgroundColor: T.bg, borderTopColor: T.border }]}>
        <TextInput style={[s.chatInput, { backgroundColor: T.card, color: T.text, borderColor: T.border }]}
          value={chat} onChangeText={setChat} placeholder="Ask your coach..."
          placeholderTextColor={T.sub} onSubmitEditing={sendChat} returnKeyType="send" />
        <TouchableOpacity style={[s.chatSendBtn, { backgroundColor: T.green }]} onPress={sendChat}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── RENDER SETTINGS ───
  const renderSettings = () => (
    <ScrollView style={{ flex: 1, backgroundColor: T.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={[s.pageTitle, { color: T.text }]}>Settings ⚙️</Text>

      {/* Theme */}
      <View style={[s.settingsCard, { backgroundColor: T.card }]}>
        <Text style={[s.settingsTitle, { color: T.text }]}>🎨 Theme</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {(['light', 'dark'] as const).map(t => (
            <TouchableOpacity key={t} style={[s.modePill, { flex: 1, justifyContent: 'center', borderColor: T.border }, theme === t && s.modePillActive]}
              onPress={() => { setTheme(t); localStorage.setItem('zenpath_theme', t); showToast(`${t === 'dark' ? '🌙 Dark' : '☀️ Light'} mode!`); }}>
              <Text style={[s.modePillText, { color: T.sub, textAlign: 'center' }, theme === t && { color: '#fff' }]}>
                {t === 'light' ? '☀️ Light' : '🌙 Dark'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Focus Timer Duration */}
      <View style={[s.settingsCard, { backgroundColor: T.card }]}>
        <Text style={[s.settingsTitle, { color: T.text }]}>⏱️ Focus Timer</Text>
        <Text style={[s.settingsInfo, { color: T.sub }]}>Current: {notifTime} minutes</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {[15, 20, 25, 30, 45, 60].map(t => (
            <TouchableOpacity key={t} style={[s.modePill, { borderColor: T.border }, notifTime === t && s.modePillActive]}
              onPress={() => { setNotifTime(t); setTimer(t * 60); localStorage.setItem('zenpath_notif_time', String(t)); showToast(`⏱️ Timer: ${t} min`); }}>
              <Text style={[s.modePillText, { color: T.sub }, notifTime === t && { color: '#fff' }]}>{t} min</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notifications */}
      <View style={[s.settingsCard, { backgroundColor: T.card }]}>
        <Text style={[s.settingsTitle, { color: T.text }]}>🔔 Notifications</Text>
        <Text style={[s.settingsInfo, { color: T.sub }]}>Status: {'Notification' in window ? Notification.permission : 'not supported'}</Text>
        <TouchableOpacity style={[s.settingsBtn, { backgroundColor: T.green }]} onPress={requestNotifPermission}>
          <Text style={s.settingsBtnText}>
            {'Notification' in window && Notification.permission === 'granted' ? '✅ Enabled — 8 PM daily' : '🔔 Enable Reminders'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile */}
      <View style={[s.settingsCard, { backgroundColor: T.card }]}>
        <Text style={[s.settingsTitle, { color: T.text }]}>👤 Profile</Text>
        {[
          `Logged in as: ${userName}`,
          `Total habits: ${habits.length}`,
          `Weekly completion: ${rate}%`,
          `Focus sessions: ${focusSessions.length}`,
          `Total focus time: ${totalFocusMins} mins`,
          `Server: ${serverReady ? '🟢 Online' : '🟡 Waking up...'}`,
        ].map((info, i) => <Text key={i} style={[s.settingsInfo, { color: T.sub }]}>{info}</Text>)}
        <TouchableOpacity style={[s.settingsBtn, { backgroundColor: '#888', marginTop: 8 }]} onPress={loadData}>
          <Text style={s.settingsBtnText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ─── MAIN RENDER ───
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {toast ? <View style={s.toast}><Text style={s.toastText}>{toast}</Text></View> : null}
      {celebrating && <View style={s.celebration}><Text style={s.celebrationText}>🎉 All habits done today! Amazing! 🎉</Text></View>}

      {activeTab === 'home' && renderHome()}
      {activeTab === 'insights' && renderInsights()}
      {activeTab === 'focus' && renderFocus()}
      {activeTab === 'coach' && renderCoach()}
      {activeTab === 'settings' && renderSettings()}

      {/* Bottom Nav */}
      <View style={[s.bottomNav, { backgroundColor: T.card, borderTopColor: T.border }]}>
        {[
          { id: 'home', icon: '🏠', label: 'Home' },
          { id: 'insights', icon: '📊', label: 'Insights' },
          { id: 'focus', icon: '🎯', label: 'Focus' },
          { id: 'coach', icon: '🤖', label: 'Coach' },
          { id: 'settings', icon: '⚙️', label: 'Settings' },
        ].map(tab => (
          <TouchableOpacity key={tab.id} style={s.navItem} onPress={() => setActiveTab(tab.id)}>
            <Text style={[s.navIcon, activeTab === tab.id && { opacity: 1 }]}>{tab.icon}</Text>
            <Text style={[s.navLabel, { color: T.sub }, activeTab === tab.id && { color: T.green, fontWeight: '500' }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Habit Modal */}
      <Modal visible={showAddHabit} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { backgroundColor: T.card }]}>
            <Text style={[s.modalTitle, { color: T.text }]}>New Habit 🌱</Text>
            <TextInput style={[s.input, { color: T.text, borderColor: T.border }]} placeholder="Habit name" placeholderTextColor={T.sub} value={newHabitName} onChangeText={setNewHabitName} />
            <TextInput style={[s.input, { color: T.text, borderColor: T.border }]} placeholder="Description (optional)" placeholderTextColor={T.sub} value={newHabitDesc} onChangeText={setNewHabitDesc} />
            <View style={s.targetRow}>
              <View style={[s.targetBox, { backgroundColor: T.bg }]}>
                <Text style={[s.targetLabel, { color: T.sub }]}>Daily Target</Text>
                <TextInput style={[s.targetInput, { color: T.green, borderColor: T.border }]} value={dailyTarget} onChangeText={setDailyTarget} keyboardType="numeric" placeholder="1" placeholderTextColor={T.sub} />
                <Text style={[s.targetUnit, { color: T.sub }]}>times/day</Text>
              </View>
              <View style={[s.targetBox, { backgroundColor: T.bg }]}>
                <Text style={[s.targetLabel, { color: T.sub }]}>Weekly Target</Text>
                <TextInput style={[s.targetInput, { color: T.green, borderColor: T.border }]} value={weeklyTarget} onChangeText={setWeeklyTarget} keyboardType="numeric" placeholder="5" placeholderTextColor={T.sub} />
                <Text style={[s.targetUnit, { color: T.sub }]}>days/week</Text>
              </View>
            </View>
            <TouchableOpacity style={[s.sendBtn, { backgroundColor: T.green }, adding && { opacity: 0.7 }]} onPress={addHabit} disabled={adding}>
              <Text style={s.sendBtnText}>{adding ? '⏳ Adding...' : 'Add Habit'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowAddHabit(false)}>
              <Text style={[s.cancelText, { color: T.sub }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  toast: { position: 'absolute', top: 50, left: 20, right: 20, backgroundColor: '#2d5a27', borderRadius: 12, padding: 14, zIndex: 999, alignItems: 'center' },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  celebration: { backgroundColor: '#4a8f3f', padding: 16, alignItems: 'center', zIndex: 998 },
  celebrationText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  serverBanner: { backgroundColor: '#fff8e1', marginHorizontal: 16, borderRadius: 10, padding: 10, marginBottom: 8 },
  serverBannerText: { color: '#b8860b', fontSize: 13, textAlign: 'center' },
  header: { padding: 24, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dateText: { fontSize: 11, letterSpacing: 0.5, marginBottom: 4 },
  greeting: { fontSize: 22 },
  userName: { fontSize: 26, fontWeight: '600' },
  scoreBox: { alignItems: 'flex-end' },
  scoreNum: { fontSize: 32, fontWeight: '600' },
  scoreTotal: { fontSize: 18 },
  scoreLabel: { fontSize: 12 },
  streakCard: { marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16 },
  streakText: { fontSize: 16, fontWeight: '500' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  dayDone: { backgroundColor: '#4a8f3f' },
  dayLabel: { fontSize: 12, fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8 },
  addHabitBtn: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 },
  addHabitBtnText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  habitCard: { borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  habitLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  habitEmoji: { fontSize: 28 },
  habitName: { fontSize: 15, fontWeight: '500', marginBottom: 6 },
  progressBar: { height: 4, borderRadius: 2, marginBottom: 4 },
  progressFill: { height: 4, borderRadius: 2 },
  habitMeta: { fontSize: 11 },
  checkBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  checkBtnDone: { backgroundColor: '#4a8f3f', borderColor: '#4a8f3f' },
  empty: { fontSize: 14, textAlign: 'center', padding: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '500' },
  statLabel: { fontSize: 11, marginTop: 2 },
  pageTitle: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
  insightCard: { borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#4a8f3f' },
  insightLabel: { fontSize: 11, color: '#4a8f3f', fontWeight: '600', letterSpacing: 0.8, marginBottom: 8 },
  insightText: { fontSize: 14, lineHeight: 22 },
  weeklyCard: { borderRadius: 16, padding: 16, marginBottom: 10 },
  weeklyName: { fontSize: 14, fontWeight: '500' },
  weeklyPercent: { fontSize: 14, fontWeight: '500', color: '#4a8f3f' },
  weeklyMeta: { fontSize: 12, marginTop: 6 },
  topicInput: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 14 },
  timerCircle: { width: 200, height: 200, borderRadius: 100, borderWidth: 8, justifyContent: 'center', alignItems: 'center' },
  timerText: { fontSize: 42, fontWeight: '300' },
  timerMode: { fontSize: 12, letterSpacing: 1, marginTop: 4 },
  timerBtn: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28 },
  timerBtnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  timerBtnOutline: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20 },
  timerBtnOutlineText: { fontSize: 15 },
  modePill: { borderWidth: 1.5, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14 },
  modePillActive: { backgroundColor: '#4a8f3f', borderColor: '#4a8f3f' },
  modePillText: { fontSize: 13 },
  chatBubble: { borderRadius: 12, padding: 12, marginBottom: 10, maxWidth: '80%' },
  chatText: { fontSize: 14, lineHeight: 20 },
  chatInputRow: { flexDirection: 'row', padding: 16, gap: 10, paddingBottom: 90, borderTopWidth: 0.5 },
  chatInput: { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 12, fontSize: 14 },
  chatSendBtn: { borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
  settingsCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  settingsTitle: { fontSize: 16, fontWeight: '500', marginBottom: 12 },
  settingsBtn: { borderRadius: 10, padding: 12, alignItems: 'center' },
  settingsBtnText: { color: '#fff', fontWeight: '500' },
  settingsInfo: { fontSize: 14, marginBottom: 8 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingBottom: 20, paddingTop: 12, borderTopWidth: 0.5 },
  navItem: { flex: 1, alignItems: 'center' },
  navIcon: { fontSize: 22, marginBottom: 2, opacity: 0.4 },
  navLabel: { fontSize: 11 },
  input: { borderWidth: 1.5, borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 14 },
  sendBtn: { borderRadius: 10, padding: 14, alignItems: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '500', fontSize: 15 },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelText: { fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: '600', marginBottom: 20 },
  targetRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  targetBox: { flex: 1, borderRadius: 12, padding: 12 },
  targetLabel: { fontSize: 12, marginBottom: 8 },
  targetInput: { borderWidth: 1.5, borderRadius: 8, padding: 10, fontSize: 18, fontWeight: '500', textAlign: 'center', marginBottom: 6 },
  targetUnit: { fontSize: 11, textAlign: 'center' },
});       