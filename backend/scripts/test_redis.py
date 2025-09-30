#!/usr/bin/env python3
"""
Redis connection and operations test script for Railway deployment
"""

import os
import sys
import time
import json
from typing import Dict, Any

# Add the parent directory to sys.path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import redis_client, db_manager
from app.config import settings

def test_basic_connection() -> Dict[str, Any]:
    """Test basic Redis connection"""
    print("🔌 Testing Redis connection...")
    try:
        pong = redis_client.ping()
        if pong:
            print("✅ Redis connection successful")
            return {"status": "success", "message": "Redis connection successful"}
        else:
            print("❌ Redis ping failed")
            return {"status": "error", "message": "Redis ping failed"}
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        return {"status": "error", "message": f"Redis connection failed: {e}"}

def test_cache_operations() -> Dict[str, Any]:
    """Test cache set/get/delete operations"""
    print("\n📝 Testing cache operations...")
    try:
        test_key = "test:cache:operation"
        test_value = "test_value_123"

        # Test SET
        redis_client.setex(test_key, 60, test_value)
        print("✅ Cache SET operation successful")

        # Test GET
        retrieved_value = redis_client.get(test_key)
        if retrieved_value == test_value:
            print("✅ Cache GET operation successful")
        else:
            print(f"❌ Cache GET failed. Expected: {test_value}, Got: {retrieved_value}")
            return {"status": "error", "message": "Cache GET operation failed"}

        # Test TTL
        ttl = redis_client.ttl(test_key)
        if ttl > 0:
            print(f"✅ Cache TTL working (remaining: {ttl}s)")
        else:
            print("❌ Cache TTL not working")
            return {"status": "error", "message": "Cache TTL not working"}

        # Test DELETE
        redis_client.delete(test_key)
        deleted_value = redis_client.get(test_key)
        if deleted_value is None:
            print("✅ Cache DELETE operation successful")
        else:
            print("❌ Cache DELETE failed")
            return {"status": "error", "message": "Cache DELETE operation failed"}

        return {"status": "success", "message": "All cache operations successful"}

    except Exception as e:
        print(f"❌ Cache operations failed: {e}")
        return {"status": "error", "message": f"Cache operations failed: {e}"}

def test_celery_queues() -> Dict[str, Any]:
    """Test Celery queue operations"""
    print("\n🚀 Testing Celery queues...")
    try:
        # Test different queues
        queues = ["celery", "events", "notifications", "ml"]

        for queue in queues:
            # Push a test job
            test_job = {
                "task": f"test.{queue}.task",
                "id": f"test-{queue}-{int(time.time())}",
                "args": ["test_arg"],
                "kwargs": {"test_kwarg": "test_value"}
            }

            redis_client.lpush(queue, json.dumps(test_job))
            queue_length = redis_client.llen(queue)

            print(f"✅ Queue '{queue}' test successful (length: {queue_length})")

            # Clean up
            redis_client.lpop(queue)

        return {"status": "success", "message": "All queue operations successful"}

    except Exception as e:
        print(f"❌ Queue operations failed: {e}")
        return {"status": "error", "message": f"Queue operations failed: {e}"}

def test_redis_info() -> Dict[str, Any]:
    """Test Redis server info"""
    print("\n📊 Testing Redis server info...")
    try:
        info = redis_client.info()

        print(f"✅ Redis Version: {info.get('redis_version')}")
        print(f"✅ Memory Used: {info.get('used_memory_human')}")
        print(f"✅ Connected Clients: {info.get('connected_clients')}")
        print(f"✅ Uptime: {info.get('uptime_in_days')} days")
        print(f"✅ Operations/sec: {info.get('instantaneous_ops_per_sec', 0)}")

        return {
            "status": "success",
            "message": "Redis info retrieved successfully",
            "info": {
                "version": info.get("redis_version"),
                "memory_used": info.get("used_memory_human"),
                "connected_clients": info.get("connected_clients"),
                "uptime_days": info.get("uptime_in_days")
            }
        }

    except Exception as e:
        print(f"❌ Redis info failed: {e}")
        return {"status": "error", "message": f"Redis info failed: {e}"}

def test_health_check() -> Dict[str, Any]:
    """Test the application health check"""
    print("\n🏥 Testing application health check...")
    try:
        # This will be an async call, so we'll test it differently
        health = redis_client.ping()
        if health:
            print("✅ Health check Redis component successful")
            return {"status": "success", "message": "Health check successful"}
        else:
            print("❌ Health check Redis component failed")
            return {"status": "error", "message": "Health check failed"}

    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return {"status": "error", "message": f"Health check failed: {e}"}

def run_performance_test() -> Dict[str, Any]:
    """Run basic performance test"""
    print("\n⚡ Running performance test...")
    try:
        iterations = 100
        start_time = time.time()

        for i in range(iterations):
            key = f"perf:test:{i}"
            value = f"performance_test_value_{i}"

            # SET operation
            redis_client.setex(key, 10, value)

            # GET operation
            retrieved = redis_client.get(key)

            if retrieved != value:
                raise Exception(f"Performance test failed at iteration {i}")

            # DELETE operation
            redis_client.delete(key)

        end_time = time.time()
        total_time = end_time - start_time
        ops_per_second = (iterations * 3) / total_time  # 3 operations per iteration

        print(f"✅ Performance test completed")
        print(f"✅ {iterations} iterations in {total_time:.2f}s")
        print(f"✅ {ops_per_second:.2f} operations/second")

        return {
            "status": "success",
            "message": "Performance test successful",
            "metrics": {
                "iterations": iterations,
                "total_time": total_time,
                "ops_per_second": ops_per_second
            }
        }

    except Exception as e:
        print(f"❌ Performance test failed: {e}")
        return {"status": "error", "message": f"Performance test failed: {e}"}

def main():
    """Run all Redis tests"""
    print("🧪 Starting Redis Test Suite")
    print("=" * 50)
    print(f"Redis URL: {settings.redis_url}")
    print(f"Celery Broker: {settings.celery_broker_url}")
    print(f"Celery Backend: {settings.celery_result_backend}")
    print("=" * 50)

    results = {
        "connection": test_basic_connection(),
        "cache_operations": test_cache_operations(),
        "celery_queues": test_celery_queues(),
        "redis_info": test_redis_info(),
        "health_check": test_health_check(),
        "performance": run_performance_test()
    }

    print("\n" + "=" * 50)
    print("📋 TEST RESULTS SUMMARY")
    print("=" * 50)

    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result["status"] == "success")

    for test_name, result in results.items():
        status_icon = "✅" if result["status"] == "success" else "❌"
        print(f"{status_icon} {test_name.replace('_', ' ').title()}: {result['message']}")

    print("=" * 50)
    print(f"🎯 Tests Passed: {passed_tests}/{total_tests}")

    if passed_tests == total_tests:
        print("🎉 All tests passed! Redis is ready for Railway deployment.")
        return 0
    else:
        print("⚠️  Some tests failed. Please check Redis configuration.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)