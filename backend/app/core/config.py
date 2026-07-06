import os
import logging
from pathlib import Path
from dotenv import load_dotenv, dotenv_values

logger = logging.getLogger("hawkEYE.config")

# 1. Resolve absolute path to backend/.env based on config.py location
backend_dir = Path(__file__).resolve().parent.parent.parent
env_path = (backend_dir / ".env").resolve()

# 2. Force load key-value pairs from backend/.env into os.environ
env_exists = env_path.exists()
if env_exists:
    load_dotenv(dotenv_path=env_path, override=True)
    file_vals = dotenv_values(env_path)
    for k, v in file_vals.items():
        if v is not None and v.strip():
            os.environ[k] = v.strip()

class Settings:
    PROJECT_NAME: str = "hawkEYE Vision & Issues API"
    VERSION: str = "1.0.0"

    BACKEND_DIR: Path = backend_dir
    ENV_FILE_PATH: Path = env_path

    # Gemini Configuration
    @property
    def GEMINI_API_KEY(self) -> str:
        return os.getenv("GEMINI_API_KEY", "").strip()

    @property
    def GEMINI_MODEL(self) -> str:
        return os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

    # Cloudinary Configuration
    @property
    def CLOUDINARY_CLOUD_NAME(self) -> str:
        return os.getenv("CLOUDINARY_CLOUD_NAME", "").strip()

    @property
    def CLOUDINARY_API_KEY(self) -> str:
        return os.getenv("CLOUDINARY_API_KEY", "").strip()

    @property
    def CLOUDINARY_API_SECRET(self) -> str:
        return os.getenv("CLOUDINARY_API_SECRET", "").strip()

    # Firebase Admin Configuration
    @property
    def FIREBASE_PROJECT_ID(self) -> str:
        return os.getenv("FIREBASE_PROJECT_ID", "hawkeye-28df9").strip()

    @property
    def FIREBASE_SERVICE_ACCOUNT_PATH(self) -> str:
        val = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "").strip()
        if val:
            p = Path(val)
            if not p.is_absolute():
                p = (self.BACKEND_DIR / p).resolve()
            if p.exists():
                return str(p)

        candidates = [
            self.BACKEND_DIR / "secrets" / "firebase-service-account.json",
            self.BACKEND_DIR / "secrets" / "firebase-service-account.json.json",
            self.BACKEND_DIR / "service-account.json",
        ]

        for cand in candidates:
            if cand.exists():
                return str(cand.resolve())

        return ""

    # SMTP Configuration
    @property
    def SMTP_EMAIL(self) -> str:
        return os.getenv("SMTP_EMAIL", "").strip()

    @property
    def SMTP_APP_PASSWORD(self) -> str:
        val = os.getenv("SMTP_APP_PASSWORD", "").strip()
        return val.replace(" ", "")  # Strip internal spaces if provided formatted as "abcd efgh ijkl mnop"

    @property
    def SMTP_HOST(self) -> str:
        return os.getenv("SMTP_HOST", "smtp.gmail.com").strip()

    @property
    def SMTP_PORT(self) -> int:
        try:
            return int(os.getenv("SMTP_PORT", "587").strip())
        except ValueError:
            return 587

    # Resend Email Configuration (Fallback)
    @property
    def RESEND_API_KEY(self) -> str:
        return os.getenv("RESEND_API_KEY", "").strip()

    @property
    def RESEND_FROM_EMAIL(self) -> str:
        return os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev").strip()

    # Allowed CORS Origins
    @property
    def FRONTEND_CORS_ORIGIN(self) -> str:
        return os.getenv("FRONTEND_CORS_ORIGIN", "http://localhost:5173").strip()

    # Validation Thresholds & Geolocation Radius
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.70"))
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
    ALLOWED_MIME_TYPES: set[str] = {"image/jpeg", "image/png", "image/webp"}
    DUPLICATE_SEARCH_RADIUS_METERS: float = float(os.getenv("DUPLICATE_SEARCH_RADIUS_METERS", "50.0"))

settings = Settings()

# Safe Startup Diagnostics (Print ONLY status, NEVER print secrets/keys)
has_gemini = bool(settings.GEMINI_API_KEY)
has_cloudinary = bool(settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET)
has_firebase_sa = bool(settings.FIREBASE_SERVICE_ACCOUNT_PATH and Path(settings.FIREBASE_SERVICE_ACCOUNT_PATH).exists())
has_smtp = bool(settings.SMTP_EMAIL and settings.SMTP_APP_PASSWORD)

print("=" * 60)
print(f"Environment file path: {env_path}")
print(f"Environment file exists: {'yes' if env_exists else 'no'}")
print(f"GEMINI_API_KEY configured: {'yes' if has_gemini else 'no'}")
print(f"Cloudinary credentials configured: {'yes' if has_cloudinary else 'no'}")
print(f"Firebase project ID: {settings.FIREBASE_PROJECT_ID}")
print(f"Firebase Service Account JSON present: {'yes' if has_firebase_sa else 'no'}")
if has_firebase_sa:
    print(f"Detected Service Account Path: {settings.FIREBASE_SERVICE_ACCOUNT_PATH}")
print(f"SMTP Email Delivery configured: {'yes' if has_smtp else 'no'}")
print(f"Duplicate Search Radius: {settings.DUPLICATE_SEARCH_RADIUS_METERS} meters")
print("=" * 60)
