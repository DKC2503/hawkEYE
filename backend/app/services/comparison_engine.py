import logging
from typing import List, Dict, Any
from app.schemas.intelligence import DevelopmentProposal

logger = logging.getLogger("hawkEYE.comparison_engine")

class ProposalComparisonEngine:
    """
    Objective comparison engine for evaluating competing development proposals.
    Provides side-by-side metric tables and transparent ranking rationale.
    """

    def compare_proposals(self, proposal_a: DevelopmentProposal, proposal_b: DevelopmentProposal) -> Dict[str, Any]:
        higher_proposal = proposal_a if proposal_a.priority_score >= proposal_b.priority_score else proposal_b
        lower_proposal = proposal_b if proposal_a.priority_score >= proposal_b.priority_score else proposal_a

        diff_points = round(higher_proposal.priority_score - lower_proposal.priority_score, 1)

        reasons = []
        if higher_proposal.unique_citizens > lower_proposal.unique_citizens:
            reasons.append(f"Higher citizen demand ({higher_proposal.unique_citizens} unique requests vs {lower_proposal.unique_citizens}).")
        if higher_proposal.affected_population > lower_proposal.affected_population:
            reasons.append(f"Broader population impact ({higher_proposal.affected_population} residents affected vs {lower_proposal.affected_population}).")
        if higher_proposal.average_travel_distance_km > lower_proposal.average_travel_distance_km:
            reasons.append(f"Greater accessibility gap (citizens travel {higher_proposal.average_travel_distance_km} km vs {lower_proposal.average_travel_distance_km} km).")

        rationale = f"'{higher_proposal.title}' ranks higher (+{diff_points} pts) because it demonstrates: " + " ".join(reasons)

        comparison_matrix = [
            {
                "metric": "Priority Score",
                "proposal_a_val": f"{proposal_a.priority_score} / 100",
                "proposal_b_val": f"{proposal_b.priority_score} / 100",
                "winner": "A" if proposal_a.priority_score >= proposal_b.priority_score else "B",
            },
            {
                "metric": "Unique Citizen Requests",
                "proposal_a_val": str(proposal_a.unique_citizens),
                "proposal_b_val": str(proposal_b.unique_citizens),
                "winner": "A" if proposal_a.unique_citizens >= proposal_b.unique_citizens else "B",
            },
            {
                "metric": "Affected Population Impact",
                "proposal_a_val": f"{proposal_a.affected_population:,} residents",
                "proposal_b_val": f"{proposal_b.affected_population:,} residents",
                "winner": "A" if proposal_a.affected_population >= proposal_b.affected_population else "B",
            },
            {
                "metric": "Capacity Infrastructure Gap",
                "proposal_a_val": f"{proposal_a.capacity_gap} units",
                "proposal_b_val": f"{proposal_b.capacity_gap} units",
                "winner": "A" if proposal_a.capacity_gap >= proposal_b.capacity_gap else "B",
            },
            {
                "metric": "Average Travel Distance",
                "proposal_a_val": f"{proposal_a.average_travel_distance_km} km",
                "proposal_b_val": f"{proposal_b.average_travel_distance_km} km",
                "winner": "A" if proposal_a.average_travel_distance_km >= proposal_b.average_travel_distance_km else "B",
            },
        ]

        return {
            "proposal_a": proposal_a.model_dump(),
            "proposal_b": proposal_b.model_dump(),
            "recommended_winner_id": higher_proposal.proposal_id,
            "score_difference": diff_points,
            "comparison_matrix": comparison_matrix,
            "objective_rationale": rationale,
        }

proposal_comparison_engine = ProposalComparisonEngine()
