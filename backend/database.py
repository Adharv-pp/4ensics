import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from config import DATABASE_URL, DATABASE_URL_WITHOUT_DB, DB_NAME

logger = logging.getLogger("DeepfakeDatabase")

# Engine for server-level operations (e.g. creating the database)
engine_no_db = create_engine(
    DATABASE_URL_WITHOUT_DB,
    pool_recycle=3600,
    pool_pre_ping=True
)

# Engine for application database operations
engine = create_engine(
    DATABASE_URL,
    pool_recycle=3600,
    pool_pre_ping=True,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """FastAPI dependency for database session management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def ensure_database_exists():
    """Ensure the target database exists in MySQL."""
    try:
        with engine_no_db.connect() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"))
            conn.commit()
            logger.info(f"Database `{DB_NAME}` verified/created successfully.")
    except Exception as e:
        logger.error(f"Error ensuring database exists: {e}")
        raise

def test_connection():
    """Tests MySQL connectivity and returns status."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            return {"connected": True, "result": result, "database": DB_NAME}
    except Exception as e:
        return {"connected": False, "error": str(e), "database": DB_NAME}
