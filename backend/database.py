import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables from .env file
load_dotenv()

# Retrieve database connection string
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # If DATABASE_URL is not set, we default to the Supabase Postgres direct connection string format.
    # Note: User must replace [YOUR_PASSWORD] with their actual Supabase database password.
    DATABASE_URL = "postgresql://postgres:[YOUR_PASSWORD]@db.lxpjgedkctdekfcupcdm.supabase.co:5432/postgres"

# SQLAlchemy compatibility fix for PostgreSQL URL scheme
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine and session maker
engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,  # Automatically checks connection health and reconnects
    connect_args={"connect_timeout": 5}  # Fast fail on database connection issues
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# FastAPI Dependency to yield database sessions per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
