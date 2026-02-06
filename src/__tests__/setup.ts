import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.location
const locationMock = {
    href: '',
    assign: vi.fn(),
    replace: vi.fn(),
};
Object.defineProperty(window, 'location', {
    value: locationMock,
    writable: true,
});

// Mock Intl.DateTimeFormat
vi.mock('Intl', () => ({
    DateTimeFormat: () => ({
        resolvedOptions: () => ({ timeZone: 'America/Los_Angeles' }),
    }),
}));

// Reset mocks between tests
beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
});

afterEach(() => {
    vi.restoreAllMocks();
});
