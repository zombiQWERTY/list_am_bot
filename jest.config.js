module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  roots: ['<rootDir>/src/'],
  coveragePathIgnorePatterns: [
    'node_modules',
    'test-config',
    '.module.ts',
    '.dto.ts',
    '.config.ts',
    '.options.ts',
    '.consts.ts',
    '.types.ts',
    'main.ts',
    '.mock.ts',
    '.mapper.ts',
  ],
  moduleNameMapper: {
    '^@list-am-bot/(.*)$': '<rootDir>/src/$1',
  },
};

