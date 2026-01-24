import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            // Пользователь нажал Cancel или произошла ошибка
            navigate('/?error=' + error);
            return;
        }

        if (token) {
            localStorage.setItem('token', token);
            navigate('/dashboard');
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