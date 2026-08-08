#!/usr/bin/env python3
"""
Category CRUD + DELETE guard test suite for Kirano (Postgres)
Tests all scenarios specified in the review request.
"""

import requests
import json

# Base URL from environment
BASE_URL = "https://bd75065f-0fe9-42c3-966d-eee8289d3d0a.preview.emergentagent.com/api"

# Demo credentials
ROYAL_BAKERY_OWNER = {
    "email": "owner@royalbakery.com",
    "password": "password123"
}

SUNRISE_CAFE_OWNER = {
    "email": "owner@sunrisecafe.com",
    "password": "password123"
}

def print_test(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"   {details}")
    print()

def get_auth_token(credentials):
    """Login and return JWT token"""
    try:
        resp = requests.post(f"{BASE_URL}/admin/login", json=credentials, timeout=10)
        if resp.status_code == 200:
            return resp.json().get('token')
        return None
    except Exception as e:
        print(f"Login failed: {e}")
        return None

def test_get_categories():
    """Test GET /api/admin/categories with auth"""
    print("=" * 80)
    print("TEST 1: GET /api/admin/categories")
    print("=" * 80)
    
    all_passed = True
    
    # Test with valid token
    try:
        token = get_auth_token(ROYAL_BAKERY_OWNER)
        if not token:
            print_test("GET /api/admin/categories (setup)", False, "Could not get auth token")
            return False
        
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{BASE_URL}/admin/categories", headers=headers, timeout=10)
        
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:500]}")
        
        if resp.status_code != 200:
            print_test("GET /api/admin/categories (with token)", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            categories = data.get('categories', [])
            
            print(f"Found {len(categories)} categories")
            
            if len(categories) == 0:
                print_test("GET /api/admin/categories (with token)", False, "No categories returned")
                all_passed = False
            else:
                # Check required fields
                cat = categories[0]
                required_fields = ['id', 'tenantId', 'name', 'order', 'icon']
                missing = [f for f in required_fields if f not in cat]
                
                if missing:
                    print_test("GET /api/admin/categories (with token)", False, f"Missing fields: {missing}")
                    all_passed = False
                else:
                    print(f"Sample category: {json.dumps(cat, indent=2)}")
                    print_test("GET /api/admin/categories (with token)", True, f"Returns {len(categories)} categories with all required fields")
    
    except Exception as e:
        print_test("GET /api/admin/categories (with token)", False, f"Exception: {str(e)}")
        all_passed = False
    
    # Test without token (should 401)
    try:
        resp = requests.get(f"{BASE_URL}/admin/categories", timeout=10)
        print(f"Status (no token): {resp.status_code}")
        
        if resp.status_code != 401:
            print_test("GET /api/admin/categories (no token)", False, f"Expected 401, got {resp.status_code}")
            all_passed = False
        else:
            print_test("GET /api/admin/categories (no token)", True, "Returns 401 without token")
    
    except Exception as e:
        print_test("GET /api/admin/categories (no token)", False, f"Exception: {str(e)}")
        all_passed = False
    
    # Test with invalid token (should 401)
    try:
        bad_headers = {"Authorization": "Bearer invalid.token.here"}
        resp = requests.get(f"{BASE_URL}/admin/categories", headers=bad_headers, timeout=10)
        print(f"Status (invalid token): {resp.status_code}")
        
        if resp.status_code != 401:
            print_test("GET /api/admin/categories (invalid token)", False, f"Expected 401, got {resp.status_code}")
            all_passed = False
        else:
            print_test("GET /api/admin/categories (invalid token)", True, "Returns 401 with invalid token")
    
    except Exception as e:
        print_test("GET /api/admin/categories (invalid token)", False, f"Exception: {str(e)}")
        all_passed = False
    
    return all_passed

def test_post_category():
    """Test POST /api/admin/categories with validation"""
    print("=" * 80)
    print("TEST 2: POST /api/admin/categories")
    print("=" * 80)
    
    all_passed = True
    
    token = get_auth_token(ROYAL_BAKERY_OWNER)
    if not token:
        print_test("POST /api/admin/categories (setup)", False, "Could not get auth token")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test creating a category with valid data
    try:
        new_category = {
            "name": "Test Category",
            "icon": "🥤"
        }
        
        resp = requests.post(f"{BASE_URL}/admin/categories", json=new_category, headers=headers, timeout=10)
        print(f"Status (valid data): {resp.status_code}")
        print(f"Response: {resp.text[:500]}")
        
        if resp.status_code != 200:
            print_test("POST /api/admin/categories (valid data)", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            category = data.get('category', {})
            
            # Verify response structure
            required_fields = ['id', 'tenantId', 'name', 'order', 'icon']
            missing = [f for f in required_fields if f not in category]
            
            if missing:
                print_test("POST /api/admin/categories (valid data)", False, f"Missing fields in response: {missing}")
                all_passed = False
            else:
                # Verify order is auto-assigned
                if 'order' not in category or category['order'] is None:
                    print_test("POST /api/admin/categories (order auto-assign)", False, "Order not auto-assigned")
                    all_passed = False
                else:
                    print(f"Created category: {json.dumps(category, indent=2)}")
                    print_test("POST /api/admin/categories (valid data)", True, f"Created category with auto-assigned order: {category['order']}")
                    
                    # Store category ID for later tests
                    global test_category_id
                    test_category_id = category['id']
    
    except Exception as e:
        print_test("POST /api/admin/categories (valid data)", False, f"Exception: {str(e)}")
        all_passed = False
    
    # Test with empty name (should 400)
    try:
        invalid_category = {
            "name": "",
            "icon": "🍹"
        }
        
        resp = requests.post(f"{BASE_URL}/admin/categories", json=invalid_category, headers=headers, timeout=10)
        print(f"Status (empty name): {resp.status_code}")
        print(f"Response: {resp.text[:200]}")
        
        if resp.status_code != 400:
            print_test("POST /api/admin/categories (empty name)", False, f"Expected 400, got {resp.status_code}")
            all_passed = False
        else:
            error_data = resp.json()
            error_msg = error_data.get('error', '')
            
            if 'Missing category name' not in error_msg:
                print_test("POST /api/admin/categories (empty name)", False, f"Wrong error message: {error_msg}")
                all_passed = False
            else:
                print_test("POST /api/admin/categories (empty name)", True, f"Returns 400 with error: {error_msg}")
    
    except Exception as e:
        print_test("POST /api/admin/categories (empty name)", False, f"Exception: {str(e)}")
        all_passed = False
    
    # Test without token (should 401)
    try:
        resp = requests.post(f"{BASE_URL}/admin/categories", json={"name": "Test", "icon": "🍕"}, timeout=10)
        print(f"Status (no token): {resp.status_code}")
        
        if resp.status_code != 401:
            print_test("POST /api/admin/categories (no token)", False, f"Expected 401, got {resp.status_code}")
            all_passed = False
        else:
            print_test("POST /api/admin/categories (no token)", True, "Returns 401 without token")
    
    except Exception as e:
        print_test("POST /api/admin/categories (no token)", False, f"Exception: {str(e)}")
        all_passed = False
    
    return all_passed

def test_put_category():
    """Test PUT /api/admin/categories/:id"""
    print("=" * 80)
    print("TEST 3: PUT /api/admin/categories/:id")
    print("=" * 80)
    
    all_passed = True
    
    token = get_auth_token(ROYAL_BAKERY_OWNER)
    if not token:
        print_test("PUT /api/admin/categories/:id (setup)", False, "Could not get auth token")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # First, get existing categories to find one to update
    try:
        resp = requests.get(f"{BASE_URL}/admin/categories", headers=headers, timeout=10)
        if resp.status_code != 200:
            print_test("PUT /api/admin/categories/:id (setup)", False, "Could not fetch categories")
            return False
        
        categories = resp.json().get('categories', [])
        if not categories:
            print_test("PUT /api/admin/categories/:id (setup)", False, "No categories to update")
            return False
        
        # Use the first category
        category_id = categories[0]['id']
        original_name = categories[0]['name']
        
        print(f"Updating category {category_id} (original name: {original_name})")
        
        # Update the category
        update_data = {
            "name": "Renamed Category",
            "icon": "🍹"
        }
        
        resp = requests.put(f"{BASE_URL}/admin/categories/{category_id}", json=update_data, headers=headers, timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:500]}")
        
        if resp.status_code != 200:
            print_test("PUT /api/admin/categories/:id", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            updated_category = data.get('category', {})
            
            if updated_category.get('name') != "Renamed Category":
                print_test("PUT /api/admin/categories/:id", False, f"Name not updated. Got: {updated_category.get('name')}")
                all_passed = False
            elif updated_category.get('icon') != "🍹":
                print_test("PUT /api/admin/categories/:id", False, f"Icon not updated. Got: {updated_category.get('icon')}")
                all_passed = False
            else:
                print(f"Updated category: {json.dumps(updated_category, indent=2)}")
                print_test("PUT /api/admin/categories/:id", True, "Category updated successfully")
                
                # Verify the update persisted by fetching again
                resp = requests.get(f"{BASE_URL}/admin/categories", headers=headers, timeout=10)
                if resp.status_code == 200:
                    categories = resp.json().get('categories', [])
                    updated = next((c for c in categories if c['id'] == category_id), None)
                    
                    if updated and updated['name'] == "Renamed Category" and updated['icon'] == "🍹":
                        print_test("PUT /api/admin/categories/:id (persistence)", True, "Update persisted correctly")
                    else:
                        print_test("PUT /api/admin/categories/:id (persistence)", False, "Update not persisted")
                        all_passed = False
    
    except Exception as e:
        print_test("PUT /api/admin/categories/:id", False, f"Exception: {str(e)}")
        all_passed = False
    
    return all_passed

def test_delete_empty_category():
    """Test DELETE /api/admin/categories/:id with no products"""
    print("=" * 80)
    print("TEST 4: DELETE /api/admin/categories/:id (empty category)")
    print("=" * 80)
    
    all_passed = True
    
    token = get_auth_token(ROYAL_BAKERY_OWNER)
    if not token:
        print_test("DELETE empty category (setup)", False, "Could not get auth token")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a new category to delete
    try:
        new_category = {
            "name": "Category To Delete",
            "icon": "🗑️"
        }
        
        resp = requests.post(f"{BASE_URL}/admin/categories", json=new_category, headers=headers, timeout=10)
        if resp.status_code != 200:
            print_test("DELETE empty category (setup)", False, "Could not create test category")
            return False
        
        category_id = resp.json()['category']['id']
        print(f"Created test category: {category_id}")
        
        # Delete the category
        resp = requests.delete(f"{BASE_URL}/admin/categories/{category_id}", headers=headers, timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:200]}")
        
        if resp.status_code != 200:
            print_test("DELETE /api/admin/categories/:id (empty)", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            
            if not data.get('ok'):
                print_test("DELETE /api/admin/categories/:id (empty)", False, f"Expected {{ok:true}}, got {data}")
                all_passed = False
            else:
                print_test("DELETE /api/admin/categories/:id (empty)", True, "Empty category deleted successfully")
                
                # Verify it's gone
                resp = requests.get(f"{BASE_URL}/admin/categories", headers=headers, timeout=10)
                if resp.status_code == 200:
                    categories = resp.json().get('categories', [])
                    deleted = next((c for c in categories if c['id'] == category_id), None)
                    
                    if deleted:
                        print_test("DELETE verification", False, "Category still exists after delete")
                        all_passed = False
                    else:
                        print_test("DELETE verification", True, "Category no longer appears in GET")
    
    except Exception as e:
        print_test("DELETE /api/admin/categories/:id (empty)", False, f"Exception: {str(e)}")
        all_passed = False
    
    return all_passed

def test_delete_category_with_products():
    """Test DELETE /api/admin/categories/:id with products (should fail with 400)"""
    print("=" * 80)
    print("TEST 5: DELETE /api/admin/categories/:id (with products - DELETE GUARD)")
    print("=" * 80)
    
    all_passed = True
    
    token = get_auth_token(ROYAL_BAKERY_OWNER)
    if not token:
        print_test("DELETE category with products (setup)", False, "Could not get auth token")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get categories and products
    try:
        resp = requests.get(f"{BASE_URL}/admin/products", headers=headers, timeout=10)
        if resp.status_code != 200:
            print_test("DELETE category with products (setup)", False, "Could not fetch products")
            return False
        
        data = resp.json()
        products = data.get('products', [])
        categories = data.get('categories', [])
        
        if not products or not categories:
            print_test("DELETE category with products (setup)", False, "No products or categories found")
            return False
        
        # Find a category that has products
        category_with_products = None
        product_count = 0
        
        for cat in categories:
            cat_products = [p for p in products if p.get('categoryId') == cat['id']]
            if cat_products:
                category_with_products = cat
                product_count = len(cat_products)
                break
        
        if not category_with_products:
            print_test("DELETE category with products (setup)", False, "No category with products found")
            return False
        
        category_id = category_with_products['id']
        category_name = category_with_products['name']
        
        print(f"Attempting to delete category '{category_name}' (ID: {category_id}) with {product_count} product(s)")
        
        # Try to delete the category (should fail with 400)
        resp = requests.delete(f"{BASE_URL}/admin/categories/{category_id}", headers=headers, timeout=10)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:500]}")
        
        if resp.status_code != 400:
            print_test("DELETE /api/admin/categories/:id (with products)", False, f"Expected 400, got {resp.status_code}")
            all_passed = False
        else:
            error_data = resp.json()
            error_msg = error_data.get('error', '')
            
            print(f"Error message: {error_msg}")
            
            # Verify error message contains "Cannot delete" and product count
            if "Cannot delete" not in error_msg:
                print_test("DELETE /api/admin/categories/:id (with products)", False, f"Error message missing 'Cannot delete': {error_msg}")
                all_passed = False
            elif str(product_count) not in error_msg:
                print_test("DELETE /api/admin/categories/:id (with products)", False, f"Error message missing product count: {error_msg}")
                all_passed = False
            else:
                print_test("DELETE /api/admin/categories/:id (with products)", True, f"Returns 400 with error: {error_msg}")
                
                # Verify the category was NOT deleted
                resp = requests.get(f"{BASE_URL}/admin/categories", headers=headers, timeout=10)
                if resp.status_code == 200:
                    categories = resp.json().get('categories', [])
                    still_exists = next((c for c in categories if c['id'] == category_id), None)
                    
                    if not still_exists:
                        print_test("DELETE guard verification", False, "Category was deleted despite having products!")
                        all_passed = False
                    else:
                        print_test("DELETE guard verification", True, "Category still exists (not deleted)")
    
    except Exception as e:
        print_test("DELETE /api/admin/categories/:id (with products)", False, f"Exception: {str(e)}")
        all_passed = False
    
    return all_passed

def test_multi_tenant_isolation():
    """Test multi-tenant isolation for categories"""
    print("=" * 80)
    print("TEST 6: MULTI-TENANT ISOLATION")
    print("=" * 80)
    
    all_passed = True
    
    # Login as Royal Bakery owner
    token1 = get_auth_token(ROYAL_BAKERY_OWNER)
    if not token1:
        print_test("Multi-tenant isolation (setup)", False, "Could not login as Royal Bakery owner")
        return False
    
    headers1 = {"Authorization": f"Bearer {token1}"}
    
    # Login as Sunrise Cafe owner
    token2 = get_auth_token(SUNRISE_CAFE_OWNER)
    if not token2:
        print_test("Multi-tenant isolation (setup)", False, "Could not login as Sunrise Cafe owner")
        return False
    
    headers2 = {"Authorization": f"Bearer {token2}"}
    
    try:
        # Get Royal Bakery categories
        resp1 = requests.get(f"{BASE_URL}/admin/categories", headers=headers1, timeout=10)
        if resp1.status_code != 200:
            print_test("Multi-tenant isolation", False, "Could not fetch Royal Bakery categories")
            return False
        
        royal_categories = resp1.json().get('categories', [])
        royal_category_ids = set(c['id'] for c in royal_categories)
        
        print(f"Royal Bakery has {len(royal_categories)} categories")
        
        # Get Sunrise Cafe categories
        resp2 = requests.get(f"{BASE_URL}/admin/categories", headers=headers2, timeout=10)
        if resp2.status_code != 200:
            print_test("Multi-tenant isolation", False, "Could not fetch Sunrise Cafe categories")
            return False
        
        cafe_categories = resp2.json().get('categories', [])
        cafe_category_ids = set(c['id'] for c in cafe_categories)
        
        print(f"Sunrise Cafe has {len(cafe_categories)} categories")
        
        # Check for cross-leak
        cross_leak = royal_category_ids & cafe_category_ids
        
        if cross_leak:
            print_test("Multi-tenant isolation (GET)", False, f"Found {len(cross_leak)} categories shared between tenants (data leak!)")
            all_passed = False
        else:
            print_test("Multi-tenant isolation (GET)", True, "No cross-tenant data leak in GET")
        
        # Try to update a Royal Bakery category using Sunrise Cafe token
        if royal_categories:
            royal_cat_id = royal_categories[0]['id']
            royal_cat_name = royal_categories[0]['name']
            
            print(f"Attempting to update Royal Bakery category '{royal_cat_name}' (ID: {royal_cat_id}) using Sunrise Cafe token")
            
            update_data = {
                "name": "Hacked Category Name"
            }
            
            resp = requests.put(f"{BASE_URL}/admin/categories/{royal_cat_id}", json=update_data, headers=headers2, timeout=10)
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text[:200]}")
            
            # Verify the update had no effect
            resp_verify = requests.get(f"{BASE_URL}/admin/categories", headers=headers1, timeout=10)
            if resp_verify.status_code == 200:
                royal_categories_after = resp_verify.json().get('categories', [])
                target_cat = next((c for c in royal_categories_after if c['id'] == royal_cat_id), None)
                
                if target_cat and target_cat['name'] == "Hacked Category Name":
                    print_test("Multi-tenant isolation (PUT)", False, "Sunrise Cafe owner was able to update Royal Bakery category!")
                    all_passed = False
                else:
                    print_test("Multi-tenant isolation (PUT)", True, "Cross-tenant update had no effect (404 or no change)")
        
        # Try to delete a Royal Bakery category using Sunrise Cafe token
        if royal_categories:
            royal_cat_id = royal_categories[0]['id']
            
            print(f"Attempting to delete Royal Bakery category (ID: {royal_cat_id}) using Sunrise Cafe token")
            
            resp = requests.delete(f"{BASE_URL}/admin/categories/{royal_cat_id}", headers=headers2, timeout=10)
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text[:200]}")
            
            # Verify the category still exists
            resp_verify = requests.get(f"{BASE_URL}/admin/categories", headers=headers1, timeout=10)
            if resp_verify.status_code == 200:
                royal_categories_after = resp_verify.json().get('categories', [])
                still_exists = next((c for c in royal_categories_after if c['id'] == royal_cat_id), None)
                
                if not still_exists:
                    print_test("Multi-tenant isolation (DELETE)", False, "Sunrise Cafe owner was able to delete Royal Bakery category!")
                    all_passed = False
                else:
                    print_test("Multi-tenant isolation (DELETE)", True, "Cross-tenant delete had no effect")
    
    except Exception as e:
        print_test("Multi-tenant isolation", False, f"Exception: {str(e)}")
        all_passed = False
    
    return all_passed

def test_regression():
    """Test regression - ensure nothing else is broken"""
    print("=" * 80)
    print("TEST 7: REGRESSION TESTS")
    print("=" * 80)
    
    all_passed = True
    
    # Test 1: Seed idempotency
    try:
        resp = requests.post(f"{BASE_URL}/seed", timeout=30)
        print(f"POST /api/seed: {resp.status_code}")
        
        if resp.status_code != 200:
            print_test("Seed idempotency", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            # Second call should return seeded:false
            if data.get('seeded') == False:
                print_test("Seed idempotency", True, "Returns {seeded:false} on second call")
            else:
                print_test("Seed idempotency", True, "Seed endpoint working")
    
    except Exception as e:
        print_test("Seed idempotency", False, f"Exception: {str(e)}")
        all_passed = False
    
    # Test 2: Checkout with INR formatting
    try:
        # Get a product
        resp = requests.get(f"{BASE_URL}/tenant/royalbakery", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            products = data.get('products', [])
            
            if products:
                product = products[0]
                
                checkout_data = {
                    "tenantSlug": "royalbakery",
                    "customer": {
                        "name": "Test Customer",
                        "phone": "15551234567",
                        "address": "123 Test St"
                    },
                    "mode": "delivery",
                    "items": [
                        {
                            "name": product['name'],
                            "qty": 2,
                            "unitPrice": product['price']
                        }
                    ]
                }
                
                resp = requests.post(f"{BASE_URL}/checkout", json=checkout_data, timeout=10)
                print(f"POST /api/checkout: {resp.status_code}")
                
                if resp.status_code != 200:
                    print_test("Checkout INR formatting", False, f"Expected 200, got {resp.status_code}")
                    all_passed = False
                else:
                    data = resp.json()
                    whatsapp_url = data.get('whatsappUrl', '')
                    
                    # Check for wa.me URL
                    if not whatsapp_url.startswith('https://wa.me/'):
                        print_test("Checkout INR formatting", False, "WhatsApp URL format incorrect")
                        all_passed = False
                    else:
                        # Decode and check for ₹ symbol
                        from urllib.parse import unquote
                        if '?text=' in whatsapp_url:
                            decoded = unquote(whatsapp_url.split('?text=')[1])
                            
                            if '₹' not in decoded:
                                print_test("Checkout INR formatting", False, "WhatsApp message missing ₹ symbol")
                                all_passed = False
                            else:
                                print_test("Checkout INR formatting", True, "Returns wa.me URL with ₹ formatted message")
    
    except Exception as e:
        print_test("Checkout INR formatting", False, f"Exception: {str(e)}")
        all_passed = False
    
    # Test 3: Signup with cloud_kitchen template
    try:
        import time
        timestamp = int(time.time())
        
        signup_data = {
            "template": "cloud_kitchen",
            "businessName": f"Test Cloud Kitchen {timestamp}",
            "ownerName": "Test Owner",
            "email": f"test{timestamp}@cloudkitchen.com",
            "password": "password123",
            "whatsappNumber": "15550001234"
        }
        
        resp = requests.post(f"{BASE_URL}/signup", json=signup_data, timeout=15)
        print(f"POST /api/signup (cloud_kitchen): {resp.status_code}")
        
        if resp.status_code != 200:
            print_test("Signup cloud_kitchen template", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            
            if 'token' not in data:
                print_test("Signup cloud_kitchen template", False, "No token in response")
                all_passed = False
            else:
                # Verify starter products
                tenant = data.get('tenant', {})
                slug = tenant.get('slug')
                
                if slug:
                    resp2 = requests.get(f"{BASE_URL}/tenant/{slug}", timeout=10)
                    if resp2.status_code == 200:
                        tenant_data = resp2.json()
                        products = tenant_data.get('products', [])
                        
                        if len(products) > 0:
                            print_test("Signup cloud_kitchen template", True, f"Returns token + {len(products)} starter products")
                        else:
                            print_test("Signup cloud_kitchen template", False, "No starter products created")
                            all_passed = False
    
    except Exception as e:
        print_test("Signup cloud_kitchen template", False, f"Exception: {str(e)}")
        all_passed = False
    
    return all_passed

def main():
    print("\n" + "=" * 80)
    print("KIRANO CATEGORY CRUD + DELETE GUARD TEST SUITE")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print("=" * 80 + "\n")
    
    results = {}
    
    # Run all tests
    results['get_categories'] = test_get_categories()
    results['post_category'] = test_post_category()
    results['put_category'] = test_put_category()
    results['delete_empty'] = test_delete_empty_category()
    results['delete_with_products'] = test_delete_category_with_products()
    results['multi_tenant'] = test_multi_tenant_isolation()
    results['regression'] = test_regression()
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name.upper()}")
    
    all_passed = all(results.values())
    
    print("\n" + "=" * 80)
    if all_passed:
        print("✅ ALL TESTS PASSED")
    else:
        print("❌ SOME TESTS FAILED")
    print("=" * 80 + "\n")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit(main())
