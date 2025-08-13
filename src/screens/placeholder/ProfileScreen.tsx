import React from 'react'
import { SimpleScreen } from '../../components/SimpleScreen'

export const ProfileScreen: React.FC = () => {
  return (
    <SimpleScreen 
      title="Profile"
      description="User profile and settings will appear here"
      showBackButton={false}
    />
  )
}