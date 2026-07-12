from fastapi import status

def test_register_user_success(client):
    payload = {
        "email": "new_user@ecosphere.com",
        "password": "securepassword",
        "full_name": "Alice Green",
        "role": "employee"
    }
    response = client.post("/api/social/auth/register", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == payload["email"]
    assert data["full_name"] == payload["full_name"]
    assert "id" in data
    assert "hashed_password" not in data

def test_register_duplicate_email_fails(client, test_employee):
    payload = {
        "email": test_employee.email, # already exists
        "password": "somepassword",
        "full_name": "Alice Duplicate",
        "role": "employee"
    }
    response = client.post("/api/social/auth/register", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "EMAIL_ALREADY_EXISTS"

def test_register_invalid_inputs_fails(client):
    # Short password and invalid role
    payload = {
        "email": "invalid_user@ecosphere.com",
        "password": "123",
        "full_name": "John Doe",
        "role": "superadmin"
    }
    response = client.post("/api/social/auth/register", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "VALIDATION_ERROR"
    assert "body.password" in data["details"]
    assert "body.role" in data["details"]

def test_login_oauth2_success(client, test_employee):
    response = client.post(
        "/api/social/auth/token",
        data={"username": test_employee.email, "password": "emppass123"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_credentials_fails(client, test_employee):
    response = client.post(
        "/api/social/auth/token",
        data={"username": test_employee.email, "password": "wrongpassword"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "INVALID_CREDENTIALS"

def test_get_current_user_me_profile_success(client, employee_headers, test_employee):
    response = client.get("/api/social/auth/me", headers=employee_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == test_employee.email
    assert data["id"] == str(test_employee.id)

def test_get_me_unauthorized_fails(client):
    response = client.get("/api/social/auth/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
