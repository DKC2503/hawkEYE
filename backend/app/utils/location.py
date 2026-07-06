import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("hawkEYE.utils.location")

def extract_report_location(report_doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extracts and normalizes location data from a hawkEYE report Firestore document.
    
    Reads actual hawkEYE Firestore schema and extracts:
    - latitude (float)
    - longitude (float)
    - area (str)
    - address (str)
    
    Logs which schema path successfully produced the coordinates for backend diagnostics.
    Preserves full precision float values for latitude and longitude.
    """
    if not isinstance(report_doc, dict):
        logger.warning("extract_report_location received non-dict payload.")
        return {
            "latitude": None,
            "longitude": None,
            "area": None,
            "address": None,
            "is_valid": False,
            "schema_path": "invalid_payload"
        }

    loc = report_doc.get("location")
    coords = report_doc.get("coordinates")

    lat: Optional[float] = None
    lng: Optional[float] = None
    matched_path: Optional[str] = None

    # 1. Inspect location dict
    if isinstance(loc, dict):
        if loc.get("latitude") is not None and loc.get("longitude") is not None:
            lat = loc.get("latitude")
            lng = loc.get("longitude")
            matched_path = "location.latitude / location.longitude"
        elif loc.get("lat") is not None and loc.get("lng") is not None:
            lat = loc.get("lat")
            lng = loc.get("lng")
            matched_path = "location.lat / location.lng"

    # 2. Inspect coordinates dict
    if lat is None and isinstance(coords, dict):
        if coords.get("latitude") is not None and coords.get("longitude") is not None:
            lat = coords.get("latitude")
            lng = coords.get("longitude")
            matched_path = "coordinates.latitude / coordinates.longitude"
        elif coords.get("lat") is not None and coords.get("lng") is not None:
            lat = coords.get("lat")
            lng = coords.get("lng")
            matched_path = "coordinates.lat / coordinates.lng"

    # 3. Inspect top-level keys
    if lat is None:
        if report_doc.get("latitude") is not None and report_doc.get("longitude") is not None:
            lat = report_doc.get("latitude")
            lng = report_doc.get("longitude")
            matched_path = "top_level.latitude / top_level.longitude"
        elif report_doc.get("lat") is not None and report_doc.get("lng") is not None:
            lat = report_doc.get("lat")
            lng = report_doc.get("lng")
            matched_path = "top_level.lat / top_level.lng"

    # Convert coordinates to float while preserving precision
    float_lat: Optional[float] = None
    float_lng: Optional[float] = None

    if lat is not None:
        try:
            float_lat = float(lat)
        except (ValueError, TypeError):
            float_lat = None

    if lng is not None:
        try:
            float_lng = float(lng)
        except (ValueError, TypeError):
            float_lng = None

    # Determine coordinate validity (non-None, non-zero)
    is_valid = False
    if float_lat is not None and float_lng is not None:
        if abs(float_lat) > 0.0001 or abs(float_lng) > 0.0001:
            is_valid = True
            logger.info(f"Report location successfully extracted via schema path '{matched_path}': ({float_lat}, {float_lng})")
        else:
            logger.warning(f"Report coordinates ({float_lat}, {float_lng}) evaluated to zero (schema path: '{matched_path}'). Marked invalid.")
    else:
        logger.warning("No valid numeric coordinates found in report document.")

    # 4. Extract Area / Locality
    area: Optional[str] = None
    if isinstance(loc, dict):
        area = loc.get("area") or loc.get("locality")
    if not area and isinstance(coords, dict):
        area = coords.get("area") or coords.get("locality")
    if not area:
        area = report_doc.get("area") or report_doc.get("locality")

    # 5. Extract Formatted Address / Display Name
    address: Optional[str] = None
    if isinstance(loc, dict):
        address = loc.get("displayName") or loc.get("formattedAddress") or loc.get("address")
    if not address and isinstance(coords, dict):
        address = coords.get("displayName") or coords.get("formattedAddress") or coords.get("address")
    if not address:
        address = report_doc.get("displayName") or report_doc.get("formattedAddress") or report_doc.get("address")

    return {
        "latitude": float_lat if is_valid else None,
        "longitude": float_lng if is_valid else None,
        "area": area or (address if address else None),
        "address": address or (area if area else None),
        "is_valid": is_valid,
        "schema_path": matched_path or "none"
    }
