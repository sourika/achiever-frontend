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

const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const ChallengeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [saving, setSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [leaving, setLeaving] = useState(false);

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
            const [challengeRes, progressRes] = await Promise.all([
                api.get(`/api/challenges/${id}`),
                api.get(`/api/challenges/${id}/progress`),
            ]);
            setChallenge(challengeRes.data);
            setProgress(progressRes.data);
            setShowLeaveConfirm(false);
        } catch (err) {
            console.error('Failed to leave challenge', err);
        } finally {
            setLeaving(false);
        }
    };

    const isCreator = user && challenge && user.id === challenge.createdBy.id;
    const currentUserForfeited = user && challenge?.participants.find(p => p.userId === user.id)?.forfeitedAt;

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

    if (!challenge) return null;

    const sportConfig: Record<SportType, { emoji: string; label: string }> = {
        RUN: { emoji: '🏃', label: 'Running' },
        RIDE: { emoji: '🚴', label: 'Cycling' },
        SWIM: { emoji: '🏊', label: 'Swimming' },
        WALK: { emoji: '🚶', label: 'Walking' },
    };

    return (
        <div className="min-h-screen bg-navy-950 p-4 sm:p-8">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-navy-300 hover:text-navy-200 mb-4 text-sm font-body"
                >
                    ← Back to Dashboard
                </button>

                {/* User forfeited banner */}
                {currentUserForfeited && (
                    <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4 mb-6">
                        <p className="text-red-400 font-medium text-center text-lg font-display">
                            You forfeited this challenge
                        </p>
                    </div>
                )}

                {/* Challenge completed - winner */}
                {challenge.status === 'COMPLETED' && challenge.winnerId && !currentUserForfeited && (
                    <div className={`border rounded-xl p-6 mb-6 text-center ${
                        challenge.winnerId === user?.id
                            ? 'bg-emerald-950/30 border-emerald-500/30'
                            : 'bg-red-950/20 border-red-500/20'
                    }`}>
                        <p className={`font-display font-bold text-2xl ${
                            challenge.winnerId === user?.id ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                            {challenge.winnerId === user?.id
                                ? '🏆 VICTORY!'
                                : `🏁 DEFEAT — Winner: ${challenge.participants.find(p => p.userId === challenge.winnerId)?.username}`
                            }
                        </p>
                    </div>
                )}

                {/* Tie */}
                {challenge.status === 'COMPLETED' && !challenge.winnerId && !challenge.participants.some(p => p.forfeitedAt) && (
                    <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-6 mb-6 text-center">
                        <p className="text-amber-400 font-display font-bold text-2xl">🤝 DRAW!</p>
                    </div>
                )}

                {/* Expired */}
                {challenge.status === 'EXPIRED' && (
                    <div className="bg-gray-900/30 border border-gray-600/30 rounded-xl p-4 mb-6 text-center">
                        <p className="text-gray-500 font-display font-medium">
                            Challenge expired — no opponent joined in time
                        </p>
                    </div>
                )}

                {/* Challenge info card */}
                <div className="bg-navy-800/60 border border-navy-600/40 rounded-2xl card-glow p-6 mb-6">
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
                                        className="font-display font-bold text-2xl bg-navy-900/80 border border-navy-600/50 text-white
                                                   rounded-lg px-2 py-1 flex-1 focus:outline-none focus:ring-2 focus:ring-accent/50"
                                        autoFocus
                                    />
                                    <button onClick={handleSaveName} disabled={saving}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-sm disabled:opacity-50">
                                        {saving ? '...' : '✓'}
                                    </button>
                                    <button onClick={() => { setIsEditing(false); setEditName(challenge.name || ''); }}
                                        className="bg-navy-700 hover:bg-navy-600 text-navy-300 px-3 py-1 rounded-lg text-sm">
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mb-2">
                                    <h1 className="font-display font-bold text-2xl text-white">
                                        {challenge.name || 'Challenge'}
                                    </h1>
                                    {isCreator && (
                                        <button onClick={() => setIsEditing(true)}
                                            className="text-navy-500 hover:text-navy-300 text-sm" title="Edit name">
                                            ✏️
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Date */}
                            <div className="flex items-center gap-1.5 mb-2">
                                <svg className="w-4 h-4 text-navy-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-navy-300 text-sm font-body">
                                    {formatDate(challenge.startAt)} – {formatDate(challenge.endAt)}
                                </span>
                            </div>

                            {/* Sport tags */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                {Object.keys(
                                    challenge.participants.find(p => p.userId === user?.id)?.goals || {}
                                ).map(sport => {
                                    const sportType = sport as SportType;
                                    return (
                                        <span key={sport}
                                            className="bg-navy-700/50 border border-navy-600/40 px-2.5 py-1 rounded-lg text-sm text-navy-200 font-body">
                                            {sportConfig[sportType]?.emoji} {sportConfig[sportType]?.label}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Status + Actions */}
                        <div className="flex flex-col items-end gap-2 ml-4">
                            <span className={`font-display font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-lg ${
                                challenge.status === 'ACTIVE' ? 'bg-accent/10 text-accent-light' :
                                challenge.status === 'PENDING' ? 'bg-sky-500/10 text-sky-400' :
                                challenge.status === 'SCHEDULED' ? 'bg-violet-500/10 text-violet-400' :
                                challenge.status === 'COMPLETED' ? 'bg-navy-700/50 text-navy-300' :
                                challenge.status === 'EXPIRED' ? 'bg-gray-800/50 text-gray-500' :
                                challenge.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' :
                                'bg-navy-700/50 text-navy-300'
                            }`}>
                                {challenge.status}
                            </span>

                            {/* Creator actions */}
                            {isCreator && (challenge.status === 'PENDING' || challenge.status === 'EXPIRED' || challenge.status === 'COMPLETED') && (
                                <button onClick={() => setShowDeleteConfirm(true)}
                                    className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 font-body">
                                    🗑️ Delete
                                </button>
                            )}
                            {isCreator && !currentUserForfeited && challenge.status === 'SCHEDULED' && challenge.participants.length > 1 && (
                                <button
                                    onClick={() => alert('Please ask your opponent to leave first. Once they leave, you can delete the challenge.')}
                                    className="text-accent hover:text-accent-light text-sm flex items-center gap-1 font-body">
                                    🚪 Leave
                                </button>
                            )}
                            {!isCreator && !currentUserForfeited && challenge.status === 'SCHEDULED' && (
                                <button onClick={() => setShowLeaveConfirm(true)}
                                    className="text-accent hover:text-accent-light text-sm flex items-center gap-1 font-body">
                                    🚪 Leave
                                </button>
                            )}
                            {!currentUserForfeited && challenge.status === 'ACTIVE' && (
                                <button onClick={() => setShowLeaveConfirm(true)}
                                    className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 font-body">
                                    🏳️ Forfeit
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Pending - invite link */}
                    {challenge.participants.length < 2 && challenge.status !== 'EXPIRED' && (
                        <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mt-4">
                            <p className="text-accent-light font-medium font-body mb-2">
                                Waiting for opponent to join
                            </p>
                            <div className="flex items-center">
                                <input
                                    type="text"
                                    readOnly
                                    value={`${window.location.origin}/join/${challenge.inviteCode}`}
                                    className="flex-1 bg-navy-900/80 border border-navy-600/50 text-navy-300 
                                               rounded-l-xl px-3 py-2 text-sm font-mono focus:outline-none"
                                />
                                <button onClick={copyInviteLink}
                                    className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-r-xl text-sm font-display font-semibold transition-all">
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Progress Section */}
                <div className="bg-navy-800/60 border border-navy-600/40 rounded-2xl card-glow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-display font-bold text-xl text-white">Progress</h2>
                        {challenge.status === 'ACTIVE' && (
                            <button onClick={handleSync} disabled={syncing}
                                className="bg-navy-700 hover:bg-navy-600 text-navy-200 px-4 py-2 rounded-xl text-sm 
                                           font-body disabled:opacity-50 transition-colors">
                                {syncing ? 'Syncing...' : '🔄 Sync Strava'}
                            </button>
                        )}
                    </div>

                    {(progress?.participants ?? []).map((p) => {
                        const participantForfeited = challenge.participants.find(
                            cp => cp.userId === p.userId
                        )?.forfeitedAt;

                        return (
                            <div key={p.userId}
                                className={`mb-6 last:mb-0 border-b border-navy-700/30 pb-6 last:border-0 ${
                                    participantForfeited ? 'opacity-40' : ''
                                }`}>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-display font-bold text-lg text-white">
                                        {p.username}
                                        {participantForfeited && (
                                            <span className="text-red-400 text-sm ml-2 font-body">(forfeited)</span>
                                        )}
                                    </span>
                                    <span className="text-lg font-mono font-semibold text-accent">
                                        {p.overallProgressPercent}%
                                    </span>
                                </div>

                                {/* Overall progress bar */}
                                <div className="w-full bg-navy-700/50 rounded-full h-3 mb-4 overflow-hidden">
                                    <div
                                        className="h-3 rounded-full transition-all duration-700 ease-out"
                                        style={{
                                            width: `${Math.min(p.overallProgressPercent, 100)}%`,
                                            background: 'linear-gradient(90deg, #e8842a, #f59640)',
                                        }}
                                    />
                                </div>

                                {/* Per-sport breakdown */}
                                <div className="space-y-2">
                                    {Object.keys(p.goals || {}).map((sport) => {
                                        const sportType = sport as SportType;
                                        const goalKm = p.goals?.[sportType] || 0;
                                        const distanceMeters = p.currentDistances?.[sportType] || 0;
                                        const percent = p.sportProgressPercents?.[sportType] || 0;
                                        const config = sportConfig[sportType];

                                        return (
                                            <div key={sport} className="bg-navy-900/40 border border-navy-700/20 rounded-xl p-3">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-navy-200 font-body">
                                                        {config?.emoji} {config?.label}
                                                    </span>
                                                    <span className="text-navy-300 font-mono text-xs">
                                                        {(distanceMeters / 1000).toFixed(1)} / {goalKm} km ({percent}%)
                                                    </span>
                                                </div>
                                                <div className="w-full bg-navy-700/40 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="h-2 rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${Math.min(percent, 100)}%`,
                                                            background: 'linear-gradient(90deg, #3a5a8a, #5a7eb0)',
                                                        }}
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
                        <p className="text-navy-500 font-body">No progress yet.</p>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-navy-800 border border-navy-600/50 rounded-2xl p-6 max-w-sm w-full card-glow">
                        <h3 className="font-display font-bold text-lg text-white mb-2">Delete Challenge?</h3>
                        <p className="text-navy-300 mb-4 font-body">
                            This action cannot be undone. All progress data will be lost.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 bg-navy-700 hover:bg-navy-600 text-navy-200 py-2 rounded-xl font-body transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-xl font-body disabled:opacity-50 transition-colors">
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Modal - SCHEDULED */}
            {showLeaveConfirm && challenge.status === 'SCHEDULED' && !isCreator && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-navy-800 border border-navy-600/50 rounded-2xl p-6 max-w-sm w-full card-glow">
                        <h3 className="font-display font-bold text-lg text-white mb-2">Leave Challenge?</h3>
                        <p className="text-navy-300 mb-4 font-body">
                            The challenge hasn't started yet. You can leave without any consequences.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowLeaveConfirm(false)}
                                className="flex-1 bg-navy-700 hover:bg-navy-600 text-navy-200 py-2 rounded-xl font-body transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleLeave} disabled={leaving}
                                className="flex-1 bg-accent hover:bg-accent-hover text-white py-2 rounded-xl font-body disabled:opacity-50 transition-colors">
                                {leaving ? 'Leaving...' : 'Leave'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Forfeit Modal - ACTIVE */}
            {showLeaveConfirm && challenge.status === 'ACTIVE' && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-navy-800 border border-navy-600/50 rounded-2xl p-6 max-w-sm w-full card-glow">
                        <h3 className="font-display font-bold text-lg text-white mb-2">Forfeit Challenge?</h3>
                        <p className="text-navy-300 mb-4 font-body">
                            If you forfeit, your opponent will win and the challenge will end immediately. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowLeaveConfirm(false)}
                                className="flex-1 bg-navy-700 hover:bg-navy-600 text-navy-200 py-2 rounded-xl font-body transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleLeave} disabled={leaving}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-xl font-body disabled:opacity-50 transition-colors">
                                {leaving ? 'Forfeiting...' : 'Forfeit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChallengeDetail;
