# Vi-Notes

Vi-Notes is a minimal, focused writing application built with the MERN stack (MongoDB, Express, React, Node.js). It offers a distraction-free writing environment with a side-by-side session history, theme toggling, and secure user authentication.

## Features

*   **Focus Mode Editing:** Clean, distraction-free textured notepad interface.
*   **Session History:** Save, reopen, edit, and delete past writing sessions.
*   **Keystroke Timing Metrics:** Analyzes typing behavior by capturing non-intrusive timing metrics (no actual characters are stored for privacy).
*   **Authentication:** Secure registration and login using JWT.
*   **Theming:** Animated light and dark mode toggle.
*   **Responsive:** Works beautifully across desktop and mobile devices.

---

## 🚀 Getting Started

Follow these steps to set up and run the application locally.

### Prerequisites

*   **Node.js** (v18 or higher recommended)
*   **MongoDB**: A MongoDB Atlas cluster (cloud) or a local MongoDB server.

### 1. Clone & Install Dependencies

Open your terminal and navigate to the project root. First, install the dependencies for both the frontend and backend:

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Configure Environment Variables

You need to set up the connection strings and secrets for the backend.

1. Navigate to the `backend` folder.
2. Create a new file named `.env`.
3. Add the following variables:

```env
# 🔴 IMPORTANT: Replace this MongoDB URI with your own connection string!
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/vi-notes?retryWrites=true&w=majority

# Provide a strong, random secret string for JWT authentication
JWT_SECRET=your_super_secret_jwt_key

# The port your backend will run on
PORT=5000

# Where your frontend is hosted (for CORS)
CLIENT_ORIGIN=http://localhost:5173
```

> **Note on MongoDB:** The `MONGO_URI` is crucial. The application will not start if it cannot connect to the database. Make sure to replace `<username>`, `<password>`, and your cluster URL with your actual MongoDB credentials.

### 3. Running the Application

You will need to run the frontend and backend servers simultaneously in two separate terminal windows.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```
*(This starts the backend on port `5000` with hot-reloading enabled).*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
*(This starts the Vite React application, usually on port `5173`).*

### 4. Access the App

Open your browser and navigate to the URL provided by Vite (typically `http://localhost:5173`). 

*Tip: For subsequent deployments or if you want to test the compiled code, you can use `npm run build` and then `npm start` in the backend folder.*

---

## Architecture Overview

**Frontend:**
*   **React** (Vite + TypeScript)
*   **Styling:** Custom CSS with CSS variables for theming, neon glow effects, and responsive grid layouts.
*   **Routing:** `react-router-dom`

**Backend:**
*   **Node.js / Express** (TypeScript)
*   **Database:** MongoDB with Mongoose ODM
*   **Security:** `helmet` for HTTP headers, `express-rate-limit` for DDoS protection, `bcryptjs` for password hashing, and size limits on payloads.
