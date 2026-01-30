import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const Home = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Check if already logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleContinue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setError('Please enter your email');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await api.get(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
            const { exists, hasPassword } = response.data;

            if (exists && hasPassword) {
                navigate('/login/password', { state: { email } });
            } else if (exists && !hasPassword) {
                navigate('/login/set-password', { state: { email } });
            } else {
                navigate('/login/not-found', { state: { email } });
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-orange-500 mb-2">Achiever</h1>
                        <p className="text-gray-600">Compete in fitness challenges with friends</p>
                    </div>

                    <h2 className="text-xl font-semibold text-center mb-6">
                        Enter your email to sign in
                    </h2>

                    <form onSubmit={handleContinue} className="space-y-4">
                        <div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
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
                            {loading ? 'Checking...' : 'Continue'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Home;