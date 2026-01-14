# iEWS - TOI (Mock Implementation)

A specialized Data Ingestion and Company Profile Management systems built for the "TOI" project.

## Project Structure

This is a **monorepo** containing both the client and server applications:

*   **`/client`**: Frontend application (React + Vite + Tailwind CSS).
*   **`/server`**: Backend API (Node.js + Express + MongoDB + Multer).

## Prerequisites

*   Node.js (v18+)
*   MongoDB (Development instance or Cloud URI)

## Getting Started

### 1. Setup Backend

```bash
cd server
npm install

# Create a .env file based on .env.example
# cp .env.example .env
# Set your MONGODB_URI and JWT_SECRET
```

**Run Development Server:**
```bash
npm run dev # (or `node server.js`)
```
Server runs on: `http://localhost:5000`

### 2. Setup Frontend

```bash
cd client
npm install
```

**Run Frontend:**
```bash
npm run dev
```
Client runs on: `http://localhost:3000`

## Features

*   **Authentication**: Admin login (mock: `Admin/admin123`) and Company Code login.
*   **Company Profile**: Manage details (Address, Shareholders, Directors).
*   **Bank Ingestion**:
    *   Drag & Drop multi-image upload for Bank Statements (PDF/Images).
    *   Mock OCR processing (Google AI simulation).
    *   Extraction of Date, Description, Money In/Out, Balance.
*   **Mock Verification**: Simulates "AI Verification" delays.

## Deployment

### Frontend (Vercel)
*   Root Directory: `client`
*   Build Command: `npm run build`
*   Output Directory: `dist`

### Backend (Render/Railway)
*   Root Directory: `server`
*   Build Command: `npm install`
*   Start Command: `node server.js`
*   Environment Variables: `MONGODB_URI`, `JWT_SECRET`
