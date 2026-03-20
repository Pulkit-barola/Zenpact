import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  const auth = getAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email aur password dono bharo!');
      return;
    }
    setLoading(true);
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.logo}>🌿</Text>
      <Text style={s.title}>ZenPath</Text>
      <Text style={s.subtitle}>Your AI habit coach</Text>

      <View style={s.card}>
        <TextInput
          style={s.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={s.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={s.btn} onPress={handleAuth}>
          <Text style={s.btnText}>
            {loading ? 'Loading...' : isSignup ? 'Sign Up' : 'Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignup(s => !s)} style={s.switchBtn}>
          <Text style={s.switchText}>
            {isSignup ? 'Already have account? Login' : "Don't have account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f0e8', justifyContent: 'center', alignItems: 'center', padding: 24 },
  logo: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 36, fontWeight: '600', color: '#3a3a2e', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  input: { borderWidth: 1, borderColor: '#e0dbd0', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 15, color: '#3a3a2e' },
  btn: { backgroundColor: '#6b8f5e', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  switchBtn: { alignItems: 'center', padding: 8 },
  switchText: { color: '#6b8f5e', fontSize: 14 },
});