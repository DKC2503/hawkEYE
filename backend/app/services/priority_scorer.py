import logging
from typing import Dict, Any

logger = logging.getLogger("hawkEYE.priority_scorer")

class DeterministicPriorityScorer:
    """
    Transparent, deterministic priority scoring engine.
    Calculates score out of 100 based on exact mathematical factors.
    Prevents direct LLM manipulation of score values.
    """

    DEFAULT_WEIGHTS = {
        "citizen_demand": 0.25,      # 25 points max
        "population_impact": 0.20,   # 20 points max
        "infrastructure_gap": 0.20,  # 20 points max
        "urgency_safety": 0.15,      # 15 points max
        "geographic_equity": 0.10,   # 10 points max
        "trend_recurrence": 0.05,    # 5 points max
        "feasibility": 0.05,         # 5 points max
    }

    def calculate_priority_score(
        self,
        unique_citizens: int,
        total_submissions: int,
        population_affected: int,
        capacity_gap: int,
        urgency: str,
        average_travel_distance_km: float,
        trend_direction: str = "RISING",
        custom_weights: Dict[str, float] = None
    ) -> Dict[str, Any]:
        weights = custom_weights or self.DEFAULT_WEIGHTS

        # 1. Citizen Demand Score (max 25)
        # Scale: 1 citizen = 5 pts, 10 citizens = 15 pts, 50+ citizens = 25 pts
        raw_demand = min(1.0, (unique_citizens * 0.05) + (total_submissions * 0.01))
        demand_score = round(raw_demand * 100 * weights["citizen_demand"], 1)

        # 2. Population Impact Score (max 20)
        # Scale: <500 = 5 pts, 1000 = 10 pts, 5000+ = 20 pts
        raw_pop = min(1.0, population_affected / 5000.0)
        pop_score = round(raw_pop * 100 * weights["population_impact"], 1)

        # 3. Infrastructure Gap Score (max 20)
        # Scale: capacity gap relative to travel distance
        gap_factor = min(1.0, (capacity_gap / 1000.0) + (average_travel_distance_km / 10.0))
        gap_score = round(gap_factor * 100 * weights["infrastructure_gap"], 1)

        # 4. Urgency / Safety Score (max 15)
        urgency_map = {"CRITICAL": 1.0, "HIGH": 0.8, "MEDIUM": 0.5, "LOW": 0.2}
        urg_factor = urgency_map.get(urgency.upper(), 0.5)
        urg_score = round(urg_factor * 100 * weights["urgency_safety"], 1)

        # 5. Geographic Equity Score (max 10)
        # Distant/underserved areas (higher travel distance) receive higher equity score
        equity_factor = min(1.0, average_travel_distance_km / 8.0)
        equity_score = round(equity_factor * 100 * weights["geographic_equity"], 1)

        # 6. Trend / Recurrence Score (max 5)
        trend_map = {"RISING": 1.0, "STABLE": 0.6, "DECLINING": 0.3}
        trend_factor = trend_map.get(trend_direction.upper(), 0.6)
        trend_score = round(trend_factor * 100 * weights["trend_recurrence"], 1)

        # 7. Feasibility Score (max 5)
        feasibility_score = round(0.8 * 100 * weights["feasibility"], 1)

        total_score = round(
            demand_score + pop_score + gap_score + urg_score + equity_score + trend_score + feasibility_score,
            1
        )

        return {
            "total_score": min(100.0, total_score),
            "max_score": 100.0,
            "score_breakdown": {
                "citizen_demand": demand_score,
                "population_impact": pop_score,
                "infrastructure_gap": gap_score,
                "urgency_safety": urg_score,
                "geographic_equity": equity_score,
                "trend_recurrence": trend_score,
                "feasibility": feasibility_score,
            },
            "weights_applied": weights,
        }

priority_scorer = DeterministicPriorityScorer()
