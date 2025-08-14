/**
 * Register Screen - New user account creation
 * 
 * SAFETY CRITICAL: Proper validation for creating medical information accounts
 * Ensures secure account setup before onboarding dietary restrictions
 */

import React, { useState } from 'react'
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native'
import { AuthStackScreenProps } from '../../types/navigation.types'
import { useAuth } from '../../contexts/AuthContext'

type Props = AuthStackScreenProps<'Register'>

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { signUp, loading } = useAuth()
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const { fullName, email, password, confirmPassword } = formData
    
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name')
      return false
    }
    
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address')
      return false
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address')
      return false
    }
    
    if (password.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters long')
      return false
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match')
      return false
    }
    
    return true
  }

  const handleSignUp = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
  const result = await signUp(
        formData.email.trim().toLowerCase(), 
        formData.password,
        {
          full_name: formData.fullName.trim(),
          account_type: 'individual'
        }
      )
      
  if (result.error) {
        Alert.alert(
          'Registration Failed', 
          result.error?.message || 'Unable to create account. Please try again.'
        )
      } else {
        // Navigate to onboarding flow
        navigation.navigate('OnboardingIntro')
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignIn = () => {
    navigation.navigate('Login')
  }

  const isFormValid = 
    formData.fullName.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    formData.password.length >= 8 &&
    formData.confirmPassword === formData.password

  const isLoading = loading || isSubmitting

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Set up your safety profile to protect yourself and your family
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={formData.fullName}
                onChangeText={(value) => updateFormData('fullName', value)}
                placeholder="Enter your full name"
                placeholderTextColor="#999999"
                autoCapitalize="words"
                accessibilityLabel="Full name"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                placeholder="Enter your email"
                placeholderTextColor="#999999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Email address"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                placeholder="Create a password (min 8 characters)"
                placeholderTextColor="#999999"
                secureTextEntry
                accessibilityLabel="Password"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                placeholder="Confirm your password"
                placeholderTextColor="#999999"
                secureTextEntry
                accessibilityLabel="Confirm password"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity 
              style={[
                styles.signUpButton, 
                (!isFormValid || isLoading) && styles.buttonDisabled
              ]} 
              onPress={handleSignUp}
              disabled={!isFormValid || isLoading}
              accessibilityLabel="Create new account"
            >
              <Text style={[
                styles.signUpButtonText,
                (!isFormValid || isLoading) && styles.buttonTextDisabled
              ]}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleSignIn} disabled={isLoading}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  signUpButton: {
    backgroundColor: '#E53E3E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonTextDisabled: {
    color: '#666666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#666666',
  },
  signInLink: {
    fontSize: 16,
    color: '#E53E3E',
    fontWeight: '600',
  },
})