import time
import urllib.parse
import sys
import psycopg2

# Add backend root to sys.path to enable app core imports if needed
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings

def wait_for_db():
    print("Checking database connection readiness...")
    
    # Parse the DATABASE_URL config dynamically
    try:
        url = urllib.parse.urlparse(settings.DATABASE_URL)
        host = url.hostname or "localhost"
        port = url.port or 5432
        user = url.username or "postgres"
        password = url.password or "postgres"
        dbname = url.path.lstrip("/") or "ecosphere_social"
    except Exception as parse_ex:
        print(f"Failed to parse database connection URL: {parse_ex}. Defaulting parameters.")
        host, port, user, password, dbname = "db", 5432, "postgres", "postgres", "ecosphere_social"

    retries = 30
    while retries > 0:
        try:
            print(f"Attempting to connect to PostgreSQL ({host}:{port}/{dbname}) as user '{user}'...")
            conn = psycopg2.connect(
                host=host,
                port=port,
                user=user,
                password=password,
                database=dbname,
                connect_timeout=2
            )
            conn.close()
            print("Successfully connected to the database. Ready for migrations.")
            return
        except psycopg2.OperationalError as e:
            print(f"Database not ready yet. Error: {e.args[0].strip()}. Retrying in 1s ({retries} retries left)...")
            retries -= 1
            time.sleep(1)
            
    print("Database connection timed out. Exiting with failure.")
    sys.exit(1)

if __name__ == "__main__":
    wait_for_db()
