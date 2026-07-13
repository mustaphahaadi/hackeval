# Judge & Jury Panel Evaluation Guide

Thank you for serving as an adjudicator for this university hackathon! This guide explains how to navigate your assessment workspace, compile manual scoresheets, execute automated Gemini-driven repository audits, and utilize the interactive **AI Judge Assistant** to analyze submissions.

---

## 🧭 Step 1: Navigating the Judge Dashboard

Upon logging in with your **Judge** credentials, your dashboard separates submissions into active status tabs:

*   **All Projects:** Central list of all student submissions.
*   **Pending Evaluation:** Submissions currently waiting for reviews.
*   **Evaluated:** Submissions that have received both AI assessments and human evaluations.

*Click on any team card to open the complete grading workspace for that project.*

---

## 🤖 Step 2: Running Automated AI Repository Audits

Our platform uses Google's **Gemini 3.5 Flash** model to perform automated, unbiased reviews of team repositories and pitch materials:

```text
                        [ RUN AI EVALUATION ]
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
Static Repository Scan                         Documentation Review
(Parses directories, loops                     (Reviews README clarity, problem
and program complexity structures)             statement, and solution feasibility)
         │                                               │
         └───────────────────────┬───────────────────────┘
                                 ▼
                     Comprehensive Evaluation Scorecard
              (Fills 7 criteria matrices with markdown feedback)
```

1.  Open a project card that is in `Pending AI` state.
2.  Click the blue **Run AI Evaluation** button.
3.  The Gemini model analyzes the repository metadata, code files, and descriptive logs.
4.  Within seconds, the platform displays the automated **AI Evaluation** containing a criteria breakdown and comprehensive feedback text.

---

## ✍️ Step 3: Compiling Human Jury Scorecards

Your academic and industry expertise is critical to balancing automated static reviews. To submit your manual review:

1.  Scroll to the **Human Evaluation Card** on the project page.
2.  Rate the project across the 7 categories from **0 to 100** points:
    *   **Idea:** Conceptual feasibility and solution validity.
    *   **Innovation:** Creativity and unique problem-solving.
    *   **Code Quality:** Clean architecture, modular layout, and styling consistency.
    *   **Readme:** Documentation clarity, setup steps, and usage guide.
    *   **UI/UX:** Visual layout, responsiveness, and typography.
    *   **AI Usage:** Integration depth of smart models or APIs.
    *   **Technical:** Complexity of engineering implementation.
3.  Add detailed **Feedback/Comments**. Include specific recommendations, strengths, and areas for improvement.
4.  Click **Submit Review** to save your evaluation.

---

## 💬 Step 4: Interacting with the AI Judge Assistant

The right side of the Judge Dashboard features the interactive **AI Judge Assistant**, a secure, custom-grounded oracle designed to help you analyze evaluations and rankings.

```text
+-----------------------------------------------------------+
| [Sparkles] AI Judge Assistant (Academic & Quality Oracle) |
+-----------------------------------------------------------+
| Bot: Hello Judge! I am your assistant. Ask me anything    |
|      about submissions, rankings, or score breakdowns!    |
|                                                           |
| User: Compare MediSync and EcoSphere based on UI score.   |
|                                                           |
| Bot: MediSync holds a UI score of 95, featuring a fluid   |
|      patient triage system, while EcoSphere scored 92.    |
+-----------------------------------------------------------+
| [ Ask about project details, innovation...           ] [>]|
+-----------------------------------------------------------+
```

### Supported Query Operations:

You can ask the assistant complex analysis questions. Click on the suggested quick-query prompts, or type custom queries directly into the input bar:

*   **Comparative Queries:**
    *   *"Compare EcoSphere and EduPulse based on innovation and code quality."*
    *   *"Which team has the highest technical score?"*
*   **Deep Dives:**
    *   *"Why did EcoSphere receive such high points?"*
    *   *"Summarize the judge feedback for the patient queuing project."*
*   **Standings & Stats:**
    *   *"What are the strongest projects currently registered on the leaderboard?"*
    *   *"List all teams currently waiting for human reviews."*
