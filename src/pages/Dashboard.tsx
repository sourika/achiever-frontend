import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

interface User {
    id: string;
    username: string;
    email: string;
    stravaConnected: boolean;
}

interface Challenge {
    id: string;
    sportType: string;
    startAt: string;
    endAt: string;
    status: string;
    participants: { username: string }[];
}

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/api/auth/me'),
            api.get('/api/challenges/my'),
        ])
            .then(([userRes, challengesRes]) => {
                setUser(userRes.data);
                setChallenges(challengesRes.data);
            })
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

    const sportLabels: Record<string, string> = {
        RUN: '🏃',
        RIDE: '🚴',
        SWIM: '🏊',
        WALK: '🚶',
    };

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
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Your Challenges</h2>
                        <button
                            onClick={() => navigate('/challenges/new')}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
                        >
                            + New Challenge
                        </button>
                    </div>

                    {challenges.length === 0 ? (
                        <p className="text-gray-500">No challenges yet. Create one!</p>
                    ) : (
                        <div className="space-y-3">
                            {challenges.map((c) => (
                                <div
                                    key={c.id}
                                    onClick={() => navigate(`/challenges/${c.id}`)}
                                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-xl mr-2">{sportLabels[c.sportType]}</span>
                                            <span className="font-medium">
                        {c.participants.map((p) => p.username).join(' vs ')}
                      </span>
                                        </div>
                                        <span
                                            className={`px-2 py-1 rounded text-xs ${
                                                c.status === 'ACTIVE'
                                                    ? 'bg-green-100 text-green-800'
                                                    : c.status === 'PENDING'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                      {c.status}
                    </span>
                                    </div>
                                    <p className="text-gray-500 text-sm mt-1">
                                        {c.startAt} → {c.endAt}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;