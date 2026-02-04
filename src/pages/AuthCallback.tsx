import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [mismatch, setMismatch] = useState<{
        pendingEmail: string;
        actualEmail: string;
        username: string;
    } | null>(null);

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            navigate('/?error=' + error);
            return;
        }

        if (token) {
            const pendingEmail = localStorage.getItem('pendingEmail');
            const tempToken = token;

            api
                .get('/api/auth/me', {
                    headers: { Authorization: `Bearer ${tempToken}` },
                })
                .then((res) => {
                    localStorage.removeItem('pendingEmail');

                    if (
                        pendingEmail &&
                        pendingEmail.toLowerCase() !== res.data.email.toLowerCase()
                    ) {
                        setMismatch({
                            pendingEmail,
                            actualEmail: res.data.email,
                            username: res.data.username,
                        });
                        return;
                    }

                    localStorage.setItem('token', tempToken);

                    if (res.data.hasPassword) {
                        navigate('/dashboard');
                    } else {
                        navigate('/set-password');
                    }
                })
                .catch(() => {
                    localStorage.setItem('token', tempToken);
                    navigate('/dashboard');
                });
        } else {
            navigate('/');
        }
    }, [searchParams, navigate]);

    if (mismatch) {
        return (
            <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-navy-800/60 border border-navy-600/40 rounded-2xl card-glow p-8">
                        <h2 className="font-display font-semibold text-xl text-red-400 mb-4">
                            Email doesn't match
                        </h2>
                        <p className="text-navy-300 mb-4 font-body">
                            You entered <strong className="text-white">{mismatch.pendingEmail}</strong>, but your
                            Strava account is linked to a different email (
                            <strong className="text-white">{mismatch.actualEmail}</strong>).
                        </p>
                        <p className="text-navy-300 mb-6 font-body">
                            To create an account with{' '}
                            <strong className="text-white">{mismatch.pendingEmail}</strong>, please log out of Strava
                            first, or use the email associated with your Strava account.
                        </p>

                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-accent hover:bg-accent-hover text-white font-display font-semibold py-3 rounded-xl mb-3 transition-all"
                        >
                            Try different email
                        </button>

                        <a
                            href="https://www.strava.com/logout"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center border border-navy-600/50 text-navy-300 font-body py-3 rounded-xl hover:bg-navy-700/30 transition-colors"
                        >
                            Log out of Strava
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-navy-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-navy-400 font-body">Logging in...</p>
            </div>
        </div>
    );
};

export default AuthCallback;