const Privacy = () => {
    return (
        <div className="min-h-screen bg-navy-950 p-4 sm:p-8">
            <div className="max-w-2xl mx-auto bg-navy-800/60 border border-navy-600/40 rounded-2xl card-glow p-8">
                <h1 className="font-display font-bold text-2xl text-white mb-6">Privacy Policy</h1>
                <p className="text-navy-300 mb-4 font-body">Last updated: January 2026</p>

                <h2 className="font-display font-semibold text-lg text-white mt-6 mb-2">Data We Collect</h2>
                <p className="text-navy-300 mb-4 font-body">
                    We collect your Strava profile information (name, profile picture) and activity data
                    (distance, duration, sport type) to track your progress in fitness challenges.
                </p>

                <h2 className="font-display font-semibold text-lg text-white mt-6 mb-2">How We Use Your Data</h2>
                <p className="text-navy-300 mb-4 font-body">
                    Your data is used solely to calculate challenge progress and display leaderboards
                    to challenge participants.
                </p>

                <h2 className="font-display font-semibold text-lg text-white mt-6 mb-2">Data Sharing</h2>
                <p className="text-navy-300 mb-4 font-body">
                    We do not sell or share your data with third parties. Your activity data is only
                    visible to other participants in challenges you join.
                </p>

                <h2 className="font-display font-semibold text-lg text-white mt-6 mb-2">Data Deletion</h2>
                <p className="text-navy-300 mb-4 font-body">
                    You can disconnect your Strava account at any time through Strava settings.
                    Contact us to request complete data deletion.
                </p>

                <h2 className="font-display font-semibold text-lg text-white mt-6 mb-2">Contact</h2>
                <p className="text-navy-300 font-body">
                    Questions? Email: your-email@example.com
                </p>
            </div>
        </div>
    );
};

export default Privacy;
