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
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }
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

    return (
        <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-navy-800/60 border border-navy-600/40 rounded-2xl card-glow p-8">
                    <h2 className="font-display font-semibold text-xl text-white mb-2">Set a password</h2>
                    <p className="text-navy-300 mb-6 font-body">
                        Create a password so you can sign in without Strava next time.
                    </p>
                    <form onSubmit={handleSetPassword} className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="New password"
                            className="w-full bg-navy-900/80 border border-navy-600/50 text-white placeholder-navy-400
                                       rounded-xl px-4 py-3 font-body focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                            className="w-full bg-navy-900/80 border border-navy-600/50 text-white placeholder-navy-400
                                       rounded-xl px-4 py-3 font-body focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                        {error && <p className="text-red-400 text-sm font-body">{error}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent hover:bg-accent-hover text-white font-display font-semibold 
                                       py-3 rounded-xl disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-accent/20"
                        >
                            {loading ? 'Saving...' : 'Set password'}
                        </button>
                    </form>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full mt-3 text-navy-500 hover:text-navy-300 py-2 font-body text-sm transition-colors"
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SetPassword;
