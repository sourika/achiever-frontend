import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';

const LoginPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!email) navigate('/');
    }, [email, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/api/auth/login', { email, password });
            localStorage.setItem('token', response.data.token);
            navigate('/dashboard');
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { error?: string } } };
            setError(axiosError.response?.data?.error || 'Invalid password');
        } finally {
            setLoading(false);
        }
    };

    if (!email) return null;

    return (
        <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-navy-800/60 border border-navy-600/40 rounded-2xl card-glow p-8">
                    <button onClick={() => navigate('/')} className="text-navy-400 hover:text-navy-200 mb-4 text-sm font-body">
                        ← Back
                    </button>
                    <h2 className="font-display font-semibold text-xl text-white mb-2">Welcome back!</h2>
                    <p className="text-navy-400 mb-6 font-body">{email}</p>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
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
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPassword;
