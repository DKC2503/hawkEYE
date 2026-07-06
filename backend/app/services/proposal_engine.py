import logging
import uuid
import datetime
from typing import List, Dict, Any, Optional
from app.services.public_data_adapter import public_data_adapter
from app.services.priority_scorer import priority_scorer
from app.schemas.intelligence import DevelopmentProposal

logger = logging.getLogger("hawkEYE.proposal_engine")

class ProposalGenerationEngine:
    """
    Generates evidence-based development proposals from validated citizen demand themes,
    demographic datasets, and infrastructure gap metrics.
    """

    def generate_proposal_for_theme(
        self,
        theme_title: str,
        domain: str,
        area: str,
        unique_citizens: int,
        total_submissions: int,
        urgency: str = "HIGH",
        theme_summary: Optional[str] = None
    ) -> DevelopmentProposal:
        # Fetch public data profile for area
        data_profile = public_data_adapter.get_area_metrics(area)
        metrics = data_profile["metrics"]

        # Domain specific metrics extraction
        if domain.upper() == "EDUCATION":
            pop_affected = metrics.get("school_age_children", 3400)
            capacity = metrics.get("school_enrolment_capacity", 1800)
            gap = max(200, int(pop_affected * 0.4))
            dist_km = metrics.get("nearest_school_distance_km", 7.4)
            action = f"Upgrade existing municipal high school in {area} to add 12 classrooms and science labs."
            alts = [
                f"Upgrade existing high school in {area}",
                f"Construct new 500-student government school campus in {area}",
                "Provide dedicated student transit shuttle service",
            ]
        elif domain.upper() == "HEALTHCARE":
            pop_affected = metrics.get("population", 14200)
            capacity = metrics.get("hospital_beds_capacity", 45)
            gap = max(50, int(pop_affected * 0.01))
            dist_km = metrics.get("nearest_hospital_distance_km", 5.2)
            action = f"Establish 24/7 Primary Health Centre & Diagnostic Lab in {area}."
            alts = [
                f"Establish 24/7 Primary Health Centre in {area}",
                "Deploy weekly mobile health clinic units",
                "Upgrade nearest sub-centre emergency ward",
            ]
        elif domain.upper() == "WATER_SUPPLY":
            pop_affected = int(metrics.get("population", 14200) * 0.38)
            capacity = metrics.get("water_pipeline_coverage_pct", 62)
            gap = 100 - capacity
            dist_km = 3.5
            action = f"Construct 500 KL Overhead Storage Reservoir & sub-surface water pipeline network in {area}."
            alts = [
                f"Construct Overhead Storage Reservoir in {area}",
                "Upgrade main trunk pipeline feeder network",
                "Install automated RO drinking water kiosks",
            ]
        else: # ROADS, TRANSPORT, DRAINAGE, etc.
            pop_affected = int(metrics.get("population", 14200) * 0.5)
            capacity = 50
            gap = 150
            dist_km = 4.0
            action = f"Construct storm-water drainage network and bitumen road upgrade in {area}."
            alts = [
                f"Comprehensive bitumen road & drainage reconstruction in {area}",
                "Targeted pothole sealing & shoulder stabilization",
                "Install solar streetlight corridor & traffic safety barriers",
            ]

        # Calculate transparent priority score
        score_res = priority_scorer.calculate_priority_score(
            unique_citizens=unique_citizens,
            total_submissions=total_submissions,
            population_affected=pop_affected,
            capacity_gap=gap,
            urgency=urgency,
            average_travel_distance_km=dist_km,
        )

        now_iso = datetime.datetime.utcnow().isoformat() + "Z"
        prop_id = f"PROP-{uuid.uuid4().hex[:6].upper()}"

        return DevelopmentProposal(
            proposal_id=prop_id,
            title=f"{domain.capitalize().replace('_', ' ')} Upgrade: {area}",
            domain=domain.upper(),
            area=area,
            problem_statement=theme_summary or f"{unique_citizens} citizens in {area} requested urgent infrastructure improvements due to capacity gaps and excessive travel distance.",
            recommended_action=action,
            alternatives=alts,
            unique_citizens=unique_citizens,
            total_submissions=total_submissions,
            affected_population=pop_affected,
            capacity_gap=gap,
            average_travel_distance_km=dist_km,
            priority_score=score_res["total_score"],
            score_breakdown=score_res["score_breakdown"],
            status="AI_RECOMMENDED",
            data_sources=[data_profile["source"], "CIVIC_CITIZEN_FEEDBACK"],
            created_at=now_iso,
            updated_at=now_iso,
        )

proposal_generation_engine = ProposalGenerationEngine()
