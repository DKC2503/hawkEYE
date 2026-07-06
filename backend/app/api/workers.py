import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Query, Header
from pydantic import BaseModel, Field
from app.services.firestore_service import firestore_service, MUNICIPAL_DEPARTMENTS

logger = logging.getLogger("hawkEYE.api.workers")
router = APIRouter(prefix="/api/workers", tags=["Municipal Workforce"])

class WorkerCreatePayload(BaseModel):
    employeeId: str = Field(..., min_length=3, max_length=20)
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=120)
    phone: str = Field(..., min_length=8, max_length=20)
    department: str
    jobRole: str
    shift: str
    status: str = "available"

class WorkOrderCreatePayload(BaseModel):
    reportId: str
    department: str
    workerId: str
    priority: str = "medium"  # low, medium, high, critical
    targetDate: str
    instructions: Optional[str] = None

@router.get("", summary="Get real municipal workers")
def get_workers(department: Optional[str] = Query(None)):
    try:
        workers = firestore_service.get_all_workers(department_filter=department)
        return {"success": True, "workers": workers, "count": len(workers)}
    except Exception as e:
        logger.error(f"Error fetching workers: {str(e)}")
        return {"success": True, "workers": [], "count": 0}

@router.post("", status_code=status.HTTP_201_CREATED, summary="Register a real municipal worker")
def create_worker(
    payload: WorkerCreatePayload,
    x_authority_role: Optional[str] = Header("authority"),
):
    if payload.department not in MUNICIPAL_DEPARTMENTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid department. Allowed departments: {', '.join(MUNICIPAL_DEPARTMENTS)}",
        )

    try:
        authority_uid = "system_authority_official"
        new_worker = firestore_service.create_worker(payload.dict(), authority_uid=authority_uid)
        return {"success": True, "worker": new_worker}
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to create worker: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register worker in Firestore database.",
        )

@router.get("/{worker_id}", summary="Get worker profile details")
def get_worker(worker_id: str):
    worker = firestore_service.get_worker_by_id(worker_id)
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Worker '{worker_id}' not found.")
    return {"success": True, "worker": worker}
