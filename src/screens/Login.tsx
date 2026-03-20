import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/user-not-found': return 'Account not found! Please Sign Up first.';
      case 'auth/wrong-password': return 'Wrong password! Please try again.';
      case 'auth/email-already-in-use': return 'Email already registered! Please Login.';
      case 'auth/weak-password': return 'Password must be at least 6 characters!';
      case 'auth/invalid-email': return 'Please enter a valid email address!';
      case 'auth/invalid-credential': return 'Invalid email or password!';
      default: return 'Something went wrong! Please try again.';
    }
  };

  const handleAuth = async () => {
    if (!email || !password) { setError('Please enter email and password!'); return; }
    setLoading(true); setError('');
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (e: any) {
      setError(getErrorMessage(e.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (e: any) {
      setError('Google sign in failed! Please try again.');
    }
  };

  return (
    <View style={s.container}>
      <View style={s.logoBox}>
        <Text style={s.logoEmoji}>🌿</Text>
      </View>
      <Text style={s.title}>ZenPath</Text>
      <Text style={s.subtitle}>Build better habits, every day</Text>

      <View style={s.card}>
        <Text style={s.cardTitle}>{isSignup ? 'Create Account' : 'Welcome back'}</Text>

        {error ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        <TextInput
          style={s.input}
          placeholder="✉  Email address"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={(t) => { setEmail(t); setError(''); }}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={s.input}
          placeholder="🔒  Password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={(t) => { setPassword(t); setError(''); }}
          secureTextEntry
        />

        <TouchableOpacity style={s.btn} onPress={handleAuth}>
          <Text style={s.btnText}>
            {loading ? 'Loading...' : isSignup ? 'Create Account' : 'Login to ZenPath'}
          </Text>
        </TouchableOpacity>

        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>or</Text>
          <View style={s.dividerLine} />
        </View>

        <TouchableOpacity style={s.googleBtn} onPress={handleGoogle}>
          <Text style={s.googleText}>🔵  Sign in with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setIsSignup(p => !p); setError(''); }} style={s.switchBtn}>
          <Text style={s.switchText}>
            {isSignup ? 'Already have account? Login →' : "Don't have account? Sign Up →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2d5a27', justifyContent: 'center', alignItems: 'center', padding: 24 },
  logoBox: { width: 72, height: 72, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoEmoji: { fontSize: 36 },
  title: { fontSize: 32, fontWeight: '600', color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 32 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400 },
  cardTitle: { fontSize: 18, fontWeight: '500', color: '#1a3a16', marginBottom: 20, textAlign: 'center' },
  errorBox: { backgroundColor: '#fff8f8', borderRadius: 10, padding: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#e24b4a' },
  errorText: { color: '#a32d2d', fontSize: 13 },
  input: { borderWidth: 1.5, borderColor: '#e8e4d9', borderRadius: 12, padding: 14, marginBottom: 14, fontSize: 15, color: '#1a3a16', backgroundColor: '#fafaf8' },
  btn: { backgroundColor: '#2d5a27', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e8e4d9' },
  dividerText: { color: '#aaa', fontSize: 12, marginHorizontal: 10 },
  googleBtn: { borderWidth: 1.5, borderColor: '#e8e4d9', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  googleText: { fontSize: 15, color: '#3a3a2e', fontWeight: '500' },
  switchBtn: { alignItems: 'center', padding: 8 },
  switchText: { color: '#6b8f5e', fontSize: 14 },
});