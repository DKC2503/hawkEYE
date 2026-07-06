import logging
from typing import Dict, Any, Optional
from pathlib import Path
from fastapi import Header, HTTPException, status, Depends
import firebase_admin.auth as fb_auth
from app.core.firebase import get_firebase_app, get_firestore_client
from app.core.config import settings

logger = logging.getLogger("hawkEYE.auth_dep")

class AuthenticatedCitizen:
    def __init__(self, uid: str, decoded_token: Dict[str, Any]):
        self.uid = uid
        self.decoded_token = decoded_token

async def get_optional_citizen(authorization: Optional[str] = Header(None)) -> Optional[AuthenticatedCitizen]:
    if not authorization:
        return None
    try:
        parts = authorization.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None
        token = parts[1].strip()
        get_firebase_app()
        decoded_token = fb_auth.verify_id_token(token)
        return AuthenticatedCitizen(uid=decoded_token.get("uid", "anonymous"), decoded_token=decoded_token)
    except Exception:
        return None

async def get_current_citizen(authorization: str = Header(None)) -> AuthenticatedCitizen:
    # Diagnostic check
    has_sa = bool(settings.FIREBASE_SERVICE_ACCOUNT_PATH and Path(settings.FIREBASE_SERVICE_ACCOUNT_PATH).exists())

    if not authorization:
        logger.warning("[AUTH_DIAGNOSTIC] Authorization header missing.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="[AUTH_HEADER_MISSING] Authorization header with Bearer token is required.",
        )

    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        logger.warning("[AUTH_DIAGNOSTIC] Malformed Authorization header format.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="[AUTH_HEADER_INVALID] Malformed Authorization header. Expected 'Bearer <token>'.",
        )

    token = parts[1].strip()
    if not token:
        logger.warning("[AUTH_DIAGNOSTIC] Bearer token string is empty.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="[AUTH_HEADER_INVALID] Bearer token is empty.",
        )

    # Ensure Firebase Admin is initialized
    get_firebase_app()

    # Safe dev diagnostics (NO TOKEN CONTENTS LOGGED)
    logger.info(f"[AUTH_DIAGNOSTIC] Header present: YES | Bearer format: YES | Token length: {len(token)} | Project: {settings.FIREBASE_PROJECT_ID} | Service Account JSON: {'YES' if has_sa else 'NO'}")

    try:
        decoded_token = fb_auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        if not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="[AUTH_TOKEN_INVALID] Firebase token missing user ID.",
            )
        logger.info(f"[AUTH_DIAGNOSTIC] Firebase ID Token successfully verified for UID: {uid[:6]}***")
        return AuthenticatedCitizen(uid=uid, decoded_token=decoded_token)
    except fb_auth.ExpiredIdTokenError:
        logger.warning("[AUTH_DIAGNOSTIC] Exception: ExpiredIdTokenError (Token expired)")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="[AUTH_TOKEN_EXPIRED] Firebase authentication token has expired. Please refresh session.",
        )
    except fb_auth.InvalidIdTokenError as exc:
        logger.warning(f"[AUTH_DIAGNOSTIC] Exception: InvalidIdTokenError | Details: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"[AUTH_TOKEN_INVALID] Invalid Firebase authentication token: {str(exc)}",
        )
    except Exception as exc:
        exc_name = type(exc).__name__
        exc_msg = str(exc)
        logger.error(f"[AUTH_DIAGNOSTIC] Exception: {exc_name} | Details: {exc_msg}")

        if "Credential" in exc_msg or "certificate" in exc_msg.lower() or "default credentials" in exc_msg.lower() or not has_sa:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="[FIREBASE_ADMIN_NOT_CONFIGURED] Backend Firebase Admin requires a Service Account JSON key to verify ID tokens locally.",
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"[AUTH_VERIFICATION_FAILED] Firebase identity token verification failed: {exc_name}",
        )

async def get_current_authority(
    citizen: AuthenticatedCitizen = Depends(get_current_citizen),
    x_authority_role: Optional[str] = Header(None)
) -> AuthenticatedCitizen:
    if not x_authority_role or x_authority_role.lower() != "authority":
        logger.warning(f"[SECURITY CHECK FAILED] UID {citizen.uid} attempted authority action without authority role header.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="[AUTH_ROLE_INVALID] User is authenticated but does not have authority role permissions."
        )
    
    logger.warning(
        f"[SECURITY WARNING] UID {citizen.uid} authorized via development-only header bypass. "
        "Missing production authority authorization architecture (custom claims or role database check)."
    )
    return citizen

class AuthenticatedArtisan:
    def __init__(self, employee_id: str, employee_code: str, full_name: str, official_email: str, department: str, role: str, doc_data: Dict[str, Any]):
        self.employee_id = employee_id
        self.employee_code = employee_code
        self.full_name = full_name
        self.official_email = official_email
        self.department = department
        self.role = role
        self.doc_data = doc_data

async def get_current_artisan(
    authorization: Optional[str] = Header(None),
    x_artisan_email: Optional[str] = Header(None)
) -> AuthenticatedArtisan:
    db = get_firestore_client()
    target_email = (x_artisan_email or "karthikdaraworks@gmail.com").strip().lower()

    # 1. Attempt token verification if authorization header is provided
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1].strip()
        if token:
            try:
                get_firebase_app()
                decoded_token = fb_auth.verify_id_token(token)
                provider = decoded_token.get("firebase", {}).get("sign_in_provider")
                if provider != "anonymous":
                    uid = decoded_token.get("uid")
                    raw_email = decoded_token.get("email")

                    # Query by firebaseUid
                    emp_snaps = db.collection("employees").where("firebaseUid", "==", uid).limit(1).get()
                    if emp_snaps:
                        emp_doc = emp_snaps[0]
                        emp_data = emp_doc.to_dict()
                        return AuthenticatedArtisan(
                            employee_id=emp_doc.id,
                            employee_code=emp_data.get("employeeCode", emp_doc.id),
                            full_name=emp_data.get("fullName", emp_data.get("name", "Field Specialist")),
                            official_email=emp_data.get("officialEmail", emp_data.get("email", "")),
                            department=emp_data.get("department", "Roads & Infrastructure"),
                            role=emp_data.get("role", "Field Specialist"),
                            doc_data=emp_data,
                        )
                    if raw_email:
                        target_email = raw_email.strip().lower()
            except Exception:
                pass # Fallback to dev default worker

    # 2. Dev Bypass / Unauthenticated Fallback: Default to active worker document
    email_snaps = db.collection("employees").where("officialEmail", "==", target_email).limit(1).get()
    if not email_snaps:
        email_snaps = db.collection("employees").where("email", "==", target_email).limit(1).get()
    if not email_snaps:
        email_snaps = db.collection("employees").where("isActive", "==", True).limit(1).get()

    if not email_snaps:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="[DEV_BYPASS_FAILED] No active employee document found in Firestore.",
        )

    emp_doc = email_snaps[0]
    emp_data = emp_doc.to_dict()

    return AuthenticatedArtisan(
        employee_id=emp_doc.id,
        employee_code=emp_data.get("employeeCode", emp_doc.id),
        full_name=emp_data.get("fullName", emp_data.get("name", "Field Specialist")),
        official_email=emp_data.get("officialEmail", emp_data.get("email", target_email)),
        department=emp_data.get("department", "Roads & Infrastructure"),
        role=emp_data.get("role", "Senior Field Specialist"),
        doc_data=emp_data,
    )
