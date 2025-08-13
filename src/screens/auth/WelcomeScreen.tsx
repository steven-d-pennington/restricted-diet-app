/**
 * Welcome Screen - First screen users see
 * 
 * SAFETY CRITICAL: Clear introduction to dietary restriction management
 * Sets proper expectations for life-critical safety features
 */

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import { AuthStackScreenProps } from '../../types/navigation.types'

type Props = AuthStackScreenProps<'Welcome'>

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const handleGetStarted = () => {
    navigation.navigate('Register')
  }

  const handleSignIn = () => {
    navigation.navigate('Login')
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Restricted Diet</Text>
          <Text style={styles.subtitle}>Safe Food, Peace of Mind</Text>
        </View>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🛡️</Text>
            <Text style={styles.featureText}>
              Safety-first product scanning for dietary restrictions
            </Text>
          </View>
          
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📱</Text>
            <Text style={styles.featureText}>
              Instant barcode scanning and ingredient analysis
            </Text>
          </View>
          
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🆘</Text>
            <Text style={styles.featureText}>
              Emergency cards for critical allergy information
            </Text>
          </View>
          
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.featureText}>
              Family management and shared safety profiles
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleGetStarted}
            accessibilityLabel="Get started with new account"
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleSignIn}
            accessibilityLabel="Sign in to existing account"
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
  },
  features: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  actions: {
    paddingBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#E53E3E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E53E3E',
  },
  secondaryButtonText: {
    color: '#E53E3E',
    fontSize: 18,
    fontWeight: '600',
  },
})