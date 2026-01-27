import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const CreateChallenge = () => {
    const navigate = useNavigate();
    const [sportType, setSportType] = useState('RUN');
    const [goalValue, setGoalValue] = useState(10000); // meters
    const [startAt, setStartAt] = useState(new Date().toISOString().split('T')[0]);
    const [endAt, setEndAt] = useState(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/api/challenges', {
                sportType,
                goalValue,
                startAt,
                endAt,
            });
            navigate(`/challenges/${response.data.id}`);
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { message?: string } } };
            setError(axiosError.response?.data?.message || 'Failed to create challenge');
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

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sport Type
                            </label>
                            <select
                                value={sportType}
                                onChange={(e) => setSportType(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                            >
                                <option value="RUN">Running</option>
                                <option value="RIDE">Cycling</option>
                                <option value="SWIM">Swimming</option>
                                <option value="WALK">Walking</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Goal (km)
                            </label>
                            <input
                                type="number"
                                value={goalValue / 1000}
                                onChange={(e) => setGoalValue(Number(e.target.value) * 1000)}
                                min="1"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startAt}
                                onChange={(e) => setStartAt(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endAt}
                                onChange={(e) => setEndAt(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
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