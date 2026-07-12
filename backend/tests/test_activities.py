from fastapi import status
import os
import shutil

def test_log_activity_success(client, employee_headers, test_challenge):
    # Ensure local upload directory is clean
    if os.path.exists("uploads"):
        shutil.rmtree("uploads")
        
    data = {
        "challenge_id": str(test_challenge.id),
        "activity_type": "Running",
        "notes": "Logged 5k run",
        "date_logged": "2026-07-12"
    }
    files = {
        "proof_image": ("run_proof.png", b"fake-png-binary-data", "image/png")
    }
    
    response = client.post(
        "/api/social/activity",
        data=data,
        files=files,
        headers=employee_headers
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    resp_data = response.json()
    assert resp_data["activity_type"] == data["activity_type"]
    assert "proof_url" in resp_data
    assert resp_data["proof_url"].startswith("/static/uploads/")
    
    # Cleanup uploads
    if os.path.exists("uploads"):
        shutil.rmtree("uploads")

def test_log_activity_invalid_mime_type_fails(client, employee_headers, test_challenge):
    data = {
        "challenge_id": str(test_challenge.id),
        "activity_type": "Running",
        "date_logged": "2026-07-12"
    }
    # Uploading a text file instead of an image
    files = {
        "proof_image": ("proof.txt", b"plain text data", "text/plain")
    }
    
    response = client.post(
        "/api/social/activity",
        data=data,
        files=files,
        headers=employee_headers
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    resp_data = response.json()
    assert resp_data["success"] is False
    assert resp_data["error_code"] == "INVALID_MIME_TYPE"

def test_log_activity_file_too_large_fails(client, employee_headers, test_challenge):
    data = {
        "challenge_id": str(test_challenge.id),
        "activity_type": "Running",
        "date_logged": "2026-07-12"
    }
    # Create content larger than 5MB
    large_content = b"x" * (5 * 1024 * 1024 + 10)
    files = {
        "proof_image": ("proof.jpg", large_content, "image/jpeg")
    }
    
    response = client.post(
        "/api/social/activity",
        data=data,
        files=files,
        headers=employee_headers
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    resp_data = response.json()
    assert resp_data["success"] is False
    assert resp_data["error_code"] == "FILE_TOO_LARGE"

def test_log_activity_future_date_fails(client, employee_headers, test_challenge):
    data = {
        "challenge_id": str(test_challenge.id),
        "activity_type": "Running",
        "date_logged": "2050-12-31" # Way in the future
    }
    files = {
        "proof_image": ("proof.jpg", b"some-img-data", "image/jpeg")
    }
    
    response = client.post(
        "/api/social/activity",
        data=data,
        files=files,
        headers=employee_headers
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    resp_data = response.json()
    assert resp_data["success"] is False
    assert resp_data["error_code"] == "FUTURE_DATE_FORBIDDEN"

def test_get_activity_history(client, employee_headers, test_challenge):
    # Log one activity first
    data = {
        "challenge_id": str(test_challenge.id),
        "activity_type": "Running",
        "date_logged": "2026-07-12"
    }
    files = {
        "proof_image": ("proof.jpg", b"data", "image/jpeg")
    }
    client.post("/api/social/activity", data=data, files=files, headers=employee_headers)
    
    # Retrieve history
    response = client.get("/api/social/activity/history", headers=employee_headers)
    assert response.status_code == status.HTTP_200_OK
    history = response.json()
    assert len(history) == 1
    assert history[0]["activity_type"] == "Running"
    
    # Cleanup uploads
    if os.path.exists("uploads"):
        shutil.rmtree("uploads")
