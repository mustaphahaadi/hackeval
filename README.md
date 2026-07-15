# Autonomous AI Hackathon Evaluation Platform

 An enterprise-grade, university-tailored SaaS platform designed to streamline hackathon project submissions, execute fully automated GitHub repository static audits, run live performance checks on deployed applications, generate comprehensive multi-criteria grading reports using the Google Gemini LLM engine, and compute composite standings with manual jury scorecards.

Developed for university hackathon organizers and student developer clubs, this platform replaces slow, inconsistent human judging with instant, unbiased, high-fidelity AI evaluations integrated with human organizer overrides.

---

## 🧭 Documentation Portal

To explore the detailed design, administration, and usage guidelines of the Autonomous AI Hackathon Platform, navigate to the specialized documentation modules below:

### ⚙️ Technical & Engineering Reference
*   **[System Architecture Documentation](./docs/system_architecture.md)** — Architectural diagrams, data entity relationships, backend module schemas, state transition patterns, and Gemini model pipelines.
*   **[API Specification Manual](./docs/api_documentation.md)** — REST JSON API collection, route access levels (RBAC), request/response schemas, JWT authentication, and bulk triggers.
*   **[Deployment & Infrastructure Guide](./docs/deployment_guide.md)** — Guide to containerization, environment variable configurations, SQLite/PostgreSQL/Firebase setups, and Cloud Run production staging.
*   **[FastAPI & PostgreSQL Migration Plan](./docs/migration_plan.md)** — Complete blueprint for transitioning from the rapid-development Express/JSON stack to the high-performance Python FastAPI and PostgreSQL stack.

### 👥 User & Operations Manuals
*   **[User (Participant) Guide](./docs/user_guide.md)** — Step-by-step instructions for student teams to register, submit repositories, track evaluation status, upload project pitch decks, and claim verifiable academic certificates.
*   **[Admin Operations Guide](./docs/admin_guide.md)** — Instructions for roles configuration, team detail modification, event schedulers, triggering bulk AI evaluations, submitting manual jury scorecards, and downloading ranked CSV reports.

---

## 🛠️ Key Technology Stack

The platform is designed with a modern full-stack TypeScript architecture optimized for extreme speed, developer ergonomics, and minimal runtime footprint.

### Core Stack
*   **Frontend Client:** React 18+ with TypeScript, Vite (bundling), Tailwind CSS v4 (design utility classes), and Lucide React (icon library).
*   **Backend Application Server:** Express.js serving JSON APIs with TypeScript execution via `tsx` (dev) and pre-compiled bundler pipelines using `esbuild`.
*   **AI Engine:** Google GenAI SDK (`@google/genai`) utilizing the state-of-the-art **Gemini** model for automated code evaluations and natural language query analytics.
*   **Database layer:** High-performance, real-time **Firebase Firestore** integration for persistent cloud database storage paired with a fast local caching manager (`src/db.ts`).

---

## 📐 Composite Scoring & Placement Algorithm

The platform enforces a standardized grading policy to balance rapid automation and human domain expertise:

$$\text{Combined Score} = (0.4 \times \text{AI Overall Score}) + (0.6 \times \text{Jury Average Score})$$

Where:
*   **AI Overall Score (40%):** Generated autonomously by Google Gemini across 7 criteria: Concept Validity, Innovation, Code Quality, README Clarity, UI/UX, AI Tooling Usage, and Technical Complexity.
*   **Jury Average Score (60%):** Real-time average of manual scorecards submitted by authenticated organizers/judges.
*   **Rankings:** Calculated dynamically in descending order of the combined score. Ties are resolved transparently based on subscores.

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
   The application will boot up at `http://localhost:3000`. Open it in your web browser to sign up as a Participant or Admin!

---

## 🧪 Running the Test Suite

The platform includes a robust testing matrix crossing Python backend endpoints and React client components.

### 🐍 Pytest API & Persistence Tests
To verify database schemas, AI evaluation algorithms, and backend routers:
```bash
pip install pytest requests
pytest tests/pytest/ -v
```

### ⚛️ Frontend React Component Tests
To verify form inputs, role routing, and admin dashboards:
```bash
npm run test
```

---

## 🏛️ License & Academic Usage
This platform was built with the highest standards of software engineering craftsmanship to support university engineering departments, student developer clubs, and hackathon networks globally. Feel free to fork, adapt, and scale it for your upcoming campus builds!
