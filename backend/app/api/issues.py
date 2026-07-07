import io
import logging
import datetime
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status, Query, Header
from PIL import Image
from pydantic import BaseModel, Field
from firebase_admin import auth as firebase_auth
from app.core.config import settings
from app.api.auth_dep import get_current_citizen, get_current_citizen_demo_fallback, AuthenticatedCitizen
from app.core.firebase import get_firestore_client
from app.services.cloudinary_service import cloudinary_service
from app.services.firestore_service import (
    firestore_service,
    calculate_bytes_sha256,
    DuplicateIssueException,
)

logger = logging.getLogger("hawkEYE.api.issues")
router = APIRouter(prefix="/api", tags=["Civic Issues & Authority Work Orders"])

class DismissPayload(BaseModel):
    reason: Optional[str] = None
    reasonCode: Optional[str] = None
    notes: Optional[str] = None
    remarks: Optional[str] = None
    duplicateOfTicketId: Optional[str] = None

class DeletePayload(BaseModel):
    reasonCode: Optional[str] = None
    notes: Optional[str] = None
    remarks: Optional[str] = None

import time

@router.get("/issues", summary="Get all issues for Authority Dashboard and City Map")
def get_all_issues(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
):
    start_time = time.time()
    logger.info("Endpoint entered: GET /api/issues")
    try:
        issues = firestore_service.get_all_issues(
            status_filter=status,
            category_filter=category,
            severity_filter=severity,
        )
        elapsed = (time.time() - start_time) * 1000
        logger.info(f"Firestore query completed in {elapsed:.2f}ms. Returned {len(issues)} issues.")
        return {"success": True, "issues": issues, "count": len(issues)}
    except Exception as e:
        elapsed = (time.time() - start_time) * 1000
        logger.error(f"Error fetching issues after {elapsed:.2f}ms: {str(e)}")
        return {"success": True, "issues": [], "count": 0}

@router.get("/issues/my-issues", summary="Get citizen's own submitted issues")
def get_my_issues(citizen: AuthenticatedCitizen = Depends(get_current_citizen)):
    try:
        issues = firestore_service.get_user_issues(citizen.uid)
        return {"success": True, "issues": issues, "count": len(issues)}
    except Exception as e:
        logger.error(f"Error fetching user issues for UID '{citizen.uid}': {str(e)}")
        return {"success": True, "issues": [], "count": 0}

@router.get("/issues/{issue_id}", summary="Get single issue by ID")
def get_issue(issue_id: str):
    issue = firestore_service.get_issue_by_id(issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Issue '{issue_id}' not found.")
    return {"success": True, "issue": issue}

@router.post("/issues/check-duplicate", summary="Check if a similar issue exists nearby before creating a report")
async def check_duplicate(
    latitude: float = Form(...),
    longitude: float = Form(...),
    category: str = Form(...),
    file: Optional[UploadFile] = File(None),
):
    try:
        image_bytes = await file.read() if file else None
        candidates = firestore_service.check_nearby_duplicate_multisignal(
            latitude=latitude,
            longitude=longitude,
            category=category,
            image_bytes=image_bytes,
        )

        if candidates and candidates[0]["overallConfidence"] >= 0.70:
            return {
                "duplicateDetected": True,
                "candidates": candidates,
                "radiusMeters": settings.DUPLICATE_SEARCH_RADIUS_METERS,
            }

        return {
            "duplicateDetected": False,
            "candidates": [],
            "radiusMeters": settings.DUPLICATE_SEARCH_RADIUS_METERS,
        }
    except Exception as e:
        logger.error(f"Duplicate check failed: {str(e)}")
        return {"duplicateDetected": False, "candidates": []}

@router.post("/issues/{issue_id}/raise-hand", summary="Raise a hand / support an existing civic issue")
def raise_a_hand(
    issue_id: str,
    citizen: AuthenticatedCitizen = Depends(get_current_citizen),
):
    try:
        result = firestore_service.raise_a_hand(issue_id, citizen.uid)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        logger.error(f"Raise a hand failed for issue '{issue_id}': {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not register support for issue.",
        )

# Authority Decision Endpoints
@router.post("/issues/{issue_id}/accept", summary="Accept citizen report (Status -> ACCEPTED)")
def accept_report(
    issue_id: str,
    x_authority_role: Optional[str] = Header(None),
):
    try:
        authority_uid = "system_authority_official"
        result = firestore_service.accept_report(issue_id, authority_uid=authority_uid)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to accept report '{issue_id}': {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to accept report.")

@router.post("/issues/{issue_id}/dismiss", summary="Dismiss citizen report (Status -> DISMISSED)")
@router.patch("/authority/issues/{issue_id}/dismiss", summary="Alias: Dismiss citizen report")
def dismiss_report(
    issue_id: str,
    payload: DismissPayload,
    authorization: Optional[str] = Header(None),
    x_authority_role: Optional[str] = Header(None),
):
    if not authorization and not x_authority_role:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header is required.")

    if authorization and (not x_authority_role or x_authority_role not in ["authority", "admin"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requires authority role permissions.")

    authority_uid = "system_authority_official"
    if authorization:
        token = authorization.replace("Bearer ", "")
        try:
            decoded = firebase_auth.verify_id_token(token)
            authority_uid = decoded.get("uid", authority_uid)
        except Exception:
            pass

    reason_val = payload.reason or payload.reasonCode or "Dismissed by authority"
    notes_val = payload.notes or payload.remarks

    try:
        result = firestore_service.dismiss_report(
            issue_id,
            authority_uid=authority_uid,
            reason=reason_val,
            notes=notes_val,
            duplicate_of_ticket_id=payload.duplicateOfTicketId,
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to dismiss report '{issue_id}': {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to dismiss report.")

@router.patch("/authority/issues/{issue_id}/delete", summary="Soft delete citizen report")
def delete_report(
    issue_id: str,
    payload: Optional[DeletePayload] = None,
    authorization: Optional[str] = Header(None),
    x_authority_role: Optional[str] = Header(None),
):
    if not authorization and not x_authority_role:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header is required.")

    if authorization and (not x_authority_role or x_authority_role not in ["authority", "admin"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requires authority role permissions.")

    reason_code = payload.reasonCode if payload else None
    remarks = payload.notes or payload.remarks if payload else None

    if reason_code == "other" and not remarks:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Remarks are required when reason is 'other'.")

    authority_uid = "system_authority_official"
    if authorization:
        token = authorization.replace("Bearer ", "")
        try:
            decoded = firebase_auth.verify_id_token(token)
            authority_uid = decoded.get("uid", authority_uid)
        except Exception:
            pass

    try:
        result = firestore_service.delete_report(
            issue_id=issue_id,
            authority_uid=authority_uid,
            reason_code=reason_code,
            remarks=remarks,
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to delete report '{issue_id}': {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete report.")

@router.post(
    "/issues",
    status_code=status.HTTP_201_CREATED,
    summary="Submit citizen issue with verified Firebase auth, Cloudinary upload, and Firestore persistence",
)
async def create_issue(
    file: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    accuracy: float = Form(None),
    area: str = Form(None),
    city: str = Form(None),
    state: str = Form(None),
    country: str = Form(None),
    postalCode: str = Form(None),
    displayName: str = Form(None),
    aiCategory: str = Form(...),
    aiSummary: str = Form(...),
    aiSeverity: str = Form(...),
    aiVisibleRisk: str = Form(...),
    aiConfidence: float = Form(...),
    needsHumanReview: bool = Form(False),
    category: str = Form(...),
    description: str = Form(""),
    citizenNotes: str = Form(""),
    idempotencyKey: str = Form(None),
    userConfirmedDifferent: bool = Form(False),
    citizen: AuthenticatedCitizen = Depends(get_current_citizen_demo_fallback),
):
    if not (-90.0 <= latitude <= 90.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="[INVALID_REPORT] Latitude must be between -90 and 90 degrees.",
        )
    if not (-180.0 <= longitude <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="[INVALID_REPORT] Longitude must be between -180 and 180 degrees.",
        )

    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="[INVALID_IMAGE] Issue photo is required.",
        )

    if file.content_type not in settings.ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"[INVALID_IMAGE] Unsupported file format '{file.content_type}'. Allowed formats: JPEG, PNG, WEBP.",
        )

    contents = await file.read()
    if not contents or len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="[INVALID_IMAGE] Uploaded image file is empty.",
        )

    try:
        img = Image.open(io.BytesIO(contents))
        img.verify()
    except Exception as e:
        logger.error(f"Image verification error for issue submission: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="[INVALID_IMAGE] Corrupted or invalid image file.",
        )

    image_sha256 = calculate_bytes_sha256(contents)

    if not userConfirmedDifferent:
        candidates = firestore_service.check_nearby_duplicate_multisignal(
            latitude=latitude,
            longitude=longitude,
            category=category,
            image_hash=image_sha256,
        )
        if candidates and candidates[0]["overallConfidence"] >= 0.75:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "POSSIBLE_DUPLICATE",
                    "message": "A similar civic issue has already been reported nearby.",
                    "candidates": candidates,
                },
            )

    try:
        image_data = cloudinary_service.upload_issue_image(contents)
        image_data["sha256"] = image_sha256
    except ValueError as ve:
        logger.warning(f"Cloudinary configuration issue: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"[CLOUDINARY_NOT_CONFIGURED] {str(ve)}",
        )
    except Exception as exc:
        logger.error(f"Image upload to Cloudinary failed: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="[IMAGE_UPLOAD_FAILED] Failed to upload issue photo to Cloudinary image storage.",
        )

    location_payload = {
        "latitude": latitude,
        "longitude": longitude,
        "accuracy": accuracy,
        "area": area,
        "city": city,
        "state": state,
        "country": country,
        "postalCode": postalCode,
        "displayName": displayName or (f"{area}, {city}" if area and city else f"{latitude:.4f}, {longitude:.4f}"),
    }

    ai_analysis_payload = {
        "category": aiCategory,
        "summary": aiSummary,
        "severity": aiSeverity,
        "visibleRisk": aiVisibleRisk,
        "confidence": aiConfidence,
        "needsHumanReview": needsHumanReview,
    }

    try:
        created_issue = firestore_service.create_issue_document(
            reporter_uid=citizen.uid,
            category=category,
            description=description,
            citizen_notes=citizenNotes,
            ai_analysis=ai_analysis_payload,
            location_data=location_payload,
            image_data=image_data,
            idempotency_key=idempotencyKey,
            user_confirmed_different=userConfirmedDifferent,
        )

        if citizen.decoded_token.get("auth_mode") == "hackathon_demo_fallback":
            get_firestore_client().collection("issues").document(created_issue["issueId"]).update({
                "auth_mode": "hackathon_demo_fallback"
            })

        return {
            "success": True,
            "issueId": created_issue.get("issueId"),
            "ticketId": created_issue.get("ticketId"),
            "category": created_issue.get("category"),
            "description": created_issue.get("description"),
            "status": created_issue.get("status"),
            "location": created_issue.get("location"),
            "image": created_issue.get("image"),
            "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
    except DuplicateIssueException as dup_err:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "POSSIBLE_DUPLICATE",
                "message": "A similar civic issue has already been reported nearby.",
                "candidates": dup_err.candidates,
            },
        )
    except Exception as fs_err:
        logger.error(f"Firestore issue creation failed: {str(fs_err)}")
        if image_data.get("public_id"):
            cloudinary_service.delete_issue_image(image_data["public_id"])

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="[ISSUE_CREATION_FAILED] Could not record issue in Cloud Firestore database.",
        )
