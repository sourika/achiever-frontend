const Privacy = () => {
    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
                <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>

                <p className="text-gray-600 mb-4">Last updated: January 2025</p>

                <h2 className="text-lg font-semibold mt-6 mb-2">Data We Collect</h2>
                <p className="text-gray-700 mb-4">
                    We collect your Strava profile information (name, profile picture) and activity data
                    (distance, duration, sport type) to track your progress in fitness challenges.
                </p>

                <h2 className="text-lg font-semibold mt-6 mb-2">How We Use Your Data</h2>
                <p className="text-gray-700 mb-4">
                    Your data is used solely to calculate challenge progress and display leaderboards
                    to challenge participants.
                </p>

                <h2 className="text-lg font-semibold mt-6 mb-2">Data Sharing</h2>
                <p className="text-gray-700 mb-4">
                    We do not sell or share your data with third parties. Your activity data is only
                    visible to other participants in challenges you join.
                </p>

                <h2 className="text-lg font-semibold mt-6 mb-2">Data Deletion</h2>
                <p className="text-gray-700 mb-4">
                    You can disconnect your Strava account at any time through Strava settings.
                    Contact us to request complete data deletion.
                </p>

                <h2 className="text-lg font-semibold mt-6 mb-2">Contact</h2>
                <p className="text-gray-700">
                    Questions? Email: your-email@example.com
                </p>
            </div>
        </div>
    );
};

export default Privacy;