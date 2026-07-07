from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback
import logging

from app.core.config import settings
from app.api.vision import router as vision_router
from app.api.issues import router as issues_router
from app.api.workers import router as workers_router
from app.api.employees import router as employees_router
from app.api.artisan import router as artisan_router, authority_router
from app.api.development import router as development_router
from app.api.auth_dep import get_current_citizen, AuthenticatedCitizen

logger = logging.getLogger("hawkEYE.main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="hawkEYE Citizen Civic Issue Neural Vision & Issues API",
    docs_url="/docs",
    redoc_url="/redoc",
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception in API request: {str(exc)}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"success": False, "detail": f"Internal Server Error: {str(exc)}"},
    )

allowed_origins = [
    "https://hawkeye-28df9.web.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5176",
]

if settings.FRONTEND_CORS_ORIGIN:
    env_origins = settings.FRONTEND_CORS_ORIGIN.split(",")
    for env_origin in env_origins:
        stripped = env_origin.strip().rstrip("/")
        if stripped:
            allowed_origins.append(stripped)

origins = list(dict.fromkeys(allowed_origins))

print(f"INFO:     CORS Allowed Origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(vision_router)
app.include_router(issues_router)
app.include_router(workers_router)
app.include_router(employees_router)
app.include_router(artisan_router)
app.include_router(authority_router)
app.include_router(development_router)

@app.get("/api/auth/check", tags=["Auth Diagnostic"])
def auth_check(citizen: AuthenticatedCitizen = Depends(get_current_citizen)):
    return {
        "authenticated": True,
        "message": "Firebase identity token successfully verified by backend Firebase Admin SDK.",
    }

@app.get("/", tags=["Health"])
@app.get("/health", tags=["Health"])
def health_check():
    has_gemini = bool(settings.GEMINI_API_KEY)
    has_cloudinary = bool(settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET)
    has_resend = bool(settings.RESEND_API_KEY)
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "gemini_model": settings.GEMINI_MODEL,
        "api_key_configured": has_gemini,
        "cloudinary_configured": has_cloudinary,
        "firebase_project_id": settings.FIREBASE_PROJECT_ID,
        "resend_email_configured": has_resend,
    }
