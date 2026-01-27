import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LoginPassword from './pages/LoginPassword';
import LoginNotFound from './pages/LoginNotFound';
import LoginSetPassword from './pages/LoginSetPassword';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import SetPassword from './pages/SetPassword';
import CreateChallenge from './pages/CreateChallenge';
import ChallengeDetail from './pages/ChallengeDetail';
import JoinChallenge from './pages/JoinChallenge';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login/password" element={<LoginPassword />} />
                <Route path="/login/not-found" element={<LoginNotFound />} />
                <Route path="/login/set-password" element={<LoginSetPassword />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/set-password" element={<SetPassword />} />
                <Route path="/challenges/new" element={<CreateChallenge />} />
                <Route path="/challenges/:id" element={<ChallengeDetail />} />
                <Route path="/join/:code" element={<JoinChallenge />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;