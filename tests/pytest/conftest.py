import pytest

@pytest.fixture
def base_url():
    """Returns the local mock or live staging server development URL."""
    return "http://localhost:3000"

@pytest.fixture
def mock_participant_payload():
    """Returns standard registration credentials for a Participant team."""
    return {
        "email": "test_team@hackathon.com",
        "password": "SecurePassword123!",
        "role": "Participant"
    }

@pytest.fixture
def mock_judge_payload():
    """Returns registration credentials for a Jury member."""
    return {
        "email": "jury_chair@hackathon.com",
        "password": "SecurePassword123!",
        "role": "Judge"
    }

@pytest.fixture
def mock_admin_payload():
    """Returns standard registration credentials for an Event Administrator."""
    return {
        "email": "admin@hackathon.com",
        "password": "SecurePassword123!",
        "role": "Admin"
    }

@pytest.fixture
def mock_project_submission():
    """Returns standard hackathon project submission payload."""
    return {
        "projectName": "EcoSphere: Carbon Router",
        "teamName": "GreenEarth Developers",
        "description": "An intelligent routing router to track carbon offsets using spatial machine learning.",
        "problemStatement": "Logistics companies fail to measure micro-carbon footprints of dynamic routes.",
        "githubUrl": "https://github.com/test/ecosphere",
        "liveUrl": "https://ecosphere-live.demo"
    }

@pytest.fixture
def mock_judge_review():
    """Returns standard criteria evaluation scores submitted by a judge."""
    return {
        "scores": {
            "idea": 90,
            "innovation": 95,
            "codeQuality": 88,
            "readme": 92,
            "ui": 94,
            "aiUsage": 90,
            "technical": 91
        },
        "feedback": "Outstanding architectural layout with real-time reactive route simulations."
    }
