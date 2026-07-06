import io
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from PIL import Image
from app.main import app

client = TestClient(app)

def create_dummy_image_bytes():
    buf = io.BytesIO()
    img = Image.new('RGB', (100, 100), color='blue')
    img.save(buf, format='JPEG')
    return buf.getvalue()

def test_issues_api_missing_auth():
    img_bytes = create_dummy_image_bytes()
    response = client.post(
        "/api/issues",
        files={"file": ("test.jpg", img_bytes, "image/jpeg")},
        data={
            "latitude": "17.6868",
            "longitude": "83.2185",
            "aiCategory": "POTHOLE",
            "aiSummary": "Test pothole",
            "aiSeverity": "HIGH",
            "aiVisibleRisk": "Test risk",
            "aiConfidence": "0.95",
            "category": "pothole",
            "description": "Test description",
        },
    )
    assert response.status_code == 401
    assert "AUTH_HEADER_MISSING" in response.text

def test_issues_api_invalid_coordinates():
    img_bytes = create_dummy_image_bytes()
    headers = {"Authorization": "Bearer fake_token_string"}

    with patch("firebase_admin.auth.verify_id_token") as mock_verify:
        mock_verify.return_value = {"uid": "test_uid_123"}
        response = client.post(
            "/api/issues",
            headers=headers,
            files={"file": ("test.jpg", img_bytes, "image/jpeg")},
            data={
                "latitude": "999.0", # Invalid latitude
                "longitude": "83.2185",
                "aiCategory": "POTHOLE",
                "aiSummary": "Test pothole",
                "aiSeverity": "HIGH",
                "aiVisibleRisk": "Test risk",
                "aiConfidence": "0.95",
                "category": "pothole",
                "description": "Test description",
            },
        )
        assert response.status_code == 400
        assert "INVALID_REPORT" in response.text

@patch("app.services.cloudinary_service.cloudinary_service.upload_issue_image")
@patch("app.services.firestore_service.firestore_service.create_issue_document")
@patch("firebase_admin.auth.verify_id_token")
def test_issues_api_success(mock_verify, mock_create_doc, mock_upload_img):
    mock_verify.return_value = {"uid": "verified_test_citizen_uid"}

    mock_upload_img.return_value = {
        "secure_url": "https://res.cloudinary.com/test/image.jpg",
        "public_id": "hawkeye/issues/he_issue_12345",
        "width": 800,
        "height": 600,
        "format": "jpg",
        "bytes": 150000,
    }

    mock_create_doc.return_value = {
        "issueId": "test-issue-uuid-1234",
        "ticketId": "HE-2026-TEST99",
        "reporter": {"uid": "verified_test_citizen_uid"},
        "category": "pothole",
        "description": "Test pothole complaint",
        "status": "SUBMITTED",
        "location": {"displayName": "MVP Colony, Visakhapatnam"},
        "image": {"secure_url": "https://res.cloudinary.com/test/image.jpg"},
    }

    img_bytes = create_dummy_image_bytes()
    headers = {"Authorization": "Bearer valid_firebase_token"}

    response = client.post(
        "/api/issues",
        headers=headers,
        files={"file": ("test.jpg", img_bytes, "image/jpeg")},
        data={
            "latitude": "17.6868",
            "longitude": "83.2185",
            "accuracy": "10",
            "area": "MVP Colony",
            "city": "Visakhapatnam",
            "aiCategory": "POTHOLE",
            "aiSummary": "Pothole detected on main road",
            "aiSeverity": "HIGH",
            "aiVisibleRisk": "Road safety hazard",
            "aiConfidence": "0.94",
            "category": "pothole",
            "description": "Test pothole complaint",
        },
    )

    assert response.status_code == 201
    json_data = response.json()
    assert json_data["success"] is True
    assert json_data["ticketId"] == "HE-2026-TEST99"
    assert json_data["issueId"] == "test-issue-uuid-1234"

@patch("app.services.firestore_service.firestore_service.dismiss_report")
@patch("firebase_admin.auth.verify_id_token")
def test_dismiss_report_patch_endpoint(mock_verify, mock_dismiss):
    # 1. Missing auth header
    response = client.patch("/api/authority/issues/report-123/dismiss", json={"reasonCode": "spam_or_misuse"})
    assert response.status_code == 401
    assert "Authorization header" in response.json()["detail"]

    # 2. Authenticated but missing role header
    mock_verify.return_value = {"uid": "auth_user_123"}
    headers = {"Authorization": "Bearer token"}
    response = client.patch(
        "/api/authority/issues/report-123/dismiss",
        headers=headers,
        json={"reasonCode": "spam_or_misuse"}
    )
    assert response.status_code == 403
    assert "authority role permissions" in response.json()["detail"]

    # 3. Successful dismissal
    headers["X-Authority-Role"] = "authority"
    mock_dismiss.return_value = {
        "success": True,
        "issueId": "report-123",
        "ticketId": "HE-2026-ABCDE",
        "status": "DISMISSED",
    }
    response = client.patch(
        "/api/authority/issues/report-123/dismiss",
        headers=headers,
        json={
            "reasonCode": "spam_or_misuse",
            "remarks": "unrelated spam report"
        }
    )
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert json_data["status"] == "DISMISSED"
    mock_dismiss.assert_called_once_with(
        "report-123",
        authority_uid="auth_user_123",
        reason="spam_or_misuse",
        notes="unrelated spam report",
        duplicate_of_ticket_id=None
    )

@patch("app.services.firestore_service.firestore_service.delete_report")
@patch("firebase_admin.auth.verify_id_token")
def test_delete_report_patch_endpoint(mock_verify, mock_delete):
    # 1. Missing auth header
    response = client.patch("/api/authority/issues/report-123/delete", json={"reasonCode": "test_report"})
    assert response.status_code == 401

    # 2. Authenticated but missing role header
    mock_verify.return_value = {"uid": "auth_user_123"}
    headers = {"Authorization": "Bearer token"}
    response = client.patch(
        "/api/authority/issues/report-123/delete",
        headers=headers,
        json={"reasonCode": "test_report"}
    )
    assert response.status_code == 403

    # 3. Missing remarks when reasonCode is 'other'
    headers["X-Authority-Role"] = "authority"
    response = client.patch(
        "/api/authority/issues/report-123/delete",
        headers=headers,
        json={"reasonCode": "other"}
    )
    assert response.status_code == 400
    assert "Remarks are required" in response.json()["detail"]

    # 4. Successful soft-delete
    mock_delete.return_value = {
        "success": True,
        "issueId": "report-123",
        "ticketId": "HE-2026-ABCDE",
        "status": "DISMISSED",
    }
    response = client.patch(
        "/api/authority/issues/report-123/delete",
        headers=headers,
        json={
            "reasonCode": "test_report",
            "remarks": "test run cleanup"
        }
    )
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    mock_delete.assert_called_once_with(
        issue_id="report-123",
        authority_uid="auth_user_123",
        reason_code="test_report",
        remarks="test run cleanup"
    )
