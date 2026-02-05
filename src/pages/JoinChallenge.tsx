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
const sortSports = (sports: SportType[]): SportType[] =>
    [...sports].sort((a, b) => SPORT_ORDER.indexOf(a) - SPORT_ORDER.indexOf(b));

const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const JoinChallenge = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [selectedSports, setSelectedSports] = useState<Set<SportType>>(new Set());
    const [goals, setGoals] = useState<Record<SportType, number>>({
        RUN: 50, RIDE: 100, SWIM: 5, WALK: 30,
    });
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadChallenge = async () => {
            try {
                const res = await api.get(`/api/challenges/invite/${code}`);
                setChallenge(res.data);
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
        if (newSelected.has(sportType)) newSelected.delete(sportType);
        else newSelected.add(sportType);
        setSelectedSports(newSelected);
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedSports.size === 0) { setError('Please select at least one sport'); return; }
        setJoining(true);
        setError('');
        const token = localStorage.getItem('token');
        if (!token) {
            localStorage.setItem('pendingJoin', code || '');
            navigate('/');
            return;
        }
        const goalsToSend: Record<string, number> = {};
        selectedSports.forEach((sport) => { goalsToSend[sport] = goals[sport]; });
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
            <div className="min-h-screen flex items-center justify-center bg-navy-950">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <span className="text-navy-300 text-sm font-body">Loading...</span>
                </div>
            </div>
        );
    }

    if (error && !challenge) {
        return (
            <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
                <div className="bg-navy-800/60 border border-navy-600/40 rounded-2xl card-glow p-8 max-w-md w-full text-center">
                    <h1 className="font-display font-bold text-xl text-red-400 mb-4">Invalid Link</h1>
                    <p className="text-navy-300 mb-6 font-body">{error}</p>
                    <button onClick={() => navigate('/')}
                        className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-xl font-display font-semibold transition-all">
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    const isExpired = challenge && (
        challenge.status === 'EXPIRED' || new Date(challenge.endAt) < new Date(new Date().toDateString())
    );

    if (isExpired) {
        return (
            <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
                <div className="bg-navy-800/60 border border-navy-600/40 rounded-2xl card-glow p-8 max-w-md w-full text-center">
                    <h1 className="font-display font-bold text-xl text-gray-400 mb-4">Challenge Expired</h1>
                    <p className="text-navy-300 mb-6 font-body">
                        This challenge ended on {challenge?.endAt ? formatDate(challenge.endAt) : ''}. You can no longer join.
                    </p>
                    <button onClick={() => navigate('/')}
                        className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-xl font-display font-semibold transition-all">
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    const isFull = challenge && challenge.participants.length >= 2;
    if (isFull) {
        return (
            <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
                <div className="bg-navy-800/60 border border-navy-600/40 rounded-2xl card-glow p-8 max-w-md w-full text-center">
                    <h1 className="font-display font-bold text-xl text-navy-300 mb-4">Challenge Full</h1>
                    <p className="text-navy-300 mb-6 font-body">
                        This challenge already has the maximum number of participants.
                    </p>
                    <button onClick={() => navigate('/')}
                        className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-xl font-display font-semibold transition-all">
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    const sortedCreatorSports = challenge ? sortSports(challenge.sportTypes) : [];

    return (
        <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
            <div className="bg-navy-800/60 border border-navy-600/40 rounded-2xl card-glow p-8 max-w-md w-full">
                <h1 className="font-display font-bold text-2xl text-white mb-2">Join Challenge</h1>
                <p className="text-navy-300 mb-6 font-body">
                    {challenge?.createdBy.username} invited you to compete!
                </p>

                {/* Challenge info card */}
                <div className="bg-navy-900/50 border border-navy-700/30 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl flex gap-1">
                            {sortedCreatorSports.map((sport, idx) => {
                                const config = SPORTS.find(s => s.type === sport);
                                return <span key={idx}>{config?.emoji}</span>;
                            })}
                        </span>
                        <span className="font-display font-medium text-white">
                            {challenge?.name || 'Challenge'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                        <svg className="w-3.5 h-3.5 text-navy-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-navy-300 text-sm font-body">
                            {challenge?.startAt ? formatDate(challenge.startAt) : ''} – {challenge?.endAt ? formatDate(challenge.endAt) : ''}
                        </span>
                    </div>
                    <p className="text-navy-500 text-xs font-body">
                        Creator's sports: {sortedCreatorSports.map(s => SPORTS.find(sp => sp.type === s)?.label).join(', ')}
                    </p>
                </div>

                <form onSubmit={handleJoin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-navy-300 mb-3 font-body">
                            Select Your Sports & Goals
                        </label>
                        <div className="space-y-3">
                            {SPORTS.map((sport) => {
                                const isSelected = selectedSports.has(sport.type);
                                const isCreatorSport = challenge?.sportTypes.includes(sport.type);
                                return (
                                    <div key={sport.type}
                                        className={`border rounded-xl p-3 transition-all cursor-pointer ${
                                            isSelected
                                                ? 'border-accent/50 bg-accent/5'
                                                : 'border-navy-600/40 bg-navy-800/30'
                                        }`}
                                        onClick={() => toggleSport(sport.type)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 cursor-pointer flex-1">
                                                <input type="checkbox" checked={isSelected} onChange={() => {}}
                                                    className="w-5 h-5 rounded bg-navy-900 border-navy-500 text-accent" />
                                                <span className="text-lg">{sport.emoji}</span>
                                                <span className="text-white font-body">{sport.label}</span>
                                                {isCreatorSport && (
                                                    <span className="text-xs bg-navy-700 text-navy-300 px-2 py-0.5 rounded font-body">
                                                        Creator's pick
                                                    </span>
                                                )}
                                            </label>
                                        </div>
                                        {isSelected && (
                                            <div className="mt-2 flex items-center gap-2 ml-7" onClick={(e) => e.stopPropagation()}>
                                                <input type="number" value={goals[sport.type] || ''}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value, 10);
                                                        setGoals({ ...goals, [sport.type]: isNaN(val) ? 0 : val });
                                                    }}
                                                    min="1"
                                                    className="w-20 bg-navy-900/80 border border-navy-600/50 text-white rounded-lg 
                                                               px-2 py-1 text-center font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                                                />
                                                <span className="text-navy-300 text-sm font-body">{sport.unit}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-sm font-body">{error}</p>}

                    <button type="submit" disabled={joining || selectedSports.size === 0}
                        className="w-full bg-accent hover:bg-accent-hover text-white font-display font-semibold 
                                   py-3 rounded-xl disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-accent/20">
                        {joining ? 'Joining...' : 'Join Challenge'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default JoinChallenge;
