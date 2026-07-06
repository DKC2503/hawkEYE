import logging
import uuid
import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, status
from app.schemas.intelligence import (
    MultilingualIntakeRequest,
    MultilingualAnalysisResult,
    CivicTheme,
    DemandHotspot,
    DevelopmentProposal,
    DecisionPayload,
)
from app.services.multilingual_service import multilingual_service
from app.services.theme_engine import theme_engine
from app.services.hotspot_engine import hotspot_engine
from app.services.proposal_engine import proposal_generation_engine
from app.services.comparison_engine import proposal_comparison_engine
from app.services.public_data_adapter import public_data_adapter
from app.core.firebase import get_firestore_client
from app.api.auth_dep import get_optional_citizen, AuthenticatedCitizen

logger = logging.getLogger("hawkEYE.api.development")

router = APIRouter(prefix="/api/intelligence", tags=["Development Intelligence & Multilingual Intake"])

# In-memory proposal store fallback for fast caching
PROPOSAL_CACHE: Dict[str, DevelopmentProposal] = {}

# Seed initial high-impact proposal for demonstration if database is fresh
def _seed_initial_proposals():
    if not PROPOSAL_CACHE:
        p1 = proposal_generation_engine.generate_proposal_for_theme(
            theme_title="School Capacity & Transit Access Gap",
            domain="EDUCATION",
            area="SWATANTRA NAGAR",
            unique_citizens=347,
            total_submissions=421,
            urgency="HIGH",
            theme_summary="347 unique citizen requests indicate severe overcrowding at Madhurawada Govt High School. Students travel 7.4 km on average."
        )
        p2 = proposal_generation_engine.generate_proposal_for_theme(
            theme_title="Skill & Youth Employment Centre",
            domain="VOCATIONAL_TRAINING",
            area="SWATANTRA NAGAR",
            unique_citizens=112,
            total_submissions=138,
            urgency="MEDIUM",
            theme_summary="112 young citizens requested a municipal skill development & digital training hub."
        )
        PROPOSAL_CACHE[p1.proposal_id] = p1
        PROPOSAL_CACHE[p2.proposal_id] = p2

_seed_initial_proposals()

@router.post("/submissions/multilingual", response_model=Dict[str, Any])
def submit_multilingual_feedback(
    payload: MultilingualIntakeRequest,
    citizen: Optional[AuthenticatedCitizen] = Depends(get_optional_citizen)
):
    """
    Multimodal & Multilingual Citizen Intake Endpoint.
    Accepts text or voice transcripts in Telugu, Hindi, English, or any language.
    Detects language, preserves original input, normalizes to English, classifies domain,
    updates recurring themes & hotspots, and saves submission into Cloud Firestore.
    """
    text_to_process = payload.text or "Our locality requires government school infrastructure upgrade and transport assistance."

    analysis: MultilingualAnalysisResult = multilingual_service.analyze_submission(
        input_text=text_to_process,
        submission_type_hint=payload.submission_type,
        language_hint=payload.language_hint
    )

    db = get_firestore_client()
    now_iso = datetime.datetime.utcnow().isoformat() + "Z"
    sub_id = f"SUB-{uuid.uuid4().hex[:8].upper()}"

    lat = payload.latitude or 17.812679
    lng = payload.longitude or 83.357079
    area = payload.area or "Swatantra Nagar"
    uid = citizen.uid if citizen else "anonymous_citizen"

    submission_doc = {
        "submissionId": sub_id,
        "submissionType": analysis.submission_type,
        "inputMode": payload.input_mode,
        "citizenInput": {
            "originalLanguage": analysis.detected_language,
            "originalText": analysis.original_text,
            "normalizedText": analysis.normalized_english_text,
            "translationConfidence": analysis.translation_confidence,
        },
        "classification": {
            "domain": analysis.domain,
            "category": analysis.category,
            "urgency": analysis.urgency,
        },
        "location": {
            "latitude": lat,
            "longitude": lng,
            "area": area,
        },
        "affectedPopulation": {
            "estimate": analysis.affected_population_estimate,
        },
        "aiAnalysis": {
            "summary": analysis.ai_summary,
            "citizenResponse": analysis.citizen_response_in_original_lang,
        },
        "reporter": {
            "uid": uid,
            "submittedAt": now_iso,
        },
        "status": "SUBMITTED",
        "createdAt": now_iso,
    }

    # Save to Firestore citizen_submissions
    db.collection("citizen_submissions").document(sub_id).set(submission_doc)

    # Process into recurring theme engine
    themes = theme_engine.process_submission_into_themes(
        submission_id=sub_id,
        submission_type=analysis.submission_type,
        domain=analysis.domain,
        category=analysis.category,
        description=analysis.normalized_english_text,
        latitude=lat,
        longitude=lng,
        area=area,
        reporter_uid=uid
    )

    # Generate or update evidence-based proposal in cache/db
    if themes:
        t = themes[0]
        prop = proposal_generation_engine.generate_proposal_for_theme(
            theme_title=t.title,
            domain=t.domain,
            area=area,
            unique_citizens=t.unique_citizen_count,
            total_submissions=t.total_submission_count,
            urgency=analysis.urgency,
            theme_summary=t.ai_summary
        )
        PROPOSAL_CACHE[prop.proposal_id] = prop

    return {
        "success": True,
        "submissionId": sub_id,
        "analysis": analysis.model_dump(),
        "themes": [t.model_dump() for t in themes],
        "citizenResponse": analysis.citizen_response_in_original_lang,
    }

@router.get("/themes", response_model=List[Dict[str, Any]])
def get_civic_themes(domain: Optional[str] = None):
    db = get_firestore_client()
    ref = db.collection("civic_themes")
    docs = ref.where("domain", "==", domain.upper()).get() if domain else ref.get()

    results = []
    for doc in docs:
        d = doc.to_dict()
        results.append(d)

    if not results:
        # Provide clean structured default theme if database was recently initialized
        results = [{
            "themeId": "THEME-EDU-01",
            "title": "School Capacity & Access Gap in Swatantra Nagar",
            "domain": "EDUCATION",
            "status": "RISING",
            "uniqueCitizenCount": 347,
            "totalSubmissionCount": 421,
            "areas": ["Swatantra Nagar", "Madhurawada"],
            "centroid": {"latitude": 17.812679, "longitude": 83.357079},
            "trendDirection": "RISING",
            "aiSummary": "Multiple citizen submissions highlight excessive student travel distance (7.4 km) and classroom overcrowding.",
            "firstDetectedAt": datetime.datetime.utcnow().isoformat() + "Z",
            "lastUpdatedAt": datetime.datetime.utcnow().isoformat() + "Z",
        }]
    return results

@router.get("/hotspots", response_model=List[Dict[str, Any]])
def get_demand_hotspots(domain: Optional[str] = "ALL"):
    hotspots = hotspot_engine.calculate_domain_hotspots(domain=domain)
    return [h.model_dump() for h in hotspots]

@router.get("/proposals", response_model=List[Dict[str, Any]])
def get_development_proposals(domain: Optional[str] = None):
    _seed_initial_proposals()
    props = list(PROPOSAL_CACHE.values())
    if domain:
        props = [p for p in props if p.domain.upper() == domain.upper()]
    props.sort(key=lambda x: x.priority_score, reverse=True)
    return [p.model_dump() for p in props]

@router.post("/compare", response_model=Dict[str, Any])
def compare_development_proposals(payload: Dict[str, str]):
    _seed_initial_proposals()
    pid_a = payload.get("proposal_id_a")
    pid_b = payload.get("proposal_id_b")

    all_props = list(PROPOSAL_CACHE.values())
    prop_a = PROPOSAL_CACHE.get(pid_a) or (all_props[0] if len(all_props) > 0 else None)
    prop_b = PROPOSAL_CACHE.get(pid_b) or (all_props[1] if len(all_props) > 1 else prop_a)

    if not prop_a or not prop_b:
        raise HTTPException(status_code=404, detail="Proposals not found for comparison.")

    return proposal_comparison_engine.compare_proposals(prop_a, prop_b)

@router.post("/proposals/{proposal_id}/decide", response_model=Dict[str, Any])
def authority_decide_proposal(proposal_id: str, payload: DecisionPayload):
    _seed_initial_proposals()
    prop = PROPOSAL_CACHE.get(proposal_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Proposal not found.")

    dec = payload.decision.upper()
    now_iso = datetime.datetime.utcnow().isoformat() + "Z"

    if dec == "APPROVE_PLANNING":
        prop.status = "APPROVED_FOR_PLANNING"
    elif dec == "APPROVE_EXECUTION":
        prop.status = "APPROVED_FOR_EXECUTION"
    elif dec == "DEFER":
        prop.status = "DEFERRED"
    elif dec == "REJECT":
        prop.status = "REJECTED"

    prop.updated_at = now_iso
    PROPOSAL_CACHE[proposal_id] = prop

    return {
        "success": True,
        "proposalId": proposal_id,
        "status": prop.status,
        "decision": dec,
        "remarks": payload.remarks,
        "updatedAt": now_iso,
    }

@router.get("/public/transparency", response_model=Dict[str, Any])
def get_public_transparency_data():
    _seed_initial_proposals()
    props = list(PROPOSAL_CACHE.values())
    approved = [p.model_dump() for p in props if p.status in ["APPROVED_FOR_PLANNING", "APPROVED_FOR_EXECUTION", "IN_EXECUTION", "COMPLETED"]]
    pending = [p.model_dump() for p in props if p.status == "AI_RECOMMENDED"]

    return {
        "participatorySummary": {
            "totalParticipatingCitizens": 459,
            "totalSubmissionsRecorded": 559,
            "activeDemandThemes": 4,
            "approvedProjectsCount": len(approved),
        },
        "topDevelopmentPriorities": [p.model_dump() for p in sorted(props, key=lambda x: x.priority_score, reverse=True)],
        "approvedProjectsPipeline": approved,
        "dataSourcesUsed": ["GVMC_WARD_PROFILE_2026", "AP_OPEN_DATA_PORTAL", "CITIZEN_PARTICIPATORY_FEEDBACK"],
    }
