import { render } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ReactElement } from 'react';

interface RenderOptions {
    route?: string;
    initialEntries?: string[];
}

export function renderWithRouter(ui: ReactElement, options: RenderOptions = {}) {
    const { initialEntries = ['/'] } = options;

    return render(
        <MemoryRouter initialEntries={initialEntries}>
            {ui}
        </MemoryRouter>
    );
}

export function renderWithBrowserRouter(ui: ReactElement) {
    return render(
        <BrowserRouter>
            {ui}
        </BrowserRouter>
    );
}

// Test data factories
export const createMockUser = (overrides = {}) => ({
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    stravaConnected: true,
    ...overrides,
});

export const createMockChallenge = (overrides = {}) => ({
    id: 'challenge-1',
    name: 'Test Challenge',
    sportTypes: ['RUN'] as const,
    startAt: '2025-02-01',
    endAt: '2025-02-08',
    status: 'ACTIVE',
    participants: [
        { userId: 'user-1', username: 'testuser', goals: { RUN: 50 } },
        { userId: 'user-2', username: 'opponent', goals: { RUN: 50 } },
    ],
    createdBy: { id: 'user-1', username: 'testuser' },
    ...overrides,
});

export const createMockNotification = (overrides = {}) => ({
    id: 'notif-1',
    type: 'CHALLENGE_JOINED',
    challengeId: 'challenge-1',
    challengeName: 'Test Challenge',
    message: 'Someone joined your challenge!',
    read: false,
    createdAt: new Date().toISOString(),
    ...overrides,
});

export const createMockProgress = (challengeId: string, overrides = {}) => ({
    challengeId,
    participants: [
        { userId: 'user-1', username: 'testuser', overallProgressPercent: 50 },
        { userId: 'user-2', username: 'opponent', overallProgressPercent: 30 },
    ],
    ...overrides,
});
