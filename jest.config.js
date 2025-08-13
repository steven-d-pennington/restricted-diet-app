module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)'
  ],
  setupFilesAfterEnv: [
    '@testing-library/react-native/extend-expect'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/__tests__/**/*',
    '!src/**/__mocks__/**/*'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    'src/types/'
  ],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx)',
    '**/*.(test|spec).(ts|tsx)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};