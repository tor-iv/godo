import pytest
import pytest_asyncio
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime
import uuid

from app.services.user_service import UserService
from app.models.user import UserCreate, UserUpdate, UserLogin
from app.utils.exceptions import APIException


class TestUserService:
    """Test suite for UserService"""
    
    @pytest.fixture
    def mock_supabase(self):
        """Mock Supabase client"""
        mock_client = Mock()
        mock_table = Mock()
        mock_client.table.return_value = mock_table
        return mock_client, mock_table
    
    @pytest.fixture
    def user_service(self, mock_supabase):
        """UserService instance with mocked dependencies"""
        service = UserService()
        service.supabase = mock_supabase[0]
        return service
    
    @pytest.fixture
    def sample_user_data(self):
        """Sample user creation data"""
        return UserCreate(
            email="test@example.com",
            password="SecurePass123",
            full_name="Test User",
            age=25,
            location_neighborhood="East Village",
            phone_number="+15551234567"
        )
    
    @pytest.fixture
    def sample_user_record(self):
        """Sample user database record"""
        return {
            "id": str(uuid.uuid4()),
            "email": "test@example.com",
            "password_hash": "$2b$12$hashed_password",
            "full_name": "Test User",
            "age": 25,
            "location_neighborhood": "East Village",
            "privacy_level": "private",
            "phone_hash": "hashed_phone",
            "preferences": {},
            "ml_preference_vector": [],
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

    @pytest.mark.asyncio
    async def test_create_user_success(self, user_service, mock_supabase, sample_user_data, sample_user_record):
        """Test successful user creation"""
        mock_client, mock_table = mock_supabase
        
        # Mock database responses
        mock_table.select.return_value.eq.return_value.execute.return_value.data = []  # No existing user
        mock_table.insert.return_value.execute.return_value.data = [sample_user_record]
        
        # Create user
        result = await user_service.create_user(sample_user_data)
        
        # Assertions
        assert result.id == sample_user_record["id"]
        assert result.email == sample_user_data.email
        assert result.full_name == sample_user_data.full_name
        mock_table.insert.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_create_user_duplicate_email(self, user_service, mock_supabase, sample_user_data, sample_user_record):
        """Test user creation with duplicate email"""
        mock_client, mock_table = mock_supabase
        
        # Mock existing user
        mock_table.select.return_value.eq.return_value.execute.return_value.data = [sample_user_record]
        
        # Expect exception
        with pytest.raises(APIException) as exc_info:
            await user_service.create_user(sample_user_data)
        
        assert exc_info.value.error_code == "USER_ALREADY_EXISTS"
        assert exc_info.value.status_code == 400
    
    @pytest.mark.asyncio
    async def test_create_user_invalid_neighborhood(self, user_service, mock_supabase):
        """Test user creation with invalid neighborhood"""
        mock_client, mock_table = mock_supabase
        
        # Mock no existing user
        mock_table.select.return_value.eq.return_value.execute.return_value.data = []
        
        # Invalid user data
        invalid_data = UserCreate(
            email="test@example.com",
            password="SecurePass123",
            location_neighborhood="Invalid Neighborhood"
        )
        
        # Expect exception
        with pytest.raises(APIException) as exc_info:
            await user_service.create_user(invalid_data)
        
        assert exc_info.value.error_code == "INVALID_NEIGHBORHOOD"
    
    @pytest.mark.asyncio
    async def test_authenticate_user_success(self, user_service, mock_supabase, sample_user_record):
        """Test successful user authentication"""
        mock_client, mock_table = mock_supabase
        
        # Mock user found with correct password
        mock_table.select.return_value.eq.return_value.execute.return_value.data = [sample_user_record]
        
        with patch.object(user_service, 'verify_password', return_value=True), \
             patch.object(user_service, 'update_last_login', return_value=None):
            
            result = await user_service.authenticate_user("test@example.com", "correct_password")
            
            assert result is not None
            assert result.email == "test@example.com"
    
    @pytest.mark.asyncio
    async def test_authenticate_user_wrong_password(self, user_service, mock_supabase, sample_user_record):
        """Test authentication with wrong password"""
        mock_client, mock_table = mock_supabase
        
        # Mock user found but wrong password
        mock_table.select.return_value.eq.return_value.execute.return_value.data = [sample_user_record]
        
        with patch.object(user_service, 'verify_password', return_value=False):
            result = await user_service.authenticate_user("test@example.com", "wrong_password")
            
            assert result is None
    
    @pytest.mark.asyncio
    async def test_authenticate_user_not_found(self, user_service, mock_supabase):
        """Test authentication with non-existent user"""
        mock_client, mock_table = mock_supabase
        
        # Mock no user found
        mock_table.select.return_value.eq.return_value.execute.return_value.data = []
        
        result = await user_service.authenticate_user("notfound@example.com", "password")
        
        assert result is None
    
    @pytest.mark.asyncio
    async def test_get_user_by_id_success(self, user_service, mock_supabase, sample_user_record):
        """Test getting user by ID"""
        mock_client, mock_table = mock_supabase
        
        # Mock user found
        mock_table.select.return_value.eq.return_value.execute.return_value.data = [sample_user_record]
        
        result = await user_service.get_user_by_id(sample_user_record["id"])
        
        assert result is not None
        assert result.id == sample_user_record["id"]
    
    @pytest.mark.asyncio
    async def test_get_user_by_id_not_found(self, user_service, mock_supabase):
        """Test getting non-existent user by ID"""
        mock_client, mock_table = mock_supabase
        
        # Mock no user found
        mock_table.select.return_value.eq.return_value.execute.return_value.data = []
        
        result = await user_service.get_user_by_id("non-existent-id")
        
        assert result is None
    
    @pytest.mark.asyncio
    async def test_update_user_profile_success(self, user_service, mock_supabase, sample_user_record):
        """Test successful profile update"""
        mock_client, mock_table = mock_supabase
        
        update_data = UserUpdate(
            full_name="Updated Name",
            age=26,
            location_neighborhood="SoHo"
        )
        
        # Mock successful update
        updated_record = sample_user_record.copy()
        updated_record.update({
            "full_name": "Updated Name",
            "age": 26,
            "location_neighborhood": "SoHo"
        })
        mock_table.update.return_value.eq.return_value.execute.return_value.data = [updated_record]
        
        result = await user_service.update_user_profile(sample_user_record["id"], update_data)
        
        assert result is not None
        assert result.full_name == "Updated Name"
        assert result.age == 26
        mock_table.update.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_update_user_profile_invalid_neighborhood(self, user_service, mock_supabase):
        """Test profile update with invalid neighborhood"""
        update_data = UserUpdate(location_neighborhood="Invalid Neighborhood")
        
        with pytest.raises(APIException) as exc_info:
            await user_service.update_user_profile("user-id", update_data)
        
        assert exc_info.value.error_code == "INVALID_NEIGHBORHOOD"
    
    def test_hash_password(self, user_service):
        """Test password hashing"""
        password = "TestPassword123"
        hashed = user_service.hash_password(password)
        
        assert hashed != password
        assert len(hashed) > 50  # Bcrypt hashes are long
        assert hashed.startswith('$2b$')
    
    def test_verify_password(self, user_service):
        """Test password verification"""
        password = "TestPassword123"
        hashed = user_service.hash_password(password)
        
        assert user_service.verify_password(password, hashed) is True
        assert user_service.verify_password("WrongPassword", hashed) is False
    
    def test_hash_phone_number(self, user_service):
        """Test phone number hashing"""
        phone = "+15551234567"
        hashed = user_service.hash_phone_number(phone)
        
        assert hashed != phone
        assert len(hashed) == 64  # SHA256 hex digest length
        
        # Same phone should produce same hash
        assert user_service.hash_phone_number(phone) == hashed
        
        # Different phones should produce different hashes
        different_phone = "+15559876543"
        assert user_service.hash_phone_number(different_phone) != hashed
    
    @pytest.mark.asyncio
    async def test_deactivate_user_success(self, user_service, mock_supabase, sample_user_record):
        """Test successful user deactivation"""
        mock_client, mock_table = mock_supabase
        
        # Mock successful deactivation
        deactivated_record = sample_user_record.copy()
        deactivated_record["is_active"] = False
        mock_table.update.return_value.eq.return_value.execute.return_value.data = [deactivated_record]
        
        result = await user_service.deactivate_user(sample_user_record["id"])
        
        assert result is True
        mock_table.update.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_update_user_preferences_success(self, user_service, mock_supabase, sample_user_record):
        """Test successful preferences update"""
        mock_client, mock_table = mock_supabase
        
        preferences = {"theme": "dark", "notifications": True}
        
        # Mock successful update
        updated_record = sample_user_record.copy()
        updated_record["preferences"] = preferences
        mock_table.update.return_value.eq.return_value.execute.return_value.data = [updated_record]
        
        result = await user_service.update_user_preferences(sample_user_record["id"], preferences)
        
        assert result is True
        mock_table.update.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_user_preferences_success(self, user_service, mock_supabase, sample_user_record):
        """Test getting user preferences"""
        mock_client, mock_table = mock_supabase
        
        preferences = {"theme": "dark", "notifications": True}
        user_record = sample_user_record.copy()
        user_record["preferences"] = preferences
        
        # Mock user with preferences
        mock_table.select.return_value.eq.return_value.execute.return_value.data = [user_record]
        
        result = await user_service.get_user_preferences(sample_user_record["id"])
        
        assert result == preferences
    
    @pytest.mark.asyncio
    async def test_find_friends_by_phone_success(self, user_service, mock_supabase):
        """Test finding friends by phone contacts"""
        mock_client, mock_table = mock_supabase
        
        phone_hashes = ["hash1", "hash2", "hash3"]
        requesting_user_id = str(uuid.uuid4())
        
        # Mock found users
        found_users = [
            {
                "id": str(uuid.uuid4()),
                "full_name": "Friend One",
                "location_neighborhood": "Brooklyn Heights",
                "profile_image_url": None,
                "privacy_level": "public"
            },
            {
                "id": str(uuid.uuid4()),
                "full_name": "Friend Two",
                "location_neighborhood": "Chelsea",
                "profile_image_url": "/images/friend2.jpg",
                "privacy_level": "friends_only"
            }
        ]
        
        mock_table.select.return_value.in_.return_value.neq.return_value.execute.return_value.data = found_users
        
        result = await user_service.find_friends_by_phone(phone_hashes, requesting_user_id)
        
        assert len(result) == 2
        assert result[0].reason == "phone_contact"
        assert result[0].confidence_score == 0.9
        assert result[1].user.full_name == "Friend Two"
    
    @pytest.mark.asyncio
    async def test_get_public_profile_public_user(self, user_service, mock_supabase, sample_user_record):
        """Test getting public profile of public user"""
        mock_client, mock_table = mock_supabase
        
        # Make user public
        public_user = sample_user_record.copy()
        public_user["privacy_level"] = "public"
        mock_table.select.return_value.eq.return_value.execute.return_value.data = [public_user]
        
        result = await user_service.get_public_profile(public_user["id"], "requesting-user-id")
        
        assert result is not None
        assert result.full_name == public_user["full_name"]
        assert result.age == public_user["age"]
        assert result.location_neighborhood == public_user["location_neighborhood"]
    
    @pytest.mark.asyncio
    async def test_get_public_profile_private_user(self, user_service, mock_supabase, sample_user_record):
        """Test getting public profile of private user"""
        mock_client, mock_table = mock_supabase
        
        # User is private
        mock_table.select.return_value.eq.return_value.execute.return_value.data = [sample_user_record]
        
        result = await user_service.get_public_profile(sample_user_record["id"], "requesting-user-id")
        
        assert result is not None
        assert result.full_name is None  # Private info hidden
        assert result.age is None
        assert result.location_neighborhood is None
    
    @pytest.mark.asyncio
    async def test_get_public_profile_own_profile(self, user_service, mock_supabase, sample_user_record):
        """Test getting own profile (should show all info regardless of privacy)"""
        mock_client, mock_table = mock_supabase
        
        mock_table.select.return_value.eq.return_value.execute.return_value.data = [sample_user_record]
        
        # Request own profile
        result = await user_service.get_public_profile(sample_user_record["id"], sample_user_record["id"])
        
        assert result is not None
        assert result.full_name == sample_user_record["full_name"]
        assert result.age == sample_user_record["age"]
        assert result.location_neighborhood == sample_user_record["location_neighborhood"]


class TestUserServiceIntegration:
    """Integration tests that would run against a real database"""
    
    @pytest.mark.skip(reason="Integration test - requires database")
    @pytest.mark.asyncio
    async def test_full_user_lifecycle(self):
        """Test complete user lifecycle: create, login, update, deactivate"""
        # This would test against a real database
        pass
    
    @pytest.mark.skip(reason="Integration test - requires file system")
    @pytest.mark.asyncio
    async def test_profile_image_upload(self):
        """Test profile image upload and processing"""
        # This would test actual file operations
        pass