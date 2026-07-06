import logging
import uuid
import cloudinary
import cloudinary.uploader
from app.core.config import settings

logger = logging.getLogger("hawkEYE.cloudinary_service")

class CloudinaryService:
    def __init__(self):
        self._configured = False

    def _ensure_configured(self):
        if not self._configured:
            cloud_name = settings.CLOUDINARY_CLOUD_NAME
            api_key = settings.CLOUDINARY_API_KEY
            api_secret = settings.CLOUDINARY_API_SECRET

            if not (cloud_name and api_key and api_secret):
                raise ValueError("CLOUDINARY_NOT_CONFIGURED: Cloudinary credentials missing in backend/.env")

            cloudinary.config(
                cloud_name=cloud_name,
                api_key=api_key,
                api_secret=api_secret,
                secure=True,
            )
            self._configured = True

    def upload_issue_image(self, file_bytes: bytes, file_name_prefix: str = "he_issue") -> dict:
        self._ensure_configured()

        unique_id = f"{file_name_prefix}_{uuid.uuid4().hex[:12]}"
        folder = "hawkeye/issues"

        try:
            response = cloudinary.uploader.upload(
                file_bytes,
                folder=folder,
                public_id=unique_id,
                resource_type="image",
                overwrite=True,
            )

            return {
                "secure_url": response.get("secure_url"),
                "public_id": response.get("public_id"),
                "width": response.get("width"),
                "height": response.get("height"),
                "format": response.get("format"),
                "bytes": response.get("bytes"),
            }
        except Exception as e:
            logger.error(f"Cloudinary upload failed: {str(e)}")
            raise e

    def upload_evidence_image(self, file_bytes: bytes, ticket_id: str, work_order_number: str) -> dict:
        self._ensure_configured()
        unique_id = f"after_{uuid.uuid4().hex[:12]}"
        folder = f"hawkeye/completion-evidence/{ticket_id}/{work_order_number}"

        try:
            response = cloudinary.uploader.upload(
                file_bytes,
                folder=folder,
                public_id=unique_id,
                resource_type="image",
                overwrite=True,
            )

            return {
                "secure_url": response.get("secure_url"),
                "public_id": response.get("public_id"),
                "width": response.get("width"),
                "height": response.get("height"),
                "format": response.get("format"),
                "bytes": response.get("bytes"),
            }
        except Exception as e:
            logger.error(f"Cloudinary evidence upload failed: {str(e)}")
            raise e

    def delete_issue_image(self, public_id: str) -> bool:
        try:
            self._ensure_configured()
            cloudinary.uploader.destroy(public_id, resource_type="image")
            logger.info(f"Orphan image '{public_id}' cleaned up from Cloudinary.")
            return True
        except Exception as e:
            logger.error(f"Failed to delete orphan Cloudinary image '{public_id}': {str(e)}")
            return False

cloudinary_service = CloudinaryService()
