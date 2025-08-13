/**
 * Authentication Navigator
 * 
 * SAFETY CRITICAL: Handles unauthenticated user flow
 * Ensures proper onboarding for dietary restriction setup
 */

import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AuthStackParamList } from '../types/navigation.types'

// Import auth screens
import { WelcomeScreen } from '../screens/auth/WelcomeScreen'
import { LoginScreen } from '../screens/auth/LoginScreen'
import { RegisterScreen } from '../screens/auth/RegisterScreen'
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen'
import { OnboardingIntroScreen } from '../screens/auth/OnboardingIntroScreen'

// Import new onboarding screens
import { OnboardingWelcomeScreen } from '../screens/auth/OnboardingWelcomeScreen'
import { OnboardingBasicInfoScreen } from '../screens/auth/OnboardingBasicInfoScreen'
import { OnboardingRestrictionsScreen } from '../screens/auth/OnboardingRestrictionsScreen'
import { OnboardingSeverityScreen } from '../screens/auth/OnboardingSeverityScreen'
import { OnboardingEmergencyScreen } from '../screens/auth/OnboardingEmergencyScreen'
import { OnboardingCompletionScreen } from '../screens/auth/OnboardingCompletionScreen'

// Import onboarding context provider
import { OnboardingProvider } from '../contexts/OnboardingContext'

// Placeholder screens for remaining auth flow
import { PlaceholderScreen } from '../components/PlaceholderScreen'

const Stack = createNativeStackNavigator<AuthStackParamList>()

export const AuthNavigator: React.FC = () => {
  return (
    <OnboardingProvider>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen} 
          options={{
            gestureEnabled: false, // Prevent swipe back on welcome
          }}
        />
        
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            title: 'Sign In',
            headerShown: true,
            headerBackTitle: 'Back',
          }}
        />
        
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{
            title: 'Create Account',
            headerShown: true,
            headerBackTitle: 'Back',
          }}
        />
        
        <Stack.Screen 
          name="ForgotPassword" 
          component={ForgotPasswordScreen}
          options={{
            title: 'Reset Password',
            headerShown: true,
            headerBackTitle: 'Back',
          }}
        />
        
        <Stack.Screen 
          name="OnboardingIntro" 
          component={OnboardingIntroScreen}
          options={{
            gestureEnabled: false, // Prevent going back during onboarding
          }}
        />
        
        {/* New comprehensive onboarding flow */}
        <Stack.Screen 
          name="OnboardingWelcome" 
          component={OnboardingWelcomeScreen}
          options={{
            gestureEnabled: false, // Prevent going back during onboarding
            headerShown: false,
          }}
        />
        
        <Stack.Screen 
          name="OnboardingBasicInfo" 
          component={OnboardingBasicInfoScreen}
          options={{
            gestureEnabled: false,
            headerShown: false,
          }}
        />
        
        <Stack.Screen 
          name="OnboardingRestrictions" 
          component={OnboardingRestrictionsScreen}
          options={{
            gestureEnabled: false,
            headerShown: false,
          }}
        />
        
        <Stack.Screen 
          name="OnboardingSeverity" 
          component={OnboardingSeverityScreen}
          options={{
            gestureEnabled: false,
            headerShown: false,
          }}
        />
        
        <Stack.Screen 
          name="OnboardingEmergency" 
          component={OnboardingEmergencyScreen}
          options={{
            gestureEnabled: false,
            headerShown: false,
          }}
        />
        
        <Stack.Screen 
          name="OnboardingCompletion" 
          component={OnboardingCompletionScreen}
          options={{
            gestureEnabled: false,
            headerShown: false,
          }}
        />
        
        {/* Legacy onboarding screen - keeping for backward compatibility */}
        <Stack.Screen 
          name="OnboardingComplete" 
          component={PlaceholderScreen}
          initialParams={{ title: 'Setup Complete' }}
          options={{
            gestureEnabled: false,
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </OnboardingProvider>
  )
}