module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules[\\\\/](?!(\\.pnpm[\\\\/])?((jest-)?react-native|@react-native(-community)?|@react-native|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|react-native-svg|@yikes/.*))',
  ],
  moduleNameMapper: {
    '^@yikes/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
  },
  testTimeout: 15000,
};
