import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

interface Notification {
    id: string;
    type: string;
    challengeId: string | null;
    challengeName: string | null;
    message: string;
    read: boolean;
    createdAt: string;
}

interface Props {
    onNewNotification?: () => void;
}

const NotificationBell = ({ onNewNotification }: Props) => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const unreadCountRef = useRef(0);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await api.get('/api/notifications/unread-count');
            const newCount = res.data.count;
            if (newCount > unreadCountRef.current && onNewNotification) {
                onNewNotification();
            }
            unreadCountRef.current = newCount;
            setUnreadCount(newCount);
        } catch (err) {
            console.error('Failed to fetch unread count', err);
        }
    }, [onNewNotification]);

    useEffect(() => {
        const run = () => void fetchUnreadCount();
        run();
        const interval = setInterval(run, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/api/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    const handleToggle = async () => {
        if (!open) await fetchNotifications();
        setOpen(!open);
    };

    const handleMarkAllRead = async () => {
        try {
            await api.post('/api/notifications/read');
            unreadCountRef.current = 0;
            setUnreadCount(0);
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (notification.challengeId) {
            navigate(`/challenges/${notification.challengeId}`);
            setOpen(false);
        }
    };

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHr = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHr / 24);
        if (diffMin < 1) return 'just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHr < 24) return `${diffHr}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'CHALLENGE_JOINED': return '👋';
            case 'CHALLENGE_STARTED': return '🏁';
            case 'CHALLENGE_WON': return '🏆';
            case 'CHALLENGE_LOST': return '😔';
            case 'CHALLENGE_TIE': return '🤝';
            case 'CHALLENGE_FORFEITED': return '🏆';
            case 'CHALLENGE_COMPLETED': return '🏁';
            case 'CHALLENGE_EXPIRED': return '⏰';
            default: return '🔔';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={handleToggle}
                className="relative p-2 text-navy-400 hover:text-navy-200 focus:outline-none transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full 
                                     h-5 w-5 flex items-center justify-center font-bold font-mono">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-navy-800 border border-navy-600/50 rounded-xl 
                                card-glow z-50 max-h-96 overflow-hidden">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-navy-700/50">
                        <h3 className="font-display font-semibold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead}
                                className="text-xs text-accent hover:text-accent-hover font-body transition-colors">
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto max-h-80">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-navy-500 font-body">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div key={n.id} onClick={() => handleNotificationClick(n)}
                                    className={`px-4 py-3 border-b border-navy-700/30 cursor-pointer 
                                                hover:bg-navy-700/30 flex items-start gap-3 transition-colors ${
                                        !n.read ? 'bg-accent/5' : ''
                                    }`}>
                                    <span className="text-xl flex-shrink-0 mt-0.5">
                                        {getNotificationIcon(n.type)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-body ${
                                            !n.read ? 'font-semibold text-white' : 'text-navy-300'
                                        }`}>
                                            {n.message}
                                        </p>
                                        <p className="text-xs text-navy-500 mt-1 font-body">
                                            {getTimeAgo(n.createdAt)}
                                        </p>
                                    </div>
                                    {!n.read && (
                                        <span className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-2" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
