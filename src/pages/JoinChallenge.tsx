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
    defaultGoal: number;
}

const SPORTS: SportConfig[] = [
    { type: 'RUN', label: 'Running', emoji: '🏃', unit: 'km', defaultGoal: 50 },
    { type: 'RIDE', label: 'Cycling', emoji: '🚴', unit: 'km', defaultGoal: 100 },
    { type: 'SWIM', label: 'Swimming', emoji: '🏊', unit: 'km', defaultGoal: 5 },
    { type: 'WALK', label: 'Walking', emoji: '🚶', unit: 'km', defaultGoal: 30 },
];

const SPORT_ORDER: SportType[] = ['RUN', 'RIDE', 'SWIM', 'WALK'];

const sortSports = (sports: SportType[]): SportType[] => {
    return [...sports].sort((a, b) => SPORT_ORDER.indexOf(a) - SPORT_ORDER.indexOf(b));
};

const JoinChallenge = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [selectedSports, setSelectedSports] = useState<Set<SportType>>(new Set());
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

                // Pre-select creator's sports and set their goals as defaults
                const creatorSports = new Set<SportType>(res.data.sportTypes);
                setSelectedSports(creatorSports);

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

    const toggleSport = (sportType: SportType) => {
        const newSelected = new Set(selectedSports);
        if (newSelected.has(sportType)) {
            newSelected.delete(sportType);
        } else {
            newSelected.add(sportType);
        }
        setSelectedSports(newSelected);
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedSports.size === 0) {
            setError('Please select at least one sport');
            return;
        }

        setJoining(true);
        setError('');

        const token = localStorage.getItem('token');
        if (!token) {
            localStorage.setItem('pendingJoin', code || '');
            navigate('/');
            return;
        }

        // Build goals object with only selected sports
        const goalsToSend: Record<string, number> = {};
        selectedSports.forEach((sport) => {
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

    // Check if challenge has expired (status EXPIRED or endAt passed)
    const isExpired = challenge && (
        challenge.status === 'EXPIRED' || 
        new Date(challenge.endAt) < new Date(new Date().toDateString())
    );
    
    if (isExpired) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
                    <h1 className="text-xl font-bold text-gray-600 mb-4">⏰ Challenge Expired</h1>
                    <p className="text-gray-600 mb-6">
                        This challenge ended on {challenge?.endAt}. You can no longer join.
                    </p>
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

    // Check if challenge is already full
    const isFull = challenge && challenge.participants.length >= 2;
    
    if (isFull) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
                    <h1 className="text-xl font-bold text-gray-600 mb-4">Challenge Full</h1>
                    <p className="text-gray-600 mb-6">
                        This challenge already has the maximum number of participants.
                    </p>
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

    const sortedCreatorSports = challenge ? sortSports(challenge.sportTypes) : [];

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
                            {sortedCreatorSports.map((sport, idx) => {
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
                    <p className="text-gray-500 text-xs mt-2">
                        Creator's sports: {sortedCreatorSports.map(s => SPORTS.find(sp => sp.type === s)?.label).join(', ')}
                    </p>
                </div>

                <form onSubmit={handleJoin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select Your Sports & Goals
                        </label>
                        <div className="space-y-3">
                            {SPORTS.map((sport) => {
                                const isSelected = selectedSports.has(sport.type);
                                const isCreatorSport = challenge?.sportTypes.includes(sport.type);
                                return (
                                    <div
                                        key={sport.type}
                                        className={`border rounded-lg p-3 ${
                                            isSelected
                                                ? 'border-orange-500 bg-orange-50'
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 cursor-pointer flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSport(sport.type)}
                                                    className="w-5 h-5 rounded text-orange-500"
                                                />
                                                <span className="text-lg">{sport.emoji}</span>
                                                <span>{sport.label}</span>
                                                {isCreatorSport && (
                                                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                                        Creator's pick
                                                    </span>
                                                )}
                                            </label>
                                        </div>
                                        {isSelected && (
                                            <div className="mt-2 flex items-center gap-2 ml-7">
                                                <input
                                                    type="number"
                                                    value={goals[sport.type] || ''}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value, 10);
                                                        setGoals({ ...goals, [sport.type]: isNaN(val) ? 0 : val });
                                                    }}
                                                    min="1"
                                                    className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-center"
                                                />
                                                <span className="text-gray-600 text-sm">{sport.unit}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button
                        type="submit"
                        disabled={joining || selectedSports.size === 0}
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