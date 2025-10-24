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
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
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

