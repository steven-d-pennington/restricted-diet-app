/**
 * Navigation Types for Restricted Diet Application
 * 
 * SAFETY CRITICAL: Proper navigation typing ensures safe routing
 * between screens containing medical information
 */

import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { CompositeScreenProps } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

// Root Navigation Stack - Main app flow control
export type RootStackParamList = {
  AuthStack: undefined
  MainStack: undefined
  Loading: undefined
}

// Authentication Stack - Unauthenticated user flow
export type AuthStackParamList = {
  Welcome: undefined
  Login: undefined
  Register: undefined
  ForgotPassword: undefined
  OnboardingIntro: undefined
  OnboardingWelcome: undefined
  OnboardingBasicInfo: undefined
  OnboardingRestrictions: undefined
  OnboardingSeverity: undefined
  OnboardingEmergency: undefined
  OnboardingCompletion: undefined
  OnboardingComplete: undefined // Deprecated - keeping for backward compatibility
}

// Main App Tab Navigation - Authenticated user flow
export type MainTabParamList = {
  Home: undefined
  Scanner: undefined
  Profile: undefined
  Emergency: undefined
  Family: undefined
}

// Nested Stack Navigators within Main Tabs
export type HomeStackParamList = {
  Dashboard: undefined
  ProductDetails: { productId: string; productName?: string }
  RecentScans: undefined
  SafetyAlert: { alertType: 'danger' | 'warning'; productName: string; allergens: string[] }
}

export type ScannerStackParamList = {
  ScannerCamera: undefined
  ScanResult: { barcode: string; productName?: string }
  ManualEntry: { barcode?: string; barcodeType?: string }
}

export type ProfileStackParamList = {
  ProfileOverview: undefined
  EditProfile: undefined
  DietaryRestrictions: undefined
  EditRestrictions: undefined
  Settings: undefined
  AccountSettings: undefined
  NotificationSettings: undefined
  PrivacySettings: undefined
}

export type EmergencyStackParamList = {
  EmergencyCards: undefined
  CreateCard: undefined
  EditCard: { cardId: string }
  CardPreview: { cardId: string }
  ShareCard: { cardId: string }
}

export type FamilyStackParamList = {
  FamilyOverview: undefined
  AddMember: undefined
  MemberProfile: { memberId: string }
  EditMember: { memberId: string }
  MemberRestrictions: { memberId: string }
}

// Screen Props Type Helpers
export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>

export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >

export type HomeStackScreenProps<T extends keyof HomeStackParamList> = 
  CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, T>,
    MainTabScreenProps<'Home'>
  >

export type ScannerStackScreenProps<T extends keyof ScannerStackParamList> = 
  CompositeScreenProps<
    NativeStackScreenProps<ScannerStackParamList, T>,
    MainTabScreenProps<'Scanner'>
  >

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = 
  CompositeScreenProps<
    NativeStackScreenProps<ProfileStackParamList, T>,
    MainTabScreenProps<'Profile'>
  >

export type EmergencyStackScreenProps<T extends keyof EmergencyStackParamList> = 
  CompositeScreenProps<
    NativeStackScreenProps<EmergencyStackParamList, T>,
    MainTabScreenProps<'Emergency'>
  >

export type FamilyStackScreenProps<T extends keyof FamilyStackParamList> = 
  CompositeScreenProps<
    NativeStackScreenProps<FamilyStackParamList, T>,
    MainTabScreenProps<'Family'>
  >

// Navigation utility types
export type NavigationProp = any // This will be refined as needed
export type RouteProp = any // This will be refined as needed

// Screen configuration types
export interface ScreenOptions {
  title?: string
  headerShown?: boolean
  gestureEnabled?: boolean
  animationEnabled?: boolean
}

// Tab bar icon props
export interface TabBarIconProps {
  focused: boolean
  color: string
  size: number
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}