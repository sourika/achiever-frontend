import { useNavigate, useLocation } from 'react-router-dom';

const LoginNotFound = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    const handleCreateAccount = () => {
        localStorage.setItem('pendingEmail', email);
        localStorage.removeItem('token');
        window.location.href = `${apiUrl}/api/auth/strava?prompt=consent&email=${encodeURIComponent(email)}`;
    };

    return (
        <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-navy-800/60 border border-navy-600/40 rounded-2xl card-glow p-8">
                    <button onClick={() => navigate('/')} className="text-navy-300 hover:text-navy-200 mb-4 text-sm font-body">
                        ← Back
                    </button>
                    <h2 className="font-display font-semibold text-xl text-red-400 mb-2">Email not found</h2>
                    <p className="text-navy-300 mb-6 font-body">
                        The email <strong className="text-white">{email}</strong> is not associated with an Achiever account.
                    </p>
                    <button
                        onClick={handleCreateAccount}
                        className="w-full bg-accent hover:bg-accent-hover text-white font-display font-semibold
                                   py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-accent/20"
                    >
                        Create account
                    </button>
                    <p className="text-center text-navy-300 text-sm mt-4 font-body">
                        You'll connect with Strava to create your account
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginNotFound;