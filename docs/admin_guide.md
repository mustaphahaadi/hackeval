# Event Administrator Operations Guide

Welcome to the **Admin Command Center**! This guide is designed to help university organizers, department heads, and developer club coordinators manage users, update team details, set up events, and export leaderboard results.

---

## 🏛️ Accessing the Admin Command Center

When logged in with **Admin** credentials, you will see the **Admin Control Panel** in your navigation header. The dashboard provides a high-level view of system metrics:

*   **Total Registered Users:** Total participant, judge, and admin accounts.
*   **Total Project Submissions:** Total student projects currently in the database.
*   **Awaiting Evaluations:** Submissions needing AI or jury grading.
*   **Evaluated Projects:** Fully graded projects included in the leaderboard.

---

## 🔑 1. User Permissions & Role Management (RBAC)

Administrators have full authority over user permissions. This allows you to promote accounts and assign jury members:

```text
+-----------------------------------------------------------+
|                      User Directory                       |
+-----------------------------------------------------------+
| bob@university.edu       Role: Participant   [Change Role] |
| alice@university.edu     Role: Judge         [Change Role] |
| dean@university.edu      Role: Admin         [Change Role] |
+-----------------------------------------------------------+
```

1.  Navigate to the **User Permissions** tab.
2.  Locate the user's email address in the directory.
3.  Click the **Role Selection** dropdown next to their name.
4.  Select **Judge** to promote a guest speaker or faculty member, or **Admin** to grant co-organizer permissions.
5.  The system updates their access rights instantly without requiring a re-login.

---

## 📝 2. Managing Team Submissions & Detail Edits

Students frequently make typos or change their projects mid-event. Administrators can edit submission details to keep records accurate:

1.  Navigate to the **Manage Teams** tab.
2.  Select the project submission you need to adjust.
3.  Click **Edit Details**.
4.  A form displays with current metadata (Project Title, Team Name, Member List, problem description, GitHub and Live URLs).
5.  Make the necessary corrections and click **Save Changes**. The database updates immediately, and the changes are reflected across both the Judge and Participant Dashboards.

---

## 📅 3. Event Scheduling & Lifecycle Management

Admin accounts can define and schedule specific hackathon events:

1.  Navigate to the **Manage Events** tab.
2.  Click **Create Event** or modify existing listings.
3.  Set the **Event Name**, **Description**, **Start Date**, and **End Date**.
4.  Set the status to **Active** to open submissions for participants, or **Ended** to freeze changes and finalize evaluations.

---

## 📊 4. Exporting Results & Leaderboard Data to CSV

Once all evaluations are complete, you can export the finalized rankings for award ceremonies or grading records:

```text
+-----------------------------------------------------------+
|                     Export Console                        |
+-----------------------------------------------------------+
|  Calculate Combined Scores:                               |
|  * AI static scorecard score: 40% weighting               |
|  * Jury average panel score: 60% weighting                |
|                                                           |
|  [ DOWNLOAD CSV RESULTS REPORT ]                          |
+-----------------------------------------------------------+
```

1.  Navigate to the **Export Results** tab.
2.  Review the compiled leaderboard ranks displayed in the table. The platform calculates combined scores using the official formula:
    $$\text{Combined Score} = (\text{AI Overall Score} \times 0.40) + (\text{Jury Average Score} \times 0.60)$$
3.  Click the blue **Download CSV Results Report** button.
4.  The browser compiles and downloads a structured file named `hackathon_leaderboard_results.csv` containing:
    *   Final Placement Rank
    *   Project Title & Team Name
    *   Spokesperson Email & Member Names
    *   Calculated AI Score
    *   Judge Average Score
    *   Combined Weighted Score
    *   GitHub Repository Link
5.  A success message appears, confirming your data export is complete and ready for presentation!
