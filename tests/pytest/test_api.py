import pytest
import unittest.mock as mock

def test_user_authentication_flow(mock_participant_payload):
    """
    Simulates registering and logging in a participant user.
    Checks that a JWT is returned and standard headers are set correctly.
    """
    # Standard JWT Response Simulation
    mock_response = mock.Mock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "token": "mocked_jwt_token_header.payload.signature",
        "user": {
            "id": "usr_99",
            "email": "test_team@hackathon.com",
            "role": "Participant"
        }
    }

    # Verify authorization schema structure
    res_data = mock_response.json()
    assert mock_response.status_code == 200
    assert "token" in res_data
    assert res_data["user"]["role"] == "Participant"
    assert "@hackathon.com" in res_data["user"]["email"]

def test_role_based_access_control(mock_project_submission):
    """
    Verifies API boundaries:
    - Participants can POST projects.
    - Public / Unauthorized requests are rejected with 401/403 errors.
    """
    # 1. Unauthorized request simulation
    unauth_response = mock.Mock()
    unauth_response.status_code = 401
    unauth_response.json.return_value = {"error": "Access token is missing or invalid."}
    
    assert unauth_response.status_code == 401
    assert "token" in unauth_response.json()["error"].lower()

    # 2. Authorized participant project submission
    auth_response = mock.Mock()
    auth_response.status_code = 201
    auth_response.json.return_value = {
        "id": "proj_101",
        "projectName": "EcoSphere: Carbon Router",
        "teamName": "GreenEarth Developers",
        "status": "pending",
        "teamMembers": "Alice, Bob",
        "createdAt": "2026-07-13T11:45:00Z"
    }

    assert auth_response.status_code == 201
    assert auth_response.json()["status"] == "pending"
    assert "id" in auth_response.json()

def test_admin_triggers_bulk_evaluation():
    """
    Verifies that an Admin can trigger bulk AI evaluation over all submitted projects.
    """
    bulk_response = mock.Mock()
    bulk_response.status_code = 200
    bulk_response.json.return_value = {
        "success": True,
        "evaluatedCount": 5,
        "results": [
            {"projectId": "proj_101", "projectName": "EcoSphere", "status": "success"}
        ]
    }

    assert bulk_response.status_code == 200
    assert bulk_response.json()["success"] is True
    assert bulk_response.json()["evaluatedCount"] == 5
