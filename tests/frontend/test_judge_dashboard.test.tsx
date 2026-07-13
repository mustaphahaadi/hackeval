import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import JudgeDashboard from "../../src/components/JudgeDashboard";

describe("JudgeDashboard Component", () => {
  const mockToken = "sample_judge_token_jwt";
  const mockOnSelectProject = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the global fetch function to simulate API calls
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes("/api/projects")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: "proj_abc",
              projectName: "EcoSphere: Carbon Router",
              teamName: "GreenEarth Developers",
              description: "AI emissions path router for certified offsets.",
              status: "pending",
              createdAt: "2026-07-13T11:00:00Z"
            }
          ])
        });
      }
      if (url.includes("/api/ai-judge-assistant")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            answer: "EcoSphere scores highly due to its carbon offset math routing model."
          })
        });
      }
      return Promise.resolve({ ok: false });
    });
  });

  test("renders submissions list and allows filter change", async () => {
    render(<JudgeDashboard token={mockToken} onSelectProject={mockOnSelectProject} />);

    // Wait for the mock project to load
    await waitFor(() => {
      expect(screen.getByText("EcoSphere: Carbon Router")).toBeInTheDocument();
    });

    // Verify sub-details like team name and status tags
    expect(screen.getByText("Team: GreenEarth Developers")).toBeInTheDocument();
    expect(screen.getByText("Pending AI")).toBeInTheDocument();
  });

  test("triggers project evaluation callback on selection", async () => {
    render(<JudgeDashboard token={mockToken} onSelectProject={mockOnSelectProject} />);

    await waitFor(() => {
      expect(screen.getByText("EcoSphere: Carbon Router")).toBeInTheDocument();
    });

    // Click on the evaluate/project container
    const card = screen.getByText("EcoSphere: Carbon Router");
    fireEvent.click(card);

    expect(mockOnSelectProject).toHaveBeenCalledWith("proj_abc");
  });

  test("interacts with the AI Judge Assistant chat interface", async () => {
    render(<JudgeDashboard token={mockToken} onSelectProject={mockOnSelectProject} />);

    // Verify chat assistant title and starting prompt
    expect(screen.getByText("AI Judge Assistant")).toBeInTheDocument();
    expect(screen.getByText(/Hello Judge! I am your AI Judge Assistant/i)).toBeInTheDocument();

    // Find the query input field
    const inputField = screen.getByPlaceholderText("Ask about project details, innovation...");
    expect(inputField).toBeInTheDocument();

    // Type a specific question
    fireEvent.change(inputField, { target: { value: "Why did EcoSphere receive 90+ points?" } });
    expect(inputField).toHaveValue("Why did EcoSphere receive 90+ points?");

    // Submit the query form
    const submitBtn = screen.getByRole("button", { name: "" }); // Send button has SVG icon only
    fireEvent.click(submitBtn);

    // Verify user query and mock AI assistant response are rendered
    await waitFor(() => {
      expect(screen.getByText("Why did EcoSphere receive 90+ points?")).toBeInTheDocument();
      expect(screen.getByText(/EcoSphere scores highly due to its carbon offset math routing model/i)).toBeInTheDocument();
    });
  });
});
