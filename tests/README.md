# Hackathon Platform Testing Suite

This testing suite provides a complete, modern, and robust testing architecture for the Hackathon Platform. It spans across multiple tiers of the application—covering the backend engine, PostgreSQL/Drizzle-style persistence, JSON APIs, AI evaluators, and React/Tailwind visual interfaces.

## 📁 Testing Architecture

```text
tests/
├── README.md                     # Test strategy, guides, and execution scripts
├── pytest/                       # Python-based Pytest API & Integration tests
│   ├── conftest.py               # Shared Pytest fixtures, tokens, and test endpoints
│   ├── test_backend_db.py        # Database level persistence and structure validation
│   ├── test_api.py               # JSON API endpoints validation (Auth, Projects, Reviews)
│   └── test_ai_evaluation.py     # AI System prompt, evaluation, and LLM behavior tests
└── frontend/                     # React Testing Library & Vitest/Jest frontend tests
    ├── test_participant_portal.test.tsx  # Participant team registration & submission flows
    ├── test_judge_dashboard.test.tsx      # Jury card scoring, comment trails, and AI assistant
    └── test_admin_dashboard.test.tsx      # Access levels, event configurations, and data export
```

---

## 🎯 Testing Strategy Breakdown

### 1. Backend & DB Persistence Tests (`tests/pytest/test_backend_db.py`)
- **Objective:** Ensures correct transactional and structural consistency of database tables (Users, Projects, AI Evaluations, Reviews, Hackathons, Certificates).
- **Strategy:** Validates state transitions (e.g. project changing from `pending` to `evaluated`), unique field constraints, and referential integrity of relations (such as ensuring judge scorecards correspond to existing team projects).

### 2. Integration API Tests (`tests/pytest/test_api.py`)
- **Objective:** Validates end-to-end API payloads, routing, security interceptors, and CORS/CSRF headers.
- **Strategy:** Performs HTTP requests via Pytest's `requests` client to simulate real user actions:
  - Registering and logging in participants, judges, and admins.
  - Submitting new hackathon projects and ensuring input boundaries are guarded.
  - Submitting evaluation reviews and verifying RBAC permissions (e.g., participants cannot rate other projects).

### 3. AI Evaluation Tests (`tests/pytest/test_ai_evaluation.py`)
- **Objective:** Validates the prompt template structures, safety checks, and deterministic responses of Gemini models.
- **Strategy:** Uses Pytest parameterization to evaluate:
  - Input token sizing and structure sanitization before dispatching to the Gemini API.
  - Mock and live response parsing of evaluation metrics (Innovation, Code Quality, UI, Readme).
  - Validation that AI scores are within acceptable boundaries `[0 - 100]` and feed correctly into the leaderboard aggregation logic.

### 4. Frontend Component Tests (`tests/frontend/*.test.tsx`)
- **Objective:** Validates visual correctness, responsive action triggers, local caching, and state synchronization of the React client.
- **Strategy:** Employs **React Testing Library** and **Vitest/Jest** to simulate real-world interactive behaviors:
  - User typing, submit button throttling, and error message rendering on network drops.
  - Drag-and-drop file upload capabilities for documents.
  - Seamless responsive toggles, dynamic chart animations (via Recharts), and real-time query inputs in the AI Judge Assistant chat interface.

---

## 🚀 How to Execute Tests

### Running Python Pytest Suite
To run the Pytest suite, initialize your Python virtual environment and run the test suite pointing to the application backend:

```bash
# Install testing dependencies
pip install pytest requests

# Execute all test cases with verbose details
pytest tests/pytest/ -v

# Run a specific module
pytest tests/pytest/test_api.py -v
```

### Running Frontend React Testing Library
To run the frontend component testing suite:

```bash
# Install testing modules if not present
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Execute testing script in watch/CI mode
npm test
```
