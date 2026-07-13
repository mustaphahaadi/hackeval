# REST API Specifications Manual

This document details the public and protected REST API endpoints hosted by the Autonomous AI Hackathon Platform. All requests must utilize the application JSON content-type and provide valid credentials where specified.

---

## 🔐 Authentication Module

### 1. User Registration
Creates a new account inside the platform.
*   **Method:** `POST`
*   **Path:** `/api/auth/register`
*   **Headers:** `Content-Type: application/json`
*   **Request Body:**
    ```json
    {
      "email": "innovator_team@university.edu",
      "password": "StrongPassword123!",
      "role": "Participant"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "message": "User registered successfully.",
      "user": {
        "id": "usr_7ecf1489",
        "email": "innovator_team@university.edu",
        "role": "Participant"
      }
    }
    ```

### 2. User Authentication
Validates user credentials and issues a secure JWT token.
*   **Method:** `POST`
*   **Path:** `/api/auth/login`
*   **Request Body:**
    ```json
    {
      "email": "innovator_team@university.edu",
      "password": "StrongPassword123!"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzcl83ZWNmMTQ4OSIsImVtYWlsIjoiaW5ub3ZhdG9yX3RlYW1AdW5pdmVyc2l0eS5lZHUiLCJyb2xlIjoiUGFydGljaXBhbnQifQ...",
      "user": {
        "id": "usr_7ecf1489",
        "email": "innovator_team@university.edu",
        "role": "Participant"
      }
    }
    ```

---

## 📁 Project Submission Module

### 1. Submit Hackathon Project
Registers a team submission.
*   **Method:** `POST`
*   **Path:** `/api/projects`
*   **Headers:**
    *   `Authorization: Bearer <JWT_TOKEN>` (Role: `Participant` or `Admin`)
*   **Request Body:**
    ```json
    {
      "projectName": "MediSync: Patient Queue Coordinator",
      "teamName": "ByteSized Medical",
      "teamMembers": "Alice Chen, Bob Vance",
      "description": "An automated patient queuing platform utilizing dynamic triage machine learning schemas.",
      "problemStatement": "Emergency rooms suffer from long wait times and suboptimal patient priority routing.",
      "githubUrl": "https://github.com/bytesized/medisync",
      "liveUrl": "https://medisync-demo.cloud"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "id": "proj_a28b49cd",
      "userId": "usr_7ecf1489",
      "projectName": "MediSync: Patient Queue Coordinator",
      "teamName": "ByteSized Medical",
      "teamMembers": "Alice Chen, Bob Vance",
      "description": "An automated patient queuing platform...",
      "problemStatement": "Emergency rooms suffer...",
      "githubUrl": "https://github.com/bytesized/medisync",
      "liveUrl": "https://medisync-demo.cloud",
      "status": "pending",
      "createdAt": "2026-07-13T11:55:00.000Z"
    }
    ```

### 2. Fetch All Project Submissions
Retrieves all submissions. Output is sanitized based on user access roles.
*   **Method:** `GET`
*   **Path:** `/api/projects`
*   **Headers:**
    *   `Authorization: Bearer <JWT_TOKEN>`
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "proj_a28b49cd",
        "projectName": "MediSync: Patient Queue Coordinator",
        "teamName": "ByteSized Medical",
        "status": "pending",
        "createdAt": "2026-07-13T11:55:00.000Z"
      }
    ]
    ```

---

## 🤖 AI Evaluation & Automated Grading Module

### 1. Trigger Gemini AI Review on Single Project
Triggers the live code static audit and Gemini evaluation for a project.
*   **Method:** `POST`
*   **Path:** `/api/evaluate/proj_a28b49cd`
*   **Headers:**
    *   `Authorization: Bearer <JWT_TOKEN>` (Must be role: `Admin`)
*   **Response (200 OK):**
    ```json
    {
      "message": "AI Evaluation completed successfully.",
      "evaluation": {
        "id": "eval_88fa12",
        "projectId": "proj_a28b49cd",
        "overallScore": 87.1,
        "ideaScore": 90,
        "innovationScore": 85,
        "codeQualityScore": 82,
        "readmeScore": 88,
        "uiScore": 92,
        "aiUsageScore": 85,
        "technicalScore": 88,
        "feedback": "### Executive AI Overview\n\nMediSync proposes a clean triage priority system...",
        "createdAt": "2026-07-13T11:56:00.000Z"
      }
    }
    ```

### 2. Run Bulk AI Evaluation On All Submissions
Performs autonomous, simultaneous code reviews and assigns grades over all projects.
*   **Method:** `POST`
*   **Path:** `/api/evaluate-all`
*   **Headers:**
    *   `Authorization: Bearer <JWT_TOKEN>` (Must be role: `Admin`)
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "evaluatedCount": 8,
      "results": [
        {
          "projectId": "proj_a28b49cd",
          "projectName": "MediSync: Patient Queue Coordinator",
          "overallScore": 87.1,
          "status": "success"
        }
      ]
    }
    ```

### 3. Query AI Evaluation Assistant Chat
Interacts with the dynamic natural language context oracle over evaluated results.
*   **Method:** `POST`
*   **Path:** `/api/ai-judge-assistant`
*   **Headers:**
    *   `Authorization: Bearer <JWT_TOKEN>` (Must be role: `Admin`)
*   **Request Body:**
    ```json
    {
      "query": "Compare MediSync and EcoSphere based on UI and Code Quality."
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "answer": "### Comparison Report: MediSync vs. EcoSphere\n\n1. **User Interface (UI):**\n   - **MediSync** leads with a UI score of **95** points, featuring a fluid triage dashboard layout.\n   - **EcoSphere** scored **92** points, backed by highly visual real-time carbon graphs.\n\n2. **Code Quality:**\n   - **EcoSphere** ranks higher in code architecture, scoring **88** points due to clean modular separation.\n   - **MediSync** received **80** points, where judges noted room for component decoupling."
    }
    ```

---

## 👑 Administrative Operations

### 1. Upgrade User Role (RBAC management)
Promotes or demotes user accounts inside the permission tables.
*   **Method:** `PUT`
*   **Path:** `/api/admin/users/usr_7ecf1489/role`
*   **Headers:**
    *   `Authorization: Bearer <JWT_TOKEN>` (Must be role: `Admin`)
*   **Request Body:**
    ```json
    {
      "role": "Admin"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "User role updated successfully."
    }
    ```
