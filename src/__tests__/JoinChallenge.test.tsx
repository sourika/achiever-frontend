import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JoinChallenge from '../pages/JoinChallenge';
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

describe('JoinChallenge', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('fake-token');
    });

    const renderWithCode = (code: string) => {
        return render(
            <MemoryRouter initialEntries={[`/join/${code}`]}>
                <Routes>
                    <Route path="/join/:code" element={<JoinChallenge />} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('shows loading state initially', () => {
        (api.get as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
        renderWithCode('abc123');

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows error for invalid invite code', async () => {
        (api.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Not found'));
        renderWithCode('invalid');

        await waitFor(() => {
            expect(screen.getByText('Invalid Link')).toBeInTheDocument();
        });
    });

    it('shows expired state for expired challenge', async () => {
        const expiredChallenge = {
            id: 'challenge-1',
            name: 'Test Challenge',
            sportTypes: ['RUN'],
            startAt: '2024-01-01',
            endAt: '2024-01-01',
            status: 'EXPIRED',
            createdBy: { username: 'creator' },
            participants: [{ username: 'creator', goals: { RUN: 50 } }],
        };
        (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: expiredChallenge });
        renderWithCode('abc123');

        await waitFor(() => {
            expect(screen.getByText('Challenge Expired')).toBeInTheDocument();
        });
    });

    it('navigates to home when clicking Go Home on error page', async () => {
        const user = userEvent.setup();
        (api.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Not found'));
        renderWithCode('invalid');

        await waitFor(() => {
            expect(screen.getByText('Invalid Link')).toBeInTheDocument();
        });

        const homeButton = screen.getByRole('button', { name: /go home/i });
        await user.click(homeButton);

        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
