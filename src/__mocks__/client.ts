import { vi } from 'vitest';

export const api = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
        request: {
            use: vi.fn(),
        },
    },
};

export default api;
