from typing import Any, Dict, Optional

class CustomBaseException(Exception):
    def __init__(
        self, 
        message: str, 
        error_code: str, 
        details: Optional[Dict[str, Any]] = None, 
        status_code: int = 400
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        self.status_code = status_code
        super().__init__(message)

class ResourceNotFoundException(CustomBaseException):
    def __init__(self, message: str, error_code: str = "RESOURCE_NOT_FOUND", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, error_code, details, status_code=404)

class UnauthorizedException(CustomBaseException):
    def __init__(self, message: str, error_code: str = "UNAUTHORIZED", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, error_code, details, status_code=401)

class ForbiddenException(CustomBaseException):
    def __init__(self, message: str, error_code: str = "FORBIDDEN", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, error_code, details, status_code=403)

class DuplicateVerificationException(CustomBaseException):
    def __init__(self, message: str = "You have already verified this participation", error_code: str = "DUPLICATE_VERIFICATION", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, error_code, details, status_code=400)

class SelfVerificationException(CustomBaseException):
    def __init__(self, message: str = "Employees cannot verify their own participation", error_code: str = "SELF_VERIFICATION", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, error_code, details, status_code=400)

class InvalidFileUploadException(CustomBaseException):
    def __init__(self, message: str, error_code: str = "INVALID_FILE_UPLOAD", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, error_code, details, status_code=400)

class S3FailureException(CustomBaseException):
    def __init__(self, message: str, error_code: str = "S3_FAILURE", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, error_code, details, status_code=500)

class DatabaseException(CustomBaseException):
    def __init__(self, message: str, error_code: str = "DATABASE_FAILURE", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, error_code, details, status_code=500)
