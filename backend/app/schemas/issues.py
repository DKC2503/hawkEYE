from pydantic import BaseModel, Field
from typing import Optional

class IssueSubmissionResponse(BaseModel):
    issueId: str
    ticketId: str
    category: str
    description: str
    status: str
    createdAt: str
    formattedLocation: Optional[str] = None
    imageUrl: Optional[str] = None

class CreateIssuePayload(BaseModel):
    latitude: float = Field(ge=-90.0, le=90.0)
    longitude: float = Field(ge=-180.0, le=180.0)
    accuracy: Optional[float] = None
    area: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    displayName: Optional[str] = None
    aiCategory: str
    aiSummary: str
    aiSeverity: str
    aiVisibleRisk: str
    aiConfidence: float = Field(ge=0.0, le=1.0)
    needsHumanReview: bool = False
    category: str
    description: str
    citizenNotes: Optional[str] = None
    idempotencyKey: Optional[str] = None
