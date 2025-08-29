import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import json
from datetime import datetime
import uuid

from app.main import app
from app.models.user import UserCreate, User, UserProfile


class TestAuthEndpoints:
    """Test suite for authentication endpoints"""
    
    @pytest.fixture
    def client(self):
        """FastAPI test client"""
        return TestClient(app)
    
    @pytest.fixture
    def sample_user_data(self):
        """Sample user registration data"""
        return {
            "email": "test@example.com",
            "password": "SecurePass123",
            "full_name": "Test User",
            "age": 25,
            "location_neighborhood": "East Village",
            "privacy_level": "private"
        }
    
    @pytest.fixture
    def sample_user_object(self):
        """Sample User object"""
        return User(
            id=uuid.uuid4(),
            email="test@example.com",
            full_name="Test User",
            age=25,
            location_neighborhood="East Village",
            privacy_level="private",
            preferences={},
            ml_preference_vector=[],
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

    @patch('app.routers.auth.get_user_service')
    @patch('app.routers.auth.get_auth_middleware')
    def test_register_user_success(self, mock_auth, mock_user_service, client, sample_user_data, sample_user_object):
        """Test successful user registration"""
        # Mock services
        mock_user_service_instance = Mock()
        mock_auth_instance = Mock()
        
        mock_user_service.return_value = mock_user_service_instance
        mock_auth.return_value = mock_auth_instance
        
        # Mock user creation and token generation
        mock_user_service_instance.create_user.return_value = sample_user_object
        mock_auth_instance.create_access_token.return_value = "mock_access_token"
        mock_auth_instance.create_refresh_token.return_value = "mock_refresh_token"
        
        # Make request
        response = client.post("/api/v1/auth/register", json=sample_user_data)
        
        # Assertions
        assert response.status_code == 201
        data = response.json()
        assert data["access_token"] == "mock_access_token"
        assert data["refresh_token"] == "mock_refresh_token"
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == sample_user_data["email"]
        
        # Verify service calls
        mock_user_service_instance.create_user.assert_called_once()
    
    @patch('app.routers.auth.get_user_service')
    def test_register_user_duplicate_email(self, mock_user_service, client, sample_user_data):
        """Test registration with duplicate email"""
        # Mock service to raise exception
        mock_user_service_instance = Mock()
        mock_user_service.return_value = mock_user_service_instance
        
        from app.utils.exceptions import APIException
        mock_user_service_instance.create_user.side_effect = APIException(
            message="User with this email already exists",
            status_code=400,
            error_code="USER_ALREADY_EXISTS"
        )
        
        # Make request
        response = client.post("/api/v1/auth/register", json=sample_user_data)
        
        # Should handle the exception appropriately
        assert response.status_code == 400
    
    def test_register_user_invalid_data(self, client):
        """Test registration with invalid data"""
        invalid_data = {
            "email": "invalid-email",
            "password": "weak",  # Too short
            "age": 17  # Too young
        }
        
        response = client.post("/api/v1/auth/register", json=invalid_data)
        
        # Should return validation error
        assert response.status_code == 422
    
    @patch('app.routers.auth.get_user_service')
    @patch('app.routers.auth.get_auth_middleware')
    def test_login_user_success(self, mock_auth, mock_user_service, client, sample_user_object):
        """Test successful user login"""
        # Mock services
        mock_user_service_instance = Mock()
        mock_auth_instance = Mock()
        
        mock_user_service.return_value = mock_user_service_instance
        mock_auth.return_value = mock_auth_instance
        
        # Mock authentication and token generation
        mock_user_service_instance.authenticate_user.return_value = sample_user_object
        mock_auth_instance.create_access_token.return_value = "mock_access_token"
        mock_auth_instance.create_refresh_token.return_value = "mock_refresh_token"
        
        # Make request (OAuth2PasswordRequestForm expects form data)
        login_data = {
            "username": "test@example.com",
            "password": "SecurePass123"
        }
        
        response = client.post("/api/v1/auth/login", data=login_data)
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == "mock_access_token"
        assert data["refresh_token"] == "mock_refresh_token"
        assert data["user"]["email"] == sample_user_object.email
        
        # Verify authentication was called
        mock_user_service_instance.authenticate_user.assert_called_once_with(
            "test@example.com", "SecurePass123"
        )
    
    @patch('app.routers.auth.get_user_service')
    def test_login_user_invalid_credentials(self, mock_user_service, client):
        """Test login with invalid credentials"""
        # Mock service to return None (invalid credentials)
        mock_user_service_instance = Mock()
        mock_user_service.return_value = mock_user_service_instance
        mock_user_service_instance.authenticate_user.return_value = None
        
        login_data = {
            "username": "test@example.com",
            "password": "WrongPassword"
        }
        
        response = client.post("/api/v1/auth/login", data=login_data)
        
        # Should return unauthorized
        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]
    
    @patch('app.routers.auth.get_user_service')
    def test_login_user_inactive_account(self, mock_user_service, client, sample_user_object):
        """Test login with inactive account"""
        # Mock inactive user
        inactive_user = sample_user_object
        inactive_user.is_active = False
        
        mock_user_service_instance = Mock()
        mock_user_service.return_value = mock_user_service_instance
        mock_user_service_instance.authenticate_user.return_value = inactive_user
        
        login_data = {
            "username": "test@example.com",
            "password": "SecurePass123"
        }
        
        response = client.post("/api/v1/auth/login", data=login_data)
        
        # Should return unauthorized
        assert response.status_code == 401
        assert "Account is deactivated" in response.json()["detail"]
    
    @patch('app.routers.auth.get_user_service')
    @patch('app.routers.auth.get_auth_middleware')
    def test_refresh_token_success(self, mock_auth, mock_user_service, client, sample_user_object):
        """Test successful token refresh"""
        # Mock services
        mock_user_service_instance = Mock()
        mock_auth_instance = Mock()
        
        mock_user_service.return_value = mock_user_service_instance
        mock_auth.return_value = mock_auth_instance
        
        # Mock token verification and user lookup
        mock_auth_instance.verify_token.return_value = {\n            \"user_id\": str(sample_user_object.id),\n            \"token_type\": \"refresh\"\n        }\n        mock_user_service_instance.get_user_by_id.return_value = sample_user_object\n        mock_auth_instance.create_access_token.return_value = \"new_access_token\"\n        mock_auth_instance.create_refresh_token.return_value = \"new_refresh_token\"\n        \n        # Make request\n        refresh_data = {\"refresh_token\": \"valid_refresh_token\"}\n        response = client.post(\"/api/v1/auth/refresh\", data=refresh_data)\n        \n        # Assertions\n        assert response.status_code == 200\n        data = response.json()\n        assert data[\"access_token\"] == \"new_access_token\"\n        assert data[\"refresh_token\"] == \"new_refresh_token\"\n        \n        # Verify token verification was called\n        mock_auth_instance.verify_token.assert_called_once_with(\"valid_refresh_token\")\n    \n    @patch('app.routers.auth.get_auth_middleware')\n    def test_refresh_token_invalid_token_type(self, mock_auth, client):\n        \"\"\"Test token refresh with non-refresh token\"\"\"\n        mock_auth_instance = Mock()\n        mock_auth.return_value = mock_auth_instance\n        \n        # Mock token verification returning access token instead of refresh\n        mock_auth_instance.verify_token.return_value = {\n            \"user_id\": \"user-id\",\n            \"token_type\": \"access\"  # Wrong type\n        }\n        \n        refresh_data = {\"refresh_token\": \"invalid_token_type\"}\n        response = client.post(\"/api/v1/auth/refresh\", data=refresh_data)\n        \n        # Should return unauthorized\n        assert response.status_code == 401\n        assert \"Invalid token type\" in response.json()[\"detail\"]\n    \n    @patch('app.routers.auth.get_auth_middleware')\n    def test_refresh_token_user_not_found(self, mock_auth, client):\n        \"\"\"Test token refresh with non-existent user\"\"\"\n        mock_auth_instance = Mock()\n        mock_user_service_instance = Mock()\n        \n        mock_auth.return_value = mock_auth_instance\n        \n        with patch('app.routers.auth.get_user_service') as mock_user_service:\n            mock_user_service.return_value = mock_user_service_instance\n            \n            # Mock valid refresh token but user not found\n            mock_auth_instance.verify_token.return_value = {\n                \"user_id\": \"non-existent-user\",\n                \"token_type\": \"refresh\"\n            }\n            mock_user_service_instance.get_user_by_id.return_value = None\n            \n            refresh_data = {\"refresh_token\": \"valid_token_missing_user\"}\n            response = client.post(\"/api/v1/auth/refresh\", data=refresh_data)\n            \n            # Should return unauthorized\n            assert response.status_code == 401\n            assert \"User not found or inactive\" in response.json()[\"detail\"]\n    \n    @patch('app.routers.auth.get_auth_middleware')\n    def test_logout_user_success(self, mock_auth, client, sample_user_object):\n        \"\"\"Test successful user logout\"\"\"\n        mock_auth_instance = Mock()\n        mock_auth.return_value = mock_auth_instance\n        mock_auth_instance.get_current_user.return_value = sample_user_object\n        \n        # Mock authentication dependency\n        with patch('app.routers.auth.get_auth_middleware') as mock_get_auth:\n            mock_auth_obj = Mock()\n            mock_auth_obj.get_current_user = Mock(return_value=sample_user_object)\n            mock_get_auth.return_value = mock_auth_obj\n            \n            response = client.post(\n                \"/api/v1/auth/logout\",\n                headers={\"Authorization\": \"Bearer mock_token\"}\n            )\n            \n            # Should return success message\n            assert response.status_code == 200\n            assert \"Successfully logged out\" in response.json()[\"message\"]\n    \n    @patch('app.routers.auth.get_user_service')\n    @patch('app.routers.auth.get_auth_middleware')\n    def test_get_current_user_profile_success(self, mock_auth, mock_user_service, client, sample_user_object):\n        \"\"\"Test getting current user profile\"\"\"\n        mock_auth_instance = Mock()\n        mock_user_service_instance = Mock()\n        \n        mock_auth.return_value = mock_auth_instance\n        mock_user_service.return_value = mock_user_service_instance\n        \n        # Mock current user and fresh user data\n        mock_auth_instance.get_current_user.return_value = sample_user_object\n        mock_user_service_instance.get_user_by_id.return_value = sample_user_object\n        \n        with patch('app.routers.auth.get_auth_middleware') as mock_get_auth:\n            mock_auth_obj = Mock()\n            mock_auth_obj.get_current_user = Mock(return_value=sample_user_object)\n            mock_get_auth.return_value = mock_auth_obj\n            \n            response = client.get(\n                \"/api/v1/auth/me\",\n                headers={\"Authorization\": \"Bearer mock_token\"}\n            )\n            \n            # Should return user profile\n            assert response.status_code == 200\n            data = response.json()\n            assert data[\"email\"] == sample_user_object.email\n            assert data[\"full_name\"] == sample_user_object.full_name\n    \n    @patch('app.routers.auth.get_user_service')\n    @patch('app.routers.auth.get_auth_middleware')\n    def test_get_current_user_profile_not_found(self, mock_auth, mock_user_service, client, sample_user_object):\n        \"\"\"Test getting current user profile when user not found\"\"\"\n        mock_auth_instance = Mock()\n        mock_user_service_instance = Mock()\n        \n        mock_auth.return_value = mock_auth_instance\n        mock_user_service.return_value = mock_user_service_instance\n        \n        # Mock current user but no fresh data found\n        mock_auth_instance.get_current_user.return_value = sample_user_object\n        mock_user_service_instance.get_user_by_id.return_value = None\n        \n        with patch('app.routers.auth.get_auth_middleware') as mock_get_auth:\n            mock_auth_obj = Mock()\n            mock_auth_obj.get_current_user = Mock(return_value=sample_user_object)\n            mock_get_auth.return_value = mock_auth_obj\n            \n            response = client.get(\n                \"/api/v1/auth/me\",\n                headers={\"Authorization\": \"Bearer mock_token\"}\n            )\n            \n            # Should return not found\n            assert response.status_code == 404\n            assert \"User not found\" in response.json()[\"detail\"]\n    \n    def test_auth_endpoints_without_token(self, client):\n        \"\"\"Test protected endpoints without authentication token\"\"\"\n        protected_endpoints = [\n            (\"/api/v1/auth/logout\", \"post\"),\n            (\"/api/v1/auth/me\", \"get\")\n        ]\n        \n        for endpoint, method in protected_endpoints:\n            if method == \"post\":\n                response = client.post(endpoint)\n            else:\n                response = client.get(endpoint)\n            \n            # Should return unauthorized\n            assert response.status_code == 403  # FastAPI returns 403 for missing auth\n    \n    def test_auth_endpoints_with_invalid_token(self, client):\n        \"\"\"Test protected endpoints with invalid token\"\"\"\n        headers = {\"Authorization\": \"Bearer invalid_token\"}\n        \n        protected_endpoints = [\n            (\"/api/v1/auth/logout\", \"post\"),\n            (\"/api/v1/auth/me\", \"get\")\n        ]\n        \n        for endpoint, method in protected_endpoints:\n            if method == \"post\":\n                response = client.post(endpoint, headers=headers)\n            else:\n                response = client.get(endpoint, headers=headers)\n            \n            # Should return unauthorized (exact status depends on implementation)\n            assert response.status_code in [401, 403]\n\n\nclass TestAuthEndpointsIntegration:\n    \"\"\"Integration tests for auth endpoints\"\"\"\n    \n    @pytest.mark.skip(reason=\"Integration test - requires database\")\n    def test_full_auth_flow_integration(self):\n        \"\"\"Test complete authentication flow with real database\"\"\"\n        # This would test the full flow: register -> login -> access protected endpoint -> refresh -> logout\n        pass\n    \n    @pytest.mark.skip(reason=\"Integration test - requires database\")\n    def test_concurrent_login_sessions(self):\n        \"\"\"Test multiple concurrent login sessions for same user\"\"\"\n        pass\n    \n    @pytest.mark.skip(reason=\"Integration test - requires database\")\n    def test_token_expiration_handling(self):\n        \"\"\"Test token expiration and automatic refresh\"\"\"\n        pass