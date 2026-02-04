const GetStarted = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    const handleConnectStrava = () => {
        localStorage.removeItem('token');
        window.location.href = apiUrl + '/api/auth/strava?prompt=consent';
    };

    return (
        <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
            <div className="bg-navy-800/60 border border-navy-600/40 rounded-2xl card-glow p-8 text-center max-w-md">
                <h1 className="font-display font-bold text-2xl text-white mb-2">Create Account</h1>
                <p className="text-navy-300 mb-8 font-body">Connect your Strava account to get started</p>

                <button
                    onClick={handleConnectStrava}
                    className="w-full bg-accent hover:bg-accent-hover text-white font-display font-semibold 
                               px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-accent/20"
                >
                    Connect with Strava
                </button>

                <div className="mt-6 pt-6 border-t border-navy-700/50 text-left">
                    <p className="text-sm font-medium text-navy-300 mb-3 font-body">
                        Shared computer? Use browser profiles:
                    </p>
                    <ol className="text-xs text-navy-500 space-y-2 list-decimal list-inside font-body">
                        <li>Click your profile icon (top-right corner of Chrome)</li>
                        <li>Select "Add" or choose your existing profile</li>
                        <li>Each person gets their own profile with separate logins</li>
                    </ol>
                </div>

                <a href="/" className="block mt-6 text-navy-500 hover:text-navy-300 text-sm font-body transition-colors">
                    Back to home
                </a>
            </div>
        </div>
    );
};

export default GetStarted;
