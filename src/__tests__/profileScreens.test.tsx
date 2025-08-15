import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { AuthProvider } from '../contexts/AuthContext'
import ProfileOverviewScreen from '../screens/profile/ProfileOverviewScreen'
import EditProfileScreen from '../screens/profile/EditProfileScreen'

// Mock supabase client methods used in AuthContext
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn().mockReturnThis(),
    })),
  },
  handleSupabaseResponse: (r: any) => ({ data: r.data, error: r.error || null }),
}))

function Wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe('Profile screens', () => {
  it('ProfileOverviewScreen renders basic info safely', async () => {
    // Provide minimal route/nav props expected by the component types
    const route = { key: 'ProfileOverview', name: 'ProfileOverview', params: undefined } as any
    const navigation = { navigate: jest.fn(), getParent: jest.fn(() => ({ navigate: jest.fn() })) } as any
    render(<ProfileOverviewScreen route={route} navigation={navigation} />, { wrapper: Wrapper })
  expect(screen.getByText(/Sign Out/i)).toBeTruthy()
  })

  it('EditProfileScreen validates and blocks empty name on save', async () => {
    const route = { key: 'EditProfile', name: 'EditProfile', params: undefined } as any
    const navigation = { goBack: jest.fn() } as any
    render(<EditProfileScreen route={route} navigation={navigation} />, { wrapper: Wrapper })
    // Attempt to save without name
    const save = screen.getByText(/Save|Saving/i)
    fireEvent.press(save)
    // Expect validation error to appear
    expect(await screen.findByText(/Name is required/i)).toBeTruthy()
  })
})
