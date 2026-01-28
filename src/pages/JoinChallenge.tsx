import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

type SportType = 'RUN' | 'RIDE' | 'SWIM' | 'WALK';

interface Participant {
    username: string;
    goals: Record<SportType, number>;
}

interface Challenge {
    id: string;
    name?: string;
    sportTypes: SportType[];
    startAt: string;
    endAt: string;
    status: string;
    createdBy: { username: string };
    participants: Participant[];
}

interface SportConfig {
    type: SportType;
    label: string;
    emoji: string;
    unit: string;
}

const SPORTS: SportConfig[] = [
    { type: 'RUN', label: 'Running', emoji: '🏃', unit: 'km' },
    { type: 'RIDE', label: 'Cycling', emoji: '🚴', unit: 'km' },
    { type: 'SWIM', label: 'Swimming', emoji: '🏊', unit: 'km' },
    { type: 'WALK', label: 'Walking', emoji: '🚶', unit: 'km' },
];

// Consistent sort order for sports
const SPORT_ORDER: SportType[] = ['RUN', 'RIDE', 'SWIM', 'WALK'];

const sortSports = (sports: SportType[]): SportType[] => {
    return [...sports].sort((a, b) => SPORT_ORDER.indexOf(a) - SPORT_ORDER.indexOf(b));
};

const JoinChallenge = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [goals, setGoals] = useState<Record<SportType, number>>({
        RUN: 50,
        RIDE: 100,
        SWIM: 5,
        WALK: 30,
    });
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadChallenge = async () => {
            try {
                const res = await api.get(`/api/challenges/invite/${code}`);
                setChallenge(res.data);

                // Set initial goals based on creator's goals (as suggestion)
                if (res.data.participants.length > 0) {
                    const creatorGoals = res.data.participants[0].goals;
                    if (creatorGoals) {
                        setGoals(prev => {
                            const newGoals = { ...prev };
                            Object.keys(creatorGoals).forEach((sport) => {
                                newGoals[sport as SportType] = creatorGoals[sport];
                            });
                            return newGoals;
                        });
                    }
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

        // Build goals object with only challenge sports
        const goalsToSend: Record<string, number> = {};
        challenge?.sportTypes.forEach((sport) => {
            goalsToSend[sport] = goals[sport];
        });

        try {
            const res = await api.post(`/api/challenges/invite/${code}/join`, { goals: goalsToSend });
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

    const sortedSports = challenge ? sortSports(challenge.sportTypes) : [];

    const getSportLabel = (sport: SportType) => {
        const config = SPORTS.find(s => s.type === sport);
        return config ? `${config.emoji} ${config.label}` : sport;
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
                <h1 className="text-2xl font-bold mb-2">Join Challenge</h1>
                <p className="text-gray-600 mb-6">
                    {challenge?.createdBy.username} invited you to compete!
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl flex gap-1">
                            {sortedSports.map((sport, idx) => {
                                const config = SPORTS.find(s => s.type === sport);
                                return <span key={idx}>{config?.emoji}</span>;
                            })}
                        </span>
                        <span className="font-medium">
                            {challenge?.name || 'Challenge'}
                        </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                        {challenge?.startAt} → {challenge?.endAt}
                    </p>
                </div>

                <form onSubmit={handleJoin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Set Your Goals
                        </label>
                        <div className="space-y-3">
                            {sortedSports.map((sport) => {
                                const config = SPORTS.find(s => s.type === sport);
                                return (
                                    <div
                                        key={sport}
                                        className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
                                    >
                                        <span>{getSportLabel(sport)}</span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={goals[sport]}
                                                onChange={(e) => setGoals({ ...goals, [sport]: Number(e.target.value) })}
                                                min="1"
                                                className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-center"
                                            />
                                            <span className="text-gray-600 text-sm">{config?.unit}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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