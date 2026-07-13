import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ParticipantPortal from "../../src/components/ParticipantPortal";

// Mock the nested ProjectSubmissionForm since it fetches external data
jest.mock("../../src/components/ProjectSubmissionForm", () => {
  return function MockForm({ onSubmitSuccess }: { onSubmitSuccess: () => void }) {
    return (
      <div data-testid="mock-submission-form">
        <button onClick={onSubmitSuccess} data-testid="submit-project-btn">
          Submit Mock Project
        </button>
      </div>
    );
  };
});

describe("ParticipantPortal Component", () => {
  const mockToken = "sample_participant_token_jwt";
  const mockUser = {
    id: "usr_participant_1",
    email: "alpha_team@hackathon.com",
    role: "Participant" as const
  };

  test("renders portal header, tabs, and team status tracker", async () => {
    render(<ParticipantPortal token={mockToken} user={mockUser} />);

    // Validate main heading is rendered
    expect(screen.getByText("Team Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Registered Project")).toBeInTheDocument();

    // Validate team email is showcased correctly
    expect(screen.getByText("alpha_team@hackathon.com")).toBeInTheDocument();
  });

  test("toggles view between Project Submission form and Document Uploader tab", () => {
    render(<ParticipantPortal token={mockToken} user={mockUser} />);

    // Locate the tabs/buttons
    const projectTabBtn = screen.getByText("Registered Project");
    const docsTabBtn = screen.getByText("Team Documents");

    expect(projectTabBtn).toBeInTheDocument();
    expect(docsTabBtn).toBeInTheDocument();

    // Click Team Documents to open document uploader section
    fireEvent.click(docsTabBtn);
    expect(screen.getByText("Upload Project Presentation")).toBeInTheDocument();
    expect(screen.getByText("Upload PDF file containing slides, schemas, or wireframes.")).toBeInTheDocument();
  });

  test("simulates document file selection and upload progress state", async () => {
    render(<ParticipantPortal token={mockToken} user={mockUser} />);
    
    // Switch to Team Documents
    fireEvent.click(screen.getByText("Team Documents"));

    // Find the file input field
    const fileInput = screen.getByLabelText(/Select Team PDF document/i);
    expect(fileInput).toBeInTheDocument();

    // Create a mock PDF file
    const file = new File(["dummy content"], "project_slides.pdf", { type: "application/pdf" });

    // Trigger file change event
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Click upload button
    const uploadBtn = screen.getByText(/Upload Files/i);
    fireEvent.click(uploadBtn);

    // Ensure status moves to uploaded or successfully completed
    await waitFor(() => {
      expect(screen.getByText(/Document uploaded successfully!/i)).toBeInTheDocument();
    });
  });
});
