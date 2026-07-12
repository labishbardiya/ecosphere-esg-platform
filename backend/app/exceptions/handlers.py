from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.exceptions.exceptions import CustomBaseException
from app.core.logging import logger

async def custom_exception_handler(request: Request, exc: CustomBaseException):
    logger.error(
        "custom_exception",
        path=request.url.path,
        error_code=exc.error_code,
        message=exc.message,
        details=exc.details,
        status_code=exc.status_code
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "error_code": exc.error_code,
            "details": exc.details
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = {}
    for error in exc.errors():
        # Get path of the invalid field
        loc = ".".join(str(x) for x in error.get("loc", []))
        details[loc] = error.get("msg")
    
    logger.error(
        "validation_exception",
        path=request.url.path,
        details=details
    )
    
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Validation Error",
            "error_code": "VALIDATION_ERROR",
            "details": details
        }
    )

async def integrity_exception_handler(request: Request, exc: IntegrityError):
    logger.error(
        "database_integrity_exception",
        path=request.url.path,
        error=str(exc)
    )
    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "message": "Database integrity constraint violation.",
            "error_code": "INTEGRITY_ERROR",
            "details": {}
        }
    )

async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(
        "database_exception",
        path=request.url.path,
        error=str(exc)
    )
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "A database error occurred.",
            "error_code": "DATABASE_ERROR",
            "details": {}
        }
    )

async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(
        "unhandled_exception",
        path=request.url.path,
        error=str(exc)
    )
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An unexpected error occurred.",
            "error_code": "INTERNAL_SERVER_ERROR",
            "details": {}
        }
    )
