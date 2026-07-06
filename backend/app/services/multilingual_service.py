import logging
import json
from typing import Optional, Dict, Any
from google import genai
from google.genai import types
from app.core.config import settings
from app.schemas.intelligence import MultilingualAnalysisResult

logger = logging.getLogger("hawkEYE.multilingual_service")

MULTILINGUAL_INTAKE_SYSTEM_INSTRUCTION = """
You are hawkEYE Multilingual Intelligence Engine for municipal civic issues & development suggestions.
Your task is to analyze citizen submissions in any language (including Telugu, Hindi, English).

Instructions:
1. Detect the original language code (e.g., 'te' for Telugu, 'hi' for Hindi, 'en' for English).
2. Preserve the exact original input text.
3. Translate and normalize the input into clear, structured English for internal municipal database analysis.
4. Classify submissionType into 'ISSUE_REPORT' (physical problem like pothole, leak, broken light) or 'DEVELOPMENT_SUGGESTION' (strategic request like new school, healthcare centre, bus route, park, water pipeline).
5. Classify domain into one of: 'EDUCATION', 'HEALTHCARE', 'ROADS', 'WATER_SUPPLY', 'PUBLIC_TRANSPORT', 'SANITATION', 'DRAINAGE', 'WASTE_MANAGEMENT', 'STREET_LIGHTING', 'HOUSING', 'EMPLOYMENT', 'VOCATIONAL_TRAINING', 'PUBLIC_SAFETY', 'PARKS_RECREATION', 'ACCESSIBILITY', 'OTHER'.
6. Extract urgency ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') and estimate affected population count.
7. Provide a brief factual AI summary in English (under 25 words).
8. Generate a polite, empathetic confirmation response for the citizen in their ORIGINAL language.
"""

class MultilingualIntakeService:
    def _get_client(self) -> genai.Client:
        key = settings.GEMINI_API_KEY
        if not key:
            raise RuntimeError("GEMINI_API_KEY missing in settings.")
        return genai.Client(api_key=key)

    def analyze_submission(
        self,
        input_text: str,
        submission_type_hint: str = "DEVELOPMENT_SUGGESTION",
        language_hint: Optional[str] = None
    ) -> MultilingualAnalysisResult:
        client = self._get_client()

        user_prompt = f"""
        Citizen Input Text: "{input_text}"
        Submission Type Hint: {submission_type_hint}
        Language Hint: {language_hint or 'Auto-detect'}

        Analyze this input according to the instructions and return structured JSON matching the schema.
        """

        try:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=[user_prompt],
                config=types.GenerateContentConfig(
                    system_instruction=MULTILINGUAL_INTAKE_SYSTEM_INSTRUCTION,
                    response_mime_type="application/json",
                    response_schema=MultilingualAnalysisResult,
                    temperature=0.2,
                ),
            )

            raw_text = response.text
            if not raw_text:
                raise ValueError("Empty response text from Gemini.")

            data = json.loads(raw_text)
            return MultilingualAnalysisResult(**data)
        except Exception as err:
            logger.error(f"[MULTILINGUAL INTAKE ERROR] {str(err)}. Falling back to deterministic parser.")
            # Fallback parser if LLM API call fails
            is_telugu = any('\u0c00' <= char <= '\u0c7f' for char in input_text)
            is_hindi = any('\u0900' <= char <= '\u097f' for char in input_text)
            lang = "te" if is_telugu else ("hi" if is_hindi else "en")

            text_lower = input_text.lower()
            domain = "ROADS"
            if "school" in text_lower or "badi" in text_lower or "చదువు" in text_lower or "స్కూల్" in text_lower:
                domain = "EDUCATION"
            elif "hospital" in text_lower or "health" in text_lower or "వైద్యం" in text_lower or "దావఖానా" in text_lower:
                domain = "HEALTHCARE"
            elif "water" in text_lower or "leak" in text_lower or "నీరు" in text_lower or "మంచినీళ్లు" in text_lower:
                domain = "WATER_SUPPLY"
            elif "bus" in text_lower or "transport" in text_lower or "బస్సు" in text_lower:
                domain = "PUBLIC_TRANSPORT"

            confirm_msg = "ధన్యవాదాలు! మీ వినతి నమోదైంది." if lang == "te" else ("धन्यवाद! आपका सुझाव दर्ज कर लिया गया है।" if lang == "hi" else "Thank you! Your feedback has been recorded.")

            return MultilingualAnalysisResult(
                detected_language=lang,
                original_text=input_text,
                normalized_english_text=input_text,
                translation_confidence=0.85,
                submission_type=submission_type_hint,
                domain=domain,
                category=domain.lower(),
                urgency="MEDIUM",
                affected_population_estimate=150,
                ai_summary=input_text[:100],
                citizen_response_in_original_lang=confirm_msg,
            )

multilingual_service = MultilingualIntakeService()
