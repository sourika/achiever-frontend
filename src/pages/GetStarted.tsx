const GetStarted = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    const handleConnectStrava = () => {
        localStorage.removeItem('token');
        window.location.href = apiUrl + '/api/auth/strava?prompt=consent';
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
                <h1 className="text-2xl font-bold mb-2">Create Account</h1>
                <p className="text-gray-600 mb-8">Connect your Strava account to get started</p>

                <button
                    onClick={handleConnectStrava}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg w-full font-semibold"
                >
                    Connect with Strava
                </button>

                <div className="mt-6 pt-6 border-t border-gray-200 text-left">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                        Shared computer? Use browser profiles:
                    </p>
                    <ol className="text-xs text-gray-500 space-y-2 list-decimal list-inside">
                        <li>Click your profile icon (top-right corner of Chrome)</li>
                        <li>Select "Add" or choose your existing profile</li>
                        <li>Each person gets their own profile with separate logins</li>
                    </ol>
                </div>

                <a href="/" className="block mt-6 text-gray-400 hover:text-gray-600 text-sm">
                    Back to home
                </a>
            </div>
        </div>
    );
};

export default GetStarted;