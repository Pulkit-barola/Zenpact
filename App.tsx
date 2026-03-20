import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { View } from 'react-native';
import Dashboard from './src/screens/Dashboard';
import Login from './src/screens/Login';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      {loggedIn ? (
        <Dashboard />
      ) : (
        <Login onLogin={() => setLoggedIn(true)} />
      )}
    </View>
  );
}