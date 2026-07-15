# Hackathon Owner & Event Administrator Operations Guide

Welcome to the **Admin Command Center**! This guide is designed to help university organizers, department heads, and community coordinators manage users, update team details, schedule events, execute bulk AI evaluations with 1-click, and export final leaderboard reports.

---

## 🏛️ Accessing the Admin Command Center

When logged in with **Admin (Hackathon Owner)** credentials, you will see the **Admin Console** tab in your navigation header. The dashboard defaults to a comprehensive **Platform Overview** panel showing live real-time system KPIs:

*   **Active Hackathons:** Count of currently published hackathons receiving participant registrations.
*   **Registered Teams:** Total active project submissions across all events.
*   **AI Scored Rate:** Percentage and count of projects that have completed autonomous AI evaluation.
*   **Awards Issued:** Number of academic achievement certificates verifiably issued.

### 📋 Hackathon Operational Playbook
Directly in the Overview, organizers can consult the 6-step playbook to coordinate their event lifecycle successfully:
1.  **Define Hackathon Events** — Create/configure hackathon metadata and dates in the **Hackathon Events** tab.
2.  **Manage Teams & Submissions** — Track incoming participant registrations, team members, and git links.
3.  **Trigger Autonomous AI Grading** — Initiate bulk AI evaluation or individual project runs.
4.  **Input Manual Jury Overrides** — Submit professional manual jury scorecards to calculate composite rankings.
5.  **Establish and Export Standings** — Monitor live composite ranks and export official leaderboard CSVs.
6.  **Issue Academic Credentials** — Generate verifiably secure digital certificates for participants.

---

## 🔑 1. User Permissions & Role Management (RBAC)

Administrators have full authority over user permissions. This allows you to manage accounts and promote co-organizers:

```text
+-----------------------------------------------------------+
|                      User Directory                       |
+-----------------------------------------------------------+
| bob@university.edu       Role: Participant   [Make Admin]  |
| dean@university.edu      Role: Admin         [Demote User] |
+-----------------------------------------------------------+
```

1.  Navigate to the **User Permissions** tab.
2.  Locate the user's email address in the directory.
3.  Click **Make Admin** to promote a co-organizer, or **Demote to Participant** to restrict access.
4.  The system updates their access rights instantly.

---

## ⚖️ 2. Manual Jury Evaluation & Scorecard Submissions

The platform blends automated diagnostics with human expertise by supporting manual jury scorecards. This scores individual projects across the 7 criteria and weighs them at **60%** of the composite leaderboard ranking.

```text
+-----------------------------------------------------------+
|               👑 Manual Jury Evaluation                   |
+-----------------------------------------------------------+
| * Concept / Idea Alignment          [==========]  80/100  |
| * Innovation & Uniqueness           [==========]  85/100  |
| * Source Code Quality               [==========]  75/100  |
| * Feedback Note: "Excellent MVC and robust setup..."      |
|                                         [SUBMIT GRADE]    |
+-----------------------------------------------------------+
```

1.  Navigate to the **Manage Teams** tab or select a specific hackathon event.
2.  In the project list, find the target team and click **Submit Jury Scorecard** (this toggles an expandable scorecard panel).
3.  Use the range sliders to assign values from `0` to `100` for:
    *   **Concept:** Idea and validity.
    *   **Innovation:** Originality.
    *   **Code Quality:** Repository architecture and readability.
    *   **README:** Readability of developer setup documentation.
    *   **UI:** Design system and UX flow.
    *   **AI Usage:** Implementation of smart APIs or LLMs.
    *   **Technical Depth:** Complexity and sophistication.
4.  Write specific, actionable critique in the **Manual Feedback / Recommendations** text block.
5.  Click **Submit Grade**. The composite ranking updates instantly in the database, with a 60% manual and 40% AI weighted combination.

---

## 🤖 3. Running Autonomous AI Hackathon Evaluation (One-Click Bulk Grading)

Grading hackathons is now fully automated. Rather than coordinating a panel of manual judges and managing spreadsheets, you can trigger a comprehensive code audit with a single click (weighted at **40%** of the composite score):

```text
+-----------------------------------------------------------+
|           ⚡ Autonomous AI Hackathon Evaluator            |
+-----------------------------------------------------------+
| [ RUN AUTONOMOUS GRADING & RANKINGS ]                     |
|                                                           |
| * Pulls public repository branches, files & readme        |
| * Audits codebase practices & structure                   |
| * Generates scores for idea, innovation, UX, and code     |
+-----------------------------------------------------------+
```

1.  Navigate to the **Manage Teams** tab or select a specific event from the lists.
2.  Review the details card and click **Run Autonomous Grading & Rankings** (or **Grade All Submissions**).
3.  The background pipeline will:
    *   Crawl each project's GitHub URL to parse file structures, documentation, and branches.
    *   Execute static code checks to evaluate development practices.
    *   Run live accessibility, security, and performance audits over deployed website URLs.
    *   Query the Google Gemini model to grade projects against the 7 standardized criteria and compile detailed critique markdown.
4.  Upon completion, the leaderboard updates instantly. You can also re-run grading for individual projects by clicking **Run AI Grade** on specific project rows.

---

## 📝 4. Managing Team Submissions & Detail Edits

Participants occasionally make typos or change details mid-event. Administrators can edit submission details to keep records accurate:

1.  Navigate to the **Manage Teams** tab.
2.  Locate the project submission you need to adjust and click **Edit Details**.
3.  Make any corrections to the Project Title, Team Name, Member List, description, and URLs.
4.  Click **Save Changes**. The database updates immediately.

---

## 📅 5. Event Scheduling & Lifecycle Management

Admin accounts can define, schedule, and configure hackathon events:

1.  Navigate to the **Hackathon Events** tab.
2.  Click **Create Event** or modify existing listings.
3.  Set the **Event Name**, **Description**, **Start Date**, and **End Date**.
4.  Toggle **Activate** to open submissions for participants, or **Deactivate** to freeze changes and finalize evaluations.
5.  To update dates or names on an event, click **Edit Event details** inline on the event details dashboard, modify the fields, and click **Save Configuration**.

---

## 📊 6. Exporting Results & Leaderboard Data to CSV

Once evaluations are complete, you can export the finalized composite rankings for award ceremonies:

1.  Navigate to the **Export Results** tab.
2.  Click **Download CSV Results Report**.
3.  The browser compiles and downloads a structured file named `hackathon_leaderboard_results.csv` containing:
    *   Final Placement Rank
    *   Project Title & Team Name
    *   Computed AI Overall Score
    *   Jury Average Score
    *   Combined Composite Score
    *   Evaluation Status
    *   GitHub Repository Link
4.  Use this report to present awards and publish the final leaderboard standings!

---

## 🎓 7. Verifiable Academic Award Certificates

Organizers can issue secure, verifiable digital certificates to participants acknowledging their achievement, complete with unique cryptographic tracking codes:

1.  Navigate to the **Issue Awards / Certs** tab inside the Admin Dashboard.
2.  Select a project from the project submissions dropdown.
3.  Fill in the recipient's name (e.g. `John Doe`), primary email address, and select their award role (e.g. `First Place`, `Second Place`, `Third Place`, `Best AI Integration`, `Outstanding Finalist`, or `Completion`).
4.  Click **Issue Certificate**.
5.  The system mints a unique verification code, registers the credential, and allows students to fetch, verify, and view their certificates on the public **Verifiable Credentials Ledger** page.
6.  If a certificate needs to be revoked, click **Delete Certificate** next to the record inside the ledger management console.
