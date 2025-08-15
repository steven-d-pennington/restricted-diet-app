import React from 'react'
import { Platform, Text } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { useButtonClasses, useInputClasses, getSafetyInfo, cn } from '../utils/designSystem'

function StyleProbe({ hasError = false }) {
  const { getInputStyle } = useInputClasses()
  const style = getInputStyle(hasError)
  return <Text testID="style-probe">{JSON.stringify(style)}</Text>
}

function ButtonStyleProbe() {
  const { getButtonStyle, getButtonTextStyle } = useButtonClasses()
  const btnStyle = getButtonStyle('primary', 'md')
  const txtStyle = getButtonTextStyle('primary')
  return (
    <>
      <Text testID="btn-style">{JSON.stringify(btnStyle)}</Text>
      <Text testID="btn-text-style">{JSON.stringify(txtStyle)}</Text>
    </>
  )
}

describe('designSystem utilities', () => {
  const originalOS = Platform.OS
  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', { get: () => 'web' })
  })
  afterAll(() => {
    Object.defineProperty(Platform, 'OS', { get: () => originalOS })
  })

  it('getInputStyle returns visible styles on web', () => {
    render(<StyleProbe hasError={false} />)
    const node = screen.getByTestId('style-probe')
    const style = JSON.parse(node.props.children)
    expect(style).toBeTruthy()
    expect(style.color).toBe('#111827')
    expect(style.fontSize).toBe(16)
    expect(style.borderWidth).toBe(1)
  })

  it('getButtonStyle/textStyle provide web fallbacks', () => {
    render(<ButtonStyleProbe />)
    const btnStyle = JSON.parse(screen.getByTestId('btn-style').props.children)
    const txtStyle = JSON.parse(screen.getByTestId('btn-text-style').props.children)
    expect(btnStyle).toBeTruthy()
    expect(btnStyle.backgroundColor).toBeDefined()
    expect(txtStyle).toBeTruthy()
    expect(txtStyle.color).toBe('#ffffff')
  })

  it('getSafetyInfo returns config and cn joins classes', () => {
    const info = getSafetyInfo('danger')
    expect(info.label).toMatch(/Contains Allergens/i)
    expect(cn('a', false, undefined, 'b')).toBe('a b')
  })
})
