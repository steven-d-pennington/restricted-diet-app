import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src';
import { RootNavigator } from './src/navigation/RootNavigator';

// Import global CSS for NativeWind styling
// import './global.css';

/**
 * Main App Component with Navigation and Supabase Integration
 * 
 * SAFETY CRITICAL: This app manages life-threatening dietary restrictions
 * Provides complete navigation structure for authentication and main app flows
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
