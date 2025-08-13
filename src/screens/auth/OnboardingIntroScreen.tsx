/**
 * Onboarding Introduction Screen
 * 
 * SAFETY CRITICAL: Sets expectations for dietary restriction setup
 * Emphasizes the medical importance of accurate information
 */

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import { AuthStackScreenProps } from '../../types/navigation.types'

type Props = AuthStackScreenProps<'OnboardingIntro'>

export const OnboardingIntroScreen: React.FC<Props> = ({ navigation }) => {
  const handleContinue = () => {
    // Navigate to the new comprehensive onboarding flow
    navigation.navigate('OnboardingWelcome')
  }

  const handleQuickSetup = () => {
    // Navigate directly to restrictions for users who want minimal setup
    navigation.navigate('OnboardingRestrictions')
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🛡️</Text>
          <Text style={styles.title}>Welcome to Restricted Diet</Text>
          <Text style={styles.subtitle}>
            Let's set up your safety profile to keep you protected
          </Text>
        </View>

        <View style={styles.steps}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Dietary Restrictions</Text>
              <Text style={styles.stepDescription}>
                Tell us about your allergies, intolerances, and dietary preferences
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Emergency Information</Text>
              <Text style={styles.stepDescription}>
                Create emergency cards with critical medical information
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Start Scanning</Text>
              <Text style={styles.stepDescription}>
                Begin safely scanning products with confidence
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.important}>
          <Text style={styles.importantIcon}>⚠️</Text>
          <Text style={styles.importantText}>
            <Text style={styles.importantBold}>Important:</Text> Please provide accurate 
            information about your dietary restrictions. This app is designed to help 
            identify potentially harmful ingredients, but should not replace medical advice.
          </Text>
        </View>

        <View>
          <TouchableOpacity 
            style={styles.continueButton} 
            onPress={handleContinue}
            accessibilityLabel="Start comprehensive safety profile setup"
          >
            <Text style={styles.continueButtonText}>Complete Safety Setup</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickButton} 
            onPress={handleQuickSetup}
            accessibilityLabel="Quick setup with basic restrictions only"
          >
            <Text style={styles.quickButtonText}>Quick Setup</Text>
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
    marginTop: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 26,
  },
  steps: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E53E3E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
  },
  important: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  importantIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  importantText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  importantBold: {
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#E53E3E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  quickButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E53E3E',
    alignItems: 'center',
    marginTop: 12,
  },
  quickButtonText: {
    color: '#E53E3E',
    fontSize: 16,
    fontWeight: '600',
  },
})