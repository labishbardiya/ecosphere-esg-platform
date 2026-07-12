from fastapi import status
import uuid

def test_create_challenge_admin_success(client, admin_headers):
    payload = {
        "name": "Hydration Target",
        "description": "Drink at least 3 liters of water daily.",
        "target_frequency": 7,
        "cycle_type": "Weekly",
        "status": True
    }
    response = client.post("/api/social/challenges", json=payload, headers=admin_headers)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == payload["name"]
    assert "id" in data

def test_create_challenge_employee_forbidden(client, employee_headers):
    payload = {
        "name": "Hydration Target",
        "description": "Drink 3 liters of water daily.",
        "target_frequency": 7,
        "cycle_type": "Weekly",
        "status": True
    }
    response = client.post("/api/social/challenges", json=payload, headers=employee_headers)
    assert response.status_code == status.HTTP_403_FORBIDDEN
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "INSUFFICIENT_PERMISSIONS"

def test_list_challenges_success(client, employee_headers, test_challenge):
    response = client.get("/api/social/challenges", headers=employee_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["name"] == test_challenge.name

def test_list_challenges_filtering_and_search(client, employee_headers, test_challenge):
    # Search match
    response = client.get("/api/social/challenges?search=Steps", headers=employee_headers)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1

    # Search no match
    response = client.get("/api/social/challenges?search=NonExistent", headers=employee_headers)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 0

    # Filter by cycle type
    response = client.get("/api/social/challenges?cycle_type=Weekly", headers=employee_headers)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1

def test_update_challenge_admin_success(client, admin_headers, test_challenge):
    payload = {
        "name": "Updated Challenge Name",
        "target_frequency": 10
    }
    response = client.put(f"/api/social/challenges/{test_challenge.id}", json=payload, headers=admin_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["target_frequency"] == payload["target_frequency"]

def test_delete_challenge_admin_success(client, admin_headers, test_challenge):
    response = client.delete(f"/api/social/challenges/{test_challenge.id}", headers=admin_headers)
    assert response.status_code == status.HTTP_200_OK
    
    # Check that GET now fails
    response_get = client.get(f"/api/social/challenges/{test_challenge.id}", headers=admin_headers)
    assert response_get.status_code == status.HTTP_404_NOT_FOUND

def test_get_nonexistent_challenge_fails(client, employee_headers):
    fake_id = uuid.uuid4()
    response = client.get(f"/api/social/challenges/{fake_id}", headers=employee_headers)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["error_code"] == "CHALLENGE_NOT_FOUND"
