import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.VITE_API_URL = 'http://localhost:3001';

// Mock localStorage for tests
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Reset localStorage before each test
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(10000); 