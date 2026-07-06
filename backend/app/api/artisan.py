import logging
import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, status, Query, Depends, UploadFile, File, Form, Header
from pydantic import BaseModel
from firebase_admin import firestore
from app.api.auth_dep import get_current_artisan, AuthenticatedArtisan
from app.core.firebase import get_firestore_client

logger = logging.getLogger("hawkEYE.api.artisan")
router = APIRouter(prefix="/api/artisan", tags=["Artisan Portal Operations"])
authority_router = APIRouter(prefix="/api/authority", tags=["Authority Verification Queue"])

class RejectionPayload(BaseModel):
    reasonCode: str
    remarks: str

@router.get("/profile", summary="Get authenticated Artisan profile details")
def get_artisan_profile(
    artisan: AuthenticatedArtisan = Depends(get_current_artisan)
):
    try:
        doc = artisan.doc_data
        profile_data = {
            "employeeId": artisan.employee_id,
            "employeeCode": artisan.employee_code,
            "fullName": artisan.full_name,
            "officialEmail": artisan.official_email,
            "department": artisan.department,
            "role": artisan.role,
            "phone": doc.get("phone", "+91 98765 43210"),
            "isActive": doc.get("isActive", True),
            "shift": doc.get("shift", {"name": "Morning Shift", "startTime": "08:00 AM", "endTime": "04:00 PM"}),
            "serviceArea": doc.get("serviceArea", "Visakhapatnam Zone 1"),
            "activeWorkOrderIds": doc.get("activeWorkOrderIds", [])
        }
        return {"success": True, "profile": profile_data}
    except Exception as e:
        logger.error(f"Failed to fetch artisan profile: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to load artisan profile.")

@router.get("/dashboard-summary", summary="Get real Artisan dashboard task counters")
def get_artisan_dashboard_summary(
    artisan: AuthenticatedArtisan = Depends(get_current_artisan)
):
    try:
        db = get_firestore_client()
        wo_snaps = db.collection("work_orders").where("employeeId", "==", artisan.employee_id).get()

        all_assigned = len(wo_snaps)
        pending = 0
        in_progress = 0
        awaiting_verification = 0
        completed = 0

        for snap in wo_snaps:
            data = snap.to_dict()
            st = (data.get("status") or "").upper()
            if st == "ASSIGNED":
                pending += 1
            elif st == "IN_PROGRESS":
                in_progress += 1
            elif st == "AWAITING_VERIFICATION":
                awaiting_verification += 1
            elif st == "COMPLETED":
                completed += 1

        summary = {
            "allAssigned": all_assigned,
            "pending": pending,
            "inProgress": in_progress,
            "awaitingVerification": awaiting_verification,
            "completed": completed
        }
        return {"success": True, "summary": summary}
    except Exception as e:
        logger.error(f"Failed to compute artisan dashboard summary: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to compute task summary.")

@router.get("/work-orders", summary="Get work orders assigned to authenticated Artisan")
def get_artisan_work_orders(
    status_filter: Optional[str] = Query(None),
    artisan: AuthenticatedArtisan = Depends(get_current_artisan)
):
    try:
        db = get_firestore_client()
        wo_snaps = db.collection("work_orders").where("employeeId", "==", artisan.employee_id).get()

        results = []
        for snap in wo_snaps:
            data = snap.to_dict()
            wo_status = (data.get("status") or "").upper()

            if status_filter and status_filter.lower() != "all":
                target = status_filter.upper().replace("-", "_").replace(" ", "_")
                if target == "PENDING" and wo_status != "ASSIGNED":
                    continue
                elif target != "PENDING" and wo_status != target:
                    continue

            results.append({
                "workOrderId": snap.id,
                "workOrderNumber": data.get("workOrderNumber") or snap.id,
                "reportDocumentId": data.get("reportId"),
                "ticketId": data.get("ticketId"),
                "issueCategory": data.get("issueCategory", "Municipal Hazard"),
                "issueSummary": data.get("issueSummary", "Municipal maintenance task"),
                "priority": data.get("priority", "MEDIUM"),
                "imageUrl": data.get("imageUrl", ""),
                "location": data.get("location", {}),
                "assignmentDate": data.get("assignmentDate"),
                "shift": data.get("shift", {}),
                "authorityInstructions": data.get("authorityInstructions", ""),
                "status": wo_status,
                "assignedAt": data.get("assignedAt") or data.get("createdAt"),
                "isReassigned": data.get("isReassigned", False),
                "workStartedAt": data.get("workStartedAt"),
                "completedByWorkerAt": data.get("completedByWorkerAt"),
                "completionEvidence": data.get("completionEvidence"),
                "verificationHistory": data.get("verificationHistory", [])
            })

        return {"success": True, "workOrders": results, "count": len(results)}
    except Exception as e:
        logger.error(f"Failed to fetch artisan work orders: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to load work orders.")

@router.get("/work-orders/{work_order_id}", summary="Get single work order details for Artisan")
def get_artisan_work_order_detail(
    work_order_id: str,
    artisan: AuthenticatedArtisan = Depends(get_current_artisan)
):
    try:
        db = get_firestore_client()
        wo_snap = db.collection("work_orders").document(work_order_id).get()
        if not wo_snap.exists:
            q = db.collection("work_orders").where("workOrderNumber", "==", work_order_id).limit(1).get()
            if q:
                wo_snap = q[0]

        if not wo_snap or not wo_snap.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Work order '{work_order_id}' not found.")

        data = wo_snap.to_dict()
        if data.get("employeeId") != artisan.employee_id:
            logger.warning(f"[ACCESS DENIED] Artisan '{artisan.employee_id}' attempted access to work order '{work_order_id}' assigned to '{data.get('employeeId')}'.")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="[ACCESS_DENIED] You do not have permission to view this work order.")

        data["workOrderId"] = wo_snap.id
        return {"success": True, "workOrder": data}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch work order details: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to load work order details.")

@router.post("/work-orders/{work_order_id}/start", summary="Artisan starts work order")
def start_work_order(
    work_order_id: str,
    artisan: AuthenticatedArtisan = Depends(get_current_artisan)
):
    db = get_firestore_client()
    wo_snap = db.collection("work_orders").document(work_order_id).get()
    if not wo_snap.exists:
        q = db.collection("work_orders").where("workOrderNumber", "==", work_order_id).limit(1).get()
        if q:
            wo_snap = q[0]

    if not wo_snap or not wo_snap.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Work order '{work_order_id}' not found.")

    doc_id = wo_snap.id
    data = wo_snap.to_dict()

    if data.get("employeeId") != artisan.employee_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="[ACCESS_DENIED] You do not own this work order.")

    current_status = (data.get("status") or "").upper()
    if current_status == "IN_PROGRESS":
        data["workOrderId"] = doc_id
        return {"success": True, "message": "Work order is already in progress.", "workOrder": data}

    if current_status not in ["ASSIGNED", "PENDING"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot start work order in status '{current_status}'.")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    report_id = data.get("reportId") or data.get("ticketId")

    wo_ref = db.collection("work_orders").document(doc_id)
    wo_ref.update({
        "status": "IN_PROGRESS",
        "workStartedAt": now_iso,
        "updatedAt": now_iso
    })

    if report_id:
        issue_ref = db.collection("issues").document(report_id)
        issue_snap = issue_ref.get()
        if not issue_snap.exists:
            q_issue = db.collection("issues").where("ticketId", "==", report_id).limit(1).get()
            if q_issue:
                issue_ref = q_issue[0].reference

        timeline_event = {
            "eventType": "WORK_STARTED",
            "actorType": "artisan",
            "actorId": artisan.employee_id,
            "actorName": artisan.full_name,
            "timestamp": now_iso,
            "metadata": {
                "workOrderId": doc_id,
                "workOrderNumber": data.get("workOrderNumber")
            }
        }
        issue_ref.update({
            "status": "IN_PROGRESS",
            "workStartedAt": now_iso,
            "updatedAt": now_iso,
            "timeline": firestore.ArrayUnion([timeline_event])
        })

    data["status"] = "IN_PROGRESS"
    data["workStartedAt"] = now_iso
    data["workOrderId"] = doc_id
    return {"success": True, "message": "Work started successfully.", "workOrder": data}

@router.post("/work-orders/{work_order_id}/submit-evidence", summary="Artisan uploads completion photo & submits for verification")
async def submit_work_order_evidence(
    work_order_id: str,
    afterPhoto: UploadFile = File(...),
    completionRemarks: str = Form(...),
    fieldNotes: Optional[str] = Form(None),
    artisan: AuthenticatedArtisan = Depends(get_current_artisan)
):
    if not completionRemarks or len(completionRemarks.strip()) < 10:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Completion remarks are required (minimum 10 characters).")

    db = get_firestore_client()
    wo_snap = db.collection("work_orders").document(work_order_id).get()
    if not wo_snap.exists:
        q = db.collection("work_orders").where("workOrderNumber", "==", work_order_id).limit(1).get()
        if q:
            wo_snap = q[0]

    if not wo_snap or not wo_snap.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Work order '{work_order_id}' not found.")

    doc_id = wo_snap.id
    data = wo_snap.to_dict()

    if data.get("employeeId") != artisan.employee_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="[ACCESS_DENIED] You do not own this work order.")

    current_status = (data.get("status") or "").upper()
    if current_status not in ["IN_PROGRESS"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot submit evidence for work order in status '{current_status}'.")

    file_bytes = await afterPhoto.read()
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded photo file is empty.")

    ticket_id = data.get("ticketId", "HE-2026-UNKNOWN")
    wo_number = data.get("workOrderNumber", doc_id)

    from app.services.cloudinary_service import cloudinary_service
    upload_res = cloudinary_service.upload_evidence_image(file_bytes, ticket_id=ticket_id, work_order_number=wo_number)

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    evidence_data = {
        "afterImages": [
            {
                "secureUrl": upload_res.get("secure_url"),
                "publicId": upload_res.get("public_id"),
                "uploadedAt": now_iso,
                "uploadedByEmployeeId": artisan.employee_id
            }
        ],
        "completionRemarks": completionRemarks.strip(),
        "fieldNotes": fieldNotes.strip() if fieldNotes else None,
        "submittedAt": now_iso
    }

    wo_ref = db.collection("work_orders").document(doc_id)
    wo_ref.update({
        "status": "AWAITING_VERIFICATION",
        "completionEvidence": evidence_data,
        "completedByWorkerAt": now_iso,
        "updatedAt": now_iso
    })

    report_id = data.get("reportId") or ticket_id
    if report_id:
        issue_ref = db.collection("issues").document(report_id)
        issue_snap = issue_ref.get()
        if not issue_snap.exists:
            q_issue = db.collection("issues").where("ticketId", "==", report_id).limit(1).get()
            if q_issue:
                issue_ref = q_issue[0].reference

        timeline_event = {
            "eventType": "COMPLETION_EVIDENCE_SUBMITTED",
            "actorType": "artisan",
            "actorId": artisan.employee_id,
            "actorName": artisan.full_name,
            "timestamp": now_iso,
            "metadata": {
                "workOrderId": doc_id,
                "workOrderNumber": wo_number,
                "afterImageUrl": upload_res.get("secure_url"),
                "remarks": completionRemarks.strip()
            }
        }
        issue_ref.update({
            "status": "AWAITING_VERIFICATION",
            "completionEvidence": evidence_data,
            "completedByWorkerAt": now_iso,
            "updatedAt": now_iso,
            "timeline": firestore.ArrayUnion([timeline_event])
        })

    data["status"] = "AWAITING_VERIFICATION"
    data["completionEvidence"] = evidence_data
    data["completedByWorkerAt"] = now_iso
    data["workOrderId"] = doc_id

    return {"success": True, "message": "Completion evidence submitted successfully.", "workOrder": data}

# ==============================================================================
# AUTHORITY VERIFICATION QUEUE & APPROVAL / REJECTION ENDPOINTS
# ==============================================================================

@authority_router.get("/verification-queue", summary="Get reports awaiting authority verification")
def get_verification_queue(
    x_authority_role: Optional[str] = Header("authority")
):
    db = get_firestore_client()
    wo_snaps = db.collection("work_orders").where("status", "==", "AWAITING_VERIFICATION").get()

    queue = []
    for snap in wo_snaps:
        d = snap.to_dict()
        d["workOrderId"] = snap.id
        queue.append(d)

    return {"success": True, "verificationQueue": queue, "count": len(queue)}

@authority_router.post("/work-orders/{work_order_id}/verify-approval", summary="Authority approves completion evidence")
def approve_work_order_verification(
    work_order_id: str,
    x_authority_role: Optional[str] = Header("authority")
):
    db = get_firestore_client()
    wo_ref = db.collection("work_orders").document(work_order_id)
    wo_snap = wo_ref.get()
    if not wo_snap.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Work order '{work_order_id}' not found.")

    data = wo_snap.to_dict()
    if data.get("status") != "AWAITING_VERIFICATION":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Work order status is '{data.get('status')}', not 'AWAITING_VERIFICATION'.")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    authority_uid = "system_authority_official"

    wo_ref.update({
        "status": "COMPLETED",
        "verifiedAt": now_iso,
        "verifiedBy": authority_uid,
        "closedAt": now_iso,
        "updatedAt": now_iso
    })

    report_id = data.get("reportId") or data.get("ticketId")
    if report_id:
        issue_ref = db.collection("issues").document(report_id)
        issue_snap = issue_ref.get()
        if not issue_snap.exists:
            q_issue = db.collection("issues").where("ticketId", "==", report_id).limit(1).get()
            if q_issue:
                issue_ref = q_issue[0].reference

        timeline_event_verified = {
            "eventType": "WORK_VERIFIED",
            "actorType": "authority",
            "actorId": authority_uid,
            "timestamp": now_iso
        }
        timeline_event_completed = {
            "eventType": "REPORT_COMPLETED",
            "actorType": "authority",
            "actorId": authority_uid,
            "timestamp": now_iso
        }
        issue_ref.update({
            "status": "COMPLETED",
            "completedAt": now_iso,
            "verifiedAt": now_iso,
            "verifiedBy": authority_uid,
            "updatedAt": now_iso,
            "timeline": firestore.ArrayUnion([timeline_event_verified, timeline_event_completed])
        })

    emp_id = data.get("employeeId")
    if emp_id:
        emp_ref = db.collection("employees").document(emp_id)
        if emp_ref.get().exists:
            emp_ref.update({
                "activeWorkOrderIds": firestore.ArrayRemove([work_order_id])
            })

    data["status"] = "COMPLETED"
    data["verifiedAt"] = now_iso
    data["workOrderId"] = work_order_id
    return {"success": True, "message": "Work order approved and marked COMPLETED.", "workOrder": data}

@authority_router.post("/work-orders/{work_order_id}/verify-rejection", summary="Authority rejects completion evidence & returns to worker")
def reject_work_order_verification(
    work_order_id: str,
    payload: RejectionPayload,
    x_authority_role: Optional[str] = Header("authority")
):
    if not payload.remarks or not payload.remarks.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rejection remarks are mandatory.")

    db = get_firestore_client()
    wo_ref = db.collection("work_orders").document(work_order_id)
    wo_snap = wo_ref.get()
    if not wo_snap.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Work order '{work_order_id}' not found.")

    data = wo_snap.to_dict()
    if data.get("status") != "AWAITING_VERIFICATION":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Work order status is '{data.get('status')}', not 'AWAITING_VERIFICATION'.")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    authority_uid = "system_authority_official"

    rejection_record = {
        "decision": "REJECTED",
        "reasonCode": payload.reasonCode,
        "remarks": payload.remarks.strip(),
        "reviewedBy": authority_uid,
        "reviewedAt": now_iso
    }

    wo_ref.update({
        "status": "IN_PROGRESS",
        "verificationHistory": firestore.ArrayUnion([rejection_record]),
        "updatedAt": now_iso
    })

    report_id = data.get("reportId") or data.get("ticketId")
    if report_id:
        issue_ref = db.collection("issues").document(report_id)
        issue_snap = issue_ref.get()
        if not issue_snap.exists:
            q_issue = db.collection("issues").where("ticketId", "==", report_id).limit(1).get()
            if q_issue:
                issue_ref = q_issue[0].reference

        timeline_event = {
            "eventType": "COMPLETION_EVIDENCE_REJECTED",
            "actorType": "authority",
            "actorId": authority_uid,
            "timestamp": now_iso,
            "metadata": {
                "reasonCode": payload.reasonCode,
                "remarks": payload.remarks.strip()
            }
        }
        issue_ref.update({
            "status": "IN_PROGRESS",
            "verificationHistory": firestore.ArrayUnion([rejection_record]),
            "updatedAt": now_iso,
            "timeline": firestore.ArrayUnion([timeline_event])
        })

    data["status"] = "IN_PROGRESS"
    data["workOrderId"] = work_order_id
    return {"success": True, "message": "Completion evidence rejected and returned to worker for correction.", "workOrder": data}
