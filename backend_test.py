#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class CineVaultAPITester:
    def __init__(self, base_url="https://watchify-767.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = None
        self.test_watchlist_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )
        if success:
            print(f"   TMDB API: {response.get('tmdb_api', 'unknown')}")
            print(f"   OMDB API: {response.get('omdb_api', 'unknown')}")
        return success

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_create_user(self):
        """Test user creation"""
        test_user_data = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "avatar_color": "#6366f1"
        }
        
        success, response = self.run_test(
            "Create User",
            "POST",
            "users",
            200,
            data=test_user_data
        )
        
        if success and 'id' in response:
            self.test_user_id = response['id']
            print(f"   Created user ID: {self.test_user_id}")
        
        return success

    def test_get_users(self):
        """Test getting all users"""
        success, response = self.run_test(
            "Get All Users",
            "GET",
            "users",
            200
        )
        
        if success:
            print(f"   Found {len(response)} users")
        
        return success

    def test_get_user(self):
        """Test getting specific user"""
        if not self.test_user_id:
            print("❌ Skipped - No test user ID available")
            return False
            
        success, response = self.run_test(
            "Get Specific User",
            "GET",
            f"users/{self.test_user_id}",
            200
        )
        return success

    def test_create_watchlist(self):
        """Test watchlist creation"""
        if not self.test_user_id:
            print("❌ Skipped - No test user ID available")
            return False
            
        watchlist_data = {
            "user_id": self.test_user_id,
            "name": f"Test Watchlist {datetime.now().strftime('%H%M%S')}"
        }
        
        success, response = self.run_test(
            "Create Watchlist",
            "POST",
            "watchlists",
            200,
            data=watchlist_data
        )
        
        if success and 'id' in response:
            self.test_watchlist_id = response['id']
            print(f"   Created watchlist ID: {self.test_watchlist_id}")
        
        return success

    def test_get_watchlists(self):
        """Test getting user watchlists"""
        if not self.test_user_id:
            print("❌ Skipped - No test user ID available")
            return False
            
        success, response = self.run_test(
            "Get User Watchlists",
            "GET",
            "watchlists",
            200,
            params={"user_id": self.test_user_id}
        )
        
        if success:
            print(f"   Found {len(response)} watchlists for user")
        
        return success

    def test_add_to_watchlist(self):
        """Test adding item to watchlist"""
        if not self.test_watchlist_id:
            print("❌ Skipped - No test watchlist ID available")
            return False
            
        item_data = {
            "tmdb_id": 550,  # Fight Club
            "media_type": "movie",
            "title": "Fight Club",
            "poster_path": None,
            "status": "plan_to_watch"
        }
        
        success, response = self.run_test(
            "Add Item to Watchlist",
            "POST",
            f"watchlists/{self.test_watchlist_id}/items",
            200,
            data=item_data
        )
        return success

    def test_tmdb_endpoints(self):
        """Test TMDB endpoints (should return empty data)"""
        endpoints = [
            ("Get Genres", "tmdb/genres"),
            ("Get Trending", "tmdb/trending"),
            ("Get Popular Movies", "tmdb/movie/popular"),
            ("Get Popular TV", "tmdb/tv/popular"),
        ]
        
        results = []
        for name, endpoint in endpoints:
            success, response = self.run_test(
                name,
                "GET",
                endpoint,
                200
            )
            results.append(success)
            
            if success and 'results' in response:
                print(f"   Results count: {len(response.get('results', []))}")
        
        return all(results)

    def test_search_endpoint(self):
        """Test search functionality"""
        success, response = self.run_test(
            "Search Movies/TV",
            "GET",
            "tmdb/search",
            200,
            params={"query": "test"}
        )
        
        if success and 'results' in response:
            print(f"   Search results count: {len(response.get('results', []))}")
        
        return success

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test user (this should also delete watchlists)
        if self.test_user_id:
            success, _ = self.run_test(
                "Delete Test User",
                "DELETE",
                f"users/{self.test_user_id}",
                200
            )
            if success:
                print("   Test user deleted successfully")

def main():
    print("🎬 CineVault API Testing Suite")
    print("=" * 50)
    
    tester = CineVaultAPITester()
    
    # Core API Tests
    tests = [
        tester.test_health_check,
        tester.test_root_endpoint,
        tester.test_create_user,
        tester.test_get_users,
        tester.test_get_user,
        tester.test_create_watchlist,
        tester.test_get_watchlists,
        tester.test_add_to_watchlist,
        tester.test_tmdb_endpoints,
        tester.test_search_endpoint,
    ]
    
    # Run all tests
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
    
    # Cleanup
    tester.cleanup_test_data()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())