from enum import Enum
from pydantic import BaseModel, Field, field_validator

class CivicCategory(str, Enum):
    POTHOLE = "POTHOLE"
    ROAD_DAMAGE = "ROAD_DAMAGE"
    GARBAGE = "GARBAGE"
    STREETLIGHT = "STREETLIGHT"
    DRAINAGE = "DRAINAGE"
    WATER_LEAK = "WATER_LEAK"
    FLOODING = "FLOODING"
    DAMAGED_INFRASTRUCTURE = "DAMAGED_INFRASTRUCTURE"
    OTHER_CIVIC_ISSUE = "OTHER_CIVIC_ISSUE"
    NOT_A_CIVIC_ISSUE = "NOT_A_CIVIC_ISSUE"
    UNCERTAIN = "UNCERTAIN"

class CivicSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class VisionAnalysisResponse(BaseModel):
    is_civic_issue: bool
    category: CivicCategory
    summary: str = Field(description="Factual summary of visible issue under 25 words")
    severity: CivicSeverity
    visible_risk: str = Field(description="Visible risk or safety hazard statement")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score from 0.0 to 1.0")
    needs_human_review: bool

    @field_validator("summary")
    @classmethod
    def validate_summary_word_count(cls, v: str) -> str:
        words = v.strip().split()
        if len(words) > 35:
            # Truncate gracefully to under 25 words if model exceeded
            v = " ".join(words[:24]) + "..."
        return v
