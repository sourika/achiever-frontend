import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateChallenge from '../pages/CreateChallenge';
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

describe('CreateChallenge', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the create challenge form', () => {
        renderWithRouter(<CreateChallenge />);

        expect(screen.getByRole('heading', { name: /create challenge/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g. Winter Battle')).toBeInTheDocument();
        expect(screen.getByText(/running/i)).toBeInTheDocument();
        expect(screen.getByText(/cycling/i)).toBeInTheDocument();
    });

    it('allows entering challenge name with character limit', async () => {
        const user = userEvent.setup();
        renderWithRouter(<CreateChallenge />);

        const input = screen.getByPlaceholderText('e.g. Winter Battle');
        await user.type(input, 'My Challenge');

        expect(input).toHaveValue('My Challenge');
        expect(screen.getByText('12/50')).toBeInTheDocument();
    });

    it('truncates name at 50 characters', async () => {
        const user = userEvent.setup();
        renderWithRouter(<CreateChallenge />);

        const input = screen.getByPlaceholderText('e.g. Winter Battle');
        const longName = 'a'.repeat(60);
        await user.type(input, longName);

        expect(input).toHaveValue('a'.repeat(50));
        expect(screen.getByText('50/50')).toBeInTheDocument();
    });

    it('toggles sport selection', async () => {
        const user = userEvent.setup();
        renderWithRouter(<CreateChallenge />);

        const checkboxes = screen.getAllByRole('checkbox');
        await user.click(checkboxes[0]);

        expect(screen.getByDisplayValue('50')).toBeInTheDocument();

        await user.click(checkboxes[0]);

        expect(screen.queryByDisplayValue('50')).not.toBeInTheDocument();
    });

    it('allows changing goal value for selected sport', async () => {
        const user = userEvent.setup();
        renderWithRouter(<CreateChallenge />);

        const checkboxes = screen.getAllByRole('checkbox');
        await user.click(checkboxes[0]);

        const goalInput = screen.getByDisplayValue('50');
        await user.clear(goalInput);
        await user.type(goalInput, '100');

        expect(goalInput).toHaveValue(100);
    });

    it('submit button is disabled when no sports selected', () => {
        renderWithRouter(<CreateChallenge />);

        const submitButton = screen.getByRole('button', { name: /create challenge/i });
        expect(submitButton).toBeDisabled();
    });

    it('enables submit button when sport is selected', async () => {
        const user = userEvent.setup();
        renderWithRouter(<CreateChallenge />);

        const checkboxes = screen.getAllByRole('checkbox');
        await user.click(checkboxes[0]);

        const submitButton = screen.getByRole('button', { name: /create challenge/i });
        expect(submitButton).not.toBeDisabled();
    });

    it('shows challenge summary when sports are selected', async () => {
        const user = userEvent.setup();
        renderWithRouter(<CreateChallenge />);

        const checkboxes = screen.getAllByRole('checkbox');
        await user.click(checkboxes[0]);

        expect(screen.getByText(/challenge summary/i)).toBeInTheDocument();
    });

    it('successfully creates challenge and navigates', async () => {
        const user = userEvent.setup();
        (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: { id: 'new-challenge-123' },
        });

        renderWithRouter(<CreateChallenge />);

        const checkboxes = screen.getAllByRole('checkbox');
        await user.click(checkboxes[0]);

        const submitButton = screen.getByRole('button', { name: /create challenge/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/api/challenges', expect.objectContaining({
                goals: { RUN: 50 },
            }));
            expect(mockNavigate).toHaveBeenCalledWith('/challenges/new-challenge-123');
        });
    });

    it('handles API error with general message', async () => {
        const user = userEvent.setup();
        (api.post as ReturnType<typeof vi.fn>).mockRejectedValue({
            response: { data: { message: 'Server error' } },
        });

        renderWithRouter(<CreateChallenge />);

        const checkboxes = screen.getAllByRole('checkbox');
        await user.click(checkboxes[0]);

        const submitButton = screen.getByRole('button', { name: /create challenge/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Server error')).toBeInTheDocument();
        });
    });

    it('navigates back to dashboard when clicking back button', async () => {
        const user = userEvent.setup();
        renderWithRouter(<CreateChallenge />);

        const backButton = screen.getByText('← Back');
        await user.click(backButton);

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
});
