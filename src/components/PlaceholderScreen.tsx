/**
 * Placeholder Screen Component
 * 
 * Temporary component for screens that will be implemented later
 * Provides consistent UI structure during development
 */

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'

interface PlaceholderScreenProps {
  title?: string
  description?: string
  showBackButton?: boolean
}

export const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({
  title = 'Coming Soon',
  description = 'This screen is under development and will be available in a future update.',
  showBackButton = true,
}) => {
  const navigation = useNavigation()
  const route = useRoute()
  
  // Get title from route params if available
  const screenTitle = (route.params as any)?.title || title

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.main}>
          <Text style={styles.icon}>🚧</Text>
          <Text style={styles.title}>{screenTitle}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        
        {showBackButton && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleGoBack}
            accessibilityLabel="Go back to previous screen"
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        )}
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
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  backButton: {
    backgroundColor: '#E53E3E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
})