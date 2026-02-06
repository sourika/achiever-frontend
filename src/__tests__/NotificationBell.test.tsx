import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBell from '../components/NotificationBell';
import { renderWithRouter, createMockNotification } from './utils';
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

describe('NotificationBell', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
            if (url === '/api/notifications/unread-count') {
                return Promise.resolve({ data: { count: 0 } });
            }
            if (url === '/api/notifications') {
                return Promise.resolve({ data: [] });
            }
            return Promise.reject(new Error('Unknown endpoint'));
        });
    });

    it('renders bell icon', async () => {
        renderWithRouter(<NotificationBell />);

        await waitFor(() => {
            expect(screen.getByRole('button')).toBeInTheDocument();
        });
    });

    it('shows unread count badge when there are unread notifications', async () => {
        (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
            if (url === '/api/notifications/unread-count') {
                return Promise.resolve({ data: { count: 5 } });
            }
            return Promise.resolve({ data: [] });
        });

        renderWithRouter(<NotificationBell />);

        await waitFor(() => {
            expect(screen.getByText('5')).toBeInTheDocument();
        });
    });

    it('shows 9+ when unread count exceeds 9', async () => {
        (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
            if (url === '/api/notifications/unread-count') {
                return Promise.resolve({ data: { count: 15 } });
            }
            return Promise.resolve({ data: [] });
        });

        renderWithRouter(<NotificationBell />);

        await waitFor(() => {
            expect(screen.getByText('9+')).toBeInTheDocument();
        });
    });

    it('opens dropdown when clicking bell', async () => {
        const user = userEvent.setup();

        renderWithRouter(<NotificationBell />);

        await waitFor(() => {
            expect(screen.getByRole('button')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(screen.getByText('Notifications')).toBeInTheDocument();
        });
    });

    it('shows empty state when no notifications', async () => {
        const user = userEvent.setup();
        renderWithRouter(<NotificationBell />);

        await waitFor(() => {
            expect(screen.getByRole('button')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(screen.getByText('No notifications yet')).toBeInTheDocument();
        });
    });

    it('displays notifications list', async () => {
        const user = userEvent.setup();
        const mockNotifications = [
            createMockNotification({ id: '1', message: 'User joined your challenge' }),
            createMockNotification({ id: '2', message: 'Challenge started', type: 'CHALLENGE_STARTED' }),
        ];

        (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
            if (url === '/api/notifications/unread-count') {
                return Promise.resolve({ data: { count: 2 } });
            }
            if (url === '/api/notifications') {
                return Promise.resolve({ data: mockNotifications });
            }
            return Promise.resolve({ data: [] });
        });

        renderWithRouter(<NotificationBell />);

        await waitFor(() => {
            expect(screen.getByRole('button')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(screen.getByText('User joined your challenge')).toBeInTheDocument();
            expect(screen.getByText('Challenge started')).toBeInTheDocument();
        });
    });

    it('marks all as read when clicking button', async () => {
        const user = userEvent.setup();
        (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
            if (url === '/api/notifications/unread-count') {
                return Promise.resolve({ data: { count: 2 } });
            }
            if (url === '/api/notifications') {
                return Promise.resolve({ data: [createMockNotification()] });
            }
            return Promise.resolve({ data: [] });
        });
        (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({});

        renderWithRouter(<NotificationBell />);

        await waitFor(() => {
            expect(screen.getByRole('button')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(screen.getByText('Mark all as read')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Mark all as read'));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/api/notifications/read');
        });
    });

    it('navigates to challenge when clicking notification', async () => {
        const user = userEvent.setup();
        const notification = createMockNotification({
            challengeId: 'challenge-123',
            message: 'Test notification',
        });

        (api.get as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
            if (url === '/api/notifications/unread-count') {
                return Promise.resolve({ data: { count: 1 } });
            }
            if (url === '/api/notifications') {
                return Promise.resolve({ data: [notification] });
            }
            return Promise.resolve({ data: [] });
        });

        renderWithRouter(<NotificationBell />);

        await waitFor(() => {
            expect(screen.getByRole('button')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button'));

        await waitFor(() => {
            expect(screen.getByText('Test notification')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Test notification'));

        expect(mockNavigate).toHaveBeenCalledWith('/challenges/challenge-123');
    });
});
