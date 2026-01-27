import { useNavigate, useLocation } from 'react-router-dom';

const LoginSetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

    const handleConnectStrava = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/strava?prompt=consent`;
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-500 hover:text-gray-700 mb-4"
                    >
                        ← Back
                    </button>

                    <h2 className="text-xl font-semibold mb-2">Account found!</h2>
                    <p className="text-gray-600 mb-6">
                        We found an account for <strong>{email}</strong>, but you haven't set a password yet.
                        Please sign in with Strava to continue.
                    </p>

                    <button
                        onClick={handleConnectStrava}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg"
                    >
                        Continue with Strava
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginSetPassword;