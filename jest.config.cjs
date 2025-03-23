module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./tests/setup.cjs'],
  transform: {},
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  // Add coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  // Mock fetch API
  automock: false,
};