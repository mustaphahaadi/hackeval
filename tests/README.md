# Hackathon Platform Testing Suite & Quality Assurance Plan

This testing suite provides a complete, modern, and robust testing architecture for the Autonomous AI Hackathon Platform. It spans across multiple tiers of the application—covering the Python FastAPI backend logic, SQL/PostgreSQL database structures, JWT authentication layers, Gemini AI evaluations, and React/Tailwind frontend screens.

---

## 📁 Testing Architecture & File Registry

```text
tests/
├── README.md                     # QA strategy, execution commands, and pipeline integration
├── pytest/                       # Pytest-based Backend & Database tests
│   ├── conftest.py               # Shared API fixtures, headers, and database session mocking
│   ├── test_backend_db.py        # Database entities and transactional consistency checks
│   ├── test_api.py               # REST API endpoints & Role-Based Access controls
│   └── test_ai_evaluation.py     # Gemini prompt verification, validation schema checks, and parsing
└── frontend/                     # React Testing Library & Vitest frontend unit/UI tests
    ├── test_participant_portal.test.tsx  # Submission form inputs, validation feedback, and doc uploads
    └── test_admin_dashboard.test.tsx      # Elevate roles, triggering bulk AI evaluations, and CSV exports
```

---

## 🎯 Testing Strategy Breakdown

### 1. Database & Persistence Layer (`tests/pytest/test_backend_db.py`)
*   **Objective:** Ensures schema correctness, field validation rules, transactional boundaries, and SQL relationships.
*   **Methodology:**
    *   Verifies that project records maintain correct UUID and timestamp formats.
    *   Asserts referential integrity (e.g. cascading deletes: when a project is deleted, its corresponding AI evaluation is also removed).
    *   Validates unique constraint rules (e.g. users cannot sign up with the same email).

### 2. Integration API Routes (`tests/pytest/test_api.py`)
*   **Objective:** Validates routing, route controllers, and HTTP status codes under different authentication states.
*   **Methodology:**
    *   Uses Pytest's standard HTTP clients to call the live API endpoints.
    *   Tests permission levels (RBAC):
        *   **Anonymous Guest:** Blocked from all `/api/projects` or `/api/evaluate` routes.
        *   **Participant:** Permitted to create a submission, retrieve their own details, and post comments. Blocked from calling `/api/evaluate-all` bulk grading.
        *   **Admin:** Complete write/delete authorization across users, events, and evaluations.

### 3. AI Pipeline & Prompt Quality (`tests/pytest/test_ai_evaluation.py`)
*   **Objective:** Verifies prompt construction sanitization, structured JSON response schema enforcement, and mathematical safety.
*   **Methodology:**
    *   Asserts that inputs are stripped of script injections before being wrapped in XML tags.
    *   Tests the JSON Parser with simulated Gemini outputs to ensure schema compliance (e.g. handling missing subscore fields by defaulting to safe fallbacks).
    *   Validates that overall scores are always within range `[0 - 100]` and compute as accurate mathematical averages.

### 4. Frontend Component & Interactive States (`tests/frontend/*.test.tsx`)
*   **Objective:** Ensures visual correctness, input validation, loading spinners, state synchronization, and accessibility.
*   **Methodology:**
    *   Uses **React Testing Library** and **jsdom** to mount UI components.
    *   Simulates mouse clicks and key entries to verify form boundaries.
    *   Verifies that clicking **Grade All Submissions** triggers a visible loading spinner, disables action buttons, and displays real-time progress updates.

---

## 🚀 How to Execute the Testing Suite

### 🐍 Running the Python Pytest Suite
Before running the suite, make sure Python and standard testing dependencies are installed in your workspace:

```bash
# Install testing frameworks and dependency tools
pip install pytest httpx requests

# Run all backend and database assertions
pytest tests/pytest/ -v

# Run a specific file with detailed print statements
pytest tests/pytest/test_ai_evaluation.py -v -s
```

### ⚛️ Running the React Frontend Suite
To execute frontend unit and interactive UI assertions:

```bash
# Install Node dev-dependencies if missing
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Run the Vitest test runner
npm run test
```
