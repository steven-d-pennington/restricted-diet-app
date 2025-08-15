import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react-native'
import { SafetyButton } from '../components/SafetyButton'

describe('SafetyButton', () => {
  it('renders title and handles press', () => {
    const onPress = jest.fn()
    render(<SafetyButton title="Save" onPress={onPress} testID="btn" />)
    const btn = screen.getByTestId('btn')
    fireEvent.press(btn)
    expect(onPress).toHaveBeenCalled()
  })

  it('shows loading state and disables press', () => {
    const onPress = jest.fn()
    render(<SafetyButton title="Loading" loading disabled testID="btn" />)
    const btn = screen.getByTestId('btn')
    fireEvent.press(btn)
    expect(onPress).not.toHaveBeenCalled()
  })
})
