import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core.config import settings
from app.core.logging import setup_logging
from app.exceptions.exceptions import CustomBaseException
from app.exceptions.handlers import (
    custom_exception_handler,
    validation_exception_handler,
    integrity_exception_handler,
    database_exception_handler,
    global_exception_handler,
)
from app.middleware.middleware import LoggingMiddleware
from app.api import auth, challenges, activities, verifications, dashboard

# Setup Structured JSON logging
setup_logging()

app = FastAPI(
    title="EcoSphere ESG Platform - Social Module API",
    description="Production-ready backend API for Employee Wellbeing Challenges, Streaks, Points, and Peer Verification.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change to specific domains in production settings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Logging middleware
app.add_middleware(LoggingMiddleware)

# Custom error formatting exception handlers
app.add_exception_handler(CustomBaseException, custom_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(IntegrityError, integrity_exception_handler)
app.add_exception_handler(SQLAlchemyError, database_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Fallback local upload directory mount for serving proofs without AWS S3 config
os.makedirs("uploads", exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include sub-routers
app.include_router(auth.router)
app.include_router(challenges.router)
app.include_router(activities.router)
app.include_router(verifications.router)
app.include_router(dashboard.router)

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "ecosphere-social-module"}
