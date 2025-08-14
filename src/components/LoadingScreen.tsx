/**
 * Loading Screen Component
 * 
 * SAFETY CRITICAL: Proper loading states prevent user confusion
 * while authentication and safety data is being processed
 */

import React from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'

interface LoadingScreenProps {
  message?: string
  title?: string
  subtitle?: string
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message,
  title,
  subtitle,
}) => {
  const finalTitle = title || 'Loading'
  const finalMessage = message || subtitle || 'Loading your safety profile...'
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>🛡️</Text>
        <Text style={styles.appName}>{finalTitle}</Text>
        <ActivityIndicator 
          size="large" 
          color="#E53E3E" 
          style={styles.spinner}
        />
  <Text style={styles.message}>{finalMessage}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 40,
  },
  spinner: {
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
})