import React, { useMemo } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import { SafetyButton } from '../../components/SafetyButton'
import { useInputClasses } from '../../utils/designSystem'
import type { ProfileStackScreenProps } from '../../types/navigation.types'

type Props = ProfileStackScreenProps<'ProfileOverview'>

export const ProfileOverviewScreen: React.FC<Props> = ({ navigation }) => {
  const { user, userProfile, signOut } = useAuth()
  const { getInputStyle } = useInputClasses()

  const initials = useMemo(() => {
    const name = userProfile?.full_name || user?.email || 'User'
    return name
      .split(/\s+/)
      .map((p) => p[0]?.toUpperCase())
      .slice(0, 2)
      .join('') || 'U'
  }, [userProfile?.full_name, user?.email])

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* Header */}
      <View className="flex-row items-center">
        <View
          className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mr-4"
          style={getInputStyle()}
        >
          <Text className="text-xl font-bold text-blue-800">{initials}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900">{userProfile?.full_name || 'Your Profile'}</Text>
          <Text className="text-gray-600">{user?.email}</Text>
          {userProfile?.is_verified && (
            <Text className="text-green-700 mt-1">Verified</Text>
          )}
        </View>
      </View>

      {/* Quick actions */}
      <View className="flex-row" style={{ gap: 8 }}>
        <SafetyButton
          title="Edit Profile"
          onPress={() => navigation.navigate('EditProfile')}
          variant="primary"
        />
        <SafetyButton
          title="Emergency Cards"
          onPress={() => navigation.getParent()?.navigate('Emergency')}
          variant="secondary"
        />
      </View>

      {/* Details */}
      <View className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <Text className="text-gray-800 font-semibold mb-2">Personal</Text>
        <Text className="text-gray-700">Name: {userProfile?.full_name || '—'}</Text>
        <Text className="text-gray-700">Phone: {userProfile?.phone_number || '—'}</Text>
        <Text className="text-gray-700">DOB: {userProfile?.date_of_birth || '—'}</Text>
      </View>

      <View className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <Text className="text-gray-800 font-semibold mb-2">Preferences</Text>
        <Text className="text-gray-700">Language: {userProfile?.preferred_language || 'en'}</Text>
        <Text className="text-gray-700">Timezone: {userProfile?.timezone || '—'}</Text>
      </View>

      <View className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <Text className="text-gray-800 font-semibold mb-2">Emergency Contact</Text>
        <Text className="text-gray-700">Name: {userProfile?.emergency_contact_name || '—'}</Text>
        <Text className="text-gray-700">Phone: {userProfile?.emergency_contact_phone || '—'}</Text>
        <Text className="text-gray-700">Relationship: {userProfile?.emergency_contact_relationship || '—'}</Text>
      </View>

      <View className="pt-2">
        <SafetyButton
          title="Sign Out"
          variant="error"
          onPress={async () => {
            await signOut()
          }}
        />
      </View>
    </ScrollView>
  )
}

export default ProfileOverviewScreen
