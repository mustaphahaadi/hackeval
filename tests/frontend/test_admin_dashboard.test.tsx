import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminDashboard from "../../src/components/AdminDashboard";

describe("AdminDashboard Component", () => {
  const mockToken = "sample_admin_token_jwt";

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes("/api/admin/users")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: "usr_1", email: "bob@hackathon.com", role: "Participant", createdAt: "2026-07-13T11:00:00Z" },
            { id: "usr_2", email: "alice@hackathon.com", role: "Judge", createdAt: "2026-07-13T11:05:00Z" }
          ])
        });
      }
      if (url.includes("/api/hackathons")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: "h1", name: "Global Climate Hack 2026", description: "Hack for green future", status: "active", startDate: "2026-07-13", endDate: "2026-07-15", createdAt: "2026-07-13T11:00:00Z" }
          ])
        });
      }
      if (url.includes("/api/projects")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: "proj_1",
              projectName: "EcoSphere: Carbon Router",
              teamName: "GreenEarth Developers",
              description: "AI emissions path router for certified offsets.",
              status: "evaluated",
              teamMembers: "Bob, Charles",
              githubUrl: "https://github.com/green/ecosphere",
              liveUrl: "https://ecosphere.demo",
              createdAt: "2026-07-13T11:00:00Z"
            }
          ])
        });
      }
      if (url.includes("/api/leaderboard")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { rank: 1, projectName: "EcoSphere: Carbon Router", teamName: "GreenEarth Developers", aiOverallScore: 90.1, judgeAverageScore: 88.6, combinedScore: 89.2 }
          ])
        });
      }
      return Promise.resolve({ ok: false });
    });
  });

  test("renders admin statistics and sub-tabs correctly", async () => {
    render(<AdminDashboard token={mockToken} />);

    // Wait for data fetching to complete and check main sections
    await waitFor(() => {
      expect(screen.getByText("Admin Command Center")).toBeInTheDocument();
      expect(screen.getByText("Configure event schedules, judge assignments, and export ranking data.")).toBeInTheDocument();
    });

    // Check tabs
    expect(screen.getByText(/User Permissions/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage Teams/i)).toBeInTheDocument();
    expect(screen.getByText(/Export Results/i)).toBeInTheDocument();
  });

  test("allows admin to search and edit team submission details", async () => {
    render(<AdminDashboard token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText(/Manage Teams/i)).toBeInTheDocument();
    });

    // Navigate to Manage Teams tab
    fireEvent.click(screen.getByText(/Manage Teams/i));

    // Verify EcoSphere is listed
    expect(screen.getByText("EcoSphere: Carbon Router")).toBeInTheDocument();
    expect(screen.getByText("Team: GreenEarth Developers")).toBeInTheDocument();

    // Click Edit details
    const editBtn = screen.getByText("Edit details");
    fireEvent.click(editBtn);

    // Verify input fields for project edits are filled with existing values
    const projectNameInput = screen.getByLabelText(/Project Title/i);
    expect(projectNameInput).toHaveValue("EcoSphere: Carbon Router");

    // Change title
    fireEvent.change(projectNameInput, { target: { value: "EcoSphere Pro: Carbon Router" } });
    expect(projectNameInput).toHaveValue("EcoSphere Pro: Carbon Router");
  });

  test("clicking export csv triggers leaderboard compilation", async () => {
    // Mock anchor element clicks
    const mockClick = jest.fn();
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn().mockImplementation((tagName) => {
      if (tagName === "a") {
        return {
          setAttribute: jest.fn(),
          click: mockClick,
          style: {}
        };
      }
      return originalCreateElement.call(document, tagName);
    });

    render(<AdminDashboard token={mockToken} />);

    // Click Export Results tab
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Export Results/i));
    });

    const exportBtn = screen.getByText(/Download CSV Results Report/i);
    expect(exportBtn).toBeInTheDocument();

    // Trigger CSV compile/download
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(screen.getByText("Leaderboard results exported successfully to CSV!")).toBeInTheDocument();
    });

    // Restore original document functions
    document.createElement = originalCreateElement;
  });
});
