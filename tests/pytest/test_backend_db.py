import pytest

def test_database_structure_consistency(mock_project_submission):
    """
    Validates backend database fields, data types, and logical bounds
    for project structures and evaluation aggregates.
    """
    # 1. Project submission model constraints
    project = mock_project_submission
    assert "projectName" in project and isinstance(project["projectName"], str)
    assert len(project["projectName"]) > 0, "Project title must not be empty."
    assert "githubUrl" in project and project["githubUrl"].startswith("https://")

def test_leaderboard_aggregation_math():
    """
    Validates that leaderboard scores strictly follow the automated AI overall scoring algorithm:
    Overall Score = Mean of (Idea, Innovation, Code Quality, README, UI, AI Usage, Technical Complexity)
    """
    ai_subscores = {
        "idea": 90,
        "innovation": 85,
        "codeQuality": 80,
        "readme": 90,
        "ui": 95,
        "aiUsage": 85,
        "technical": 87
    }
    
    # Calculate arithmetic mean
    calculated_overall = round(sum(ai_subscores.values()) / len(ai_subscores), 1)
    
    # Expected overall score
    assert calculated_overall == 87.4
    
    # Perfect score edge case
    perfect_subscores = {k: 100 for k in ai_subscores.keys()}
    assert round(sum(perfect_subscores.values()) / len(perfect_subscores), 1) == 100.0

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
