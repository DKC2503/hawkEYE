import io
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from PIL import Image
from app.core.config import settings
from app.schemas.vision import VisionAnalysisResponse
from app.services.gemini_service import gemini_service, VisionServiceError

logger = logging.getLogger("hawkEYE.api.vision")
router = APIRouter(prefix="/api/vision", tags=["Vision Analysis"])

@router.post(
    "/analyze",
    response_model=VisionAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze citizen issue image with hawkEYE Vision AI",
)
async def analyze_image(file: UploadFile = File(...)):
    # Validation 1: Check file exists
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="[INVALID_IMAGE] No file was uploaded.",
        )

    # Validation 2: Check MIME type
    if file.content_type not in settings.ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"[INVALID_IMAGE] Unsupported file format '{file.content_type}'. Allowed formats: JPEG, PNG, WEBP.",
        )

    # Read file content into memory for validation & processing
    contents = await file.read()

    # Validation 3: Check file is not empty
    if not contents or len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="[INVALID_IMAGE] Uploaded file is empty (0 bytes).",
        )

    # Validation 4: Check max size
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"[INVALID_IMAGE] File size exceeds maximum limit of {settings.MAX_FILE_SIZE_MB}MB.",
        )

    # Validation 5: Decode image using Pillow
    try:
        image = Image.open(io.BytesIO(contents))
        image.verify()  # Verify header integrity
        image = Image.open(io.BytesIO(contents))  # Reopen after verify
    except Exception as e:
        logger.error(f"Image decode error for file {file.filename}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="[INVALID_IMAGE] Corrupted or invalid image file. Could not decode image content.",
        )

    # Validation 6: Check dimensions
    width, height = image.size
    if width < 50 or height < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="[INVALID_IMAGE] Image dimensions are too small (minimum 50x50 pixels required).",
        )

    # Call Gemini Service
    try:
        result = gemini_service.analyze_civic_image(image)
        return result
    except VisionServiceError as vse:
        logger.warning(f"VisionServiceError [{vse.code}]: {vse.message}")
        raise HTTPException(
            status_code=vse.status_code,
            detail=f"[{vse.code}] {vse.message}",
        )
    except Exception as exc:
        logger.error(f"Vision analysis endpoint unexpected exception: {str(exc)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="[UNKNOWN_ERROR] An unexpected internal error occurred while processing the vision request.",
        )
