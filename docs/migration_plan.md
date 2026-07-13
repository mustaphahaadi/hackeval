# Backend Migration Plan: Express/JSON to FastAPI/PostgreSQL

This document outlines the step-by-step engineering roadmap for migrating the **Autonomous AI Hackathon Evaluation Platform** backend from its current Node.js Express & JSON-file local storage to a production-grade Python **FastAPI, SQLAlchemy ORM, and PostgreSQL** database stack.

---

## 🏛️ Stack Comparison Table

| Component | Current Architecture | Target Migration Stack | Key Benefit |
| :--- | :--- | :--- | :--- |
| **Language Runtime** | Node.js (TypeScript) | Python 3.11+ | Native scientific, data, and ML/AI tooling |
| **Web Framework** | Express.js | FastAPI | High performance, auto OpenAPI docs, Pydantic data validation |
| **ORM / Query Engine** | Custom JS Memory Manager | SQLAlchemy & Alembic | Robust SQL compiling, transaction safety, automatic migration tracking |
| **Database Store** | Local JSON Files (`data/`) | PostgreSQL (Cloud SQL) | ACID compliance, concurrent querying, enterprise index management |
| **AI SDK** | `@google/genai` (TS SDK) | `google-genai` (Python SDK) | Native access to latest Gemini 2.5 Flash / Pro model APIs |

---

## 📅 Step-by-Step Migration Roadmap

```text
+-------------------+      +-----------------------+      +-----------------------+
|  Phase 1: DB &    | ---> |  Phase 2: FastAPI     | ---> |  Phase 3: AI Pipeline |
|  SQLAlchemy Model |      |  Endpoint Porting     |      |  Porting to Python    |
+-------------------+      +-----------------------+      +-----------------------+
                                                                      |
+-------------------+      +-----------------------+                  v
|  Phase 6: Cloud   | <--- |  Phase 5: DB          | <--- +-----------------------+
|  Run Deployment   |      |  Migration Script     |      |  Phase 4: Frontend    |
+-------------------+      +-----------------------+      |  API Alignment        |
                                                          +-----------------------+
```

### 🗄️ Phase 1: Database Setup & SQLAlchemy Schemas
1.  **Configure Database Connections:** Initialize SQLAlchemy's `sessionmaker` and `create_engine` linking to PostgreSQL.
2.  **Declare SQLAlchemy Declarative Base Models:**
    *   `User`: Primary key UUID, email (indexed, unique), hashed password, role (`Admin` or `Participant`).
    *   `ProjectSubmission`: PK UUID, name, team_name, members list, descriptions, URLs, status, foreign key to `User`.
    *   `AIEvaluation`: PK UUID, overall_score, scores for criteria (idea, innovation, code, readme, UX, AI, complexity), qualitative text feedback, FK to `ProjectSubmission`.
    *   `HackathonEvent`: PK UUID, name, start_date, end_date, active status.
3.  **Setup Database Migrations with Alembic:**
    *   Initialize Alembic in the python backend directory.
    *   Configure `env.py` to reference our metadata schemas.
    *   Run `alembic revision --autogenerate` to generate base tables.

### ⚡ Phase 2: FastAPI Web App & Security Gateways
1.  **Define Pydantic Request/Response Models:** Maintain strict type validation for user signups, sign-ins, project submissions, and evaluation reviews.
2.  **Implement JWT Authentication Middleware:**
    *   Utilize `python-jose` for JWT signing and decoding.
    *   Create a dependency `get_current_user` to inspect bearer token claims, load the user from the PostgreSQL session, and verify roles.
3.  **Port Routes & Controllers:**
    *   `POST /api/auth/register` and `POST /api/auth/login` (using `passlib` with bcrypt).
    *   `GET /api/projects` and `POST /api/projects` (with participant and admin boundaries).
    *   `POST /api/evaluate/:project_id` and `POST /api/evaluate-all` (admin bulk triggers).
    *   `POST /api/ai-judge-assistant` (admin semantic evaluation copilot).

### 🧠 Phase 3: Porting AI & Analysis Pipeline
1.  **Install Python GenAI SDK:** `pip install google-genai`.
2.  **Port Code Repository Crawling:**
    *   Use python's `httpx` or `requests` library to query the GitHub API.
    *   Parse repository README file and crawl file structures (license, file list).
3.  **Implement Static Code Evaluator:**
    *   Package crawled project data into a structured prompt using python's `google-genai` client.
    *   Force structured JSON outputs by specifying the response schema using Pydantic classes:
        ```python
        from pydantic import BaseModel, Field

        class AIEvalResponseSchema(BaseModel):
            idea: int = Field(..., ge=0, le=100)
            innovation: int = Field(..., ge=0, le=100)
            codeQuality: int = Field(..., ge=0, le=100)
            readme: int = Field(..., ge=0, le=100)
            ui: int = Field(..., ge=0, le=100)
            aiUsage: int = Field(..., ge=0, le=100)
            technical: int = Field(..., ge=0, le=100)
            feedback: str = Field(...)
        ```
    *   Deploy the `gemini-2.5-flash` model, requesting JSON format matching this schema.

### ⚛️ Phase 4: Frontend Alignment & Integration
1.  **Align Base URL:** Update Vite's development proxy target in `vite.config.ts` from the Node port (`3000`) to the python FastAPI port (e.g., `8000`), or bind FastAPI directly to port `3000` in our production container.
2.  **Ensure Request Body Parity:** Keep JSON fields identical (e.g., camelCase vs snake_case parsing). FastAPI's Pydantic models can automatically support aliases to keep client-side camelCase properties intact:
    ```python
    from pydantic import BaseModel, ConfigDict
    from pydantic.alias_generators import to_camel

    class ProjectBase(BaseModel):
        model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
        project_name: str
        team_name: str
        team_members: str
        description: str
        problem_statement: str
        github_url: str
        live_url: str | None = None
    ```

### 🗃️ Phase 5: JSON-to-SQL Migration Script
Create a simple python utility to transfer current developer configurations and testing data into the relational PostgreSQL instance:
```python
import json
import uuid
from sqlalchemy.orm import Session
from your_app.database import SessionLocal
from your_app.models import User, ProjectSubmission, AIEvaluation

def migrate_data():
    db: Session = SessionLocal()
    
    # Read local project list
    with open("data/projects.json") as f:
        projects_data = json.load(f)
        
    for proj in projects_data:
        # Map fields
        db_project = ProjectSubmission(
            id=proj["id"],
            user_id=proj["userId"],
            project_name=proj["projectName"],
            team_name=proj["teamName"],
            team_members=proj["teamMembers"],
            description=proj["description"],
            problem_statement=proj["problemStatement"],
            github_url=proj["githubUrl"],
            live_url=proj.get("liveUrl"),
            status=proj["status"],
            created_at=proj["createdAt"]
        )
        db.add(db_project)
    
    db.commit()
    db.close()
```

### 🐋 Phase 6: Production Container & Deployment Setup
Update your Docker container configurations to coordinate both compiled static assets (built in a frontend multi-stage) and the live FastAPI web app server:

```dockerfile
# Stage 1: Build the React SPA
FROM node:20-alpine AS build-stage
WORKDIR /frontend
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve via Python FastAPI Runner
FROM python:3.11-slim AS runner-stage
WORKDIR /app

# Install system utilities and python libraries
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy FastAPI source code
COPY ./backend ./backend

# Copy static frontend assets into FastAPI public assets mount
COPY --from=build-stage /frontend/dist ./backend/static

EXPOSE 3000

# Start FastAPI server binding to 3000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "3000"]
```
This production-grade single-container layout minimizes operational complexity, handles routing smoothly, and leverages FastAPI's high performance.
