import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

/**
 * Simplified App Component for Testing
 */
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restricted Diet App</Text>
      <Text style={styles.subtitle}>Phase 1 & 2 Complete! 🎉</Text>
      <Text style={styles.features}>Features Ready:</Text>
      <Text style={styles.feature}>• User Authentication & Profiles</Text>
      <Text style={styles.feature}>• Barcode Scanning & Safety Analysis</Text>
      <Text style={styles.feature}>• Emergency Information Cards</Text>
      <Text style={styles.feature}>• Restaurant Search & Discovery</Text>
      <Text style={styles.feature}>• Community Reviews & Safety Assessment</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2563eb',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    color: '#059669',
  },
  features: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151',
  },
  feature: {
    fontSize: 14,
    marginBottom: 5,
    color: '#6b7280',
  },
});