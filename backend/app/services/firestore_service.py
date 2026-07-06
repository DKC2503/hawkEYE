import logging
import uuid
import random
import string
import math
import hashlib
import pygeohash
import datetime
from typing import List, Dict, Any, Optional
from firebase_admin import firestore
from app.core.firebase import get_firestore_client
from app.core.config import settings
from app.services.email_service import email_service
from app.utils.location import extract_report_location

logger = logging.getLogger("hawkEYE.firestore_service")

# Centralized Municipal Departments list
MUNICIPAL_DEPARTMENTS = [
    "Roads & Infrastructure",
    "Sanitation & Waste Management",
    "Water Supply & Drainage",
    "Public Lighting & Electrical",
    "Traffic & Transit Works",
    "Parks & Public Spaces",
    "General Municipal Services",
]

class DuplicateIssueException(Exception):
    def __init__(self, candidates: List[Dict[str, Any]]):
        self.candidates = candidates
        super().__init__("Possible duplicate issue detected.")

def generate_ticket_id() -> str:
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"HE-2026-{random_str}"

def generate_work_order_id() -> str:
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"WO-2026-{random_str}"

def calculate_haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_bytes_sha256(contents: bytes) -> str:
    return hashlib.sha256(contents).hexdigest()

class FirestoreService:
    # -------------------------------------------------------------------------
    # ISSUE & REPORT OPERATIONS
    # -------------------------------------------------------------------------
    def check_nearby_duplicate_multisignal(
        self,
        latitude: float,
        longitude: float,
        category: str,
        image_bytes: Optional[bytes] = None,
        image_hash: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        db = get_firestore_client()
        docs = db.collection("issues").get()

        search_radius = settings.DUPLICATE_SEARCH_RADIUS_METERS
        target_hash = image_hash or (calculate_bytes_sha256(image_bytes) if image_bytes else None)

        candidates = []
        for doc in docs:
            data = doc.to_dict()
            status = data.get("status", "").upper()
            if status in ["RESOLVED", "DISMISSED"] or data.get("isDeleted"):
                continue

            loc = data.get("location", {})
            e_lat = loc.get("latitude")
            e_lng = loc.get("longitude")

            if e_lat is None or e_lng is None:
                continue

            dist = calculate_haversine_distance_meters(latitude, longitude, e_lat, e_lng)

            within_radius = dist <= search_radius
            cat_match = (data.get("category", "").lower() == category.lower())

            ex_hash = data.get("image", {}).get("sha256")
            image_match_score = 0.0
            if target_hash and ex_hash:
                if target_hash == ex_hash:
                    image_match_score = 1.0

            overall_confidence = 0.0
            is_candidate = False

            if image_match_score == 1.0 and dist <= 200.0:
                overall_confidence = 0.99
                is_candidate = True
            elif within_radius and cat_match:
                distance_factor = max(0.5, 1.0 - (dist / search_radius) * 0.5)
                overall_confidence = round(0.75 + (0.20 * distance_factor) + (0.05 * image_match_score), 2)
                is_candidate = True
            elif within_radius and not cat_match and image_match_score == 1.0:
                overall_confidence = 0.90
                is_candidate = True

            if is_candidate:
                created_at_str = data.get("createdAt")
                if hasattr(created_at_str, "isoformat"):
                    created_at_str = created_at_str.isoformat()

                candidate_entry = {
                    "issueId": data.get("issueId"),
                    "ticketId": data.get("ticketId"),
                    "category": data.get("category"),
                    "description": data.get("description"),
                    "status": data.get("status"),
                    "supportCount": data.get("supportCount", 0),
                    "distanceMeters": round(dist, 1),
                    "imageUrl": data.get("image", {}).get("secure_url"),
                    "location": data.get("location"),
                    "categoryMatch": cat_match,
                    "imageMatchScore": image_match_score,
                    "overallConfidence": overall_confidence,
                    "createdAt": created_at_str,
                }
                candidates.append(candidate_entry)

        candidates.sort(key=lambda c: (-c["overallConfidence"], c["distanceMeters"]))
        return candidates

    def create_issue_document(
        self,
        reporter_uid: str,
        category: str,
        description: str,
        citizen_notes: str,
        ai_analysis: dict,
        location_data: dict,
        image_data: dict,
        idempotency_key: Optional[str] = None,
        user_confirmed_different: bool = False,
        candidate_ticket_ids: Optional[List[str]] = None,
    ) -> dict:
        db = get_firestore_client()

        lat = location_data.get("latitude", 0.0)
        lng = location_data.get("longitude", 0.0)

        if not user_confirmed_different:
            candidates = self.check_nearby_duplicate_multisignal(
                latitude=lat,
                longitude=lng,
                category=category,
                image_hash=image_data.get("sha256"),
            )
            if candidates and candidates[0]["overallConfidence"] >= 0.75:
                logger.warning(f"Backend duplicate enforcement blocked creation. Candidate ticket: {candidates[0]['ticketId']}")
                raise DuplicateIssueException(candidates)

        if idempotency_key:
            existing_query = db.collection("issues").where("idempotencyKey", "==", idempotency_key).limit(1).get()
            if existing_query:
                logger.info(f"Duplicate submission prevented via idempotencyKey: {idempotency_key}")
                return existing_query[0].to_dict()

        issue_id = str(uuid.uuid4())
        ticket_id = generate_ticket_id()
        geohash_str = pygeohash.encode(lat, lng, precision=7)

        location_doc = {
            "latitude": lat,
            "longitude": lng,
            "accuracy": location_data.get("accuracy"),
            "displayName": location_data.get("displayName") or location_data.get("formattedAddress"),
            "area": location_data.get("area"),
            "city": location_data.get("city"),
            "state": location_data.get("state"),
            "country": location_data.get("country"),
            "postalCode": location_data.get("postalCode"),
            "geohash": geohash_str,
        }

        initial_timeline_event = {
            "eventType": "report_submitted",
            "actorUid": reporter_uid,
            "actorRole": "citizen",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "metadata": {"summary": "Report submitted by citizen"},
        }

        duplicate_check_metadata = {
            "checked": True,
            "candidateTicketIds": candidate_ticket_ids or [],
            "userConfirmedDifferent": user_confirmed_different,
        }

        issue_doc = {
            "issueId": issue_id,
            "ticketId": ticket_id,
            "reporter": {
                "uid": reporter_uid,
            },
            "category": category,
            "description": description,
            "citizenNotes": citizen_notes,
            "aiAnalysis": ai_analysis,
            "location": location_doc,
            "image": image_data,
            "status": "SUBMITTED",
            "supportCount": 0,
            "raisedBy": [],
            "duplicateCheck": duplicate_check_metadata,
            "timeline": [initial_timeline_event],
            "idempotencyKey": idempotency_key,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }

        try:
            doc_ref = db.collection("issues").document(issue_id)
            doc_ref.set(issue_doc)
            logger.info(f"Issue document successfully created in Firestore: '{issue_id}' (Ticket: {ticket_id})")

            response_data = dict(issue_doc)
            response_data["createdAt"] = firestore.SERVER_TIMESTAMP
            response_data["updatedAt"] = firestore.SERVER_TIMESTAMP
            return response_data
        except Exception as e:
            logger.error(f"Firestore issue creation failed: {str(e)}")
            raise e

    def get_all_issues(
        self,
        status_filter: Optional[str] = None,
        category_filter: Optional[str] = None,
        severity_filter: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        db = get_firestore_client()
        query = db.collection("issues")

        if status_filter and status_filter.lower() != 'all':
            query = query.where("status", "==", status_filter.upper())
        if category_filter and category_filter.lower() != 'all':
            query = query.where("category", "==", category_filter.lower())

        docs = query.get()
        results = []
        for doc in docs:
            d = doc.to_dict()
            if d.get("isDeleted"):
                continue

            if "createdAt" in d and hasattr(d["createdAt"], "isoformat"):
                d["createdAt"] = d["createdAt"].isoformat()
            if "updatedAt" in d and hasattr(d["updatedAt"], "isoformat"):
                d["updatedAt"] = d["updatedAt"].isoformat()

            if severity_filter and severity_filter.lower() != 'all':
                ai_sev = d.get("aiAnalysis", {}).get("severity", "").lower()
                if ai_sev != severity_filter.lower():
                    continue

            results.append(d)

        return results

    def get_issue_by_id(self, issue_id: str) -> Optional[Dict[str, Any]]:
        db = get_firestore_client()
        doc_snap = db.collection("issues").document(issue_id).get()
        if not doc_snap.exists:
            query_snap = db.collection("issues").where("ticketId", "==", issue_id).limit(1).get()
            if not query_snap:
                return None
            doc_snap = query_snap[0]

        d = doc_snap.to_dict()
        if d.get("isDeleted"):
            return None

        if "createdAt" in d and hasattr(d["createdAt"], "isoformat"):
            d["createdAt"] = d["createdAt"].isoformat()
        if "updatedAt" in d and hasattr(d["updatedAt"], "isoformat"):
            d["updatedAt"] = d["updatedAt"].isoformat()
        return d

    def get_user_issues(self, reporter_uid: str) -> List[Dict[str, Any]]:
        db = get_firestore_client()
        docs = db.collection("issues").where("reporter.uid", "==", reporter_uid).get()
        results = []
        for doc in docs:
            d = doc.to_dict()
            if d.get("isDeleted"):
                continue
            if "createdAt" in d and hasattr(d["createdAt"], "isoformat"):
                d["createdAt"] = d["createdAt"].isoformat()
            if "updatedAt" in d and hasattr(d["updatedAt"], "isoformat"):
                d["updatedAt"] = d["updatedAt"].isoformat()
            results.append(d)
        return results

    def raise_a_hand(self, issue_id: str, citizen_uid: str) -> Dict[str, Any]:
        db = get_firestore_client()

        doc_ref = db.collection("issues").document(issue_id)
        doc_snap = doc_ref.get()

        if not doc_snap.exists:
            query_snap = db.collection("issues").where("ticketId", "==", issue_id).limit(1).get()
            if not query_snap:
                raise ValueError(f"Issue with ID or Ticket '{issue_id}' not found.")
            doc_snap = query_snap[0]
            doc_ref = doc_snap.reference

        data = doc_snap.to_dict()
        raised_by = data.get("raisedBy", [])
        current_count = data.get("supportCount", 0)

        if citizen_uid in raised_by:
            return {
                "success": True,
                "alreadyRaised": True,
                "supportCount": current_count,
                "ticketId": data.get("ticketId"),
                "issueId": data.get("issueId"),
            }

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        support_event = {
            "eventType": "hand_raised",
            "actorUid": citizen_uid,
            "actorRole": "citizen",
            "timestamp": now_iso,
            "metadata": {"summary": "Citizen supported report via Raise a Hand"},
        }

        doc_ref.update({
            "raisedBy": firestore.ArrayUnion([citizen_uid]),
            "supportCount": firestore.Increment(1),
            "timeline": firestore.ArrayUnion([support_event]),
            "updatedAt": firestore.SERVER_TIMESTAMP,
        })

        return {
            "success": True,
            "alreadyRaised": False,
            "supportCount": current_count + 1,
            "ticketId": data.get("ticketId"),
            "issueId": data.get("issueId"),
        }

    def delete_report(
        self,
        issue_id: str,
        authority_uid: str = "system_authority_official",
        reason_code: Optional[str] = None,
        remarks: Optional[str] = None,
    ) -> Dict[str, Any]:
        db = get_firestore_client()
        doc_ref = db.collection("issues").document(issue_id)
        doc_snap = doc_ref.get()

        if not doc_snap.exists:
            query_snap = db.collection("issues").where("ticketId", "==", issue_id).limit(1).get()
            if not query_snap:
                raise ValueError(f"Report '{issue_id}' not found.")
            doc_snap = query_snap[0]
            doc_ref = doc_snap.reference

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        event = {
            "eventType": "report_soft_deleted",
            "actorUid": authority_uid,
            "actorRole": "authority",
            "timestamp": now_iso,
            "metadata": {
                "summary": "Report soft-deleted by authority official",
                "reasonCode": reason_code,
                "remarks": remarks,
            },
        }

        doc_ref.update({
            "isDeleted": True,
            "deletedAt": now_iso,
            "deletedBy": authority_uid,
            "timeline": firestore.ArrayUnion([event]),
            "updatedAt": firestore.SERVER_TIMESTAMP,
        })

        return {"success": True, "issueId": issue_id, "isDeleted": True, "status": "DISMISSED"}

    # -------------------------------------------------------------------------
    # AUTHORITY DECISIONS & STATUS LIFECYCLE
    # -------------------------------------------------------------------------
    def accept_report(self, issue_id: str, authority_uid: str) -> Dict[str, Any]:
        db = get_firestore_client()

        doc_ref = db.collection("issues").document(issue_id)
        doc_snap = doc_ref.get()

        if not doc_snap.exists:
            query_snap = db.collection("issues").where("ticketId", "==", issue_id).limit(1).get()
            if not query_snap:
                raise ValueError(f"Report '{issue_id}' not found.")
            doc_snap = query_snap[0]
            doc_ref = doc_snap.reference

        data = doc_snap.to_dict()
        current_status = data.get("status", "SUBMITTED").upper()

        if current_status not in ["SUBMITTED", "UNDER_REVIEW"]:
            raise ValueError(f"Cannot accept report currently in status '{current_status}'. Allowed initial statuses: SUBMITTED, UNDER_REVIEW.")

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        event = {
            "eventType": "report_accepted",
            "actorUid": authority_uid,
            "actorRole": "authority",
            "timestamp": now_iso,
            "metadata": {"summary": "Report verified and accepted by municipal authority"},
        }

        authority_decision = {
            "reviewedBy": authority_uid,
            "reviewedAt": now_iso,
            "decision": "ACCEPTED",
        }

        doc_ref.update({
            "status": "ACCEPTED",
            "authorityDecision": authority_decision,
            "timeline": firestore.ArrayUnion([event]),
            "updatedAt": firestore.SERVER_TIMESTAMP,
        })

        logger.info(f"Report '{issue_id}' accepted by authority '{authority_uid}'.")
        return {"success": True, "issueId": data.get("issueId", issue_id), "ticketId": data.get("ticketId"), "status": "ACCEPTED"}

    def dismiss_report(
        self,
        issue_id: str,
        authority_uid: str = "system_authority_official",
        reason: Optional[str] = None,
        notes: Optional[str] = None,
        duplicate_of_ticket_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        db = get_firestore_client()

        doc_ref = db.collection("issues").document(issue_id)
        doc_snap = doc_ref.get()

        if not doc_snap.exists:
            query_snap = db.collection("issues").where("ticketId", "==", issue_id).limit(1).get()
            if not query_snap:
                raise ValueError(f"Report '{issue_id}' not found in database.")
            doc_snap = query_snap[0]
            doc_ref = doc_snap.reference

        data = doc_snap.to_dict()
        current_status = data.get("status", "SUBMITTED").upper()

        if current_status == "DISMISSED":
            return {
                "success": True,
                "alreadyDismissed": True,
                "issueId": data.get("issueId", issue_id),
                "ticketId": data.get("ticketId"),
                "status": "DISMISSED",
            }

        if current_status == "RESOLVED":
            raise ValueError(f"Cannot dismiss a report that is already RESOLVED.")

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        event = {
            "eventType": "report_dismissed",
            "actorUid": authority_uid,
            "actorRole": "authority",
            "timestamp": now_iso,
            "metadata": {
                "reasonCode": reason,
                "notes": notes,
                "duplicateOfTicketId": duplicate_of_ticket_id,
            },
        }

        dismissal_data = {
            "reasonCode": reason,
            "remarks": notes or "",
            "duplicateOfTicketId": duplicate_of_ticket_id,
            "dismissedAt": now_iso,
            "dismissedBy": authority_uid,
        }

        authority_decision = {
            "reviewedBy": authority_uid,
            "reviewedAt": now_iso,
            "decision": "DISMISSED",
            "dismissalReason": reason,
            "dismissalNotes": notes,
            "duplicateOfTicketId": duplicate_of_ticket_id,
        }

        update_payload = {
            "status": "DISMISSED",
            "dismissal": dismissal_data,
            "authorityDecision": authority_decision,
            "timeline": firestore.ArrayUnion([event]),
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }

        if duplicate_of_ticket_id:
            update_payload["duplicateOfTicketId"] = duplicate_of_ticket_id

        doc_ref.update(update_payload)

        logger.info(f"Report '{issue_id}' (Ticket: {data.get('ticketId')}) dismissed by authority '{authority_uid}'. Reason: {reason}")
        return {
            "success": True,
            "issueId": data.get("issueId", issue_id),
            "ticketId": data.get("ticketId"),
            "status": "DISMISSED",
            "dismissal": dismissal_data,
        }

    # -------------------------------------------------------------------------
    # EMPLOYEE & WORKFORCE MANAGEMENT (employees/{employeeId})
    # -------------------------------------------------------------------------
    def get_all_employees(
        self,
        department_filter: Optional[str] = None,
        availability_filter: Optional[str] = None,
        active_only: bool = True,
    ) -> List[Dict[str, Any]]:
        db = get_firestore_client()
        query = db.collection("employees")

        if active_only:
            query = query.where("isActive", "==", True)
        if department_filter and department_filter.lower() != 'all':
            query = query.where("department", "==", department_filter)
        if availability_filter and availability_filter.lower() != 'all':
            query = query.where("status", "==", availability_filter.upper())

        docs = query.get()
        results = []
        for doc in docs:
            d = doc.to_dict()
            if "createdAt" in d and hasattr(d["createdAt"], "isoformat"):
                d["createdAt"] = d["createdAt"].isoformat()
            if "updatedAt" in d and hasattr(d["updatedAt"], "isoformat"):
                d["updatedAt"] = d["updatedAt"].isoformat()
            results.append(d)

        if not results:
            legacy_workers = self.get_all_workers(department_filter=department_filter)
            for w in legacy_workers:
                converted = {
                    "employeeId": w.get("workerId") or w.get("id"),
                    "employeeCode": w.get("employeeId") or f"EMP-{w.get('workerId', '')[:4].upper()}",
                    "fullName": w.get("name"),
                    "email": w.get("email"),
                    "phone": w.get("phone"),
                    "department": w.get("department"),
                    "role": w.get("jobRole", "Field Specialist"),
                    "skills": ["general_maintenance"],
                    "status": "AVAILABLE" if w.get("status", "").lower() == "available" else "ASSIGNED",
                    "shift": {
                        "name": w.get("shift", "Morning Shift"),
                        "startTime": "06:00 AM",
                        "endTime": "02:00 PM",
                    },
                    "serviceArea": "Visakhapatnam Central",
                    "activeWorkOrderIds": [],
                    "isActive": True,
                    "createdAt": w.get("createdAt"),
                    "updatedAt": w.get("updatedAt"),
                }
                results.append(converted)

        return results

    def create_employee(self, payload: dict, authority_uid: str) -> dict:
        db = get_firestore_client()

        code = payload.get("employeeCode", "").strip().upper()
        email = payload.get("email", "").strip().lower()

        emp_check = db.collection("employees").where("employeeCode", "==", code).limit(1).get()
        if emp_check:
            raise ValueError(f"Employee with Code '{code}' already exists.")

        email_check = db.collection("employees").where("email", "==", email).limit(1).get()
        if email_check:
            raise ValueError(f"Employee with Email '{email}' already exists.")

        emp_uuid = str(uuid.uuid4())
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        emp_doc = {
            "employeeId": emp_uuid,
            "employeeCode": code,
            "fullName": payload["fullName"],
            "email": email,
            "phone": payload.get("phone", ""),
            "department": payload["department"],
            "role": payload.get("role", "Field Specialist"),
            "skills": payload.get("skills", []),
            "status": "AVAILABLE",
            "shift": payload.get("shift", {
                "name": "Morning Shift",
                "startTime": "08:00 AM",
                "endTime": "04:00 PM",
            }),
            "serviceArea": payload.get("serviceArea", "Visakhapatnam Zone"),
            "activeWorkOrderIds": [],
            "isActive": True,
            "createdBy": authority_uid,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }

        db.collection("employees").document(emp_uuid).set(emp_doc)
        logger.info(f"Created employee '{payload['fullName']}' (Code: {code})")

        res_data = dict(emp_doc)
        res_data["createdAt"] = now_iso
        res_data["updatedAt"] = now_iso
        return res_data

    def get_employee_by_id(self, employee_id: str) -> Optional[Dict[str, Any]]:
        db = get_firestore_client()
        doc_snap = db.collection("employees").document(employee_id).get()
        if not doc_snap.exists:
            q1 = db.collection("employees").where("employeeCode", "==", employee_id.upper()).limit(1).get()
            if q1:
                doc_snap = q1[0]
            else:
                return None

        d = doc_snap.to_dict()
        if "createdAt" in d and hasattr(d["createdAt"], "isoformat"):
            d["createdAt"] = d["createdAt"].isoformat()
        if "updatedAt" in d and hasattr(d["updatedAt"], "isoformat"):
            d["updatedAt"] = d["updatedAt"].isoformat()
        return d

    def toggle_employee_active(self, employee_id: str, is_active: bool, authority_uid: str) -> Dict[str, Any]:
        db = get_firestore_client()
        ref = db.collection("employees").document(employee_id)
        snap = ref.get()
        if not snap.exists:
            q1 = db.collection("employees").where("employeeCode", "==", employee_id.upper()).limit(1).get()
            if not q1:
                raise ValueError(f"Employee '{employee_id}' not found.")
            snap = q1[0]
            ref = snap.reference

        status_str = "AVAILABLE" if is_active else "INACTIVE"
        ref.update({
            "isActive": is_active,
            "status": status_str,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        })
        return {"success": True, "employeeId": employee_id, "isActive": is_active, "status": status_str}

    def get_all_workers(self, department_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        db = get_firestore_client()
        query = db.collection("workers")
        if department_filter and department_filter.lower() != 'all':
            query = query.where("department", "==", department_filter)
        docs = query.get()
        results = []
        for doc in docs:
            d = doc.to_dict()
            if "createdAt" in d and hasattr(d["createdAt"], "isoformat"):
                d["createdAt"] = d["createdAt"].isoformat()
            if "updatedAt" in d and hasattr(d["updatedAt"], "isoformat"):
                d["updatedAt"] = d["updatedAt"].isoformat()
            results.append(d)
        return results

    def create_worker(self, payload: dict, authority_uid: str) -> dict:
        emp = self.create_employee({
            "employeeCode": payload["employeeId"],
            "fullName": payload["name"],
            "email": payload["email"],
            "phone": payload["phone"],
            "department": payload["department"],
            "role": payload["jobRole"],
            "shift": {"name": payload["shift"], "startTime": "06:00", "endTime": "14:00"},
        }, authority_uid=authority_uid)
        return emp

    def get_worker_by_id(self, worker_id: str) -> Optional[Dict[str, Any]]:
        return self.get_employee_by_id(worker_id)

    # -------------------------------------------------------------------------
    # WORK ORDER CREATION & AUTOMATIC EMAIL ASSIGNMENT FLOW
    # -------------------------------------------------------------------------
    def create_work_order(
        self,
        report_id: str,
        employee_id: str,
        assignment_date: str,
        shift: Optional[dict] = None,
        authority_instructions: Optional[str] = None,
        authority_uid: str = "system_authority_official",
        priority: str = "MEDIUM",
    ) -> Dict[str, Any]:
        db = get_firestore_client()

        report_ref = db.collection("issues").document(report_id)
        report_snap = report_ref.get()
        if not report_snap.exists:
            query_snap = db.collection("issues").where("ticketId", "==", report_id).limit(1).get()
            if not query_snap:
                raise ValueError(f"Report '{report_id}' not found.")
            report_snap = query_snap[0]
            report_ref = report_snap.reference

        report_data = report_snap.to_dict()
        rep_status = report_data.get("status", "").upper()
        if rep_status in ["DISMISSED", "RESOLVED"]:
            raise ValueError(f"Cannot dispatch work order for report currently in status '{rep_status}'.")

        ticket_id = report_data.get("ticketId")

        # Idempotency check: Return existing work order if already assigned
        existing_wo = db.collection("work_orders").where("ticketId", "==", ticket_id).limit(1).get()
        if existing_wo:
            wo_existing_data = existing_wo[0].to_dict()
            logger.info(f"Work order already exists for ticket '{ticket_id}'. Returning existing work order.")
            return {
                "success": True,
                "alreadyAssigned": True,
                "workOrder": wo_existing_data,
                "emailNotification": wo_existing_data.get("emailNotification", {}),
            }

        emp_ref = db.collection("employees").document(employee_id)
        emp_snap = emp_ref.get()
        if not emp_snap.exists:
            emp_ref = db.collection("workers").document(employee_id)
            emp_snap = emp_ref.get()

        if not emp_snap.exists:
            raise ValueError(f"Employee '{employee_id}' not found in Firestore database.")

        emp_data = emp_snap.to_dict()
        if emp_data.get("isActive") is False or emp_data.get("status", "").upper() in ["INACTIVE", "OFF_SHIFT"]:
            raise ValueError(f"Employee '{emp_data.get('fullName', emp_data.get('name'))}' is INACTIVE and cannot accept assignments.")

        emp_code = emp_data.get("employeeCode") or emp_data.get("employeeId") or "EMP-001"
        emp_name = emp_data.get("fullName") or emp_data.get("name") or "Municipal Worker"

        # Firestore worker record is source of truth for recipient email
        official_email = emp_data.get("officialEmail") or emp_data.get("email")
        if not official_email or not isinstance(official_email, str) or "@" not in official_email:
            raise ValueError(f"Employee '{emp_name}' (ID: {employee_id}) has no valid official email address in Firestore.")
        official_email = official_email.strip().lower()

        work_order_uuid = str(uuid.uuid4())
        wo_number = generate_work_order_id()
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        shift_doc = shift or emp_data.get("shift") or {
            "name": "Morning Shift",
            "startTime": "08:00 AM",
            "endTime": "04:00 PM",
        }

        # Extract real normalized report location (preserving full precision)
        norm_loc = extract_report_location(report_data)

        # Initial Email Delivery State (Before SMTP attempt)
        initial_email_delivery = {
            "recipientEmail": official_email,
            "sentAt": None,
            "status": "PENDING",
            "error": None
        }

        work_order_doc = {
            "workOrderId": work_order_uuid,
            "workOrderNumber": wo_number,
            "reportId": report_data.get("issueId", report_id),
            "ticketId": ticket_id,
            "employeeId": employee_id,
            "employeeCode": emp_code,
            "employeeName": emp_name,
            "employeeEmail": official_email,
            "issueCategory": report_data.get("category", "General Hazard"),
            "issueSummary": report_data.get("aiAnalysis", {}).get("summary") or report_data.get("description", "Civic issue report"),
            "priority": priority.upper(),
            "imageUrl": report_data.get("image", {}).get("secure_url", ""),
            "location": {
                "latitude": norm_loc.get("latitude"),
                "longitude": norm_loc.get("longitude"),
                "formattedAddress": norm_loc.get("address"),
                "area": norm_loc.get("area"),
                "isValid": norm_loc.get("is_valid", False)
            },
            "assignmentDate": assignment_date,
            "shift": shift_doc,
            "authorityInstructions": authority_instructions or "",
            "status": "ASSIGNED",
            "assignedBy": authority_uid,
            "assignedAt": now_iso,
            "emailDelivery": initial_email_delivery,
            "emailNotification": {
                "status": "PENDING",
                "sentAt": None,
                "attemptCount": 1,
                "lastAttemptAt": now_iso,
                "failureReason": None,
            },
            "createdAt": now_iso,
            "updatedAt": now_iso,
        }

        db.collection("work_orders").document(work_order_uuid).set(work_order_doc)

        event = {
            "eventType": "work_order_assigned",
            "actorUid": authority_uid,
            "actorRole": "authority",
            "timestamp": now_iso,
            "metadata": {
                "workOrderId": work_order_uuid,
                "workOrderNumber": wo_number,
                "employeeId": employee_id,
                "employeeName": emp_name,
                "recipientEmail": official_email,
            },
        }

        report_ref.update({
            "status": "IN_PROGRESS",
            "workOrderId": work_order_uuid,
            "employeeId": employee_id,
            "assignment": {
                "workOrderId": work_order_uuid,
                "workOrderNumber": wo_number,
                "employeeId": employee_id,
                "employeeName": emp_name,
                "employeeCode": emp_code,
                "recipientEmail": official_email,
                "assignedAt": now_iso,
                "location": work_order_doc["location"],
            },
            "timeline": firestore.ArrayUnion([event]),
            "updatedAt": now_iso,
        })

        emp_ref.update({
            "status": "ASSIGNED",
            "activeWorkOrderIds": firestore.ArrayUnion([work_order_uuid]),
            "updatedAt": firestore.SERVER_TIMESTAMP,
        })

        # Automatic Real Backend Email Delivery via SMTP
        email_res = email_service.send_work_assignment_email(work_order_doc)

        if email_res["success"]:
            email_delivery_data = {
                "recipientEmail": official_email,
                "sentAt": email_res.get("sentAt") or now_iso,
                "status": "SENT",
                "error": None
            }
        else:
            email_delivery_data = {
                "recipientEmail": official_email,
                "sentAt": None,
                "status": "FAILED",
                "error": email_res.get("failureReason") or "SMTP Delivery Failed"
            }

        email_notification_data = {
            "status": email_res["status"],
            "sentAt": email_res.get("sentAt"),
            "attemptCount": 1,
            "lastAttemptAt": now_iso,
            "failureReason": email_res.get("failureReason"),
        }

        db.collection("work_orders").document(work_order_uuid).update({
            "emailDelivery": email_delivery_data,
            "emailNotification": email_notification_data,
            "updatedAt": now_iso,
        })

        work_order_doc["emailDelivery"] = email_delivery_data
        work_order_doc["emailNotification"] = email_notification_data
        work_order_doc["updatedAt"] = now_iso

        logger.info(f"Work order '{wo_number}' created & assigned to employee '{emp_name}' ({official_email}). Email status: {email_res['status']}")

        return {
            "success": True,
            "workOrderId": work_order_uuid,
            "workOrderNumber": wo_number,
            "reportId": report_data.get("issueId", report_id),
            "status": "ASSIGNED",
            "emailDelivery": email_delivery_data,
            "emailNotification": email_notification_data,
            "workOrder": work_order_doc,
        }

    def retry_work_order_email(self, work_order_id: str) -> Dict[str, Any]:
        db = get_firestore_client()
        wo_ref = db.collection("work_orders").document(work_order_id)
        wo_snap = wo_ref.get()

        if not wo_snap.exists:
            q = db.collection("work_orders").where("workOrderNumber", "==", work_order_id).limit(1).get()
            if not q:
                raise ValueError(f"Work Order '{work_order_id}' not found.")
            wo_snap = q[0]
            wo_ref = wo_snap.reference

        wo_data = wo_snap.to_dict()
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        current_attempts = wo_data.get("emailNotification", {}).get("attemptCount", 1) + 1

        official_email = wo_data.get("employeeEmail") or wo_data.get("emailDelivery", {}).get("recipientEmail")
        if not official_email or "@" not in official_email:
            raise ValueError("Work order does not contain a valid recipient email address.")

        email_res = email_service.send_work_assignment_email(wo_data)

        if email_res["success"]:
            email_delivery_data = {
                "recipientEmail": official_email,
                "sentAt": email_res.get("sentAt") or now_iso,
                "status": "SENT",
                "error": None
            }
        else:
            email_delivery_data = {
                "recipientEmail": official_email,
                "sentAt": None,
                "status": "FAILED",
                "error": email_res.get("failureReason") or "SMTP Delivery Failed"
            }

        email_notification_data = {
            "status": email_res["status"],
            "sentAt": email_res.get("sentAt"),
            "attemptCount": current_attempts,
            "lastAttemptAt": now_iso,
            "failureReason": email_res.get("failureReason"),
        }

        wo_ref.update({
            "emailDelivery": email_delivery_data,
            "emailNotification": email_notification_data,
            "updatedAt": now_iso,
        })

        return {
            "success": True,
            "workOrderId": wo_data.get("workOrderId", work_order_id),
            "emailDelivery": email_delivery_data,
            "emailNotification": email_notification_data,
        }

    def reassign_work_order(
        self,
        work_order_id: str,
        new_worker_id: str,
        reason_code: str,
        remarks: str,
        assignment_date: Optional[str] = None,
        shift_name: Optional[str] = None,
        shift_start: Optional[str] = None,
        shift_end: Optional[str] = None,
        priority: Optional[str] = None,
        authority_uid: str = "system_authority_official",
    ) -> Dict[str, Any]:
        db = get_firestore_client()
        wo_ref = db.collection("work_orders").document(work_order_id)
        wo_snap = wo_ref.get()

        if not wo_snap.exists:
            q = db.collection("work_orders").where("workOrderNumber", "==", work_order_id).limit(1).get()
            if not q:
                raise ValueError(f"Work Order '{work_order_id}' not found.")
            wo_snap = q[0]
            wo_ref = wo_snap.reference

        wo_data = wo_snap.to_dict()
        current_worker_id = wo_data.get("employeeId")

        if new_worker_id == current_worker_id:
            raise ValueError("New worker is identical to the currently assigned worker.")

        if not reason_code or not reason_code.strip():
            raise ValueError("Reassignment reason is required.")

        if reason_code.lower() == "other" and not remarks.strip():
            raise ValueError("Remarks are required when selecting 'Other' as reassignment reason.")

        # Fetch New Worker from Firestore
        new_emp_ref = db.collection("employees").document(new_worker_id)
        new_emp_snap = new_emp_ref.get()
        if not new_emp_snap.exists:
            new_emp_ref = db.collection("workers").document(new_worker_id)
            new_emp_snap = new_emp_ref.get()

        if not new_emp_snap.exists:
            raise ValueError(f"New Worker '{new_worker_id}' not found in Firestore database.")

        new_emp_data = new_emp_snap.to_dict()
        if new_emp_data.get("isActive") is False or new_emp_data.get("status", "").upper() in ["INACTIVE", "OFF_SHIFT"]:
            raise ValueError(f"New Worker '{new_emp_data.get('fullName', new_emp_data.get('name'))}' is INACTIVE and cannot accept assignments.")

        new_official_email = new_emp_data.get("officialEmail") or new_emp_data.get("email")
        if not new_official_email or not isinstance(new_official_email, str) or "@" not in new_official_email:
            raise ValueError(f"New Worker '{new_emp_data.get('fullName', new_emp_data.get('name'))}' has no valid official email address in Firestore.")
        new_official_email = new_official_email.strip().lower()

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Preserve complete assignment history
        history = list(wo_data.get("assignmentHistory", []))
        if not history:
            history.append({
                "workerId": current_worker_id,
                "workerName": wo_data.get("employeeName"),
                "workerEmail": wo_data.get("employeeEmail"),
                "assignedAt": wo_data.get("assignedAt") or wo_data.get("createdAt"),
                "assignedBy": wo_data.get("assignedBy", authority_uid),
                "assignmentType": "INITIAL"
            })

        new_history_entry = {
            "workerId": new_worker_id,
            "workerName": new_emp_data.get("fullName") or new_emp_data.get("name"),
            "workerEmail": new_official_email,
            "assignedAt": now_iso,
            "assignedBy": authority_uid,
            "assignmentType": "REASSIGNMENT",
            "previousWorkerId": current_worker_id,
            "previousWorkerName": wo_data.get("employeeName"),
            "previousWorkerEmail": wo_data.get("employeeEmail"),
            "reasonCode": reason_code,
            "remarks": remarks
        }
        history.append(new_history_entry)

        shift_doc = {
            "name": shift_name or wo_data.get("shift", {}).get("name", "Morning Shift"),
            "startTime": shift_start or wo_data.get("shift", {}).get("startTime", "08:00 AM"),
            "endTime": shift_end or wo_data.get("shift", {}).get("endTime", "04:00 PM")
        }

        initial_email_delivery = {
            "recipientEmail": new_official_email,
            "sentAt": None,
            "status": "PENDING",
            "error": None
        }

        wo_update = {
            "employeeId": new_worker_id,
            "employeeCode": new_emp_data.get("employeeCode") or new_emp_data.get("employeeId") or "EMP-001",
            "employeeName": new_emp_data.get("fullName") or new_emp_data.get("name"),
            "employeeEmail": new_official_email,
            "assignmentHistory": history,
            "assignmentDate": assignment_date or wo_data.get("assignmentDate"),
            "shift": shift_doc,
            "priority": (priority or wo_data.get("priority", "MEDIUM")).upper(),
            "isReassigned": True,
            "reassignmentReason": reason_code,
            "reassignmentRemarks": remarks,
            "reassignedAt": now_iso,
            "reassignedBy": authority_uid,
            "emailDelivery": initial_email_delivery,
            "emailNotification": {
                "status": "PENDING",
                "sentAt": None,
                "attemptCount": 1,
                "lastAttemptAt": now_iso,
                "failureReason": None,
            },
            "updatedAt": now_iso
        }
        wo_ref.update(wo_update)

        # Update report document in Firestore
        report_id = wo_data.get("reportId")
        report_ref = db.collection("issues").document(report_id)
        report_snap = report_ref.get()
        if not report_snap.exists:
            q_rep = db.collection("issues").where("ticketId", "==", wo_data.get("ticketId")).limit(1).get()
            if q_rep:
                report_snap = q_rep[0]
                report_ref = report_snap.reference

        reassign_event = {
            "eventType": "worker_reassigned",
            "actorUid": authority_uid,
            "actorRole": "authority",
            "timestamp": now_iso,
            "metadata": {
                "workOrderId": wo_data.get("workOrderId"),
                "previousWorkerId": current_worker_id,
                "previousWorkerName": wo_data.get("employeeName"),
                "newWorkerId": new_worker_id,
                "newWorkerName": new_emp_data.get("fullName") or new_emp_data.get("name"),
                "reasonCode": reason_code,
                "remarks": remarks
            }
        }

        report_ref.update({
            "status": "IN_PROGRESS",
            "employeeId": new_worker_id,
            "assignment.employeeId": new_worker_id,
            "assignment.employeeName": new_emp_data.get("fullName") or new_emp_data.get("name"),
            "assignment.employeeCode": new_emp_data.get("employeeCode") or new_emp_data.get("employeeId"),
            "assignment.recipientEmail": new_official_email,
            "assignment.isReassigned": True,
            "assignment.reassignedAt": now_iso,
            "timeline": firestore.ArrayUnion([reassign_event]),
            "updatedAt": now_iso
        })

        # Update Active Work Order Counts Transactionally / Safely
        if current_worker_id:
            prev_emp_ref = db.collection("employees").document(current_worker_id)
            if not prev_emp_ref.get().exists:
                prev_emp_ref = db.collection("workers").document(current_worker_id)
            if prev_emp_ref.get().exists:
                prev_emp_ref.update({
                    "activeWorkOrderIds": firestore.ArrayRemove([wo_data.get("workOrderId")]),
                    "updatedAt": now_iso
                })

        new_emp_ref.update({
            "status": "ASSIGNED",
            "activeWorkOrderIds": firestore.ArrayUnion([wo_data.get("workOrderId")]),
            "updatedAt": now_iso
        })

        # Send Real SMTP Email to New Worker
        wo_updated_data = dict(wo_data)
        wo_updated_data.update(wo_update)

        email_res = email_service.send_work_assignment_email(wo_updated_data)

        if email_res["success"]:
            email_delivery_data = {
                "recipientEmail": new_official_email,
                "sentAt": email_res.get("sentAt") or now_iso,
                "status": "SENT",
                "error": None
            }
        else:
            email_delivery_data = {
                "recipientEmail": new_official_email,
                "sentAt": None,
                "status": "FAILED",
                "error": email_res.get("failureReason") or "SMTP Delivery Failed"
            }

        email_notification_data = {
            "status": email_res["status"],
            "sentAt": email_res.get("sentAt"),
            "attemptCount": 1,
            "lastAttemptAt": now_iso,
            "failureReason": email_res.get("failureReason"),
        }

        wo_ref.update({
            "emailDelivery": email_delivery_data,
            "emailNotification": email_notification_data,
            "updatedAt": now_iso
        })

        wo_updated_data["emailDelivery"] = email_delivery_data
        wo_updated_data["emailNotification"] = email_notification_data

        logger.info(f"Work Order '{wo_data.get('workOrderNumber')}' successfully reassigned from '{wo_data.get('employeeName')}' to '{new_emp_data.get('fullName') or new_emp_data.get('name')}' ({new_official_email}). Email status: {email_res['status']}")

        return {
            "success": True,
            "workOrderId": wo_data.get("workOrderId"),
            "status": "IN_PROGRESS",
            "emailDelivery": email_delivery_data,
            "emailNotification": email_notification_data,
            "workOrder": wo_updated_data
        }

    def get_work_order_by_report(self, report_id: str) -> Optional[Dict[str, Any]]:
        db = get_firestore_client()
        query_snap = db.collection("work_orders").where("reportId", "==", report_id).limit(1).get()
        if not query_snap:
            query_snap = db.collection("work_orders").where("ticketId", "==", report_id).limit(1).get()
        if query_snap:
            d = query_snap[0].to_dict()
            if "createdAt" in d and hasattr(d["createdAt"], "isoformat"):
                d["createdAt"] = d["createdAt"].isoformat()
            if "updatedAt" in d and hasattr(d["updatedAt"], "isoformat"):
                d["updatedAt"] = d["updatedAt"].isoformat()
            return d
        return None

firestore_service = FirestoreService()
