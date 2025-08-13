import React from 'react'
import { SimpleScreen } from '../../components/SimpleScreen'

export const FamilyScreen: React.FC = () => {
  return (
    <SimpleScreen 
      title="Family"
      description="Family member management will appear here"
      showBackButton={false}
    />
  )
}