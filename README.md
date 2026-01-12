# Pregnancy Tracker Web App

A privacy-first, mobile-friendly pregnancy tracking application built with React, TypeScript, and Node.js.

## Features

- **Dashboard**: View your pregnancy week/day, trimester, and days remaining with a beautiful progress ring
- **Daily Logs**: Track symptoms, mood, notes, and optional vitals (weight, blood pressure, blood sugar)
- **Appointments**: Manage prenatal checkups and visits with date, time, and location
- **Educational Content**: Week-by-week pregnancy information with baby development, symptoms, and tips
- **Export**: Download PDF summaries for doctor visits and CSV for personal records

## Tech Stack

### Frontend
- React 19 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- jsPDF for PDF generation

### Backend
- Node.js with Express
- TypeScript
- SQL.js (SQLite in JavaScript)
- JWT authentication with bcrypt password hashing

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd pregnancy_tracker
   ```

2. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   cd server
   npm run dev
   ```
   Server runs on http://localhost:3001

2. **In a new terminal, start the frontend:**
   ```bash
   cd client
   npm run dev
   ```
   App runs on http://localhost:5173

3. **Open your browser** and go to http://localhost:5173

## Usage

1. **Sign Up**: Create an account with email and password
2. **Onboarding**: Enter your last menstrual period (LMP) date
3. **Dashboard**: View your pregnancy progress and weekly information
4. **Daily Logs**: Add symptoms, mood, and notes each day
5. **Appointments**: Schedule and manage prenatal visits
6. **Export**: Download your data as PDF or CSV

## Project Structure

```
pregnancy_tracker/
├── server/                 # Backend API
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── middleware/    # JWT auth middleware
│   │   ├── routes/        # API endpoints
│   │   ├── utils/         # Helper functions
│   │   └── data/          # Educational content JSON
│   └── package.json
│
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # Auth context
│   │   ├── pages/         # Page components
│   │   └── utils/         # Helper functions
│   └── package.json
│
├── prd.md                 # Product requirements
└── system_prompt.md       # Development guidelines
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Create account |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/pregnancy | Get active pregnancy |
| POST | /api/pregnancy | Create pregnancy |
| GET | /api/logs | Get all daily logs |
| POST | /api/logs | Create/update log |
| GET | /api/appointments | Get appointments |
| POST | /api/appointments | Create appointment |
| PUT | /api/appointments/:id | Update appointment |
| DELETE | /api/appointments/:id | Delete appointment |
| GET | /api/education | Get educational content |
| GET | /api/export/pdf | Get PDF data |
| GET | /api/export/csv | Download CSV |

## Important Notes

⚠️ **Medical Disclaimer**: This application does not provide medical advice. Always consult a qualified healthcare professional.

🔒 **Privacy**: All data is stored locally in an SQLite database. No data is shared with third parties.

## Assumptions & Tradeoffs

- Single pregnancy per user (v1)
- SQLite database (can migrate to PostgreSQL for production)
- No email verification (can be added later)
- Static educational content (curated for quality)
- Client-side PDF generation to avoid server dependencies

## License

MIT
