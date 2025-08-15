// Global test setup for React Native/Jest
// Provide minimal browser-like globals used by platform utils or web fallbacks

// @ts-ignore
global.navigator = global.navigator || {}
// @ts-ignore
global.window = global.window || {}

// Provide optional APIs if missing
// @ts-ignore
global.navigator.clipboard = global.navigator.clipboard || { writeText: jest.fn() }
// @ts-ignore
global.navigator.share = global.navigator.share || jest.fn()
// @ts-ignore
global.navigator.geolocation = global.navigator.geolocation || {}
// @ts-ignore
global.navigator.mediaDevices = global.navigator.mediaDevices || {}

// silence noisy warnings that aren’t relevant to unit behavior
jest.spyOn(global.console, 'warn').mockImplementation(() => {})
jest.spyOn(global.console, 'error').mockImplementation(() => {})

// Placeholder test to avoid duplicate execution. Real setup is in jest.setup.ts at project root.
describe('test bootstrap placeholder', () => {
  it('runs', () => {
    expect(true).toBe(true)
  })
})
