import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const Home = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
        <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
            </div>

            <div className="max-w-md w-full relative z-10">
                <div className="bg-navy-800/60 border border-navy-600/40 rounded-2xl card-glow p-8">
                    <div className="text-center mb-8">
                        <h1 className="font-display font-bold text-4xl text-white mb-2">
                            <span className="text-accent">A</span>chiever
                        </h1>
                        <p className="text-navy-300 font-body">
                            Compete in fitness challenges with friends
                        </p>
                    </div>

                    <h2 className="font-display font-semibold text-lg text-white text-center mb-6">
                        Enter your email to sign in
                    </h2>

                    <form onSubmit={handleContinue} className="space-y-4">
                        <div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full bg-navy-900/80 border border-navy-600/50 text-white placeholder-navy-500
                                           rounded-xl px-4 py-3 font-body
                                           focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50
                                           transition-all"
                            />
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm font-body">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent hover:bg-accent-hover text-white font-display font-semibold 
                                       py-3 rounded-xl disabled:opacity-50 transition-all duration-200
                                       hover:shadow-lg hover:shadow-accent/20"
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
