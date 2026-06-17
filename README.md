# EcoLink Africa

AI-powered platform connecting African farmers directly to Chinese markets.
Built for the China-Africa Innovation Competition.

## Project Structure

```
EcoLink Africa/
├── mobile/                 # React Native mobile app
│   └── src/
│       ├── screens/        # App screens (Home, Market, Camera, Chat)
│       ├── components/     # Reusable UI components
│       ├── store/          # Redux state management
│       ├── services/       # API & socket services
│       └── assets/         # Images, fonts, icons
├── backend/                # Python FastAPI server
│   └── app/
│       ├── api/            # REST endpoints
│       ├── models/         # Database models
│       ├── services/       # Business logic
│       ├── ai/             # AI model orchestration
│       └── db/             # Database configuration
├── docs/                   # Documentation
└── README.md
```

## Tech Stack

- **Frontend:** React Native, Redux Toolkit, Socket.io
- **Backend:** Python FastAPI, PostgreSQL, Firebase
- **AI:** OpenAI Whisper (STT), GPT-4o (Translation), MobileNetV2 (CV), Coqui TTS

## Getting Started

### Mobile App
```bash
cd mobile
npm install
npx react-native start
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```
