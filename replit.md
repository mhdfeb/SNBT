# SNBT Quiz App

A React-based quiz application for Indonesian students preparing for the SNBT (Seleksi Nasional Berdasarkan Tes) university entrance exam.

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS 4
- **Animations**: Motion (Framer Motion)
- **Charts**: Recharts
- **AI**: @google/genai (Google Gemini)
- **Package Manager**: npm

## Project Structure

```
src/
  App.tsx          - Main app component with all views
  hooks/
    useQuiz.ts     - Quiz state management hook
  lib/
    irt.ts         - IRT scoring algorithm
    utils.ts       - Utility functions
  data/
    questions/     - Question sets by category
    materials.ts   - Study materials
    ptn.ts         - University data
  types/
    quiz.ts        - TypeScript type definitions
```

## Running the App

```bash
npm run dev
```

Runs on port 5000 at `http://0.0.0.0:5000`.

## Deployment

Configured as a static site deployment:
- Build: `npm run build`
- Public dir: `dist`

## Environment Variables

- `GEMINI_API_KEY` - Required for AI features (Google Gemini API)

## Key Features

- IRT (Item Response Theory) scoring (3PL model)
- Multiple question types: multiple choice, complex multiple choice, short answer
- Quiz modes: Full Tryout, Mini Tryout, Daily Practice, Category Practice
- National ranking simulation
- Study materials
- Performance analytics with charts
- Local storage persistence

## Known Fixes Applied

- Fixed missing `QuestionArea` component body in `App.tsx` (was empty in source)
- Fixed stray JSX tags in quiz view (`App.tsx`)
- Added `materialMastery` to `INITIAL_PROGRESS` in `useQuiz.ts`
- Updated port from 3000 to 5000 for Replit compatibility
- Added `allowedHosts: true` to vite config for Replit proxy support
