import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

interface Challenge {
    id: string;
    sportType: string;
    startAt: string;
    endAt: string;
    status: string;
    createdBy: { username: string };
    participants: { username: string; goalValue: number }[];
}

const JoinChallenge = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [goalValue, setGoalValue] = useState(10000);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadChallenge = async () => {
            try {
                const res = await api.get(`/api/challenges/invite/${code}`);
                setChallenge(res.data);
                if (res.data.participants.length > 0) {
                    setGoalValue(res.data.participants[0].goalValue);
                }
            } catch {
                setError('Invalid or expired invite link');
            } finally {
                setLoading(false);
            }
        };

        void loadChallenge();
    }, [code]);


    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setJoining(true);
        setError('');

        const token = localStorage.getItem('token');
        if (!token) {
            localStorage.setItem('pendingJoin', code || '');
            navigate('/');
            return;
        }

        try {
            const res = await api.post(`/api/challenges/invite/${code}/join`, { goalValue });
            navigate(`/challenges/${res.data.id}`);
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { message?: string } } };
            setError(axiosError.response?.data?.message || 'Failed to join challenge');
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    }

    if (error && !challenge) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
                    <h1 className="text-xl font-bold text-red-600 mb-4">Invalid Link</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    const sportLabels: Record<string, string> = {
        RUN: '🏃 Running',
        RIDE: '🚴 Cycling',
        SWIM: '🏊 Swimming',
        WALK: '🚶 Walking',
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
                <h1 className="text-2xl font-bold mb-2">Join Challenge</h1>
                <p className="text-gray-600 mb-6">
                    {challenge?.createdBy.username} invited you to compete!
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="font-medium">{sportLabels[challenge?.sportType || '']}</p>
                    <p className="text-gray-600 text-sm">
                        {challenge?.startAt} → {challenge?.endAt}
                    </p>
                </div>

                <form onSubmit={handleJoin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Your Goal (km)
                        </label>
                        <input
                            type="number"
                            value={goalValue / 1000}
                            onChange={(e) => setGoalValue(Number(e.target.value) * 1000)}
                            min="1"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button
                        type="submit"
                        disabled={joining}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg disabled:opacity-50"
                    >
                        {joining ? 'Joining...' : 'Join Challenge'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default JoinChallenge;