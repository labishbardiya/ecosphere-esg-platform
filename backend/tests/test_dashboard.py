from fastapi import status
from app.models.models import User, ActivityLog, EmployeeParticipation, PeerVerification
from app.core.security import create_access_token
import uuid
from datetime import date, timedelta
import os
import shutil

def test_get_dashboard_success(client, db, test_employee, employee_headers, test_challenge):
    # Setup some approved and pending activities for the user
    # 1. Approved activity (has 3 vouches)
    act1 = ActivityLog(
        employee_id=test_employee.id,
        challenge_id=test_challenge.id,
        activity_type="Cycle",
        date_logged=date.today() - timedelta(days=2)
    )
    db.add(act1)
    db.flush()

    part1 = EmployeeParticipation(
        employee_id=test_employee.id,
        activity_id=act1.id,
        approval_status="Approved",
        points_earned=10,
        vouch_count=3
    )
    db.add(part1)

    # 2. Pending activity (has 1 vouch)
    act2 = ActivityLog(
        employee_id=test_employee.id,
        challenge_id=test_challenge.id,
        activity_type="Cycle",
        date_logged=date.today() - timedelta(days=1)
    )
    db.add(act2)
    db.flush()

    part2 = EmployeeParticipation(
        employee_id=test_employee.id,
        activity_id=act2.id,
        approval_status="Pending",
        points_earned=0,
        vouch_count=1
    )
    db.add(part2)

    # Credit 10 points to employee's user profile
    test_employee.points = 10
    db.commit()

    # Query dashboard
    response = client.get(f"/api/social/dashboard/{test_employee.id}", headers=employee_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total_points"] == 10
    assert data["approved_activities"] == 1
    assert data["pending_activities"] == 1
    assert data["current_weekly_streak"] == 0 # we haven't logged >= 5 days yet
    assert data["verification_statistics"]["vouches_received"] == 4 # 3 on part1, 1 on part2

def test_dashboard_unauthorized_access_fails(client, db, test_employee, test_admin):
    # Register another employee
    other_emp = User(
        email="other@ecosphere.com",
        hashed_password="hashed_password",
        full_name="Other Employee",
        role="employee",
        is_active=True
    )
    db.add(other_emp)
    db.commit()

    token_other = create_access_token(subject=other_emp.id)
    headers_other = {"Authorization": f"Bearer {token_other}"}

    # Employee trying to read other employee's dashboard
    response = client.get(f"/api/social/dashboard/{test_employee.id}", headers=headers_other)
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.json()["error_code"] == "DASHBOARD_ACCESS_DENIED"

    # Admin reading employee's dashboard (should succeed)
    token_admin = create_access_token(subject=test_admin.id)
    headers_admin = {"Authorization": f"Bearer {token_admin}"}
    response_admin = client.get(f"/api/social/dashboard/{test_employee.id}", headers=headers_admin)
    assert response_admin.status_code == status.HTTP_200_OK

def test_dashboard_nonexistent_employee_fails(client, admin_headers):
    fake_id = uuid.uuid4()
    response = client.get(f"/api/social/dashboard/{fake_id}", headers=admin_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["error_code"] == "EMPLOYEE_NOT_FOUND"
