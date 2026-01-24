import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface User {
    id: string;
    username: string;
    email: string;
    stravaConnected: boolean;
}

const Dashboard = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/auth/me')
            .then(res => setUser(res.data))
            .catch(() => {
                localStorage.removeItem('token');
                window.location.href = '/';
            })
            .finally(() => setLoading(false));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold">Welcome, {user?.username}!</h1>
                            <p className="text-gray-600">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4">Your Challenges</h2>
                    <p className="text-gray-500">No active challenges yet.</p>
                    <button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded">
                        Create Challenge
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;