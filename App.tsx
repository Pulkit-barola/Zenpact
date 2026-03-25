import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { View } from 'react-native';
import Dashboard from './src/screens/Dashboard';
import Login from './src/screens/Login';
import { auth } from './src/firebase';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  const handleLogin = () => {
    const user = auth.currentUser;
    const name = user?.displayName || user?.email?.split('@')[0] || 'Friend';
    setUserName(name);
    setLoggedIn(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      {loggedIn ? (
        <Dashboard userName={userName} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </View>
  );
}