import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../pages/Home';
import { renderWithRouter } from './utils';
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

describe('Home', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
    });

    it('renders the home page with email input', () => {
        renderWithRouter(<Home />);

        expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    it('redirects to dashboard if token exists', () => {
        (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('fake-token');

        renderWithRouter(<Home />);

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('shows error when submitting empty email', async () => {
        const user = userEvent.setup();
        renderWithRouter(<Home />);

        await user.click(screen.getByRole('button', { name: /continue/i }));

        expect(screen.getByText('Please enter your email')).toBeInTheDocument();
    });

    it('navigates to password page for existing user with password', async () => {
        const user = userEvent.setup();
        (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: { exists: true, hasPassword: true },
        });

        renderWithRouter(<Home />);

        await user.type(screen.getByPlaceholderText('name@example.com'), 'test@example.com');
        await user.click(screen.getByRole('button', { name: /continue/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/login/password', {
                state: { email: 'test@example.com' },
            });
        });
    });

    it('navigates to set-password page for existing user without password', async () => {
        const user = userEvent.setup();
        (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: { exists: true, hasPassword: false },
        });

        renderWithRouter(<Home />);

        await user.type(screen.getByPlaceholderText('name@example.com'), 'test@example.com');
        await user.click(screen.getByRole('button', { name: /continue/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/login/set-password', {
                state: { email: 'test@example.com' },
            });
        });
    });

    it('navigates to not-found page for non-existing user', async () => {
        const user = userEvent.setup();
        (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: { exists: false, hasPassword: false },
        });

        renderWithRouter(<Home />);

        await user.type(screen.getByPlaceholderText('name@example.com'), 'new@example.com');
        await user.click(screen.getByRole('button', { name: /continue/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/login/not-found', {
                state: { email: 'new@example.com' },
            });
        });
    });

    it('shows error on API failure', async () => {
        const user = userEvent.setup();
        (api.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

        renderWithRouter(<Home />);

        await user.type(screen.getByPlaceholderText('name@example.com'), 'test@example.com');
        await user.click(screen.getByRole('button', { name: /continue/i }));

        await waitFor(() => {
            expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
        });
    });
});
