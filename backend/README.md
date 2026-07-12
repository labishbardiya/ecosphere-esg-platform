# EcoSphere ESG Management Platform — Social Module Backend

A production-ready, scalable backend service for the **EcoSphere Social Module**. It manages Employee Wellbeing Challenges, Activity Logging, Peer-to-Peer Verification, Weekly Streaks, and Points systems. Built with FastAPI, SQLAlchemy 2.0, PostgreSQL, Celery, Redis, and Docker.

---

## 🏗️ Architecture & Folder Structure

This project follows **Clean Architecture** and SOLID principles to separate concerns, improve maintainability, and ensure scalability.

```text
backend/
│
├── app/
│   ├── api/             # HTTP route controller endpoints
│   ├── core/            # App configurations, security functions, logging configurations
│   ├── database/        # Engine sessions setup, Base declarations
│   ├── dependencies/    # FastAPI dependency injectors (get_db, current_user, roles)
│   ├── exceptions/      # Core exception classes and custom handlers
│   ├── middleware/      # Performance monitoring and request logging middleware
│   ├── models/          # SQLAlchemy 2.0 DB models
│   ├── repositories/    # Database query abstractions (Repository Pattern)
│   ├── schemas/         # Pydantic v2 schemas for validations and serializations
│   ├── services/        # Business logic orchestration and S3 integrations
│   ├── workers/         # Celery tasks and scheduling definitions
│   └── main.py          # FastAPI application bootstrap file
│
├── migrations/          # Alembic migrations history
├── tests/               # Pytest testing suite
├── Dockerfile           # App build image
├── docker-compose.yml   # Multi-service local ecosystem (DB, Redis, Celery, App)
├── requirements.txt     # Python pinned dependencies
├── .env.example         # System configurations variables blueprint
└── README.md            # System documentation
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Environment Key | Description |
|---|---|
| `DATABASE_URL` | SQLAlchemy connection string to PostgreSQL |
| `JWT_SECRET` | Secret key used to encrypt and validate JWT tokens |
| `JWT_ALGORITHM` | Hashing algorithm for JWT (e.g., HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry duration (default: 60 minutes) |
| `REDIS_URL` | Redis URL for Celery message broker and result backend |
| `AWS_ACCESS_KEY_ID` | (Optional) AWS access key. If empty, falls back to local storage |
| `AWS_SECRET_ACCESS_KEY` | (Optional) AWS secret key. If empty, falls back to local storage |
| `AWS_REGION` | AWS region name for AWS S3 bucket |
| `AWS_BUCKET_NAME` | (Optional) AWS S3 bucket name for uploads |
| `LOG_LEVEL` | Logging verbosity (DEBUG, INFO, WARNING, ERROR) |

---

## 🐳 Docker Deployment Guide

The platform is designed to be fully containerized. A single command spawns the FastAPI server, PostgreSQL, Redis, Celery worker, and Celery beat scheduler.

### Bootstrapping Services

1. Build and start the environment:
   ```bash
   docker-compose up --build -d
   ```
2. Verify services are running:
   ```bash
   docker-compose ps
   ```
3. Check application server logs:
   ```bash
   docker-compose logs -f web
   ```

To shut down the services and delete volumes:
```bash
docker-compose down -v
```

---

## 💻 Local Manual Setup

For development or testing without Docker, configure a local environment:

### Prerequisites

- Python 3.12+
- PostgreSQL
- Redis

### Installation

1. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables inside a `.env` file (e.g., pointing to your local Postgres and Redis databases).

### Database Migrations

Use Alembic to initialize or upgrade the database:
```bash
alembic upgrade head
```

### Running the Application

1. Start the FastAPI application:
   ```bash
   uvicorn app.main:app --reload
   ```
2. Start the Celery Worker (in a separate terminal):
   ```bash
   celery -A app.workers.celery_app worker --loglevel=info
   ```
3. Start the Celery Beat Scheduler (in a separate terminal):
   ```bash
   celery -A app.workers.celery_app beat --loglevel=info
   ```

---

## 🧪 Testing Instructions

Tests are run on an independent in-memory SQLite database using `pytest`.

Run the test suite with test coverage reporting:
```bash
pytest -v --cov=app tests/
```

Expected output includes detailed unit and integration tests passing for:
- Authentication & JWT
- Challenge management CRUD
- S3 image verification & uploads
- Peer verification transactions
- Dashboard metric computations
- Weekly streak background worker

---

## 📖 API Documentation & Swagger

Once the FastAPI application starts, documentation is available at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## ⚡ Feature Mechanics

### 1. Peer-to-Peer Verification
When `/api/social/vouch` is called, a transaction block:
1. Validates the vouching identity against the JWT.
2. Assures no self-vouching or double-vouching occurs.
3. Increments the `vouch_count` for the participation.
4. On the 3rd vouch, changes `approval_status` to `"Approved"` and increments the employee's user points by 10.
5. Rolls back the transaction on any database failure.

### 2. Weekly Streak Reward Engine
Celery Beat triggers `weekly_streak_reward_task` every Sunday at 11:59 PM.
1. Checks the last 7 days of `ActivityLog` entries.
2. Group by employee, filtering for employees with activities logged on at least **5 distinct days** in the week.
3. Inserts an approved `EmployeeParticipation` record awarding **50 points**.
4. Writes to the `StreakRewardLog` table to guarantee idempotency and prevent duplicate streak payments.
