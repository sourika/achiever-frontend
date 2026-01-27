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
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-lg shadow-md p-8">
                        <h2 className="text-xl font-semibold text-red-600 mb-4">
                            Email doesn't match
                        </h2>
                        <p className="text-gray-600 mb-4">
                            You entered <strong>{mismatch.pendingEmail}</strong>, but your
                            Strava account is linked to a different email (
                            <strong>{mismatch.actualEmail}</strong>).
                        </p>
                        <p className="text-gray-600 mb-6">
                            To create an account with{' '}
                            <strong>{mismatch.pendingEmail}</strong>, please log out of Strava
                            first, or use the email associated with your Strava account.
                        </p>

                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg mb-3"
                        >
                            Try different email
                        </button>

                        <a
                        href="https://www.strava.com/logout"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50"
                        >
                        Log out of Strava
                    </a>
                </div>
            </div>
    </div>
    );
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Logging in...</p>
        </div>
    );
};

export default AuthCallback;