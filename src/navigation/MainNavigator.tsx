/**
 * Main App Navigator
 * 
 * SAFETY CRITICAL: Primary navigation for authenticated users
 * Provides access to all safety-critical features and information
 */

import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { 
  MainTabParamList, 
  HomeStackParamList,
  ScannerStackParamList,
  RestaurantStackParamList,
  ProfileStackParamList,
  EmergencyStackParamList,
  FamilyStackParamList,
  TabBarIconProps
} from '../types/navigation.types'

// Import main screens
import { DashboardScreen } from '../screens/main/DashboardScreen'
import { ScannerScreen } from '../screens/main/ScannerScreen'
import { ScanResultScreen } from '../screens/placeholder/ScanResultScreen'
import { ProfileScreen } from '../screens/placeholder/ProfileScreen'
import { EmergencyScreen } from '../screens/placeholder/EmergencyScreen'
import { FamilyScreen } from '../screens/placeholder/FamilyScreen'
import { SimpleScreen } from '../components/SimpleScreen'

// Import restaurant screens
import { 
  RestaurantSearchScreen,
  RestaurantDetailScreen,
  FavoriteRestaurantsScreen
} from '../screens/restaurant'

// Tab Navigator
const Tab = createBottomTabNavigator<MainTabParamList>()

// Stack Navigators for each tab
const HomeStack = createNativeStackNavigator<HomeStackParamList>()
const ScannerStack = createNativeStackNavigator<ScannerStackParamList>()
const RestaurantStack = createNativeStackNavigator<RestaurantStackParamList>()
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>()
const EmergencyStack = createNativeStackNavigator<EmergencyStackParamList>()
const FamilyStack = createNativeStackNavigator<FamilyStackParamList>()

// Tab Icons
const getTabBarIcon = (routeName: keyof MainTabParamList, focused: boolean): string => {
  const icons = {
    Home: focused ? '🏠' : '🏡',
    Scanner: focused ? '📱' : '📱',
    Restaurants: focused ? '🍽️' : '🍴',
    Emergency: focused ? '🆘' : '🚨',
    Family: focused ? '👨‍👩‍👧‍👦' : '👥',
    Profile: focused ? '👤' : '👤',
  }
  return icons[routeName]
}

// Home Stack Navigator
const HomeStackNavigator: React.FC = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeStack.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
      />
      <HomeStack.Screen 
        name="ProductDetails" 
        component={() => <SimpleScreen title="Product Details" />}
        options={{ headerShown: true, title: 'Product Details' }}
      />
      <HomeStack.Screen 
        name="RecentScans" 
        component={() => <SimpleScreen title="Recent Scans" />}
        options={{ headerShown: true, title: 'Recent Scans' }}
      />
      <HomeStack.Screen 
        name="SafetyAlert" 
        component={() => <SimpleScreen title="Safety Alert" />}
        options={{ 
          headerShown: true, 
          title: 'Safety Alert',
          presentation: 'modal',
        }}
      />
    </HomeStack.Navigator>
  )
}

// Scanner Stack Navigator
const ScannerStackNavigator: React.FC = () => {
  return (
    <ScannerStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ScannerStack.Screen 
        name="ScannerCamera" 
        component={ScannerScreen} 
      />
      <ScannerStack.Screen 
        name="ScanResult" 
        component={ScanResultScreen}
        options={{ headerShown: true, title: 'Scan Result' }}
      />
      <ScannerStack.Screen 
        name="ManualEntry" 
        component={() => <SimpleScreen title="Manual Entry" />}
        options={{ headerShown: true, title: 'Manual Entry' }}
      />
    </ScannerStack.Navigator>
  )
}

// Restaurant Stack Navigator
const RestaurantStackNavigator: React.FC = () => {
  return (
    <RestaurantStack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <RestaurantStack.Screen 
        name="RestaurantSearch" 
        component={RestaurantSearchScreen}
        options={{ 
          title: 'Find Restaurants',
          headerShown: false // Screen handles its own header
        }}
      />
      <RestaurantStack.Screen 
        name="RestaurantDetail" 
        component={RestaurantDetailScreen}
        options={{ 
          title: 'Restaurant Details',
          headerBackTitleVisible: false
        }}
      />
      <RestaurantStack.Screen 
        name="FavoriteRestaurants" 
        component={FavoriteRestaurantsScreen}
        options={{ 
          title: 'Favorites',
          headerShown: false // Screen handles its own header
        }}
      />
      <RestaurantStack.Screen 
        name="RestaurantMenu" 
        component={() => <SimpleScreen title="Restaurant Menu" />}
        options={{ title: 'Menu' }}
      />
      <RestaurantStack.Screen 
        name="RestaurantReviews" 
        component={() => <SimpleScreen title="Restaurant Reviews" />}
        options={{ title: 'Reviews' }}
      />
      <RestaurantStack.Screen 
        name="WriteReview" 
        component={() => <SimpleScreen title="Write Review" />}
        options={{ 
          title: 'Write Review',
          presentation: 'modal'
        }}
      />
    </RestaurantStack.Navigator>
  )
}

// Profile Stack Navigator
const ProfileStackNavigator: React.FC = () => {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ProfileStack.Screen 
        name="ProfileOverview" 
        component={ProfileScreen}
      />
      <ProfileStack.Screen 
        name="EditProfile" 
        component={() => <SimpleScreen title="Edit Profile" />}
        options={{ headerShown: true, title: 'Edit Profile' }}
      />
      <ProfileStack.Screen 
        name="DietaryRestrictions" 
        component={() => <SimpleScreen title="Dietary Restrictions" />}
        options={{ headerShown: true, title: 'Dietary Restrictions' }}
      />
      <ProfileStack.Screen 
        name="EditRestrictions" 
        component={() => <SimpleScreen title="Edit Restrictions" />}
        options={{ headerShown: true, title: 'Edit Restrictions' }}
      />
      <ProfileStack.Screen 
        name="Settings" 
        component={() => <SimpleScreen title="Settings" />}
        options={{ headerShown: true, title: 'Settings' }}
      />
      <ProfileStack.Screen 
        name="AccountSettings" 
        component={() => <SimpleScreen title="Account Settings" />}
        options={{ headerShown: true, title: 'Account Settings' }}
      />
      <ProfileStack.Screen 
        name="NotificationSettings" 
        component={() => <SimpleScreen title="Notifications" />}
        options={{ headerShown: true, title: 'Notifications' }}
      />
      <ProfileStack.Screen 
        name="PrivacySettings" 
        component={() => <SimpleScreen title="Privacy" />}
        options={{ headerShown: true, title: 'Privacy' }}
      />
    </ProfileStack.Navigator>
  )
}

// Emergency Stack Navigator
const EmergencyStackNavigator: React.FC = () => {
  return (
    <EmergencyStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <EmergencyStack.Screen 
        name="EmergencyCards" 
        component={EmergencyScreen}
      />
      <EmergencyStack.Screen 
        name="CreateCard" 
        component={() => <SimpleScreen title="Create Emergency Card" />}
        options={{ headerShown: true, title: 'Create Card' }}
      />
      <EmergencyStack.Screen 
        name="EditCard" 
        component={() => <SimpleScreen title="Edit Emergency Card" />}
        options={{ headerShown: true, title: 'Edit Card' }}
      />
      <EmergencyStack.Screen 
        name="CardPreview" 
        component={() => <SimpleScreen title="Card Preview" />}
        options={{ headerShown: true, title: 'Preview', presentation: 'modal' }}
      />
      <EmergencyStack.Screen 
        name="ShareCard" 
        component={() => <SimpleScreen title="Share Emergency Card" />}
        options={{ headerShown: true, title: 'Share Card', presentation: 'modal' }}
      />
    </EmergencyStack.Navigator>
  )
}

// Family Stack Navigator
const FamilyStackNavigator: React.FC = () => {
  return (
    <FamilyStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <FamilyStack.Screen 
        name="FamilyOverview" 
        component={FamilyScreen}
      />
      <FamilyStack.Screen 
        name="AddMember" 
        component={() => <SimpleScreen title="Add Family Member" />}
        options={{ headerShown: true, title: 'Add Member' }}
      />
      <FamilyStack.Screen 
        name="MemberProfile" 
        component={() => <SimpleScreen title="Member Profile" />}
        options={{ headerShown: true, title: 'Member Profile' }}
      />
      <FamilyStack.Screen 
        name="EditMember" 
        component={() => <SimpleScreen title="Edit Member" />}
        options={{ headerShown: true, title: 'Edit Member' }}
      />
      <FamilyStack.Screen 
        name="MemberRestrictions" 
        component={() => <SimpleScreen title="Member Restrictions" />}
        options={{ headerShown: true, title: 'Restrictions' }}
      />
    </FamilyStack.Navigator>
  )
}

// Main Tab Navigator
export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }: TabBarIconProps) => {
          const icon = getTabBarIcon(route.name, focused)
          // For now we'll return null, icon will be handled by the tab label
          return null
        },
        tabBarActiveTintColor: '#E53E3E',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E7',
          paddingTop: 8,
          paddingBottom: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      
      <Tab.Screen 
        name="Scanner" 
        component={ScannerStackNavigator}
        options={{
          tabBarLabel: 'Scan',
          tabBarAccessibilityLabel: 'Scanner tab',
        }}
      />

      <Tab.Screen 
        name="Restaurants" 
        component={RestaurantStackNavigator}
        options={{
          tabBarLabel: 'Restaurants',
          tabBarAccessibilityLabel: 'Restaurants tab',
        }}
      />
      
      <Tab.Screen 
        name="Emergency" 
        component={EmergencyStackNavigator}
        options={{
          tabBarLabel: 'Emergency',
          tabBarAccessibilityLabel: 'Emergency tab',
        }}
      />
      
      <Tab.Screen 
        name="Family" 
        component={FamilyStackNavigator}
        options={{
          tabBarLabel: 'Family',
          tabBarAccessibilityLabel: 'Family tab',
        }}
      />
      
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarAccessibilityLabel: 'Profile tab',
        }}
      />
    </Tab.Navigator>
  )
}