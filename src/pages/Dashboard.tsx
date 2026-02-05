import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import NotificationBell from '../components/NotificationBell';

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

interface ParticipantProgress {
    userId: string;
    username: string;
    overallProgressPercent: number;
}

interface Progress {
    challengeId: string;
    participants: ParticipantProgress[];
}

// ─── Helpers ──────────────────────────────────────────────

const STATUS_ORDER: Record<string, number> = {
    PENDING: 0,
    ACTIVE: 1,
    SCHEDULED: 2,
    COMPLETED: 3,
    EXPIRED: 4,
    CANCELLED: 5,
};

const sortChallenges = (challenges: Challenge[]): Challenge[] => {
    return [...challenges].sort(
        (a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
    );
};

const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getCountdown = (targetDate: string, isEnd = false): { days: number; hours: number; minutes: number; expired: boolean } => {
    const target = isEnd
        ? new Date(targetDate + 'T23:59:59')
        : new Date(targetDate + 'T00:00:00');
    const now = new Date();
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, expired: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, expired: false };
};

const sportEmojis: Record<string, string> = {
    RUN: '🏃',
    RIDE: '🚴',
    SWIM: '🏊',
    WALK: '🚶',
};

// ─── Countdown Display Component ──────────────────────────

const CountdownDisplay = ({ label, targetDate, isEnd = false }: { label: string; targetDate: string; isEnd?: boolean }) => {
    const [countdown, setCountdown] = useState(getCountdown(targetDate, isEnd));

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(getCountdown(targetDate, isEnd));
        }, 60000);
        return () => clearInterval(interval);
    }, [targetDate, isEnd]);

    if (countdown.expired) return null;

    return (
        <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-navy-300 text-xs font-medium uppercase tracking-wider">{label}</span>
            <div className="flex items-center gap-1">
                <span className="font-mono text-sm font-semibold text-white bg-navy-700/80 px-2 py-0.5 rounded">
                    {countdown.days}d
                </span>
                <span className="font-mono text-sm font-semibold text-white bg-navy-700/80 px-2 py-0.5 rounded">
                    {countdown.hours}h
                </span>
                <span className="font-mono text-sm font-semibold text-white bg-navy-700/80 px-2 py-0.5 rounded">
                    {countdown.minutes}m
                </span>
            </div>
        </div>
    );
};

// ─── VS Progress Bar Component ────────────────────────────

const VsProgressBar = ({
    leftPercent,
    rightPercent,
    leftColor,
    rightColor,
}: {
    leftPercent: number;
    rightPercent: number;
    leftColor: string;
    rightColor: string;
}) => {
    const leftFill = Math.min(leftPercent, 100);
    const rightFill = Math.min(rightPercent, 100);

    return (
        <div className="w-full h-2 rounded-full overflow-hidden flex progress-bar-track">
            {/* Left half */}
            <div className="w-1/2 h-full flex justify-end relative">
                <div className="absolute inset-0" />
                <div
                    className="absolute left-0 top-0 h-full transition-all duration-700 ease-out rounded-l-full"
                    style={{
                        width: `${leftFill}%`,
                        background: `linear-gradient(90deg, ${leftColor} 0%, ${leftColor}cc 100%)`,
                    }}
                />
            </div>
            {/* Right half */}
            <div className="w-1/2 h-full relative">
                <div className="absolute inset-0" />
                <div
                    className="absolute right-0 top-0 h-full transition-all duration-700 ease-out rounded-r-full"
                    style={{
                        width: `${rightFill}%`,
                        background: `linear-gradient(90deg, ${rightColor}cc 0%, ${rightColor} 100%)`,
                    }}
                />
            </div>
        </div>
    );
};

// ─── Challenge Card Component ─────────────────────────────

const ChallengeCard = ({
    challenge,
    user,
    progressMap,
    onClick,
}: {
    challenge: Challenge;
    user: User;
    progressMap: Record<string, Progress>;
    onClick: () => void;
}) => {
    const me = challenge.participants.find(p => p.userId === user.id);
    const opponent = challenge.participants.find(p => p.userId !== user.id);
    const progress = progressMap[challenge.id];

    const myProgress = progress?.participants.find(p => p.userId === user.id)?.overallProgressPercent ?? 0;
    const opponentProgress = progress?.participants.find(p => p.userId !== user.id)?.overallProgressPercent ?? 0;

    // Determine result for COMPLETED challenges
    const isWinner = challenge.status === 'COMPLETED' && challenge.winnerId === user.id;
    const isLoser = challenge.status === 'COMPLETED' && challenge.winnerId && challenge.winnerId !== user.id;
    const isDraw = challenge.status === 'COMPLETED' && !challenge.winnerId && !challenge.participants.some(p => p.forfeitedAt);
    const isExpired = challenge.status === 'EXPIRED';

    // Card background/border tint based on status
    let cardBg = 'bg-navy-800/70';
    let cardBorder = 'border-navy-600/40';
    let glowClass = 'card-glow';
    let statusLabel = challenge.status;
    let statusColor = 'text-navy-300';

    if (isWinner) {
        cardBg = 'bg-gradient-to-br from-navy-800/70 to-emerald-950/30';
        cardBorder = 'border-emerald-500/30';
        glowClass = 'card-glow-green';
        statusLabel = 'VICTORY';
        statusColor = 'text-emerald-400';
    } else if (isLoser) {
        cardBg = 'bg-gradient-to-br from-navy-800/70 to-red-950/30';
        cardBorder = 'border-red-500/30';
        glowClass = 'card-glow-red';
        statusLabel = 'DEFEAT';
        statusColor = 'text-red-400';
    } else if (isDraw) {
        cardBg = 'bg-gradient-to-br from-navy-800/70 to-amber-950/20';
        cardBorder = 'border-amber-500/30';
        glowClass = 'card-glow-yellow';
        statusLabel = 'DRAW';
        statusColor = 'text-amber-400';
    } else if (isExpired) {
        cardBg = 'bg-gradient-to-br from-navy-800/50 to-gray-900/30';
        cardBorder = 'border-gray-600/30';
        glowClass = 'card-glow-gray';
        statusLabel = 'EXPIRED';
        statusColor = 'text-gray-500';
    } else if (challenge.status === 'ACTIVE') {
        cardBg = 'bg-gradient-to-br from-navy-800/70 to-navy-700/50';
        cardBorder = 'border-accent/30';
        statusColor = 'text-accent-light';
    } else if (challenge.status === 'SCHEDULED') {
        cardBg = 'bg-navy-800/60';
        cardBorder = 'border-violet-500/25';
        statusColor = 'text-violet-400';
    } else if (challenge.status === 'PENDING') {
        cardBg = 'bg-navy-800/60';
        cardBorder = 'border-sky-500/25';
        statusColor = 'text-sky-400';
    }

    const barLeftColor = isWinner ? '#22c55e' : isLoser ? '#ef4444' : '#e8842a';
    const barRightColor = isWinner ? '#ef4444' : isLoser ? '#22c55e' : '#3a5a8a';

    return (
        <div
            onClick={onClick}
            className={`${cardBg} border ${cardBorder} ${glowClass} rounded-2xl p-5 cursor-pointer 
                        hover:scale-[1.01] hover:brightness-110 transition-all duration-200`}
        >
            {/* Top row: Challenge Name + Status */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="flex gap-0.5 text-lg shrink-0">
                        {challenge.sportTypes.map((s, i) => (
                            <span key={i}>{sportEmojis[s]}</span>
                        ))}
                    </span>
                    <h3 className="font-display font-semibold text-white truncate">
                        {challenge.name || 'Challenge'}
                    </h3>
                </div>
                <span className={`font-display font-bold text-xs uppercase tracking-widest ml-3 shrink-0 ${statusColor}`}>
                    {statusLabel}
                </span>
            </div>

            {/* Date row */}
            <div className="flex items-center gap-1.5 mb-4">
                <svg className="w-3.5 h-3.5 text-navy-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-navy-300 text-xs font-body">
                    {formatDate(challenge.startAt)} – {formatDate(challenge.endAt)}
                </span>
            </div>

            {/* Countdown for SCHEDULED */}
            {challenge.status === 'SCHEDULED' && (
                <CountdownDisplay label="Starts in:" targetDate={challenge.startAt} />
            )}

            {/* Countdown for PENDING */}
            {challenge.status === 'PENDING' && (
                <CountdownDisplay label="Expires in:" targetDate={challenge.endAt} isEnd />
            )}

            {/* Countdown for ACTIVE */}
            {challenge.status === 'ACTIVE' && (
                <CountdownDisplay label="Ends in:" targetDate={challenge.endAt} isEnd />
            )}

            {/* Participants + Progress Bar */}
            {(challenge.status === 'ACTIVE' || challenge.status === 'COMPLETED') && (
                <div className="mt-3">
                    {/* Participants row */}
                    <div className="flex items-center justify-between mb-2">
                        {/* Left: current user */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center">
                                <span className="text-accent font-display font-bold text-xs">
                                    {me?.username?.charAt(0).toUpperCase() || '?'}
                                </span>
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium leading-tight">{me?.username || 'You'}</p>
                                {me?.forfeitedAt && (
                                    <span className="text-red-400 text-[10px]">forfeited</span>
                                )}
                            </div>
                        </div>

                        {/* Center: scores */}
                        <div className="flex items-center gap-3 px-4">
                            <span className="font-mono font-bold text-xl"
                                style={{ color: barLeftColor }}>
                                {myProgress}
                            </span>
                            <span className="text-navy-500 text-xs font-bold">%</span>
                            <span className="font-mono font-bold text-xl"
                                style={{ color: barRightColor }}>
                                {opponentProgress}
                            </span>
                        </div>

                        {/* Right: opponent */}
                        <div className="flex items-center gap-2">
                            <div className="text-right">
                                <p className="text-white text-sm font-medium leading-tight">{opponent?.username || 'Opponent'}</p>
                                {opponent?.forfeitedAt && (
                                    <span className="text-red-400 text-[10px]">forfeited</span>
                                )}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-navy-600/60 border border-navy-500/40 flex items-center justify-center">
                                <span className="text-navy-200 font-display font-bold text-xs">
                                    {opponent?.username?.charAt(0).toUpperCase() || '?'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <VsProgressBar
                        leftPercent={myProgress}
                        rightPercent={opponentProgress}
                        leftColor={barLeftColor}
                        rightColor={barRightColor}
                    />
                </div>
            )}

            {/* For SCHEDULED/PENDING with participants - show names */}
            {(challenge.status === 'SCHEDULED' || challenge.status === 'PENDING') && (
                <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center">
                            <span className="text-accent font-display font-bold text-[10px]">
                                {me?.username?.charAt(0).toUpperCase() || '?'}
                            </span>
                        </div>
                        <span className="text-white text-sm">{me?.username || 'You'}</span>
                    </div>

                    <span className="text-navy-300 text-xs font-display font-bold">VS</span>

                    <div className="flex items-center gap-2">
                        {opponent ? (
                            <>
                                <span className="text-white text-sm">{opponent.username}</span>
                                <div className="w-7 h-7 rounded-full bg-navy-600/60 border border-navy-500/40 flex items-center justify-center">
                                    <span className="text-navy-200 font-display font-bold text-[10px]">
                                        {opponent.username.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="text-navy-300 text-sm italic">Waiting...</span>
                                <div className="w-7 h-7 rounded-full bg-navy-700/40 border border-navy-600/30 border-dashed flex items-center justify-center">
                                    <span className="text-navy-300 text-[10px]">?</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* EXPIRED - no opponent */}
            {challenge.status === 'EXPIRED' && (
                <div className="mt-3 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">No opponent joined</span>
                </div>
            )}
        </div>
    );
};

// ─── Main Dashboard ───────────────────────────────────────

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
    const [loading, setLoading] = useState(true);
    const [notificationTrigger, setNotificationTrigger] = useState(0);

    const fetchProgress = useCallback(async (challengeList: Challenge[]) => {
        const activeOrCompleted = challengeList.filter(
            c => c.status === 'ACTIVE' || c.status === 'COMPLETED'
        );

        const results = await Promise.allSettled(
            activeOrCompleted.map(c =>
                api.get(`/api/challenges/${c.id}/progress`).then(res => ({
                    id: c.id,
                    data: res.data as Progress,
                }))
            )
        );

        const map: Record<string, Progress> = {};
        results.forEach(r => {
            if (r.status === 'fulfilled') {
                map[r.value.id] = r.value.data;
            }
        });
        setProgressMap(map);
    }, []);

    useEffect(() => {
        Promise.all([
            api.get('/api/auth/me'),
            api.get('/api/challenges/my'),
        ])
            .then(([userRes, challengesRes]) => {
                setUser(userRes.data);
                const sorted = sortChallenges(challengesRes.data);
                setChallenges(sorted);
                void fetchProgress(sorted);
            })
            .catch(() => {
                localStorage.removeItem('token');
                window.location.href = '/';
            })
            .finally(() => setLoading(false));
    }, [notificationTrigger, fetchProgress]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/';
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

    return (
        <div className="min-h-screen bg-navy-950">
            {/* Header */}
            <header className="bg-navy-900/80 backdrop-blur-md border-b border-navy-700/50 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h1 className="font-display font-bold text-xl text-white">
                            <span className="text-accent">A</span>chiever
                        </h1>
                        <span className="hidden sm:inline text-navy-300 text-sm">|</span>
                        <span className="hidden sm:inline text-navy-300 text-sm font-body">
                            {user?.username}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <NotificationBell onNewNotification={() => setNotificationTrigger(n => n + 1)} />
                        <button
                            onClick={handleLogout}
                            className="text-navy-300 hover:text-navy-200 text-sm font-body px-3 py-1.5 rounded-lg
                                       hover:bg-navy-800/50 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {/* Title row */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="font-display font-bold text-2xl text-white">
                        Your Challenges
                    </h2>
                    <button
                        onClick={() => navigate('/challenges/new')}
                        className="bg-accent hover:bg-accent-hover text-white font-display font-semibold 
                                   px-5 py-2.5 rounded-xl text-sm transition-all duration-200
                                   hover:shadow-lg hover:shadow-accent/20"
                    >
                        + New Challenge
                    </button>
                </div>

                {/* Challenge Cards */}
                {challenges.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-5xl mb-4">🏁</div>
                        <p className="text-navy-200 text-lg font-body mb-2">No challenges yet</p>
                        <p className="text-navy-300 text-sm font-body">Create your first challenge and invite a friend!</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {challenges.map((c) => (
                            <ChallengeCard
                                key={c.id}
                                challenge={c}
                                user={user!}
                                progressMap={progressMap}
                                onClick={() => navigate(`/challenges/${c.id}`)}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
