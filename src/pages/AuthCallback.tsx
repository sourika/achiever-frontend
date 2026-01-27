import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            navigate('/?error=' + error);
            return;
        }

        if (token) {
            localStorage.setItem('token', token);

            // Check if user has password
            api.get('/api/auth/me')
                .then(res => {
                    if (res.data.hasPassword) {
                        navigate('/dashboard');
                    } else {
                        navigate('/set-password');
                    }
                })
                .catch(() => {
                    navigate('/dashboard');
                });
        } else {
            navigate('/');
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Logging in...</p>
        </div>
    );
};

export default AuthCallback;