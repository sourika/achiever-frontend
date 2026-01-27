import { useNavigate, useLocation } from 'react-router-dom';

const LoginNotFound = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

    const handleCreateAccount = () => {
        localStorage.setItem('pendingEmail', email);
        localStorage.removeItem('token');
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

                    <h2 className="text-xl font-semibold text-red-600 mb-2">
                        Email not found
                    </h2>
                    <p className="text-gray-600 mb-6">
                        The email <strong>{email}</strong> is not associated with an Achiever account.
                    </p>

                    <button
                        onClick={handleCreateAccount}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg"
                    >
                        Create account
                    </button>

                    <p className="text-center text-gray-500 text-sm mt-4">
                        You'll connect with Strava to create your account
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginNotFound;