import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Query, Header
from pydantic import BaseModel, Field
from app.services.firestore_service import firestore_service, MUNICIPAL_DEPARTMENTS

logger = logging.getLogger("hawkEYE.api.employees")
router = APIRouter(prefix="/api", tags=["Employees & Work Orders"])

class ShiftPayload(BaseModel):
    name: str = "Morning Shift"
    startTime: str = "08:00 AM"
    endTime: str = "04:00 PM"

class EmployeeCreatePayload(BaseModel):
    employeeCode: str = Field(..., min_length=3, max_length=20)
    fullName: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=120)
    phone: Optional[str] = None
    department: str
    role: str = "Senior Field Specialist"
    skills: List[str] = Field(default_factory=lambda: ["general_maintenance"])
    shift: ShiftPayload = Field(default_factory=ShiftPayload)
    serviceArea: Optional[str] = "Visakhapatnam Zone"

class WorkOrderAssignmentPayload(BaseModel):
    reportId: str
    employeeId: str
    assignmentDate: str
    shift: Optional[ShiftPayload] = None
    authorityInstructions: Optional[str] = None
    priority: str = "MEDIUM"

@router.get("/employees", summary="Get real municipal employees")
def get_employees(
    department: Optional[str] = Query(None),
    availability: Optional[str] = Query(None),
    active_only: bool = Query(True),
):
    try:
        employees = firestore_service.get_all_employees(
            department_filter=department,
            availability_filter=availability,
            active_only=active_only,
        )
        return {"success": True, "employees": employees, "count": len(employees)}
    except Exception as e:
        logger.error(f"Error fetching employees: {str(e)}")
        return {"success": True, "employees": [], "count": 0}

@router.post("/employees", status_code=status.HTTP_201_CREATED, summary="Create a new municipal employee")
def create_employee(
    payload: EmployeeCreatePayload,
    x_authority_role: Optional[str] = Header("authority"),
):
    if payload.department not in MUNICIPAL_DEPARTMENTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid department. Allowed departments: {', '.join(MUNICIPAL_DEPARTMENTS)}",
        )

    try:
        authority_uid = "system_authority_official"
        emp_dict = payload.dict()
        emp_dict["shift"] = payload.shift.dict()
        new_emp = firestore_service.create_employee(emp_dict, authority_uid=authority_uid)
        return {"success": True, "employee": new_emp}
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to create employee: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register employee in Firestore database.",
        )

@router.get("/employees/{employee_id}", summary="Get employee profile details")
def get_employee(employee_id: str):
    emp = firestore_service.get_employee_by_id(employee_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Employee '{employee_id}' not found.")
    return {"success": True, "employee": emp}

@router.patch("/employees/{employee_id}/status", summary="Activate or Deactivate employee")
def toggle_employee_status(
    employee_id: str,
    isActive: bool = Query(...),
    x_authority_role: Optional[str] = Header("authority"),
):
    try:
        authority_uid = "system_authority_official"
        result = firestore_service.toggle_employee_active(employee_id, is_active=isActive, authority_uid=authority_uid)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to toggle employee status: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update employee status.")

# Work Order Assignment API with Automatic Resend Email Delivery
@router.post("/work-orders", status_code=status.HTTP_201_CREATED, summary="Create work order, assign employee & send automatic email")
def create_work_order(
    payload: WorkOrderAssignmentPayload,
    x_authority_role: Optional[str] = Header("authority"),
):
    try:
        authority_uid = "system_authority_official"
        shift_data = payload.shift.dict() if payload.shift else None
        result = firestore_service.create_work_order(
            report_id=payload.reportId,
            employee_id=payload.employeeId,
            assignment_date=payload.assignmentDate,
            shift=shift_data,
            authority_instructions=payload.authorityInstructions,
            authority_uid=authority_uid,
            priority=payload.priority,
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to create work order assignment: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create work order assignment.")

@router.post("/work-orders/{work_order_id}/retry-email", summary="Retry sending work assignment notification email")
def retry_work_order_email(
    work_order_id: str,
    x_authority_role: Optional[str] = Header("authority"),
):
    try:
        result = firestore_service.retry_work_order_email(work_order_id)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to retry email for work order '{work_order_id}': {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retry email notification.")

class ReassignWorkOrderPayload(BaseModel):
    newWorkerId: str
    reasonCode: str
    remarks: str
    assignmentDate: Optional[str] = None
    shiftName: Optional[str] = None
    shiftStart: Optional[str] = None
    shiftEnd: Optional[str] = None
    priority: Optional[str] = None

@router.get("/work-orders/by-report/{report_id}", summary="Get existing work order for a report")
def get_work_order_by_report(report_id: str):
    wo = firestore_service.get_work_order_by_report(report_id)
    if not wo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No work order found for this report.")
    return {"success": True, "workOrder": wo}

@router.patch("/authority/work-orders/{work_order_id}/reassign", summary="Reassign work order to a new worker")
@router.patch("/work-orders/{work_order_id}/reassign", summary="Reassign work order to a new worker")
def reassign_work_order(
    work_order_id: str,
    payload: ReassignWorkOrderPayload,
    x_authority_role: Optional[str] = Header("authority"),
):
    try:
        authority_uid = "system_authority_official"
        result = firestore_service.reassign_work_order(
            work_order_id=work_order_id,
            new_worker_id=payload.newWorkerId,
            reason_code=payload.reasonCode,
            remarks=payload.remarks,
            assignment_date=payload.assignmentDate,
            shift_name=payload.shiftName,
            shift_start=payload.shiftStart,
            shift_end=payload.shiftEnd,
            priority=payload.priority,
            authority_uid=authority_uid,
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to reassign work order '{work_order_id}': {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to execute worker reassignment.")
