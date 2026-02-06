import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../pages/Dashboard';
import { renderWithRouter, createMockUser, createMockChallenge } from './utils';
import { api } from '../api/client';

vi.mock('../api/client', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('Dashboard', () => {
    const mockUser = createMockUser();

    beforeEach(() => {
        vi.clearAllMocks();
        (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('fake-token');
    });

    it('shows loading state initially', () => {
        (api.get as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
        renderWithRouter(<Dashboard />);

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('displays user info after loading', async () => {
        (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
            if (url === '/api/auth/me') return Promise.resolve({ data: mockUser });
            if (url === '/api/challenges/my') return Promise.resolve({ data: [] });
            if (url.includes('/api/notifications')) return Promise.resolve({ data: { count: 0 } });
            return Promise.resolve({ data: {} });
        });

        renderWithRouter(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('testuser')).toBeInTheDocument();
        });
    });

    it('displays empty state when no challenges', async () => {
        (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
            if (url === '/api/auth/me') return Promise.resolve({ data: mockUser });
            if (url === '/api/challenges/my') return Promise.resolve({ data: [] });
            if (url.includes('/api/notifications')) return Promise.resolve({ data: { count: 0 } });
            return Promise.resolve({ data: {} });
        });

        renderWithRouter(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('No challenges yet')).toBeInTheDocument();
        });
    });

    it('displays challenges list', async () => {
        const challenges = [
            createMockChallenge({ id: '1', name: 'Challenge 1', status: 'ACTIVE' }),
            createMockChallenge({ id: '2', name: 'Challenge 2', status: 'PENDING' }),
        ];

        (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
            if (url === '/api/auth/me') return Promise.resolve({ data: mockUser });
            if (url === '/api/challenges/my') return Promise.resolve({ data: challenges });
            if (url.includes('/progress')) return Promise.resolve({ data: { participants: [] } });
            if (url.includes('/api/notifications')) return Promise.resolve({ data: { count: 0 } });
            return Promise.resolve({ data: {} });
        });

        renderWithRouter(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Challenge 1')).toBeInTheDocument();
            expect(screen.getByText('Challenge 2')).toBeInTheDocument();
        });
    });

    it('navigates to new challenge page when clicking button', async () => {
        const user = userEvent.setup();
        (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
            if (url === '/api/auth/me') return Promise.resolve({ data: mockUser });
            if (url === '/api/challenges/my') return Promise.resolve({ data: [] });
            if (url.includes('/api/notifications')) return Promise.resolve({ data: { count: 0 } });
            return Promise.resolve({ data: {} });
        });

        renderWithRouter(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('+ New Challenge')).toBeInTheDocument();
        });

        await user.click(screen.getByText('+ New Challenge'));

        expect(mockNavigate).toHaveBeenCalledWith('/challenges/new');
    });

    it('handles logout', async () => {
        const user = userEvent.setup();
        (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
            if (url === '/api/auth/me') return Promise.resolve({ data: mockUser });
            if (url === '/api/challenges/my') return Promise.resolve({ data: [] });
            if (url.includes('/api/notifications')) return Promise.resolve({ data: { count: 0 } });
            return Promise.resolve({ data: {} });
        });

        renderWithRouter(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Logout')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Logout'));

        expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
        expect(window.location.href).toBe('/');
    });

    it('redirects to home on auth error', async () => {
        (api.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Unauthorized'));

        renderWithRouter(<Dashboard />);

        await waitFor(() => {
            expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
            expect(window.location.href).toBe('/');
        });
    });
});
