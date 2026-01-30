import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

type SportType = 'RUN' | 'RIDE' | 'SWIM' | 'WALK';

interface User {
    id: string;
    username: string;
    email: string;
    stravaConnected: boolean;
}

interface Participant {
    userId: string;
    username: string;
    goals?: Record<SportType, number>;
    forfeitedAt?: string;
}

interface Challenge {
    id: string;
    name?: string;
    sportTypes: SportType[];
    startAt: string;
    endAt: string;
    status: string;
    participants: Participant[];
    createdBy: { id: string; username: string };
    winnerId?: string;
}

const SPORT_ORDER: SportType[] = ['RUN', 'RIDE', 'SWIM', 'WALK'];

const sortSports = (sports: SportType[]): SportType[] => {
    return [...sports].sort((a, b) => SPORT_ORDER.indexOf(a) - SPORT_ORDER.indexOf(b));
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [leaveId, setLeaveId] = useState<string | null>(null);
    const [leaving, setLeaving] = useState(false);

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

    const handleDelete = async (id: string) => {
        setDeleting(true);
        try {
            await api.delete(`/api/challenges/${id}`);
            setChallenges(challenges.filter(c => c.id !== id));
            setDeleteId(null);
        } catch (err) {
            console.error('Failed to delete challenge', err);
        } finally {
            setDeleting(false);
        }
    };

    const handleLeave = async (id: string) => {
        setLeaving(true);
        try {
            const challenge = challenges.find(c => c.id === id);
            const res = await api.post(`/api/challenges/${id}/leave`);

            if (challenge?.status === 'SCHEDULED') {
                // For SCHEDULED: participant is removed completely
                setChallenges(challenges.filter(c => c.id !== id));
            } else {
                // For ACTIVE: participant is forfeited, update the challenge
                setChallenges(challenges.map(c => c.id === id ? res.data : c));
            }
            setLeaveId(null);
        } catch (err) {
            console.error('Failed to leave challenge', err);
        } finally {
            setLeaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    }

    const sportEmojis: Record<string, string> = {
        RUN: '🏃',
        RIDE: '🚴',
        SWIM: '🏊',
        WALK: '🚶',
    };

    const getParticipantsDisplay = (challenge: Challenge) => {
        if (!user) return '';

        const currentUserParticipant = challenge.participants.find(p => p.userId === user.id);
        const opponent = challenge.participants.find(p => p.userId !== user.id);

        if (currentUserParticipant && opponent) {
            return `${currentUserParticipant.username} vs ${opponent.username}`;
        } else if (currentUserParticipant) {
            return currentUserParticipant.username;
        }

        return challenge.participants.map(p => p.username).join(' vs ');
    };

    const isCreator = (challenge: Challenge) => {
        return user && challenge.createdBy.id === user.id;
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
                            {challenges.map((c) => {
                                const currentParticipant = c.participants.find(p => p.userId === user?.id);
                                const mySports = currentParticipant?.goals
                                    ? sortSports(Object.keys(currentParticipant.goals) as SportType[])
                                    : sortSports(c.sportTypes);

                                return (
                                    <div
                                        key={c.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div
                                                className="flex-1 cursor-pointer"
                                                onClick={() => navigate(`/challenges/${c.id}`)}
                                            >
                                                {/* Row 1: Sport icons + Challenge name */}
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xl flex gap-1">
                                                        {mySports.map((sport, idx) => (
                                                            <span key={idx}>{sportEmojis[sport] || ''}</span>
                                                        ))}
                                                    </span>
                                                    <span className="font-semibold">
                                                        {c.name || 'Challenge'}
                                                    </span>
                                                </div>

                                                {/* Row 2: Participants */}
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <span>{getParticipantsDisplay(c)}</span>
                                                    {c.participants.length < 2 && (
                                                        <span className="text-xs text-gray-400">
                                                            (waiting for opponent)
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Row 3: Dates */}
                                                <p className="text-gray-500 text-sm mt-1">
                                                    {c.startAt} → {c.endAt}
                                                </p>
                                            </div>

                                            {/* Right column: Status + Delete/Leave */}
                                            <div className="flex flex-col items-end gap-2 ml-4">
                                                <span
                                                    className={`px-2 py-1 rounded text-xs w-24 text-center ${
                                                        c.status === 'ACTIVE'
                                                            ? 'bg-green-100 text-green-800'
                                                            : c.status === 'PENDING'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : c.status === 'SCHEDULED'
                                                                    ? 'bg-purple-100 text-purple-800'
                                                                    : c.status === 'COMPLETED'
                                                                        ? 'bg-blue-100 text-blue-800'
                                                                        : c.status === 'EXPIRED'
                                                                            ? 'bg-gray-100 text-gray-500'
                                                                            : c.status === 'CANCELLED'
                                                                                ? 'bg-red-100 text-red-800'
                                                                                : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {c.status}
                                                </span>
                                                {(() => {
                                                    const currentParticipant = c.participants.find(p => p.userId === user?.id);
                                                    const hasForfeited = currentParticipant?.forfeitedAt;
                                                    const isWinner = c.winnerId === user?.id;
                                                    const isTie = c.status === 'COMPLETED' && !c.winnerId;
                                                    const isLoser = c.status === 'COMPLETED' && c.winnerId && c.winnerId !== user?.id;
                                                    const isExpired = c.status === 'EXPIRED';

                                                    // Show status icon for completed/forfeited/expired
                                                    if (isExpired) {
                                                        return <span className="text-gray-400">⏰</span>;
                                                    }
                                                    if (hasForfeited || isLoser) {
                                                        return <span className="text-gray-500">😔</span>;
                                                    }
                                                    if (isWinner) {
                                                        return <span className="text-yellow-500">🏆</span>;
                                                    }
                                                    if (isTie) {
                                                        return <span className="text-blue-500">🤝</span>;
                                                    }

                                                    // Show action buttons for non-completed challenges
                                                    if (isCreator(c)) {
                                                        // Can delete: PENDING, EXPIRED, COMPLETED, or SCHEDULED without opponent
                                                        const canDelete = !hasForfeited && 
                                                            c.status !== 'ACTIVE' &&
                                                            !(c.status === 'SCHEDULED' && c.participants.length > 1);
                                                        
                                                        // Can forfeit: ACTIVE and not already forfeited
                                                        const canForfeit = c.status === 'ACTIVE' && !hasForfeited;

                                                        return (
                                                            <div className="flex flex-col items-end gap-1">
                                                                {canDelete && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setDeleteId(c.id);
                                                                        }}
                                                                        className="text-red-500 hover:text-red-700"
                                                                    >
                                                                        🗑️ Delete
                                                                    </button>
                                                                )}
                                                                {canForfeit && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setLeaveId(c.id);
                                                                        }}
                                                                        className="text-orange-500 hover:text-orange-700"
                                                                    >
                                                                        🚪 Forfeit
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    } else {
                                                        // Opponent can leave SCHEDULED or forfeit ACTIVE
                                                        const canLeave = c.status === 'SCHEDULED' || c.status === 'ACTIVE';
                                                        return canLeave ? (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setLeaveId(c.id);
                                                                }}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                🚪 Leave
                                                            </button>
                                                        ) : null;
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-2">Delete Challenge?</h3>
                        <p className="text-gray-600 mb-4">
                            This action cannot be undone. All progress data will be lost.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteId)}
                                disabled={deleting}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Confirmation Modal */}
            {/* Leave Confirmation Modal */}
            {leaveId && (() => {
                const challenge = challenges.find(c => c.id === leaveId);
                const isScheduled = challenge?.status === 'SCHEDULED';

                return (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                            <h3 className="text-lg font-bold mb-2">Leave Challenge?</h3>
                            <p className="text-gray-600 mb-4">
                                {isScheduled
                                    ? "The challenge hasn't started yet. You can leave without any consequences. The challenge will return to waiting for an opponent."
                                    : "If you leave, you will forfeit this challenge. This action cannot be undone."
                                }
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setLeaveId(null)}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleLeave(leaveId)}
                                    disabled={leaving}
                                    className={`flex-1 text-white py-2 rounded disabled:opacity-50 ${
                                        isScheduled
                                            ? 'bg-orange-500 hover:bg-orange-600'
                                            : 'bg-red-500 hover:bg-red-600'
                                    }`}
                                >
                                    {leaving ? 'Leaving...' : (isScheduled ? 'Leave' : 'Leave & Forfeit')}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default Dashboard;