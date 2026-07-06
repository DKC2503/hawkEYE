import io
from unittest.mock import PropertyMock, patch
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from app.main import app
from app.schemas.vision import VisionAnalysisResponse, CivicCategory, CivicSeverity
from app.services.gemini_service import GeminiService

client = TestClient(app)

def create_test_image_bytes(format="JPEG", size=(100, 100)) -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", size, color="blue")
    img.save(buf, format=format)
    return buf.getvalue()

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "gemini_model" in data

def test_upload_empty_file():
    response = client.post(
        "/api/vision/analyze",
        files={"file": ("empty.jpg", b"", "image/jpeg")},
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_upload_unsupported_mime_type():
    response = client.post(
        "/api/vision/analyze",
        files={"file": ("test.txt", b"Hello World text file content", "text/plain")},
    )
    assert response.status_code == 400
    assert "unsupported" in response.json()["detail"].lower()

def test_upload_corrupted_image():
    response = client.post(
        "/api/vision/analyze",
        files={"file": ("fake.jpg", b"NOT_REAL_IMAGE_BYTES_12345", "image/jpeg")},
    )
    assert response.status_code == 400
    assert "corrupted" in response.json()["detail"].lower() or "decode" in response.json()["detail"].lower()

def test_missing_api_key_error():
    with patch.object(GeminiService, "api_key", new_callable=PropertyMock, return_value=""):
        img_bytes = create_test_image_bytes()
        response = client.post(
            "/api/vision/analyze",
            files={"file": ("pothole.jpg", img_bytes, "image/jpeg")},
        )
        assert response.status_code == 503
        assert "[GEMINI_KEY_MISSING]" in response.json()["detail"]

def test_consistency_not_a_civic_issue():
    raw_response = VisionAnalysisResponse(
        is_civic_issue=True,
        category=CivicCategory.NOT_A_CIVIC_ISSUE,
        summary="A normal park bench in daylight.",
        severity=CivicSeverity.LOW,
        visible_risk="No risk visible.",
        confidence=0.95,
        needs_human_review=False,
    )
    processed = GeminiService.apply_consistency_rules(raw_response)
    assert processed.is_civic_issue is False

def test_consistency_uncertain_category():
    raw_response = VisionAnalysisResponse(
        is_civic_issue=True,
        category=CivicCategory.UNCERTAIN,
        summary="Image blur prevents clear detection.",
        severity=CivicSeverity.LOW,
        visible_risk="Uncertain risk.",
        confidence=0.85,
        needs_human_review=False,
    )
    processed = GeminiService.apply_consistency_rules(raw_response)
    assert processed.needs_human_review is True

def test_consistency_low_confidence():
    raw_response = VisionAnalysisResponse(
        is_civic_issue=True,
        category=CivicCategory.POTHOLE,
        summary="Possible road indentation visible.",
        severity=CivicSeverity.MEDIUM,
        visible_risk="Potential tire damage.",
        confidence=0.55,
        needs_human_review=False,
    )
    processed = GeminiService.apply_consistency_rules(raw_response)
    assert processed.needs_human_review is True

@patch("app.api.vision.gemini_service.analyze_civic_image")
def test_successful_vision_analysis_endpoint(mock_analyze):
    mock_analyze.return_value = VisionAnalysisResponse(
        is_civic_issue=True,
        category=CivicCategory.POTHOLE,
        summary="A large pothole with broken asphalt is visible.",
        severity=CivicSeverity.HIGH,
        visible_risk="May obstruct vehicles and create safety hazards.",
        confidence=0.94,
        needs_human_review=False,
    )

    img_bytes = create_test_image_bytes()
    response = client.post(
        "/api/vision/analyze",
        files={"file": ("pothole.jpg", img_bytes, "image/jpeg")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_civic_issue"] is True
    assert data["category"] == "POTHOLE"
    assert data["severity"] == "HIGH"
    assert data["confidence"] == 0.94
