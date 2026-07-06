import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("hawkEYE.public_data_adapter")

class PublicDataAdapter:
    """
    Modular Public Data Adapter for municipal demographic, population,
    infrastructure capacity, and accessibility metrics.
    Transparently labels data sources (e.g. AP Open Data, Census Projections, GVMC Master Plan).
    """

    def __init__(self):
        # Configured Visakhapatnam Municipal Zone Public Data Profiles
        self._area_profiles = {
            "SWATANTRA NAGAR": {
                "population": 14200,
                "school_age_children": 3400,
                "primary_schools_count": 2,
                "school_enrolment_capacity": 1800,
                "nearest_school_distance_km": 7.4,
                "hospitals_count": 1,
                "hospital_beds_capacity": 45,
                "nearest_hospital_distance_km": 5.2,
                "water_pipeline_coverage_pct": 62,
                "bus_stops_count": 2,
                "avg_transit_wait_mins": 35,
                "source": "GVMC_WARD_PROFILE_2026",
            },
            "MADHURAWADA": {
                "population": 48500,
                "school_age_children": 11200,
                "primary_schools_count": 6,
                "school_enrolment_capacity": 7500,
                "nearest_school_distance_km": 3.8,
                "hospitals_count": 3,
                "hospital_beds_capacity": 210,
                "nearest_hospital_distance_km": 2.1,
                "water_pipeline_coverage_pct": 78,
                "bus_stops_count": 8,
                "avg_transit_wait_mins": 15,
                "source": "GVMC_WARD_PROFILE_2026",
            },
            "GAJUWAKA": {
                "population": 62000,
                "school_age_children": 14500,
                "primary_schools_count": 8,
                "school_enrolment_capacity": 9800,
                "nearest_school_distance_km": 4.1,
                "hospitals_count": 4,
                "hospital_beds_capacity": 350,
                "nearest_hospital_distance_km": 1.8,
                "water_pipeline_coverage_pct": 84,
                "bus_stops_count": 12,
                "avg_transit_wait_mins": 12,
                "source": "AP_OPEN_DATA_PORTAL",
            },
            "ANANDAPURAM": {
                "population": 18900,
                "school_age_children": 4200,
                "primary_schools_count": 3,
                "school_enrolment_capacity": 2200,
                "nearest_school_distance_km": 6.8,
                "hospitals_count": 1,
                "hospital_beds_capacity": 30,
                "nearest_hospital_distance_km": 8.5,
                "water_pipeline_coverage_pct": 48,
                "bus_stops_count": 3,
                "avg_transit_wait_mins": 40,
                "source": "CENSUS_2021_PROJECTION",
            },
            "DEFAULT": {
                "population": 25000,
                "school_age_children": 5800,
                "primary_schools_count": 4,
                "school_enrolment_capacity": 3500,
                "nearest_school_distance_km": 5.5,
                "hospitals_count": 2,
                "hospital_beds_capacity": 100,
                "nearest_hospital_distance_km": 4.2,
                "water_pipeline_coverage_pct": 70,
                "bus_stops_count": 5,
                "avg_transit_wait_mins": 25,
                "source": "DEMO_DATASET",
            }
        }

        self._existing_master_plans = [
            {
                "plan_id": "MP-2026-EDU-04",
                "domain": "EDUCATION",
                "area": "SWATANTRA NAGAR",
                "title": "Proposed High School Expansion & Transit Route",
                "status": "APPROVED_FOR_PLANNING",
                "allocated_budget_inr_lakhs": 120.0,
                "source": "GVMC_MASTER_PLAN_2026",
            },
            {
                "plan_id": "MP-2026-WTR-09",
                "domain": "WATER_SUPPLY",
                "area": "ANANDAPURAM",
                "title": "Sub-surface Aquifer Pipeline Augmentation",
                "status": "PROPOSED",
                "allocated_budget_inr_lakhs": 250.0,
                "source": "AP_WATER_RESOURCES_BOARD",
            }
        ]

    def get_area_metrics(self, area_name: Optional[str] = None) -> Dict[str, Any]:
        key = (area_name or "").strip().upper()
        profile = self._area_profiles.get(key, self._area_profiles["DEFAULT"])
        return {
            "area_name": area_name or "Visakhapatnam Zone",
            "metrics": profile,
            "is_demo_dataset": profile.get("source") == "DEMO_DATASET",
            "source": profile.get("source"),
            "confidence": 0.92 if profile.get("source") != "DEMO_DATASET" else 0.75,
        }

    def get_existing_development_plans(self, domain: str, area_name: Optional[str] = None) -> List[Dict[str, Any]]:
        results = []
        for plan in self._existing_master_plans:
            if plan["domain"].upper() == domain.upper():
                if not area_name or area_name.lower() in plan["area"].lower():
                    results.append(plan)
        return results

public_data_adapter = PublicDataAdapter()
