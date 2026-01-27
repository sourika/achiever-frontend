import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const SetPassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/api/auth/set-password', { password });
            navigate('/dashboard');
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { error?: string } } };
            setError(axiosError.response?.data?.error || 'Failed to set password');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-xl font-semibold mb-2">Set a password</h2>
                    <p className="text-gray-600 mb-6">
                        Create a password so you can sign in without Strava next time.
                    </p>

                    <form onSubmit={handleSetPassword} className="space-y-4">
                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="New password"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>

                        <div>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm password"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Set password'}
                        </button>
                    </form>

                    <button
                        onClick={handleSkip}
                        className="w-full mt-3 text-gray-500 hover:text-gray-700 py-2"
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SetPassword;