# Hackathon Owner & Event Administrator Operations Guide

Welcome to the **Admin Command Center**! This guide is designed to help university organizers, department heads, and community coordinators manage users, update team details, schedule events, execute bulk AI evaluations with 1-click, and export final leaderboard reports.

---

## 🏛️ Accessing the Admin Command Center

When logged in with **Admin (Hackathon Owner)** credentials, you will see the **Admin Console** tab in your navigation header. The dashboard provides a high-level view of system metrics:

*   **Total Registered Users:** Total participant and admin accounts.
*   **Total Project Submissions:** Total projects currently in the database.
*   **Awaiting Evaluations:** Submissions needing AI grading.
*   **Evaluated Projects:** Fully graded projects included in the leaderboard.

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

## 🤖 2. Running Autonomous AI Hackathon Evaluation (One-Click Bulk Grading)

Grading hackathons is now fully automated. Rather than coordinating a panel of manual judges and managing spreadsheets, you can grade all project submissions with a single click:

```text
+-----------------------------------------------------------+
|           ⚡ Autonomous AI Hackathon Evaluator            |
+-----------------------------------------------------------+
| [ GRADE ALL SUBMISSIONS ]                                 |
|                                                           |
| * Pulls public repository branches, files & readme        |
| * Audits codebase practices & structure                   |
| * Generates scores for idea, innovation, UX, and code     |
+-----------------------------------------------------------+
```

1.  Navigate to the **Manage Teams** tab in the Admin Console.
2.  Review the **Autonomous AI Hackathon Evaluator** gradient banner.
3.  Click the white **Grade All Submissions** button.
4.  The background pipeline will:
    *   Crawl each project's GitHub URL to parse file structures, documentation, and branches.
    *   Execute static code checks to evaluate development practices.
    *   Run live accessibility, security, and performance audits over deployed website URLs.
    *   Query the Google Gemini model to grade projects against the 7 standardized criteria and compile detailed critique markdown.
5.  Upon completion, the leaderboard updates instantly. You can also re-run grading for individual projects inside their detailed view page.

---

## 📝 3. Managing Team Submissions & Detail Edits

Participants occasionally make typos or change details mid-event. Administrators can edit submission details to keep records accurate:

1.  Navigate to the **Manage Teams** tab.
2.  Locate the project submission you need to adjust and click **Edit Details**.
3.  Make any corrections to the Project Title, Team Name, Member List, description, and URLs.
4.  Click **Save Changes**. The database updates immediately.

---

## 📅 4. Event Scheduling & Lifecycle Management

Admin accounts can define and schedule specific hackathon events:

1.  Navigate to the **Hackathon Events** tab.
2.  Click **Create Event** or modify existing listings.
3.  Set the **Event Name**, **Description**, **Start Date**, and **End Date**.
4.  Toggle **Activate** to open submissions for participants, or **Deactivate** to freeze changes and finalize evaluations.

---

## 📊 5. Exporting Results & Leaderboard Data to CSV

Once evaluations are complete, you can export the finalized rankings for award ceremonies:

1.  Navigate to the **Export Results** tab.
2.  Click **Download CSV Results Report**.
3.  The browser compiles and downloads a structured file named `hackathon_leaderboard_results.csv` containing:
    *   Final Placement Rank
    *   Project Title & Team Name
    *   Computed AI Overall Score
    *   Evaluation Status
    *   GitHub Repository Link
4.  Use this report to present awards and publish the final leaderboard standings!
