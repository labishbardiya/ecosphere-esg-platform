from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    DATABASE_URL: str = Field(default="postgresql://postgres:postgres@localhost:5432/ecosphere_social")
    JWT_SECRET: str = Field(default="supersecretjwtkeyforprodreplaceinproduction")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    
    # AWS S3 Storage Config (leave empty to fallback to local file system storage)
    AWS_ACCESS_KEY_ID: Optional[str] = Field(default=None)
    AWS_SECRET_ACCESS_KEY: Optional[str] = Field(default=None)
    AWS_REGION: str = Field(default="us-east-1")
    AWS_BUCKET_NAME: Optional[str] = Field(default=None)
    
    LOG_LEVEL: str = Field(default="INFO")

settings = Settings()
