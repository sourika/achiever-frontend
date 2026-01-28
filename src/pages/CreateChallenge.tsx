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
    const [selectedSports, setSelectedSports] = useState<Set<SportType>>(new Set());
    const [goals, setGoals] = useState<Record<SportType, number>>({
        RUN: 50,
        RIDE: 100,
        SWIM: 5,
        WALK: 30,
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
        if (newSelected.has(sport)) {
            newSelected.delete(sport);
        } else {
            newSelected.add(sport);
        }
        setSelectedSports(newSelected);
        // Clear sports error when user selects
        if (fieldErrors.sports) {
            setFieldErrors(prev => ({ ...prev, sports: '' }));
        }
    };

    const updateGoal = (sport: SportType, value: number) => {
        setGoals({ ...goals, [sport]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous errors
        setFieldErrors({});
        setError('');

        if (selectedSports.size === 0) {
            setFieldErrors({ sports: 'Please select at least one sport' });
            return;
        }

        setLoading(true);

        // Build goals object with only selected sports
        const goalsToSend: Record<string, number> = {};
        selectedSports.forEach((sport) => {
            goalsToSend[sport] = goals[sport];
        });

        try {
            const response = await api.post('/api/challenges', {
                goals: goalsToSend,
                startAt,
                endAt,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            });
            navigate(`/challenges/${response.data.id}`);
        } catch (err: unknown) {
            const axiosError = err as {
                response?: {
                    data?: {
                        message?: string;
                        errors?: Record<string, string>;
                    }
                }
            };

            // Handle field-specific errors from backend
            if (axiosError.response?.data?.errors) {
                setFieldErrors(axiosError.response.data.errors);
            } else {
                setError(axiosError.response?.data?.message || 'Failed to create challenge');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-md mx-auto">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-gray-500 hover:text-gray-700 mb-4"
                    >
                        ← Back
                    </button>

                    <h1 className="text-2xl font-bold mb-6">Create Challenge</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Sport Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Select Sports & Set Goals
                            </label>
                            <div className="space-y-3">
                                {SPORTS.map((sport) => (
                                    <div
                                        key={sport.type}
                                        className={`border rounded-lg p-4 transition-all ${
                                            selectedSports.has(sport.type)
                                                ? 'border-orange-500 bg-orange-50'
                                                : fieldErrors.sports
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center cursor-pointer flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSports.has(sport.type)}
                                                    onChange={() => toggleSport(sport.type)}
                                                    className="h-5 w-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                                                />
                                                <span className="ml-3 text-lg">
                                                    {sport.emoji} {sport.label}
                                                </span>
                                            </label>
                                        </div>

                                        {selectedSports.has(sport.type) && (
                                            <div className="mt-3 flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={goals[sport.type]}
                                                    onChange={(e) => updateGoal(sport.type, Number(e.target.value))}
                                                    min="1"
                                                    className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-center"
                                                />
                                                <span className="text-gray-600">{sport.unit}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {fieldErrors.sports && (
                                <p className="text-red-500 text-sm mt-2">{fieldErrors.sports}</p>
                            )}
                        </div>

                        {/* Date Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startAt}
                                    onChange={(e) => {
                                        setStartAt(e.target.value);
                                        if (fieldErrors.startAt) {
                                            setFieldErrors(prev => ({ ...prev, startAt: '' }));
                                        }
                                    }}
                                    className={`w-full border rounded-lg px-4 py-3 ${
                                        fieldErrors.startAt
                                            ? 'border-red-500 bg-red-50'
                                            : 'border-gray-300'
                                    }`}
                                />
                                {fieldErrors.startAt && (
                                    <p className="text-red-500 text-sm mt-1">{fieldErrors.startAt}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={endAt}
                                    onChange={(e) => {
                                        setEndAt(e.target.value);
                                        if (fieldErrors.endAt) {
                                            setFieldErrors(prev => ({ ...prev, endAt: '' }));
                                        }
                                    }}
                                    className={`w-full border rounded-lg px-4 py-3 ${
                                        fieldErrors.endAt
                                            ? 'border-red-500 bg-red-50'
                                            : 'border-gray-300'
                                    }`}
                                />
                                {fieldErrors.endAt && (
                                    <p className="text-red-500 text-sm mt-1">{fieldErrors.endAt}</p>
                                )}
                            </div>
                        </div>

                        {/* Summary */}
                        {selectedSports.size > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-2">Challenge Summary:</p>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from(selectedSports).map((sport) => {
                                        const config = SPORTS.find(s => s.type === sport)!;
                                        return (
                                            <span
                                                key={sport}
                                                className="bg-white border border-gray-200 rounded-full px-3 py-1 text-sm"
                                            >
                                                {config.emoji} {goals[sport]} {config.unit}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading || selectedSports.size === 0}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg disabled:opacity-50"
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