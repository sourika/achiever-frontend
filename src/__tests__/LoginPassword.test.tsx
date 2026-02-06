import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPassword from '../pages/LoginPassword';
import { api } from '../api/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render } from '@testing-library/react';

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

describe('LoginPassword', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderWithState = (email: string) => {
        return render(
            <MemoryRouter initialEntries={[{ pathname: '/login/password', state: { email } }]}>
                <Routes>
                    <Route path="/login/password" element={<LoginPassword />} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('renders login form with email from state', () => {
        renderWithState('test@example.com');

        expect(screen.getByText('Welcome back!')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });

    it('redirects to home if no email in state', () => {
        render(
            <MemoryRouter initialEntries={['/login/password']}>
                <Routes>
                    <Route path="/login/password" element={<LoginPassword />} />
                </Routes>
            </MemoryRouter>
        );

        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('allows entering password', async () => {
        const user = userEvent.setup();
        renderWithState('test@example.com');

        const passwordInput = screen.getByPlaceholderText('Enter your password');
        await user.type(passwordInput, 'mypassword123');

        expect(passwordInput).toHaveValue('mypassword123');
    });

    it('successfully logs in and navigates to dashboard', async () => {
        const user = userEvent.setup();
        (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: { token: 'fake-jwt-token' },
        });

        renderWithState('test@example.com');

        const passwordInput = screen.getByPlaceholderText('Enter your password');
        await user.type(passwordInput, 'correctpassword');

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
                email: 'test@example.com',
                password: 'correctpassword',
            });
            expect(window.localStorage.setItem).toHaveBeenCalledWith('token', 'fake-jwt-token');
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    it('shows error on invalid password', async () => {
        const user = userEvent.setup();
        (api.post as ReturnType<typeof vi.fn>).mockRejectedValue({
            response: { data: { error: 'Invalid password' } },
        });

        renderWithState('test@example.com');

        const passwordInput = screen.getByPlaceholderText('Enter your password');
        await user.type(passwordInput, 'wrongpassword');

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Invalid password')).toBeInTheDocument();
        });
    });

    it('navigates back to home when clicking back button', async () => {
        const user = userEvent.setup();
        renderWithState('test@example.com');

        const backButton = screen.getByText('← Back');
        await user.click(backButton);

        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
