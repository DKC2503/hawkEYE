import logging
from pathlib import Path
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth
from app.core.config import settings

logger = logging.getLogger("hawkEYE.firebase_admin")

_firebase_app = None

def get_firebase_app():
    global _firebase_app
    if not firebase_admin._apps:
        sa_path = settings.FIREBASE_SERVICE_ACCOUNT_PATH
        sa_exists = bool(sa_path and Path(sa_path).exists())

        try:
            if sa_exists:
                cred = credentials.Certificate(sa_path)
                _firebase_app = firebase_admin.initialize_app(cred, {'projectId': settings.FIREBASE_PROJECT_ID})
                logger.info(f"Firebase Admin SDK initialized with Service Account JSON from '{sa_path}'")
            else:
                # Initialize with project ID
                options = {'projectId': settings.FIREBASE_PROJECT_ID}
                _firebase_app = firebase_admin.initialize_app(options=options)
                logger.info(f"Firebase Admin SDK initialized with default credentials for project '{settings.FIREBASE_PROJECT_ID}'")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin SDK: {str(e)}")
            raise e
    else:
        _firebase_app = firebase_admin.get_app()
    return _firebase_app

def get_firestore_client():
    get_firebase_app()
    return firestore.client()
