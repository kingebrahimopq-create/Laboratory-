import { expect, vi, beforeEach, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest expect with jest-dom matchers
expect.extend(matchers);

// Global test setup
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
