/**
 * Dashboard Screen - Main home screen for authenticated users
 * 
 * SAFETY CRITICAL: Primary interface for dietary restriction management
 * Shows safety status, recent scans, and quick access to key features
 */

import React from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView 
} from 'react-native'
import { HomeStackScreenProps } from '../../types/navigation.types'
import { useAuth } from '../../contexts/AuthContext'

type Props = HomeStackScreenProps<'Dashboard'>

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { userProfile } = useAuth()

  const handleQuickScan = () => {
    // Navigate to scanner tab
    navigation.getParent()?.navigate('Scanner')
  }

  const handleViewRestrictions = () => {
    navigation.getParent()?.navigate('Profile', { 
      screen: 'DietaryRestrictions' 
    })
  }

  const handleEmergencyCards = () => {
    navigation.getParent()?.navigate('Emergency')
  }

  const handleRecentScans = () => {
    navigation.navigate('RecentScans')
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hello, {userProfile?.full_name || 'User'}
          </Text>
          <Text style={styles.subtitle}>Stay safe with every meal</Text>
        </View>

        {/* Safety Status Card */}
        <View style={styles.safetyCard}>
          <View style={styles.safetyHeader}>
            <Text style={styles.safetyIcon}>🛡️</Text>
            <View style={styles.safetyText}>
              <Text style={styles.safetyTitle}>Safety Profile Active</Text>
              <Text style={styles.safetyDescription}>
                Your dietary restrictions are configured and ready
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.safetyButton} 
            onPress={handleViewRestrictions}
          >
            <Text style={styles.safetyButtonText}>View Restrictions</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionCard} 
              onPress={handleQuickScan}
              accessibilityLabel="Scan product barcode"
            >
              <Text style={styles.actionIcon}>📱</Text>
              <Text style={styles.actionTitle}>Quick Scan</Text>
              <Text style={styles.actionDescription}>
                Scan a product barcode
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard} 
              onPress={handleEmergencyCards}
              accessibilityLabel="View emergency cards"
            >
              <Text style={styles.actionIcon}>🆘</Text>
              <Text style={styles.actionTitle}>Emergency Cards</Text>
              <Text style={styles.actionDescription}>
                Access emergency info
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={handleRecentScans}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📋</Text>
            <Text style={styles.emptyStateTitle}>No recent scans</Text>
            <Text style={styles.emptyStateDescription}>
              Start scanning products to see your safety history here
            </Text>
            <TouchableOpacity 
              style={styles.emptyStateButton} 
              onPress={handleQuickScan}
            >
              <Text style={styles.emptyStateButtonText}>Start Scanning</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Safety Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Tip</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Always Check Labels</Text>
              <Text style={styles.tipDescription}>
                Even if you've scanned a product before, ingredients can change. 
                Always verify product labels for the most current information.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  safetyCard: {
    backgroundColor: '#E8F5E8',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6E8C6',
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  safetyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  safetyText: {
    flex: 1,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 2,
  },
  safetyDescription: {
    fontSize: 14,
    color: '#4CAF50',
  },
  safetyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  safetyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    margin: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  seeAllText: {
    fontSize: 16,
    color: '#E53E3E',
    fontWeight: '500',
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyStateButton: {
    backgroundColor: '#E53E3E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
})