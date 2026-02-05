import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

type SportType = 'RUN' | 'RIDE' | 'SWIM' | 'WALK';

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

const CreateChallenge = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [selectedSports, setSelectedSports] = useState<Set<SportType>>(new Set());
    const [goals, setGoals] = useState<Record<SportType, number>>({
        RUN: 50, RIDE: 100, SWIM: 5, WALK: 30,
    });
    const [startAt, setStartAt] = useState(new Date().toISOString().split('T')[0]);
    const [endAt, setEndAt] = useState(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const toggleSport = (sport: SportType) => {
        const newSelected = new Set(selectedSports);
        if (newSelected.has(sport)) newSelected.delete(sport);
        else newSelected.add(sport);
        setSelectedSports(newSelected);
        if (fieldErrors.sports) setFieldErrors(prev => ({ ...prev, sports: '' }));
    };

    const updateGoal = (sport: SportType, value: number) => {
        setGoals({ ...goals, [sport]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});
        setError('');
        if (selectedSports.size === 0) {
            setFieldErrors({ sports: 'Please select at least one sport' });
            return;
        }
        setLoading(true);
        const goalsToSend: Record<string, number> = {};
        selectedSports.forEach((sport) => { goalsToSend[sport] = goals[sport]; });
        try {
            const response = await api.post('/api/challenges', {
                name: name || null, goals: goalsToSend, startAt, endAt,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            });
            navigate(`/challenges/${response.data.id}`);
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { message?: string; errors?: Record<string, string> } } };
            if (axiosError.response?.data?.errors) setFieldErrors(axiosError.response.data.errors);
            else setError(axiosError.response?.data?.message || 'Failed to create challenge');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-navy-950 p-4 sm:p-8">
            <div className="max-w-md mx-auto">
                <div className="bg-navy-800/60 border border-navy-600/40 rounded-2xl card-glow p-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-navy-300 hover:text-navy-200 mb-4 text-sm font-body"
                    >
                        ← Back
                    </button>

                    <h1 className="font-display font-bold text-2xl text-white mb-6">Create Challenge</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-navy-300 mb-1 font-body">
                                Challenge Name <span className="text-navy-600">(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value.slice(0, 50))}
                                placeholder="e.g. Winter Battle"
                                maxLength={50}
                                className="w-full bg-navy-900/80 border border-navy-600/50 text-white placeholder-navy-400
                                           rounded-xl px-4 py-3 font-body focus:outline-none focus:ring-2 focus:ring-accent/50"
                            />
                            <p className="text-navy-600 text-xs mt-1 font-body">{name.length}/50</p>
                        </div>

                        {/* Sport Selection */}
                        <div>
                            <label className="block text-sm font-medium text-navy-300 mb-3 font-body">
                                Select Sports & Set Goals
                            </label>
                            <div className="space-y-3">
                                {SPORTS.map((sport) => (
                                    <div
                                        key={sport.type}
                                        className={`border rounded-xl p-4 transition-all cursor-pointer ${
                                            selectedSports.has(sport.type)
                                                ? 'border-accent/50 bg-accent/5'
                                                : fieldErrors.sports
                                                    ? 'border-red-500/50 bg-red-500/5'
                                                    : 'border-navy-600/40 hover:border-navy-500/50 bg-navy-800/30'
                                        }`}
                                        onClick={() => toggleSport(sport.type)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center cursor-pointer flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSports.has(sport.type)}
                                                    onChange={() => {}}
                                                    className="h-5 w-5 rounded border-navy-500 bg-navy-900 text-accent focus:ring-accent/50"
                                                />
                                                <span className="ml-3 text-lg text-white font-body">
                                                    {sport.emoji} {sport.label}
                                                </span>
                                            </label>
                                        </div>
                                        {selectedSports.has(sport.type) && (
                                            <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="number"
                                                    value={goals[sport.type] || ''}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value, 10);
                                                        updateGoal(sport.type, isNaN(val) ? 0 : val);
                                                    }}
                                                    min="1"
                                                    className="w-24 bg-navy-900/80 border border-navy-600/50 text-white
                                                               rounded-lg px-3 py-2 text-center font-mono
                                                               focus:outline-none focus:ring-2 focus:ring-accent/50"
                                                />
                                                <span className="text-navy-300 font-body">{sport.unit}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {fieldErrors.sports && (
                                <p className="text-red-400 text-sm mt-2 font-body">{fieldErrors.sports}</p>
                            )}
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-navy-300 mb-1 font-body">Start Date</label>
                                <input
                                    type="date"
                                    value={startAt}
                                    onChange={(e) => {
                                        setStartAt(e.target.value);
                                        if (fieldErrors.startAt) setFieldErrors(prev => ({ ...prev, startAt: '' }));
                                    }}
                                    className={`w-full bg-navy-900/80 border text-white rounded-xl px-4 py-3 font-body
                                               focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                                        fieldErrors.startAt ? 'border-red-500/50' : 'border-navy-600/50'
                                    }`}
                                />
                                {fieldErrors.startAt && <p className="text-red-400 text-sm mt-1 font-body">{fieldErrors.startAt}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-navy-300 mb-1 font-body">End Date</label>
                                <input
                                    type="date"
                                    value={endAt}
                                    onChange={(e) => {
                                        setEndAt(e.target.value);
                                        if (fieldErrors.endAt) setFieldErrors(prev => ({ ...prev, endAt: '' }));
                                    }}
                                    className={`w-full bg-navy-900/80 border text-white rounded-xl px-4 py-3 font-body
                                               focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                                        fieldErrors.endAt ? 'border-red-500/50' : 'border-navy-600/50'
                                    }`}
                                />
                                {fieldErrors.endAt && <p className="text-red-400 text-sm mt-1 font-body">{fieldErrors.endAt}</p>}
                            </div>
                        </div>

                        {/* Summary */}
                        {selectedSports.size > 0 && (
                            <div className="bg-navy-900/50 border border-navy-700/30 rounded-xl p-4">
                                <p className="text-sm text-navy-300 mb-2 font-body">Challenge Summary:</p>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from(selectedSports).map((sport) => {
                                        const config = SPORTS.find(s => s.type === sport)!;
                                        return (
                                            <span key={sport}
                                                className="bg-navy-800 border border-navy-600/40 rounded-full px-3 py-1 text-sm text-white font-body"
                                            >
                                                {config.emoji} {goals[sport]} {config.unit}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {error && <p className="text-red-400 text-sm font-body">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading || selectedSports.size === 0}
                            className="w-full bg-accent hover:bg-accent-hover text-white font-display font-semibold 
                                       py-3 rounded-xl disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-accent/20"
                        >
                            {loading ? 'Creating...' : 'Create Challenge'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateChallenge;
