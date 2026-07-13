# Hackathon Evaluation and Judging Platform

An enterprise-grade, university-tailored SaaS platform designed to streamline hackathon project submissions, coordinate multi-criteria jury panels, execute automated GitHub repository static reviews, and generate real-time evaluations using the Google Gemini 3.5 Flash LLM engine.

Developed for university hackathon organizers, student researchers, and industry adjudicators, this platform ensures academic integrity, eliminates grading bias, and delivers real-time combined leaderboards.

---

## 🧭 Documentation Portal

To explore the detailed design, administration, and usage guidelines of the Hackathon Evaluation and Judging Platform, navigate to the specialized documentation modules below:

### ⚙️ Technical & Engineering Reference
*   **[System Architecture Documentation](./docs/system_architecture.md)** — Architectural diagrams, data entity relationships, backend module schemas, state transition patterns, and Gemini model pipelines.
*   **[API Specification Manual](./docs/api_documentation.md)** — REST JSON API collection, route access levels (RBAC), request/response schemas, JWT authentication, and rate-limiting behaviors.
*   **[Deployment & Infrastructure Guide](./docs/deployment_guide.md)** — Guide to containerization, environment variable configurations, SQLite/PostgreSQL setups, and Cloud Run production staging.

### 👥 User & Operations Manuals
*   **[User (Participant) Guide](./docs/user_guide.md)** — Step-by-step instructions for student teams to register, submit repositories, track evaluation status, and upload project pitch decks.
*   **[Judge & Jury Panel Guide](./docs/judge_guide.md)** — Core criteria definitions, scoring card workflows, comment threads, and interacting with the interactive **AI Judge Assistant**.
*   **[Admin Operations Guide](./docs/admin_guide.md)** — Instructions for roles configuration, team detail modification, event schedulers, and downloading official ranked CSV reports.

---

## 🛠️ Key Technology Stack

The platform is designed with a modern full-stack TypeScript architecture optimized for extreme speed, developer ergonomics, and minimal runtime footprint.

### Core Stack
*   **Frontend Client:** React 18+ with TypeScript, Vite (bundling), Tailwind CSS v4 (design utility classes), and Lucide React (icon library).
*   **Backend Application Server:** Express.js v4 serving JSON APIs with TypeScript execution via `tsx` (dev) and pre-compiled bundler pipelines using `esbuild`.
*   **AI Engine:** Google GenAI SDK (`@google/genai`) utilizing the state-of-the-art **Gemini 3.5 Flash** model for automated code evaluations and natural language query analytics.
*   **Database layer:** High-performance, lightweight in-memory JSON data manager (`src/db.ts`) designed for rapid prototyping, easily portable to PostgreSQL.

---

## 🚀 Quick Start & Local Setup

Get the development workspace up and running locally in less than 3 minutes.

### 📋 Prerequisites
*   Node.js (v18.0.0 or higher)
*   npm (v9.0.0 or higher)
*   A valid Google Gemini API Key

### 📦 Installation Steps

1. **Clone and enter the workspace:**
   ```bash
   git clone <repository-url>
   cd hackathon-eval-platform
   ```

2. **Configure Environment Variables:**
   Copy the example environment file and insert your API key:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and configure:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   JWT_SECRET=use_a_strong_cryptographic_secret_hash_here
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Launch the Development Server:**
   ```bash
   npm run dev
   ```
   The application will boot up at `http://localhost:3000`. Open it in your web browser to sign up as a Participant, Judge, or Admin!

---

## 🧪 Running the Test Suite

The platform includes a robust testing matrix crossing Python backend endpoints and React client components.

### 🐍 Pytest API & Persistence Tests
To verify database schemas, weighted average rankings, and API safety controllers:
```bash
pip install pytest requests
pytest tests/pytest/ -v
```

### ⚛️ Frontend React Component Tests
To verify form inputs, role routing, and chat assistance widgets:
```bash
npm run test
```

---

## 🏛️ License & Academic Usage
This platform was built with the highest standards of software engineering craftsmanship to support university engineering departments, student developer clubs, and hackathon networks globally. Feel free to fork, adapt, and scale it for your upcoming campus builds!
