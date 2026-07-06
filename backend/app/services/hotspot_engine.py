import logging
import uuid
import datetime
from typing import List, Dict, Any
from firebase_admin import firestore
from app.core.firebase import get_firestore_client
from app.schemas.intelligence import DemandHotspot

logger = logging.getLogger("hawkEYE.hotspot_engine")

class DemandHotspotEngine:
    """
    Computes geographic demand hotspots combining unique citizen requests,
    affected population estimates, geographic density, and domain urgency.
    """

    def calculate_domain_hotspots(self, domain: str = "ALL") -> List[DemandHotspot]:
        db = get_firestore_client()
        themes_ref = db.collection("civic_themes")

        if domain.upper() != "ALL":
            docs = themes_ref.where("domain", "==", domain.upper()).get()
        else:
            docs = themes_ref.get()

        hotspots: List[DemandHotspot] = []
        for doc in docs:
            data = doc.to_dict()
            unique_citizens = data.get("uniqueCitizenCount", 1)
            total_submissions = data.get("totalSubmissionCount", 1)
            areas = data.get("areas", ["Visakhapatnam"])
            area_name = areas[0] if areas else "Visakhapatnam"
            centroid = data.get("centroid", {"latitude": 17.812679, "longitude": 83.357079})

            # Score calculation: 60% unique citizens + 40% total requests
            score = round(min(100.0, (unique_citizens * 12.0) + (total_submissions * 5.0)), 1)
            urgency = "CRITICAL" if score >= 80 else ("HIGH" if score >= 50 else "MEDIUM")

            hotspots.append(DemandHotspot(
                hotspot_id=f"HOTSPOT-{doc.id}",
                title=f"{data.get('domain', 'CIVIC')} Demand Hotspot: {area_name}",
                domain=data.get("domain", "CIVIC"),
                centroid=centroid,
                radius_meters=600.0,
                unique_citizens=unique_citizens,
                total_submissions=total_submissions,
                affected_population=unique_citizens * 120,
                urgency_level=urgency,
                score=score,
                area_name=area_name,
                related_theme_ids=[doc.id],
            ))

        return hotspots

hotspot_engine = DemandHotspotEngine()
