import React, { useEffect } from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { useEmergencyCards } from '../hooks/useEmergencyCards'

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'u@example.com' } }),
}))

jest.mock('../services/database', () => {
  const actual = jest.requireActual('../services/database')
  return {
    ...actual,
    emergencyCardService: {
      getUserEmergencyCards: jest.fn().mockResolvedValue({ data: [], error: null }),
      createEmergencyCard: jest.fn().mockResolvedValue({ data: { id: 'card-1' }, error: null }),
      updateEmergencyCard: jest.fn().mockResolvedValue({ data: {}, error: null }),
      delete: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
  }
})

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'user-1' }, error: null }),
      insert: jest.fn().mockReturnThis(),
    })),
  },
}))

function HookHarness({ onReady }: { onReady: (api: ReturnType<typeof useEmergencyCards>) => void }) {
  const api = useEmergencyCards()
  useEffect(() => {
    onReady(api)
  }, [api])
  return null
}

describe('useEmergencyCards', () => {
  it('loads and can create card', async () => {
    let hookApi: ReturnType<typeof useEmergencyCards> | null = null
    render(<HookHarness onReady={(api) => { hookApi = api }} />)

    await waitFor(() => expect(hookApi).toBeTruthy())
    await waitFor(() => expect(hookApi!.loading).toBe(false))

    const ok = await hookApi!.createEmergencyCard({
      card_name: 'Test',
      restrictions_summary: 'Severe allergies',
      severity_level: 'severe',
      emergency_instructions: 'Call 911',
      medications: ['Antihistamine'],
      card_language: 'en',
      is_active: true,
    })
    expect(ok).toBe(true)
  })
})
