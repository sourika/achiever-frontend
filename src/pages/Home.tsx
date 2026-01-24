import { useSearchParams } from 'react-router-dom';

const Home = () => {
    const [searchParams] = useSearchParams();
    const token = localStorage.getItem('token');
    const error = searchParams.get('error');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    const handleSignIn = () => {
        window.location.href = apiUrl + '/api/auth/strava';
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.reload();
    };

    if (token) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
                    <h1 className="text-3xl font-bold mb-2">Achiever</h1>
                    <p className="text-gray-600 mb-8">Fitness challenges with friends</p>
                    <div className="space-y-3">
                        <a href="/dashboard" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg inline-block w-full">
                            Go to Dashboard
                        </a>
                        <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700 text-sm">
                            Logout / Switch Account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
                <h1 className="text-3xl font-bold mb-2">Achiever</h1>
                <p className="text-gray-600 mb-8">Fitness challenges with friends</p>
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                        Authorization cancelled. Please try again.
                    </div>
                )}
                <div className="space-y-4">
                    <a href="/get-started" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg w-full font-semibold block">
                        Get Started
                    </a>
                    <button onClick={handleSignIn} className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg w-full">
                        Sign In
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Home;