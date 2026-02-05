import { useNavigate, useLocation } from 'react-router-dom';

const LoginSetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';

    const handleConnectStrava = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/strava?prompt=consent`;
    };

    return (
        <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-navy-800/60 border border-navy-600/40 rounded-2xl card-glow p-8">
                    <button onClick={() => navigate('/')} className="text-navy-300 hover:text-navy-200 mb-4 text-sm font-body">
                        ← Back
                    </button>
                    <h2 className="font-display font-semibold text-xl text-white mb-2">Account found!</h2>
                    <p className="text-navy-300 mb-6 font-body">
                        We found an account for <strong className="text-white">{email}</strong>, but you haven't set a password yet.
                        Please sign in with Strava to continue.
                    </p>
                    <button
                        onClick={handleConnectStrava}
                        className="w-full bg-accent hover:bg-accent-hover text-white font-display font-semibold 
                                   py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-accent/20"
                    >
                        Continue with Strava
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginSetPassword;
