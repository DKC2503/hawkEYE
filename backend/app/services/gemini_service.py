import logging
import json
from PIL import Image
from google import genai
from google.genai import types
from google.genai.errors import APIError
from app.core.config import settings
from app.schemas.vision import VisionAnalysisResponse, CivicCategory, CivicSeverity

logger = logging.getLogger("hawkEYE.gemini_service")

HAWKEYE_VISION_SYSTEM_INSTRUCTION = """
You are hawkEYE Vision, an AI system for analyzing citizen-reported civic problems.
Your job is to analyze citizen-submitted images for visible civic and public-infrastructure issues.

Analyze ONLY what is visibly supported by the image.

Do NOT invent:
- location
- cause
- measurements
- department
- danger level that cannot reasonably be inferred

Rules:
- Keep the summary factual and under 25 words.
- If the image is unclear or visual evidence is weak, select category UNCERTAIN.
- If there is no visible civic issue, select category NOT_A_CIVIC_ISSUE.
- Never claim certainty when visual evidence is weak.
- Distinguish genuine civic problems from ordinary outdoor scenes.
"""

class VisionServiceError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 500):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class GeminiService:
    @property
    def api_key(self) -> str:
        return settings.GEMINI_API_KEY

    @property
    def model_name(self) -> str:
        return settings.GEMINI_MODEL

    def _get_client(self) -> genai.Client:
        key = self.api_key
        if not key or not key.strip():
            raise VisionServiceError(
                code="GEMINI_KEY_MISSING",
                message="GEMINI_API_KEY is missing or empty. Please configure a valid API key in backend/.env",
                status_code=503,
            )
        return genai.Client(api_key=key)

    def analyze_civic_image(self, image: Image.Image) -> VisionAnalysisResponse:
        client = self._get_client()

        prompt = "Analyze this uploaded image for visible civic or public infrastructure issues according to the hawkEYE Vision instructions."

        try:
            response = client.models.generate_content(
                model=self.model_name,
                contents=[image, prompt],
                config=types.GenerateContentConfig(
                    system_instruction=HAWKEYE_VISION_SYSTEM_INSTRUCTION,
                    response_mime_type="application/json",
                    response_schema=VisionAnalysisResponse,
                    temperature=0.2,
                ),
            )

            response_text = response.text
            if not response_text:
                raise VisionServiceError(
                    code="STRUCTURED_RESPONSE_ERROR",
                    message="Received empty response text from Gemini API.",
                    status_code=502,
                )

            try:
                raw_data = json.loads(response_text)
            except Exception as json_err:
                logger.error(f"Failed to parse Gemini response JSON: {str(json_err)}")
                raise VisionServiceError(
                    code="STRUCTURED_RESPONSE_ERROR",
                    message="Failed to parse structured JSON response from Gemini model.",
                    status_code=502,
                )

            try:
                analysis = VisionAnalysisResponse(**raw_data)
            except Exception as val_err:
                logger.error(f"Pydantic schema validation failure: {str(val_err)}")
                raise VisionServiceError(
                    code="VALIDATION_ERROR",
                    message="AI model output failed Pydantic schema validation.",
                    status_code=422,
                )

            return self.apply_consistency_rules(analysis)

        except APIError as api_err:
            logger.error(f"Google Gen AI APIError [{api_err.code}]: {api_err.message}")
            err_msg = api_err.message or ""

            if "API key not valid" in err_msg or "INVALID_ARGUMENT" in err_msg or api_err.code == 400:
                raise VisionServiceError(
                    code="GEMINI_AUTH_ERROR",
                    message="Gemini API Key is invalid or unauthorized. Please verify GEMINI_API_KEY in backend/.env.",
                    status_code=400,
                )
            elif api_err.code == 429 or "RESOURCE_EXHAUSTED" in err_msg:
                raise VisionServiceError(
                    code="GEMINI_RATE_LIMIT",
                    message="Gemini API rate limit or quota exceeded. Please try again shortly.",
                    status_code=429,
                )
            elif api_err.code == 404 or "NOT_FOUND" in err_msg:
                raise VisionServiceError(
                    code="GEMINI_MODEL_ERROR",
                    message=f"Configured model '{self.model_name}' is not found or not accessible.",
                    status_code=404,
                )
            else:
                raise VisionServiceError(
                    code="GEMINI_API_ERROR",
                    message="Google Gemini API returned an error during vision analysis.",
                    status_code=500,
                )
        except VisionServiceError as vse:
            raise vse
        except Exception as e:
            logger.error(f"Unexpected Gemini Vision Analysis Error: {str(e)}", exc_info=True)
            raise VisionServiceError(
                code="UNKNOWN_ERROR",
                message="An unexpected error occurred during hawkEYE Vision analysis.",
                status_code=500,
            )

    @staticmethod
    def apply_consistency_rules(analysis: VisionAnalysisResponse) -> VisionAnalysisResponse:
        """
        Apply deterministic consistency rules to AI response before returning to client.
        """
        # Rule 1: If category is NOT_A_CIVIC_ISSUE, is_civic_issue MUST be False
        if analysis.category == CivicCategory.NOT_A_CIVIC_ISSUE:
            analysis.is_civic_issue = False

        # Rule 2: If category is UNCERTAIN, needs_human_review MUST be True
        if analysis.category == CivicCategory.UNCERTAIN:
            analysis.needs_human_review = True

        # Rule 3: If confidence is below threshold, needs_human_review MUST be True
        if analysis.confidence < settings.CONFIDENCE_THRESHOLD:
            analysis.needs_human_review = True

        return analysis

gemini_service = GeminiService()
