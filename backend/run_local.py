#!/usr/bin/env python
"""
Local development startup script for EcoSphere Social Module.
Runs without Docker, PostgreSQL, or Redis by using SQLite.
"""
import os
import sys
import subprocess

def main():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)

    # Create a .env file for local SQLite development if it doesn't exist
    env_file = os.path.join(backend_dir, ".env")
    if not os.path.exists(env_file):
        print("Creating .env file for local SQLite development...")
        with open(env_file, "w") as f:
            f.write("DATABASE_URL=sqlite:///./ecosphere_social.db\n")
            f.write("JWT_SECRET=supersecretjwtkeyforprodreplaceinproduction\n")
            f.write("JWT_ALGORITHM=HS256\n")
            f.write("ACCESS_TOKEN_EXPIRE_MINUTES=60\n")
            f.write("REDIS_URL=redis://localhost:6379/0\n")
            f.write("LOG_LEVEL=INFO\n")
        print("Created .env with SQLite configuration.")

    # Create all database tables directly using SQLAlchemy
    print("\n--- Initializing SQLite database ---")
    sys.path.insert(0, backend_dir)
    
    from app.database.base import Base
    from app.core.config import settings

    if settings.DATABASE_URL.startswith("sqlite"):
        from sqlalchemy import create_engine
        engine = create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False}
        )
        Base.metadata.create_all(bind=engine)
        print(f"Database tables created successfully at: {settings.DATABASE_URL}")
        engine.dispose()
    else:
        print(f"Using non-SQLite database: {settings.DATABASE_URL}")
        print("Make sure the database is running and run 'alembic upgrade head'.")

    # Create uploads directory
    os.makedirs("uploads", exist_ok=True)

    # Start the FastAPI server
    print("\n--- Starting EcoSphere Social Module API ---")
    print("Swagger UI:  http://localhost:8000/docs")
    print("ReDoc:       http://localhost:8000/redoc")
    print("Health:      http://localhost:8000/health")
    print("Press Ctrl+C to stop.\n")

    venv_python = os.path.join(backend_dir, "venv", "Scripts", "uvicorn.exe")
    if os.path.exists(venv_python):
        subprocess.run([venv_python, "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"])
    else:
        subprocess.run([sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"])

if __name__ == "__main__":
    main()
