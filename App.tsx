import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import Dashboard from './src/screens/Dashboard';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Dashboard />
    </View>
  );
}