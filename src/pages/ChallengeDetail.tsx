import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

type SportType = 'RUN' | 'RIDE' | 'SWIM' | 'WALK';

interface Participant {
    userId: string;
    username: string;
    goals: Record<SportType, number>;
    forfeitedAt?: string;
}

interface Challenge {
    id: string;
    name?: string;
    inviteCode: string;
    sportTypes: SportType[];
    startAt: string;
    endAt: string;
    status: string;
    createdBy: { id: string; username: string };
    participants: Participant[];
    winnerId?: string;
}

interface ParticipantProgress {
    userId: string;
    username: string;
    goals: Record<SportType, number>;
    currentDistances: Record<SportType, number>;
    sportProgressPercents: Record<SportType, number>;
    overallProgressPercent: number;
}

interface Progress {
    challengeId: string;
    status: string;
    sportTypes: SportType[];
    participants: ParticipantProgress[];
}

interface User {
    id: string;
    username: string;
}

const ChallengeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [copied, setCopied] = useState(false);

    // Edit name state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [saving, setSaving] = useState(false);

    // Delete state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Leave state
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [leaving, setLeaving] = useState(false);

    // Finish state
    const [finishing, setFinishing] = useState(false);

    useEffect(() => {
        const loadChallenge = async () => {
            try {
                const [challengeRes, progressRes, userRes] = await Promise.all([
                    api.get(`/api/challenges/${id}`),
                    api.get(`/api/challenges/${id}/progress`),
                    api.get('/api/auth/me'),
                ]);
                setChallenge(challengeRes.data);
                setProgress(progressRes.data);
                setUser(userRes.data);
                setEditName(challengeRes.data.name || '');
            } catch {
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };

        void loadChallenge();
    }, [id, navigate]);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await api.post(`/api/challenges/${id}/sync`);
            setProgress(res.data);
        } finally {
            setSyncing(false);
        }
    };

    const copyInviteLink = () => {
        const link = `${window.location.origin}/join/${challenge?.inviteCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveName = async () => {
        setSaving(true);
        try {
            const res = await api.patch(`/api/challenges/${id}`, { name: editName || null });
            setChallenge(res.data);
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update name', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/api/challenges/${id}`);
            navigate('/dashboard');
        } catch (err) {
            console.error('Failed to delete challenge', err);
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleLeave = async () => {
        setLeaving(true);
        try {
            await api.post(`/api/challenges/${id}/leave`);
            navigate('/dashboard');
        } catch (err) {
            console.error('Failed to leave challenge', err);
            setLeaving(false);
            setShowLeaveConfirm(false);
        }
    };

    const handleFinish = async () => {
        setFinishing(true);
        try {
            const res = await api.post(`/api/challenges/${id}/finish`);
            setChallenge(res.data);
        } catch (err) {
            console.error('Failed to finish challenge', err);
        } finally {
            setFinishing(false);
        }
    };

    const isCreator = user && challenge && user.id === challenge.createdBy.id;

    // Check if current user has forfeited
    const currentUserForfeited = user && challenge?.participants.find(
        p => p.userId === user.id
    )?.forfeitedAt;

    // Check if opponent has forfeited
    const opponent = user && challenge?.participants.find(p => p.userId !== user.id);
    const opponentForfeited = opponent?.forfeitedAt;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    }

    if (!challenge) return null;

    const sportConfig: Record<SportType, { emoji: string; label: string }> = {
        RUN: { emoji: '🏃', label: 'Running' },
        RIDE: { emoji: '🚴', label: 'Cycling' },
        SWIM: { emoji: '🏊', label: 'Swimming' },
        WALK: { emoji: '🚶', label: 'Walking' },
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-gray-500 hover:text-gray-700 mb-4"
                >
                    ← Back to Dashboard
                </button>

                {/* User forfeited banner */}
                {currentUserForfeited && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800 font-medium text-center">
                            😔 You left this challenge
                        </p>
                    </div>
                )}

                {/* Challenge completed - show winner */}
                {challenge.status === 'COMPLETED' && challenge.winnerId && (
                    <div className={`border rounded-lg p-4 mb-6 ${
                        challenge.winnerId === user?.id
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                    }`}>
                        <p className={`font-medium text-center text-lg ${
                            challenge.winnerId === user?.id
                                ? 'text-green-800'
                                : 'text-gray-800'
                        }`}>
                            {challenge.winnerId === user?.id
                                ? '🏆 Congratulations! You won!'
                                : `🏁 Challenge ended. Winner: ${challenge.participants.find(p => p.userId === challenge.winnerId)?.username}`
                            }
                        </p>
                    </div>
                )}

                {/* Challenge completed - tie */}
                {challenge.status === 'COMPLETED' && !challenge.winnerId && !opponentForfeited && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-blue-800 font-medium text-center text-lg">
                            🤝 It's a tie!
                        </p>
                    </div>
                )}

                {/* Opponent left banner - for creator */}
                {isCreator && opponentForfeited && challenge.status !== 'COMPLETED' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p className="text-yellow-800 font-medium mb-3">
                            Your opponent ({opponent?.username}) has left the challenge.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleFinish}
                                disabled={finishing}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded disabled:opacity-50"
                            >
                                {finishing ? 'Finishing...' : '🏆 Finish & Win'}
                            </button>
                            <button
                                onClick={() => {/* just dismiss, continue normally */}}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded"
                            >
                                Continue Solo
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            {/* Editable name */}
                            {isEditing ? (
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value.slice(0, 50))}
                                        placeholder="Challenge name"
                                        maxLength={50}
                                        className="text-2xl font-bold border border-gray-300 rounded px-2 py-1 flex-1"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSaveName}
                                        disabled={saving}
                                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                                    >
                                        {saving ? '...' : '✓'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditName(challenge.name || '');
                                        }}
                                        className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded text-sm"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mb-2">
                                    <h1 className="text-2xl font-bold">
                                        {challenge.name || 'Challenge'}
                                    </h1>
                                    {isCreator && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="text-gray-400 hover:text-gray-600 text-sm"
                                            title="Edit name"
                                        >
                                            ✏️
                                        </button>
                                    )}
                                </div>
                            )}
                            <p className="text-gray-600">
                                {challenge.startAt} → {challenge.endAt}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {Object.keys(
                                    challenge.participants.find(p => p.userId === user?.id)?.goals || {}
                                ).map(sport => {
                                    const sportType = sport as SportType;
                                    return (
                                        <span
                                            key={sport}
                                            className="bg-gray-100 px-2 py-1 rounded text-sm"
                                        >
                                            {sportConfig[sportType]?.emoji} {sportConfig[sportType]?.label}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span
                                className={`px-3 py-1 rounded-full text-sm ${
                                    challenge.status === 'ACTIVE'
                                        ? 'bg-green-100 text-green-800'
                                        : challenge.status === 'PENDING'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : challenge.status === 'SCHEDULED'
                                                ? 'bg-purple-100 text-purple-800'
                                                : challenge.status === 'COMPLETED'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                                {challenge.status}
                            </span>
                            {isCreator && (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="text-red-500 hover:text-red-700 text-lg"
                                >
                                    <span className="text-xl">🗑️</span> Delete
                                </button>
                            )}
                            {!isCreator && !currentUserForfeited && challenge.status !== 'COMPLETED' && (
                                <button
                                    onClick={() => setShowLeaveConfirm(true)}
                                    className="text-red-500 hover:text-red-700 text-lg"
                                >
                                    <span className="text-xl">🚪</span> Leave
                                </button>
                            )}
                        </div>
                    </div>

                    {challenge.participants.length < 2 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                            <p className="text-orange-800 font-medium">
                                Waiting for opponent to join
                            </p>
                            <div className="flex items-center mt-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={`${window.location.origin}/join/${challenge.inviteCode}`}
                                    className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 text-sm bg-gray-50"
                                />
                                <button
                                    onClick={copyInviteLink}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-r-lg text-sm"
                                >
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Progress</h2>
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-sm disabled:opacity-50"
                        >
                            {syncing ? 'Syncing...' : '🔄 Sync Strava'}
                        </button>
                    </div>

                    {(progress?.participants ?? []).map((p) => {
                        const participantForfeited = challenge.participants.find(
                            cp => cp.userId === p.userId
                        )?.forfeitedAt;

                        return (
                            <div key={p.userId} className={`mb-6 last:mb-0 border-b border-gray-100 pb-6 last:border-0 ${participantForfeited ? 'opacity-50' : ''}`}>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-bold text-lg">
                                        {p.username}
                                        {participantForfeited && (
                                            <span className="text-red-500 text-sm ml-2">(left)</span>
                                        )}
                                    </span>
                                    <span className="text-lg font-medium text-orange-600">
                                        {p.overallProgressPercent}% overall
                                    </span>
                                </div>

                                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                                    <div
                                        className="bg-orange-500 h-3 rounded-full transition-all"
                                        style={{ width: `${Math.min(p.overallProgressPercent, 100)}%` }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    {Object.keys(p.goals || {}).map((sport) => {
                                        const sportType = sport as SportType;
                                        const goalKm = p.goals?.[sportType] || 0;
                                        const distanceMeters = p.currentDistances?.[sportType] || 0;
                                        const percent = p.sportProgressPercents?.[sportType] || 0;
                                        const config = sportConfig[sportType];

                                        return (
                                            <div key={sport} className="bg-gray-50 rounded-lg p-3">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>
                                                        {config?.emoji} {config?.label}
                                                    </span>
                                                    <span className="text-gray-600">
                                                        {(distanceMeters / 1000).toFixed(1)} / {goalKm} km ({percent}%)
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-400 h-2 rounded-full transition-all"
                                                        style={{ width: `${Math.min(percent, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {(!progress?.participants || progress.participants.length === 0) && (
                        <p className="text-gray-500">No progress yet.</p>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-2">Delete Challenge?</h3>
                        <p className="text-gray-600 mb-4">
                            This action cannot be undone. All progress data will be lost.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Confirmation Modal - SCHEDULED (no consequences) */}
            {showLeaveConfirm && challenge.status === 'SCHEDULED' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-2">Leave Challenge?</h3>
                        <p className="text-gray-600 mb-4">
                            The challenge hasn't started yet. You can leave without any consequences.
                            The challenge will return to waiting for an opponent.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLeaveConfirm(false)}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLeave}
                                disabled={leaving}
                                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded disabled:opacity-50"
                            >
                                {leaving ? 'Leaving...' : 'Leave'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Confirmation Modal - ACTIVE (forfeit) */}
            {showLeaveConfirm && challenge.status === 'ACTIVE' && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-2">Leave Challenge?</h3>
                        <p className="text-gray-600 mb-4">
                            If you leave, you will forfeit this challenge. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLeaveConfirm(false)}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLeave}
                                disabled={leaving}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded disabled:opacity-50"
                            >
                                {leaving ? 'Leaving...' : 'Leave & Forfeit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChallengeDetail;