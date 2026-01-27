import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

interface Participant {
    userId: string;
    username: string;
    goalValue: number;
}

interface Challenge {
    id: string;
    inviteCode: string;
    sportType: string;
    startAt: string;
    endAt: string;
    status: string;
    participants: Participant[];
}

interface ParticipantProgress {
    userId: string;
    username: string;
    goalValue: number;
    currentValue: number;
    progressPercent: number;
}

interface Progress {
    challengeId: string;
    status: string;
    participantProgress: ParticipantProgress[];
}

const ChallengeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const loadChallenge = async () => {
            try {
                const [challengeRes, progressRes] = await Promise.all([
                    api.get(`/api/challenges/${id}`),
                    api.get(`/api/challenges/${id}/progress`),
                ]);
                setChallenge(challengeRes.data);
                setProgress(progressRes.data);
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    }

    if (!challenge) return null;

    const sportLabels: Record<string, string> = {
        RUN: '🏃 Running',
        RIDE: '🚴 Cycling',
        SWIM: '🏊 Swimming',
        WALK: '🚶 Walking',
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

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-2xl font-bold">
                                {sportLabels[challenge.sportType] || challenge.sportType}
                            </h1>
                            <p className="text-gray-600">
                                {challenge.startAt} → {challenge.endAt}
                            </p>
                        </div>
                        <span
                            className={`px-3 py-1 rounded-full text-sm ${
                                challenge.status === 'ACTIVE'
                                    ? 'bg-green-100 text-green-800'
                                    : challenge.status === 'PENDING'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                            }`}
                        >
              {challenge.status}
            </span>
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

                    {progress?.participantProgress.map((p) => (
                        <div key={p.userId} className="mb-4 last:mb-0">
                            <div className="flex justify-between mb-1">
                                <span className="font-medium">{p.username}</span>
                                <span className="text-gray-600">
                  {(p.currentValue / 1000).toFixed(1)} / {(p.goalValue / 1000).toFixed(1)} km
                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4">
                                <div
                                    className="bg-orange-500 h-4 rounded-full transition-all"
                                    style={{ width: `${Math.min(p.progressPercent, 100)}%` }}
                                />
                            </div>
                            <p className="text-right text-sm text-gray-500 mt-1">
                                {p.progressPercent}%
                            </p>
                        </div>
                    ))}

                    {(!progress?.participantProgress || progress.participantProgress.length === 0) && (
                        <p className="text-gray-500">No progress yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChallengeDetail;