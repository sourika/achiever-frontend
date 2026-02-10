# Achiever Frontend

React application for the Achiever fitness challenge platform.

Turn fitness into a fair game: integrate your Strava, set your own targets, and challenge friends to see who can get closest to their personal 100% within the deadline.

## Tech Stack

- **Framework:** React 19
- **Routing:** React Router 7
- **Build Tool:** Vite 7
- **Styling:** TailwindCSS
- **HTTP Client:** Axios
- **Data Fetching:** TanStack React Query
- **Language:** TypeScript
- **Testing:** Vitest + React Testing Library

## Prerequisites

- Node.js 18+
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
VITE_API_URL=http://localhost:8080
```

### 3. Run Development Server

```bash
npm run dev
```

App runs at `http://localhost:5173`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:ui` | Run tests with UI |
| `npm run test:coverage` | Run tests with coverage |

## Project Structure

```
src/
├── api/
│   └── client.ts           # Axios instance with JWT interceptor
├── components/
│   └── NotificationBell.tsx # In-app notifications dropdown
├── pages/
│   ├── Home.tsx            # Email entry (sign in)
│   ├── LoginPassword.tsx   # Password login
│   ├── LoginSetPassword.tsx # Set password for new users
│   ├── LoginNotFound.tsx   # User not found
│   ├── SetPassword.tsx     # Set password (authenticated)
│   ├── AuthCallback.tsx    # Strava OAuth callback handler
│   ├── Dashboard.tsx       # Challenge list & progress
│   ├── CreateChallenge.tsx # Create new challenge
│   ├── JoinChallenge.tsx   # Join via invite link
│   ├── ChallengeDetail.tsx # Challenge details & progress
│   └── Privacy.tsx         # Privacy policy
├── __tests__/              # Test files
├── __mocks__/              # API mocks for tests
├── App.tsx                 # Routes configuration
├── main.tsx                # Entry point
└── index.css               # Global styles & Tailwind
```

## Features

- **Authentication** — Email/password login + Strava OAuth
- **Dashboard** — View all challenges with status badges and progress
- **Challenge Creation** — Multi-sport goals (Run, Ride, Swim, Walk)
- **Invite System** — Share invite links with friends
- **Real-time Progress** — Synced from Strava
- **Notifications** — In-app bell with unread count
- **Countdown Timers** — Time until start/end/expiry
- **Dark Theme** — Navy esports-style UI

## Testing

```bash
# Run all tests
npm test

# Run once (CI mode)
npm run test:run

# With coverage report
npm run test:coverage
```

**Test Coverage:**
- 6 test files
- 43 tests total
- Pages: Home, LoginPassword, CreateChallenge, JoinChallenge, Dashboard
- Components: NotificationBell

## Deployment (Vercel)

### Via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Via GitHub

1. Connect repository to Vercel
2. Set environment variable: `VITE_API_URL=https://api.achiever.fit`
3. Deploy automatically on push

**Production URL:** https://achiever.fit

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.achiever.fit` |

## License

MIT
