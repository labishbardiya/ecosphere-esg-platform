from fastapi import status
from app.models.models import User, ActivityLog, EmployeeParticipation
from app.core.security import get_password_hash, create_access_token
import uuid
import os
import shutil

def setup_vouchers(db):
    """Utility to register multiple distinct employees for voting/vouching tests."""
    vouchers = []
    for i in range(1, 4):
        emp = User(
            email=f"vouch_user{i}@ecosphere.com",
            hashed_password=get_password_hash("securepass123"),
            full_name=f"Voucher Employee {i}",
            role="employee",
            points=0,
            is_active=True
        )
        db.add(emp)
        vouchers.append(emp)
    db.commit()
    return vouchers

def test_peer_vouch_workflow_success(client, db, test_employee, employee_headers, test_challenge):
    # Setup: Create vouchers B, C, D
    vouchers = setup_vouchers(db)
    emp_b, emp_c, emp_d = vouchers[0], vouchers[1], vouchers[2]

    # Step 1: Employee A logs an activity
    data = {
        "challenge_id": str(test_challenge.id),
        "activity_type": "Yoga session",
        "date_logged": "2026-07-12"
    }
    files = {
        "proof_image": ("yoga.jpg", b"fake-yoga-pic", "image/jpeg")
    }
    resp_log = client.post("/api/social/activity", data=data, files=files, headers=employee_headers)
    assert resp_log.status_code == status.HTTP_201_CREATED
    activity_id = resp_log.json()["id"]

    # Retrieve the generated participation
    participation = db.query(EmployeeParticipation).filter_by(activity_id=uuid.UUID(activity_id)).first()
    assert participation is not None
    assert participation.approval_status == "Pending"
    assert participation.vouch_count == 0

    # Step 2: Employee B vouches
    token_b = create_access_token(subject=emp_b.id)
    headers_b = {"Authorization": f"Bearer {token_b}"}
    vouch_payload = {
        "participation_id": str(participation.id),
        "voucher_employee_id": str(emp_b.id)
    }
    resp_vouch1 = client.post("/api/social/vouch", json=vouch_payload, headers=headers_b)
    assert resp_vouch1.status_code == status.HTTP_201_CREATED
    
    # Reload participation from DB
    db.refresh(participation)
    assert participation.vouch_count == 1
    assert participation.approval_status == "Pending"

    # Step 3: Employee C vouches
    token_c = create_access_token(subject=emp_c.id)
    headers_c = {"Authorization": f"Bearer {token_c}"}
    vouch_payload["voucher_employee_id"] = str(emp_c.id)
    resp_vouch2 = client.post("/api/social/vouch", json=vouch_payload, headers=headers_c)
    assert resp_vouch2.status_code == status.HTTP_201_CREATED

    db.refresh(participation)
    assert participation.vouch_count == 2
    assert participation.approval_status == "Pending"

    # Step 4: Employee D vouches -> triggers approval and awards points (10 points)
    token_d = create_access_token(subject=emp_d.id)
    headers_d = {"Authorization": f"Bearer {token_d}"}
    vouch_payload["voucher_employee_id"] = str(emp_d.id)
    resp_vouch3 = client.post("/api/social/vouch", json=vouch_payload, headers=headers_d)
    assert resp_vouch3.status_code == status.HTTP_201_CREATED

    db.refresh(participation)
    assert participation.vouch_count == 3
    assert participation.approval_status == "Approved"
    assert participation.points_earned == 10

    # Verify Employee A (who logged the activity) received 10 points
    db.refresh(test_employee)
    assert test_employee.points == 10

    # Cleanup local upload directories
    if os.path.exists("uploads"):
        shutil.rmtree("uploads")

def test_self_vouch_fails(client, db, test_employee, employee_headers, test_challenge):
    # Log an activity
    data = {"challenge_id": str(test_challenge.id), "activity_type": "Gym", "date_logged": "2026-07-12"}
    files = {"proof_image": ("gym.jpg", b"img", "image/jpeg")}
    client.post("/api/social/activity", data=data, files=files, headers=employee_headers)
    participation = db.query(EmployeeParticipation).first()

    # Self vouch payload
    payload = {
        "participation_id": str(participation.id),
        "voucher_employee_id": str(test_employee.id)
    }
    response = client.post("/api/social/vouch", json=payload, headers=employee_headers)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["error_code"] == "SELF_VERIFICATION"

    if os.path.exists("uploads"):
        shutil.rmtree("uploads")

def test_duplicate_vouch_fails(client, db, test_employee, employee_headers, test_challenge):
    vouchers = setup_vouchers(db)
    emp_b = vouchers[0]

    # Log activity
    data = {"challenge_id": str(test_challenge.id), "activity_type": "Gym", "date_logged": "2026-07-12"}
    files = {"proof_image": ("gym.jpg", b"img", "image/jpeg")}
    client.post("/api/social/activity", data=data, files=files, headers=employee_headers)
    participation = db.query(EmployeeParticipation).first()

    token_b = create_access_token(subject=emp_b.id)
    headers_b = {"Authorization": f"Bearer {token_b}"}
    payload = {
        "participation_id": str(participation.id),
        "voucher_employee_id": str(emp_b.id)
    }
    # Vouch once
    client.post("/api/social/vouch", json=payload, headers=headers_b)
    # Vouch again
    response = client.post("/api/social/vouch", json=payload, headers=headers_b)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["error_code"] == "DUPLICATE_VERIFICATION"

    if os.path.exists("uploads"):
        shutil.rmtree("uploads")
