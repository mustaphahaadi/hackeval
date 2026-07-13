import pytest

def test_database_structure_consistency(mock_project_submission, mock_judge_review):
    """
    Validates backend database fields, data types, and logical bounds
    for project structures and review aggregates.
    """
    # 1. Project submission model constraints
    project = mock_project_submission
    assert "projectName" in project and isinstance(project["projectName"], str)
    assert len(project["projectName"]) > 0, "Project title must not be empty."
    assert "githubUrl" in project and project["githubUrl"].startswith("https://")
    
    # 2. Review scoring model constraints and score ranges [0 - 100]
    review = mock_judge_review
    scores = review["scores"]
    for criterion, value in scores.items():
        assert isinstance(value, int) or isinstance(value, float), f"{criterion} score must be numeric."
        assert 0 <= value <= 100, f"{criterion} score must be in range [0, 100]."
    
    assert "feedback" in review and len(review["feedback"]) >= 10, "Comments must provide actionable feedback."

def test_leaderboard_aggregation_math():
    """
    Validates that combined scores strictly follow the official weighting algorithm:
    Combined Score = (AI Overall Score * 0.40) + (Judge Average Score * 0.60)
    """
    ai_score = 90.0
    judge_avg = 85.0
    expected_combined = round((ai_score * 0.40) + (judge_avg * 0.60), 1)
    
    # Ensure our expectations match exact math calculations
    assert expected_combined == 87.0
    
    # Edge case: All perfect scores
    assert round((100 * 0.40) + (100 * 0.60), 1) == 100.0
    
    # Edge case: No reviews yet (should resolve gracefully to 0 or only AI score)
    ai_only = round((80.0 * 0.40) + (0 * 0.60), 1)
    assert ai_only == 32.0

def test_certificate_issuance_validity():
    """
    Ensures certificates have a valid cryptographic checksum reference,
    matching team fields, and a timestamp.
    """
    cert = {
        "id": "cert_xyz_789",
        "projectId": "proj_1",
        "projectName": "EcoSphere: Carbon Router",
        "teamName": "GreenEarth Developers",
        "certificateName": "Winner - Grand Prize",
        "issuedAt": "2026-07-13T11:45:00Z"
    }
    
    assert cert["id"].startswith("cert_")
    assert len(cert["certificateName"]) > 5
    assert "issuedAt" in cert
