import logging
import json
from pathlib import Path
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth
from app.core.config import settings

logger = logging.getLogger("hawkEYE.firebase_admin")

_firebase_app = None

def get_firebase_app():
    global _firebase_app
    if not firebase_admin._apps:
        sa_json_str = settings.FIREBASE_SERVICE_ACCOUNT_JSON
        sa_path = settings.FIREBASE_SERVICE_ACCOUNT_PATH
        sa_exists = bool(sa_path and Path(sa_path).exists())

        if not sa_json_str and not sa_exists:
            msg = f"FATAL: Firebase Service Account JSON file not found!settings.FIREBASE_SERVICE_ACCOUNT_PATH resolved to '{sa_path or 'None'}'. Startup aborted."
            logger.critical(msg)
            raise RuntimeError(msg)

        try:
            if sa_json_str:
                parsed_credentials = json.loads(sa_json_str)
                cred = credentials.Certificate(parsed_credentials)
                # Initialize WITHOUT overriding projectId, let it infer from JSON
                _firebase_app = firebase_admin.initialize_app(cred)
                project_id = parsed_credentials.get("project_id", "UNKNOWN")
                
                # SAFE STARTUP DIAGNOSTICS (No secrets)
                print(f"[STARTUP] FIREBASE_SERVICE_ACCOUNT_JSON present: True")
                print(f"[STARTUP] Firebase Admin initialized: True")
                print(f"[STARTUP] Firestore client initialized: True")
                print(f"[STARTUP] Firebase project_id from parsed JSON: {project_id}")
                logger.info(f"Firebase Admin SDK initialized directly from JSON for project '{project_id}'")
            else:
                cred = credentials.Certificate(sa_path)
                # Local dev can still use the path
                _firebase_app = firebase_admin.initialize_app(cred, {'projectId': settings.FIREBASE_PROJECT_ID})
                
                print(f"[STARTUP] FIREBASE_SERVICE_ACCOUNT_JSON present: False")
                print(f"[STARTUP] Firebase Admin initialized: True")
                print(f"[STARTUP] Firestore client initialized: True")
                logger.info(f"Firebase Admin SDK initializing with Service Account JSON from '{sa_path}'")
                
        except json.JSONDecodeError as je:
            print(f"[STARTUP ERROR] JSONDecodeError parsing FIREBASE_SERVICE_ACCOUNT_JSON: {str(je)}")
            logger.critical(f"FATAL: JSONDecodeError parsing FIREBASE_SERVICE_ACCOUNT_JSON: {str(je)}")
            raise je
        except Exception as e:
            exc_type = type(e).__name__
            print(f"[STARTUP ERROR] {exc_type} initializing Firebase Admin: {str(e)}")
            logger.critical(f"FATAL: {exc_type} Failed to initialize Firebase Admin SDK: {str(e)}")
            raise e
    else:
        _firebase_app = firebase_admin.get_app()
    return _firebase_app

def get_firestore_client():
    get_firebase_app()
    return firestore.client()

# Fail fast immediately at module import time
get_firebase_app()
