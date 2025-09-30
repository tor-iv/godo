#!/usr/bin/env python3
"""
Database Testing Suite for GoDo App

This comprehensive test suite validates:
1. Database connections and health
2. Table creation and constraints
3. Row Level Security (RLS) policies
4. CRUD operations for all models
5. Database functions and triggers
6. Performance and indexing

Usage:
    pytest test_database.py -v
    python test_database.py --db-url postgres://... --run-all
"""

import asyncio
import json
import os
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import argparse

import asyncpg
import pytest
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class DatabaseTester:
    def __init__(self, db_url: str, supabase_url: str = None, supabase_key: str = None):
        self.db_url = db_url
        self.connection: Optional[asyncpg.Connection] = None
        self.supabase: Optional[Client] = None

        if supabase_url and supabase_key:
            self.supabase = create_client(supabase_url, supabase_key)

    async def connect(self):
        """Connect to the database"""
        self.connection = await asyncpg.connect(self.db_url)

    async def disconnect(self):
        """Disconnect from the database"""
        if self.connection:
            await self.connection.close()

    async def test_connection(self) -> bool:
        """Test basic database connectivity"""
        try:
            result = await self.connection.fetchval("SELECT 1")
            return result == 1
        except Exception as e:
            print(f"❌ Connection test failed: {e}")
            return False

    async def test_extensions(self) -> bool:
        """Test that required extensions are installed"""
        try:
            extensions = await self.connection.fetch("""
                SELECT extname FROM pg_extension
                WHERE extname IN ('uuid-ossp', 'postgis', 'pg_trgm')
            """)

            required_extensions = {'uuid-ossp', 'postgis', 'pg_trgm'}
            installed_extensions = {ext['extname'] for ext in extensions}

            missing = required_extensions - installed_extensions
            if missing:
                print(f"❌ Missing extensions: {missing}")
                return False

            print("✅ All required extensions installed")
            return True
        except Exception as e:
            print(f"❌ Extension test failed: {e}")
            return False

    async def test_tables_exist(self) -> bool:
        """Test that all required tables exist"""
        try:
            expected_tables = {
                'users', 'events', 'swipes', 'event_attendance', 'friendships',
                'groups', 'group_members', 'invitations', 'user_preferences',
                'swipe_context', 'ml_event_features', 'swipe_recommendation_feedback',
                'notifications', 'event_sources', 'audit_logs'
            }

            tables = await self.connection.fetch("""
                SELECT tablename FROM pg_tables
                WHERE schemaname = 'public'
            """)

            existing_tables = {table['tablename'] for table in tables}
            missing_tables = expected_tables - existing_tables

            if missing_tables:
                print(f"❌ Missing tables: {missing_tables}")
                return False

            print("✅ All required tables exist")
            return True
        except Exception as e:
            print(f"❌ Table existence test failed: {e}")
            return False

    async def test_enums_exist(self) -> bool:
        """Test that all required enums exist"""
        try:
            expected_enums = {
                'privacy_level', 'event_category', 'event_source', 'moderation_status',
                'swipe_direction', 'swipe_action', 'calendar_type', 'visibility_level',
                'attendance_status', 'group_type', 'group_role', 'notification_type'
            }

            enums = await self.connection.fetch("""
                SELECT typname FROM pg_type
                WHERE typtype = 'e' AND typnamespace = (
                    SELECT oid FROM pg_namespace WHERE nspname = 'public'
                )
            """)

            existing_enums = {enum['typname'] for enum in enums}
            missing_enums = expected_enums - existing_enums

            if missing_enums:
                print(f"❌ Missing enums: {missing_enums}")
                return False

            print("✅ All required enums exist")
            return True
        except Exception as e:
            print(f"❌ Enum existence test failed: {e}")
            return False

    async def test_indexes_exist(self) -> bool:
        """Test that critical indexes exist"""
        try:
            # Check for some critical indexes
            critical_indexes = [
                'idx_users_email',
                'idx_events_active_approved',
                'idx_swipes_user_datetime',
                'idx_friendships_user_status',
                'idx_notifications_user_created'
            ]

            indexes = await self.connection.fetch("""
                SELECT indexname FROM pg_indexes
                WHERE schemaname = 'public'
                AND indexname = ANY($1)
            """, critical_indexes)

            existing_indexes = {idx['indexname'] for idx in indexes}
            missing_indexes = set(critical_indexes) - existing_indexes

            if missing_indexes:
                print(f"❌ Missing critical indexes: {missing_indexes}")
                return False

            print("✅ Critical indexes exist")
            return True
        except Exception as e:
            print(f"❌ Index existence test failed: {e}")
            return False

    async def test_rls_enabled(self) -> bool:
        """Test that RLS is enabled on all tables"""
        try:
            tables_with_rls = await self.connection.fetch("""
                SELECT tablename, rowsecurity
                FROM pg_tables t
                JOIN pg_class c ON c.relname = t.tablename
                WHERE t.schemaname = 'public'
                AND t.tablename NOT IN ('event_sources')  -- System table
            """)

            tables_without_rls = [
                table['tablename'] for table in tables_with_rls
                if not table['rowsecurity']
            ]

            if tables_without_rls:
                print(f"❌ Tables without RLS: {tables_without_rls}")
                return False

            print("✅ RLS enabled on all user tables")
            return True
        except Exception as e:
            print(f"❌ RLS test failed: {e}")
            return False

    async def test_triggers_exist(self) -> bool:
        """Test that update triggers exist"""
        try:
            triggers = await self.connection.fetch("""
                SELECT DISTINCT trigger_name
                FROM information_schema.triggers
                WHERE trigger_schema = 'public'
                AND trigger_name LIKE '%updated_at%'
            """)

            if len(triggers) < 5:  # Should have triggers on multiple tables
                print(f"❌ Expected more updated_at triggers, found: {len(triggers)}")
                return False

            print("✅ Update triggers exist")
            return True
        except Exception as e:
            print(f"❌ Trigger test failed: {e}")
            return False

    async def test_functions_exist(self) -> bool:
        """Test that custom functions exist"""
        try:
            expected_functions = [
                'update_updated_at_column',
                'are_friends',
                'get_mutual_friends_count',
                'calculate_distance_km',
                'get_user_profile'
            ]

            functions = await self.connection.fetch("""
                SELECT proname FROM pg_proc
                WHERE pronamespace = (
                    SELECT oid FROM pg_namespace WHERE nspname = 'public'
                )
                AND proname = ANY($1)
            """, expected_functions)

            existing_functions = {func['proname'] for func in functions}
            missing_functions = set(expected_functions) - existing_functions

            if missing_functions:
                print(f"❌ Missing functions: {missing_functions}")
                return False

            print("✅ All required functions exist")
            return True
        except Exception as e:
            print(f"❌ Function existence test failed: {e}")
            return False

    async def test_basic_crud_users(self) -> bool:
        """Test basic CRUD operations on users table"""
        try:
            test_user_id = str(uuid.uuid4())
            test_email = f"test_{uuid.uuid4().hex[:8]}@godo.app"

            # INSERT
            await self.connection.execute("""
                INSERT INTO users (id, email, full_name, age, privacy_level)
                VALUES ($1, $2, $3, $4, $5)
            """, test_user_id, test_email, "Test User", 25, "private")

            # SELECT
            user = await self.connection.fetchrow("""
                SELECT * FROM users WHERE id = $1
            """, test_user_id)

            if not user or user['email'] != test_email:
                print("❌ User insert/select failed")
                return False

            # UPDATE
            await self.connection.execute("""
                UPDATE users SET full_name = $1 WHERE id = $2
            """, "Updated Test User", test_user_id)

            updated_user = await self.connection.fetchrow("""
                SELECT full_name FROM users WHERE id = $1
            """, test_user_id)

            if updated_user['full_name'] != "Updated Test User":
                print("❌ User update failed")
                return False

            # DELETE
            await self.connection.execute("""
                DELETE FROM users WHERE id = $1
            """, test_user_id)

            deleted_user = await self.connection.fetchrow("""
                SELECT * FROM users WHERE id = $1
            """, test_user_id)

            if deleted_user:
                print("❌ User delete failed")
                return False

            print("✅ Users CRUD operations work")
            return True

        except Exception as e:
            print(f"❌ Users CRUD test failed: {e}")
            return False

    async def test_basic_crud_events(self) -> bool:
        """Test basic CRUD operations on events table"""
        try:
            test_event_id = str(uuid.uuid4())

            # INSERT
            await self.connection.execute("""
                INSERT INTO events (
                    id, title, date_time, location_name, category, source,
                    location_point, price_min, price_max
                ) VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326), $9, $10)
            """, test_event_id, "Test Event", datetime.now() + timedelta(days=1),
                "Test Venue", "networking", "manual", -73.9857, 40.7484, 0, 50)

            # SELECT
            event = await self.connection.fetchrow("""
                SELECT * FROM events WHERE id = $1
            """, test_event_id)

            if not event or event['title'] != "Test Event":
                print("❌ Event insert/select failed")
                return False

            # Test PostGIS location query
            nearby_events = await self.connection.fetch("""
                SELECT id FROM events
                WHERE ST_DWithin(location_point, ST_SetSRID(ST_MakePoint(-73.9857, 40.7484), 4326), 1000)
            """)

            if not any(e['id'] == test_event_id for e in nearby_events):
                print("❌ PostGIS location query failed")
                return False

            # DELETE
            await self.connection.execute("""
                DELETE FROM events WHERE id = $1
            """, test_event_id)

            print("✅ Events CRUD operations work")
            return True

        except Exception as e:
            print(f"❌ Events CRUD test failed: {e}")
            return False

    async def test_basic_crud_swipes(self) -> bool:
        """Test basic CRUD operations on swipes table"""
        try:
            # Create test user and event first
            test_user_id = str(uuid.uuid4())
            test_event_id = str(uuid.uuid4())
            test_email = f"test_{uuid.uuid4().hex[:8]}@godo.app"

            await self.connection.execute("""
                INSERT INTO users (id, email, full_name)
                VALUES ($1, $2, $3)
            """, test_user_id, test_email, "Test User")

            await self.connection.execute("""
                INSERT INTO events (id, title, date_time, location_name, category, source)
                VALUES ($1, $2, $3, $4, $5, $6)
            """, test_event_id, "Test Event", datetime.now() + timedelta(days=1),
                "Test Venue", "networking", "manual")

            # INSERT swipe
            test_swipe_id = str(uuid.uuid4())
            await self.connection.execute("""
                INSERT INTO swipes (id, user_id, event_id, direction, action)
                VALUES ($1, $2, $3, $4, $5)
            """, test_swipe_id, test_user_id, test_event_id, "right", "going_private")

            # SELECT
            swipe = await self.connection.fetchrow("""
                SELECT * FROM swipes WHERE id = $1
            """, test_swipe_id)

            if not swipe or swipe['direction'] != "right":
                print("❌ Swipe insert/select failed")
                return False

            # Test unique constraint (should fail)
            try:
                await self.connection.execute("""
                    INSERT INTO swipes (user_id, event_id, direction, action)
                    VALUES ($1, $2, $3, $4)
                """, test_user_id, test_event_id, "left", "not_interested")
                print("❌ Swipe unique constraint not working")
                return False
            except asyncpg.UniqueViolationError:
                pass  # Expected behavior

            # Cleanup
            await self.connection.execute("DELETE FROM swipes WHERE id = $1", test_swipe_id)
            await self.connection.execute("DELETE FROM events WHERE id = $1", test_event_id)
            await self.connection.execute("DELETE FROM users WHERE id = $1", test_user_id)

            print("✅ Swipes CRUD operations work")
            return True

        except Exception as e:
            print(f"❌ Swipes CRUD test failed: {e}")
            return False

    async def test_friendships_crud(self) -> bool:
        """Test friendships table operations"""
        try:
            # Create test users
            user1_id = str(uuid.uuid4())
            user2_id = str(uuid.uuid4())

            await self.connection.execute("""
                INSERT INTO users (id, email, full_name) VALUES
                ($1, $2, $3), ($4, $5, $6)
            """, user1_id, f"user1_{uuid.uuid4().hex[:8]}@godo.app", "User 1",
                user2_id, f"user2_{uuid.uuid4().hex[:8]}@godo.app", "User 2")

            # Test friendship creation
            friendship_id = str(uuid.uuid4())
            await self.connection.execute("""
                INSERT INTO friendships (id, user_id, friend_user_id, status)
                VALUES ($1, $2, $3, $4)
            """, friendship_id, user1_id, user2_id, "pending")

            # Test are_friends function
            are_friends_result = await self.connection.fetchval("""
                SELECT are_friends($1, $2)
            """, user1_id, user2_id)

            if are_friends_result:  # Should be false for pending friendship
                print("❌ are_friends function incorrect for pending friendship")
                return False

            # Accept friendship
            await self.connection.execute("""
                UPDATE friendships SET status = 'accepted' WHERE id = $1
            """, friendship_id)

            # Test are_friends function again
            are_friends_result = await self.connection.fetchval("""
                SELECT are_friends($1, $2)
            """, user1_id, user2_id)

            if not are_friends_result:
                print("❌ are_friends function incorrect for accepted friendship")
                return False

            # Cleanup
            await self.connection.execute("DELETE FROM friendships WHERE id = $1", friendship_id)
            await self.connection.execute("DELETE FROM users WHERE id IN ($1, $2)", user1_id, user2_id)

            print("✅ Friendships CRUD operations work")
            return True

        except Exception as e:
            print(f"❌ Friendships CRUD test failed: {e}")
            return False

    async def test_constraint_violations(self) -> bool:
        """Test that database constraints are properly enforced"""
        try:
            test_user_id = str(uuid.uuid4())
            test_email = f"test_{uuid.uuid4().hex[:8]}@godo.app"

            # Test email uniqueness constraint
            await self.connection.execute("""
                INSERT INTO users (id, email, full_name)
                VALUES ($1, $2, $3)
            """, test_user_id, test_email, "Test User")

            try:
                await self.connection.execute("""
                    INSERT INTO users (id, email, full_name)
                    VALUES ($1, $2, $3)
                """, str(uuid.uuid4()), test_email, "Another User")
                print("❌ Email uniqueness constraint not working")
                return False
            except asyncpg.UniqueViolationError:
                pass  # Expected

            # Test age constraint
            try:
                await self.connection.execute("""
                    UPDATE users SET age = 15 WHERE id = $1
                """, test_user_id)
                print("❌ Age constraint not working")
                return False
            except asyncpg.CheckViolationError:
                pass  # Expected

            # Test enum constraint
            try:
                await self.connection.execute("""
                    UPDATE users SET privacy_level = 'invalid' WHERE id = $1
                """, test_user_id)
                print("❌ Enum constraint not working")
                return False
            except asyncpg.DataError:
                pass  # Expected

            # Cleanup
            await self.connection.execute("DELETE FROM users WHERE id = $1", test_user_id)

            print("✅ Database constraints working properly")
            return True

        except Exception as e:
            print(f"❌ Constraint test failed: {e}")
            return False

    async def test_trigger_functionality(self) -> bool:
        """Test that triggers are working correctly"""
        try:
            test_user_id = str(uuid.uuid4())
            test_email = f"test_{uuid.uuid4().hex[:8]}@godo.app"

            # Insert user
            await self.connection.execute("""
                INSERT INTO users (id, email, full_name)
                VALUES ($1, $2, $3)
            """, test_user_id, test_email, "Test User")

            # Get initial updated_at
            initial_time = await self.connection.fetchval("""
                SELECT updated_at FROM users WHERE id = $1
            """, test_user_id)

            # Wait a moment then update
            await asyncio.sleep(0.1)
            await self.connection.execute("""
                UPDATE users SET full_name = 'Updated Name' WHERE id = $1
            """, test_user_id)

            # Get new updated_at
            updated_time = await self.connection.fetchval("""
                SELECT updated_at FROM users WHERE id = $1
            """, test_user_id)

            if updated_time <= initial_time:
                print("❌ updated_at trigger not working")
                return False

            # Cleanup
            await self.connection.execute("DELETE FROM users WHERE id = $1", test_user_id)

            print("✅ Triggers working correctly")
            return True

        except Exception as e:
            print(f"❌ Trigger test failed: {e}")
            return False

    async def test_performance_indexes(self) -> bool:
        """Test that indexes are providing performance benefits"""
        try:
            # Test event discovery query performance
            import time

            start_time = time.time()
            events = await self.connection.fetch("""
                SELECT id FROM events
                WHERE is_active = true
                AND moderation_status = 'approved'
                AND date_time > NOW()
                LIMIT 10
            """)
            query_time = time.time() - start_time

            if query_time > 0.1:  # Should be very fast with indexes
                print(f"❌ Event discovery query too slow: {query_time:.3f}s")
                return False

            # Test location-based query
            start_time = time.time()
            nearby_events = await self.connection.fetch("""
                SELECT id FROM events
                WHERE ST_DWithin(
                    location_point,
                    ST_SetSRID(ST_MakePoint(-73.9857, 40.7484), 4326),
                    1000
                )
                LIMIT 10
            """)
            location_query_time = time.time() - start_time

            if location_query_time > 0.1:
                print(f"❌ Location query too slow: {location_query_time:.3f}s")
                return False

            print("✅ Index performance acceptable")
            return True

        except Exception as e:
            print(f"❌ Performance test failed: {e}")
            return False

    async def test_data_integrity(self) -> bool:
        """Test referential integrity and data consistency"""
        try:
            # Create test data with relationships
            user_id = str(uuid.uuid4())
            event_id = str(uuid.uuid4())

            await self.connection.execute("""
                INSERT INTO users (id, email, full_name)
                VALUES ($1, $2, $3)
            """, user_id, f"test_{uuid.uuid4().hex[:8]}@godo.app", "Test User")

            await self.connection.execute("""
                INSERT INTO events (id, title, date_time, location_name, category, source)
                VALUES ($1, $2, $3, $4, $5, $6)
            """, event_id, "Test Event", datetime.now() + timedelta(days=1),
                "Test Venue", "networking", "manual")

            # Create swipe
            swipe_id = str(uuid.uuid4())
            await self.connection.execute("""
                INSERT INTO swipes (id, user_id, event_id, direction, action)
                VALUES ($1, $2, $3, $4, $5)
            """, swipe_id, user_id, event_id, "right", "going_private")

            # Test cascade delete - deleting event should delete swipe
            await self.connection.execute("DELETE FROM events WHERE id = $1", event_id)

            swipe_exists = await self.connection.fetchval("""
                SELECT id FROM swipes WHERE id = $1
            """, swipe_id)

            if swipe_exists:
                print("❌ Cascade delete not working")
                return False

            # Cleanup
            await self.connection.execute("DELETE FROM users WHERE id = $1", user_id)

            print("✅ Data integrity constraints working")
            return True

        except Exception as e:
            print(f"❌ Data integrity test failed: {e}")
            return False

    async def run_all_tests(self) -> Dict[str, bool]:
        """Run all database tests"""
        tests = {
            "Connection": self.test_connection,
            "Extensions": self.test_extensions,
            "Tables Exist": self.test_tables_exist,
            "Enums Exist": self.test_enums_exist,
            "Indexes Exist": self.test_indexes_exist,
            "RLS Enabled": self.test_rls_enabled,
            "Triggers Exist": self.test_triggers_exist,
            "Functions Exist": self.test_functions_exist,
            "Users CRUD": self.test_basic_crud_users,
            "Events CRUD": self.test_basic_crud_events,
            "Swipes CRUD": self.test_basic_crud_swipes,
            "Friendships CRUD": self.test_friendships_crud,
            "Constraints": self.test_constraint_violations,
            "Triggers": self.test_trigger_functionality,
            "Performance": self.test_performance_indexes,
            "Data Integrity": self.test_data_integrity,
        }

        results = {}
        print("🧪 Running Database Tests...\n")

        for test_name, test_func in tests.items():
            print(f"Running {test_name}...")
            try:
                results[test_name] = await test_func()
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                results[test_name] = False
            print()

        return results

    def print_results_summary(self, results: Dict[str, bool]):
        """Print a summary of test results"""
        total_tests = len(results)
        passed_tests = sum(results.values())
        failed_tests = total_tests - passed_tests

        print("=" * 50)
        print("📊 DATABASE TEST SUMMARY")
        print("=" * 50)
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")

        if failed_tests > 0:
            print("\n❌ Failed Tests:")
            for test_name, passed in results.items():
                if not passed:
                    print(f"  - {test_name}")

        print("=" * 50)
        return failed_tests == 0


async def main():
    parser = argparse.ArgumentParser(description="Test database setup")
    parser.add_argument("--db-url", type=str, help="Database URL")
    parser.add_argument("--supabase-url", type=str, help="Supabase URL")
    parser.add_argument("--supabase-key", type=str, help="Supabase Anon Key")
    parser.add_argument("--run-all", action="store_true", help="Run all tests")

    args = parser.parse_args()

    # Get credentials
    db_url = args.db_url or os.getenv("DATABASE_URL")
    supabase_url = args.supabase_url or os.getenv("EXPO_PUBLIC_SUPABASE_URL")
    supabase_key = args.supabase_key or os.getenv("EXPO_PUBLIC_SUPABASE_ANON_KEY")

    if not db_url:
        print("Error: DATABASE_URL required")
        return False

    # Create tester
    tester = DatabaseTester(db_url, supabase_url, supabase_key)

    try:
        await tester.connect()

        if args.run_all:
            results = await tester.run_all_tests()
            success = tester.print_results_summary(results)
            return success
        else:
            # Run basic connectivity test
            connection_ok = await tester.test_connection()
            if connection_ok:
                print("✅ Database connection successful!")
                return True
            else:
                print("❌ Database connection failed!")
                return False

    except Exception as e:
        print(f"Error: {e}")
        return False
    finally:
        await tester.disconnect()


if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)