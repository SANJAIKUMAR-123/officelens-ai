# OfferLens AI — React + Node.js

A working ReactJS + Node.js conversion of the supplied OfferLens AI internship scam detection UI. The original design includes company verification, offer-letter upload and HR email verification. fileciteturn0file0L262-L321

## Requirements
- Node.js 18+ (20+ recommended)
- npm

## Run backend
```bash
cd backend
npm install
npm start
```
Backend: http://localhost:5000

## Run frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL shown in the terminal (normally http://localhost:5173).

If you use a different backend port, create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

## Features
- Responsive React frontend
- Express REST API
- Company verification endpoint
- HR email verification endpoint
- PDF/PNG/JPEG upload endpoint (5 MB limit)
- Trust score, status, risk level, red flags, reason and recommendation
- No paid API key is required for the included working demo

## Important
This project uses transparent rule-based screening rather than pretending that an external AI service has verified a company. It is a screening/demo tool, not a definitive fraud detector.
