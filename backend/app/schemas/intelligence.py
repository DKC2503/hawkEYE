from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class MultilingualIntakeRequest(BaseModel):
    text: Optional[str] = None
    voice_audio_base64: Optional[str] = None
    input_mode: str = Field(default="TEXT", description="TEXT, VOICE, PHOTO, CONVERSATIONAL")
    submission_type: str = Field(default="DEVELOPMENT_SUGGESTION", description="ISSUE_REPORT or DEVELOPMENT_SUGGESTION")
    language_hint: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area: Optional[str] = None

class MultilingualAnalysisResult(BaseModel):
    detected_language: str = Field(description="e.g. te, hi, en")
    original_text: str
    normalized_english_text: str
    translation_confidence: float = 0.95
    submission_type: str = Field(description="ISSUE_REPORT or DEVELOPMENT_SUGGESTION")
    domain: str = Field(description="EDUCATION, HEALTHCARE, ROADS, WATER_SUPPLY, TRANSPORT, SANITATION, DRAINAGE, etc.")
    category: str = Field(description="Normalized sub-category")
    urgency: str = Field(description="LOW, MEDIUM, HIGH, CRITICAL")
    affected_population_estimate: int = 100
    ai_summary: str
    citizen_response_in_original_lang: str

class CivicTheme(BaseModel):
    theme_id: str
    title: str
    domain: str
    status: str = Field(default="EMERGING", description="EMERGING, RISING, ACTIVE, RESOLVED")
    submission_ids: List[str] = []
    unique_citizen_count: int = 1
    total_submission_count: int = 1
    areas: List[str] = []
    centroid: Dict[str, float] = {"latitude": 0.0, "longitude": 0.0}
    trend_direction: str = "RISING"
    ai_summary: str
    confidence: float = 0.90
    first_detected_at: str
    last_updated_at: str

class DemandHotspot(BaseModel):
    hotspot_id: str
    title: str
    domain: str
    centroid: Dict[str, float]
    radius_meters: float = 500.0
    unique_citizens: int
    total_submissions: int
    affected_population: int
    urgency_level: str
    score: float
    area_name: str
    related_theme_ids: List[str] = []

class InfrastructureGap(BaseModel):
    gap_id: str
    theme_id: str
    domain: str
    area: str
    gap_type: str
    demand_level: str
    current_capacity: int
    estimated_need: int
    capacity_gap: int
    average_travel_distance_km: float
    coverage_score: float
    evidence_quality: float

class DevelopmentProposal(BaseModel):
    proposal_id: str
    title: str
    domain: str
    area: str
    problem_statement: str
    recommended_action: str
    alternatives: List[str] = []
    unique_citizens: int
    total_submissions: int
    affected_population: int
    capacity_gap: int
    average_travel_distance_km: float
    priority_score: float
    score_breakdown: Dict[str, float]
    status: str = Field(default="AI_RECOMMENDED", description="AI_RECOMMENDED, UNDER_AUTHORITY_REVIEW, APPROVED_FOR_PLANNING, PLANNED, APPROVED_FOR_EXECUTION, IN_EXECUTION, COMPLETED, REJECTED, DEFERRED")
    data_sources: List[str] = []
    created_at: str
    updated_at: str

class DecisionPayload(BaseModel):
    decision: str = Field(description="APPROVE_PLANNING, APPROVE_EXECUTION, DEFER, REJECT, MERGE")
    remarks: str
    authority_officer: Optional[str] = "Authority Officer"
    target_project_title: Optional[str] = None
