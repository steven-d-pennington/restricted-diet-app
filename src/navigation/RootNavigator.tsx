/**
 * Root Navigator
 * 
 * SAFETY CRITICAL: Controls access to authenticated content
 * Ensures proper authentication flow before accessing medical information
 */

import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types/navigation.types'
import { useAuth } from '../contexts/AuthContext'

// Import navigators
import { AuthNavigator } from './AuthNavigator'
import { MainNavigator } from './MainNavigator'

// Import components
import { LoadingScreen } from '../components/LoadingScreen'

const Stack = createNativeStackNavigator<RootStackParamList>()

export const RootNavigator: React.FC = () => {
  const { user, loading, userProfile } = useAuth()

  // Show loading screen while checking authentication state
  if (loading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen 
          name="Loading" 
          component={LoadingScreen} 
        />
      </Stack.Navigator>
    )
  }

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: false, // Prevent gesture navigation between auth states
      }}
    >
      {user ? (
        // User is authenticated - show main app
        <Stack.Screen 
          name="MainStack" 
          component={MainNavigator}
          options={{
            animationTypeForReplace: 'push', // Smooth transition to main app
          }}
        />
      ) : (
        // User is not authenticated - show auth flow
        <Stack.Screen 
          name="AuthStack" 
          component={AuthNavigator}
          options={{
            animationTypeForReplace: 'pop', // Smooth transition to auth
          }}
        />
      )}
    </Stack.Navigator>
  )
}