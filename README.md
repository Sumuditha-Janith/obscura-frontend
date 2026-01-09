# CineTime 🎬 — Smart Movie Tracking & Engagement Platform

CineTime is a premium, full-stack MERN application designed for cinema enthusiasts to discover, track, and analyze their movie-watching habits. Featuring a high-end **"Crimson Cinema"** dark theme, the platform offers secure authentication, real-time media discovery via TMDB, and AI-powered insights.

### 🔗 Live Links
* **Frontend:** [cinetime-tracker.vercel.app](https://cinetime-tracker.vercel.app/)
* **Backend API:** [cinetime-backend.vercel.app](https://cinetime-backend.vercel.app/)

---

## ✨ Advanced Features

* **Crimson Cinema UI:** A bespoke dark-mode interface utilizing Slate-900 and Rose-600 accents for a professional theater-like experience.
* **OTP Email Verification:** Secure registration flow using 6-digit one-time passwords sent via **Nodemailer**.
* **Statistical Time Tracking:** Automatically calculates total watch time based on movie runtimes fetched from TMDB.
* **TMDB Integration:** Real-time access to a massive database of movies and TV shows including posters, ratings, and plot summaries.

---

## 🛠 Tech Stack

### Frontend
* **React.js (Vite):** High-performance UI library.
* **TypeScript:** Type safety for API responses and component props.
* **Tailwind CSS:** Custom "Crimson Cinema" design system.
* **Lucide React:** Minimalist iconography.

### Backend
* **Node.js & Express:** Scalable RESTful API logic.
* **MongoDB & Mongoose:** Schema-based data modeling.
* **Nodemailer:** Automated SMTP service for OTP delivery.
* **Google Generative AI:** Gemini 1.5 Flash integration for contextual insights.

---

## 🏗 System Architecture

The system follows a **Decoupled Client-Server Architecture**:

1.  **Client:** React.js SPA built with Vite for near-instant load times and HMR (Hot Module Replacement).
2.  **Server:** Node.js/Express backend following the **Controller-Service-Model** pattern.
3.  **Data Layer:** MongoDB Atlas for flexible, non-relational storage of user profiles and media metadata.
4.  **Interceptors:** Axios middleware to automatically attach Bearer tokens and handle global 401/403 error states.

---

## 🔑 Key Modules

### User Authentication & Security
* **Secure Onboarding:** Password hashing with **Bcrypt** and email verification to prevent bot accounts.
* **Verification Flow:** Redirects unverified users to a dedicated OTP entry page before granting full access.

### Media Discovery & Tracking
* **Smart Search:** Search thousands of titles via the TMDB API integration.
* **Personal Watchlist:** Full CRUD operations to manage "To-Watch" and "Watched" lists.
* **Watch-Time Dashboard:** A visual analytics section showing cumulative time spent watching media.

### AI Integration
* **Gemini Chatbot:** A natural language assistant that helps users find movies based on their mood or watch history.
* **Contextual Insights:** Uses AI to provide deeper information about cast members and director styles.

---
## 🚀 Installation & Setup

### 1. Clone the Repository
backend:
```bash
git clone https://github.com/Sumuditha-Janith/cinetime-backend.git
cd cinetime-backend
```
frontend:
```bash
git clone https://github.com/Sumuditha-Janith/cinetime-frontend.git
cd cinetime-frontend
```
### 2. Backend Configuration

Create a .env file inside the **backend folder** and add the following:
```bash
SERVER_PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
EMAIL_USER=your_gmail
EMAIL_PASS=your_app_password
TMDB_API_KEY=your_key
GEMINI_API_KEY=your_gemini_key
```
Create a .env file inside the **frontend folder** and add the following:
```bash
TMDB_API_KEY=your_key
TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
VITE_TMDB_API_KEY=your_key
GEMINI_API_KEY=your_gemini_key
```

### 3. Install & Run
Backend:
```bash
cd cinetime-backend
npm install
npm run dev
```
Frontend:
```bash
cd cinetime-frontend
npm install
npm run dev
```
