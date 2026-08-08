#!/usr/bin/env python3
"""
Comprehensive backend API test suite for Kirano food-ordering SaaS (Postgres migration)
Tests all critical scenarios as specified in the review request.
"""

import requests
import json
import time
from urllib.parse import unquote

# Base URL from environment
BASE_URL = "https://bd75065f-0fe9-42c3-966d-eee8289d3d0a.preview.emergentagent.com/api"

# Test data
TEMPLATES = ['bakery', 'home_baker', 'florist', 'gift_shop', 'tiffin', 'cloud_kitchen', 'office_space']

def print_test(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"   {details}")
    print()

def test_seed():
    """Test POST /api/seed - should be idempotent"""
    print("=" * 80)
    print("TEST 1: SEED ENDPOINT")
    print("=" * 80)
    
    try:
        # First seed call
        resp = requests.post(f"{BASE_URL}/seed", timeout=30)
        print(f"First seed call: {resp.status_code}")
        print(f"Response: {resp.text[:200]}")
        
        if resp.status_code != 200:
            print_test("POST /api/seed (first call)", False, f"Expected 200, got {resp.status_code}")
            return False
        
        data = resp.json()
        print(f"Seed response: {json.dumps(data, indent=2)}")
        
        # Second seed call - should return seeded:false (idempotent)
        resp2 = requests.post(f"{BASE_URL}/seed", timeout=30)
        print(f"Second seed call: {resp2.status_code}")
        
        if resp2.status_code != 200:
            print_test("POST /api/seed (idempotent)", False, f"Expected 200, got {resp2.status_code}")
            return False
        
        data2 = resp2.json()
        print(f"Second seed response: {json.dumps(data2, indent=2)}")
        
        print_test("POST /api/seed", True, "Seed endpoint working, idempotent")
        return True
        
    except Exception as e:
        print_test("POST /api/seed", False, f"Exception: {str(e)}")
        return False

def test_public_storefront():
    """Test public storefront endpoints"""
    print("=" * 80)
    print("TEST 2: PUBLIC STOREFRONT ENDPOINTS")
    print("=" * 80)
    
    all_passed = True
    
    # Test GET /api/tenants
    try:
        resp = requests.get(f"{BASE_URL}/tenants", timeout=10)
        print(f"GET /api/tenants: {resp.status_code}")
        
        if resp.status_code != 200:
            print_test("GET /api/tenants", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            tenants = data.get('tenants', [])
            print(f"Found {len(tenants)} tenants")
            
            if len(tenants) < 2:
                print_test("GET /api/tenants", False, f"Expected at least 2 tenants, got {len(tenants)}")
                all_passed = False
            else:
                # Check for required fields
                tenant = tenants[0]
                required_fields = ['slug', 'name', 'primaryColor', 'banner']
                missing = [f for f in required_fields if f not in tenant]
                
                if missing:
                    print_test("GET /api/tenants", False, f"Missing fields: {missing}")
                    all_passed = False
                else:
                    print_test("GET /api/tenants", True, f"Returns {len(tenants)} tenants with correct fields")
    except Exception as e:
        print_test("GET /api/tenants", False, f"Exception: {str(e)}")
        all_passed = False
    
    # Test GET /api/tenant/royalbakery
    try:
        resp = requests.get(f"{BASE_URL}/tenant/royalbakery", timeout=10)
        print(f"GET /api/tenant/royalbakery: {resp.status_code}")
        
        if resp.status_code != 200:
            print_test("GET /api/tenant/royalbakery", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            tenant = data.get('tenant', {})
            categories = data.get('categories', [])
            products = data.get('products', [])
            
            print(f"Tenant: {tenant.get('name')}")
            print(f"Categories: {len(categories)}")
            print(f"Products: {len(products)}")
            
            if len(categories) < 4:
                print_test("GET /api/tenant/royalbakery", False, f"Expected 4 categories, got {len(categories)}")
                all_passed = False
            elif len(products) < 6:
                print_test("GET /api/tenant/royalbakery", False, f"Expected 6+ products, got {len(products)}")
                all_passed = False
            else:
                print_test("GET /api/tenant/royalbakery", True, f"Returns tenant with {len(categories)} categories and {len(products)} products")
                
                # Store a product ID for next test
                if products:
                    product_id = products[0]['id']
                    
                    # Test GET /api/tenant/royalbakery/product/:id
                    resp = requests.get(f"{BASE_URL}/tenant/royalbakery/product/{product_id}", timeout=10)
                    print(f"GET /api/tenant/royalbakery/product/{product_id}: {resp.status_code}")
                    
                    if resp.status_code != 200:
                        print_test("GET /api/tenant/:slug/product/:id", False, f"Expected 200, got {resp.status_code}")
                        all_passed = False
                    else:
                        data = resp.json()
                        product = data.get('product', {})
                        tenant_info = data.get('tenant', {})
                        
                        if not product or not tenant_info:
                            print_test("GET /api/tenant/:slug/product/:id", False, "Missing product or tenant in response")
                            all_passed = False
                        else:
                            print_test("GET /api/tenant/:slug/product/:id", True, f"Returns product '{product.get('name')}' with minimal tenant info")
    except Exception as e:
        print_test("GET /api/tenant/royalbakery", False, f"Exception: {str(e)}")
        all_passed = False
    
    # Test GET /api/tenant/nonexistent (should 404)
    try:
        resp = requests.get(f"{BASE_URL}/tenant/nonexistent", timeout=10)
        print(f"GET /api/tenant/nonexistent: {resp.status_code}")
        
        if resp.status_code != 404:
            print_test("GET /api/tenant/nonexistent", False, f"Expected 404, got {resp.status_code}")
            all_passed = False
        else:
            print_test("GET /api/tenant/nonexistent", True, "Returns 404 for non-existent tenant")
    except Exception as e:
        print_test("GET /api/tenant/nonexistent", False, f"Exception: {str(e)}")
        all_passed = False
    
    # Test GET /api/tenant/royalbakery/product/bad-id (should 404)
    try:
        resp = requests.get(f"{BASE_URL}/tenant/royalbakery/product/bad-id-12345", timeout=10)
        print(f"GET /api/tenant/royalbakery/product/bad-id: {resp.status_code}")
        
        if resp.status_code != 404:
            print_test("GET /api/tenant/:slug/product/bad-id", False, f"Expected 404, got {resp.status_code}")
            all_passed = False
        else:
            print_test("GET /api/tenant/:slug/product/bad-id", True, "Returns 404 for non-existent product")
    except Exception as e:
        print_test("GET /api/tenant/:slug/product/bad-id", False, f"Exception: {str(e)}")
        all_passed = False
    
    return all_passed

def test_signup_flow():
    """Test signup with all 7 templates"""
    print("=" * 80)
    print("TEST 3: SIGNUP FLOW (7 TEMPLATES)")
    print("=" * 80)
    
    all_passed = True
    timestamp = int(time.time())
    
    for i, template in enumerate(TEMPLATES):
        try:
            signup_data = {
                "template": template,
                "businessName": f"Test {template.title()} {timestamp}",
                "tagline": f"Best {template} in town",
                "ownerName": f"Owner {i+1}",
                "email": f"owner{timestamp}{i}@test{template}.com",
                "password": "password123",
                "whatsappNumber": f"1555000{i:04d}",
                "phone": f"+1 555 000 {i:04d}",
                "address": f"{i+1} Test Street"
            }
            
            resp = requests.post(f"{BASE_URL}/signup", json=signup_data, timeout=15)
            print(f"POST /api/signup ({template}): {resp.status_code}")
            
            if resp.status_code != 200:
                print_test(f"Signup with {template} template", False, f"Expected 200, got {resp.status_code}: {resp.text[:200]}")
                all_passed = False
                continue
            
            data = resp.json()
            
            # Verify response structure
            if 'token' not in data or 'user' not in data or 'tenant' not in data:
                print_test(f"Signup with {template} template", False, "Missing token, user, or tenant in response")
                all_passed = False
                continue
            
            tenant = data['tenant']
            if 'slug' not in tenant or 'name' not in tenant or 'primaryColor' not in tenant:
                print_test(f"Signup with {template} template", False, "Missing required tenant fields")
                all_passed = False
                continue
            
            print(f"   Created tenant: {tenant['slug']} with color {tenant['primaryColor']}")
            
            # Verify tenant was created with correct template data
            slug = tenant['slug']
            resp2 = requests.get(f"{BASE_URL}/tenant/{slug}", timeout=10)
            
            if resp2.status_code != 200:
                print_test(f"Signup with {template} template", False, f"Tenant not accessible after signup")
                all_passed = False
                continue
            
            tenant_data = resp2.json()
            categories = tenant_data.get('categories', [])
            products = tenant_data.get('products', [])
            
            print(f"   Tenant has {len(categories)} categories and {len(products)} products")
            
            if len(categories) == 0 or len(products) == 0:
                print_test(f"Signup with {template} template", False, "No starter categories or products created")
                all_passed = False
            else:
                print_test(f"Signup with {template} template", True, f"Created tenant with {len(categories)} categories, {len(products)} products")
        
        except Exception as e:
            print_test(f"Signup with {template} template", False, f"Exception: {str(e)}")
            all_passed = False
    
    # Test duplicate email (should 409)
    try:
        duplicate_data = {
            "template": "bakery",
            "businessName": "Duplicate Test",
            "ownerName": "Duplicate Owner",
            "email": f"owner{timestamp}0@testbakery.com",  # Same as first signup
            "password": "password123",
            "whatsappNumber": "15550009999"
        }
        
        resp = requests.post(f"{BASE_URL}/signup", json=duplicate_data, timeout=10)
        print(f"POST /api/signup (duplicate email): {resp.status_code}")
        
        if resp.status_code != 409:
            print_test("Signup with duplicate email", False, f"Expected 409, got {resp.status_code}")
            all_passed = False
        else:
            print_test("Signup with duplicate email", True, "Returns 409 for duplicate email")
    except Exception as e:
        print_test("Signup with duplicate email", False, f"Exception: {str(e)}")
        all_passed = False
    
    # Test short password (should 400)
    try:
        short_pw_data = {
            "template": "bakery",
            "businessName": "Short PW Test",
            "ownerName": "Test Owner",
            "email": f"shortpw{timestamp}@test.com",
            "password": "12345",  # Only 5 chars
            "whatsappNumber": "15550009998"
        }
        
        resp = requests.post(f"{BASE_URL}/signup", json=short_pw_data, timeout=10)
        print(f"POST /api/signup (short password): {resp.status_code}")
        
        if resp.status_code != 400:
            print_test("Signup with password < 6 chars", False, f"Expected 400, got {resp.status_code}")
            all_passed = False
        else:
            print_test("Signup with password < 6 chars", True, "Returns 400 for short password")
    except Exception as e:
        print_test("Signup with password < 6 chars", False, f"Exception: {str(e)}")
        all_passed = False
    
    return all_passed

def test_checkout_inr():
    """Test checkout with INR formatting in WhatsApp URL"""
    print("=" * 80)
    print("TEST 4: CHECKOUT + INR WHATSAPP URL")
    print("=" * 80)
    
    all_passed = True
    
    # First get a product from Royal Bakery
    try:
        resp = requests.get(f"{BASE_URL}/tenant/royalbakery", timeout=10)
        if resp.status_code != 200:
            print_test("Checkout test setup", False, "Could not fetch Royal Bakery products")
            return False
        
        data = resp.json()
        products = data.get('products', [])
        tenant = data.get('tenant', {})
        
        if not products:
            print_test("Checkout test setup", False, "No products found")
            return False
        
        product = products[0]
        print(f"Using product: {product['name']} at price {product['price']}")
        
        # Create a valid checkout
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
        print(f"Response: {resp.text[:500]}")
        
        if resp.status_code != 200:
            print_test("POST /api/checkout", False, f"Expected 200, got {resp.status_code}: {resp.text[:200]}")
            all_passed = False
        else:
            data = resp.json()
            
            # Verify response structure
            if 'orderId' not in data or 'whatsappUrl' not in data or 'total' not in data:
                print_test("POST /api/checkout", False, "Missing orderId, whatsappUrl, or total in response")
                all_passed = False
            else:
                whatsapp_url = data['whatsappUrl']
                total = data['total']
                
                print(f"Order ID: {data['orderId']}")
                print(f"Total: {total}")
                print(f"WhatsApp URL: {whatsapp_url[:100]}...")
                
                # Check WhatsApp URL format
                if not whatsapp_url.startswith('https://wa.me/'):
                    print_test("WhatsApp URL format", False, "URL does not start with https://wa.me/")
                    all_passed = False
                else:
                    # Decode the message
                    if '?text=' in whatsapp_url:
                        encoded_message = whatsapp_url.split('?text=')[1]
                        decoded_message = unquote(encoded_message)
                        
                        print(f"\nDecoded WhatsApp message:\n{decoded_message}\n")
                        
                        # CRITICAL CHECK: Must contain ₹ symbol
                        if '₹' not in decoded_message:
                            print_test("WhatsApp message INR format", False, "Message does not contain ₹ symbol (uses $ instead)")
                            all_passed = False
                        else:
                            # Check for Indian locale formatting (comma separator)
                            # For amounts >= 1000, should have comma (e.g., ₹1,199)
                            if total >= 1000:
                                # Look for pattern like ₹1,199 or ₹2,500
                                import re
                                inr_pattern = r'₹[\d,]+'
                                matches = re.findall(inr_pattern, decoded_message)
                                
                                if not matches:
                                    print_test("WhatsApp message INR format", False, "No INR amounts found in message")
                                    all_passed = False
                                else:
                                    # Check if any amount >= 1000 has comma
                                    has_comma_format = any(',' in m for m in matches if int(m.replace('₹', '').replace(',', '')) >= 1000)
                                    
                                    if not has_comma_format:
                                        print_test("WhatsApp message INR format", False, "INR amounts not using Indian locale formatting (missing comma separator)")
                                        all_passed = False
                                    else:
                                        print_test("WhatsApp message INR format", True, f"Contains ₹ symbol with Indian locale formatting: {matches}")
                            else:
                                print_test("WhatsApp message INR format", True, "Contains ₹ symbol")
                    else:
                        print_test("WhatsApp URL format", False, "URL missing ?text= parameter")
                        all_passed = False
                
                print_test("POST /api/checkout", True, f"Order created with ID {data['orderId']}")
        
        # Test minimum order enforcement
        min_order = tenant.get('minOrder', 199)
        print(f"\nTesting min order enforcement (minOrder: {min_order})")
        
        low_checkout_data = {
            "tenantSlug": "royalbakery",
            "customer": {
                "name": "Test Customer",
                "phone": "15551234567"
            },
            "mode": "pickup",
            "items": [
                {
                    "name": "Test Item",
                    "qty": 1,
                    "unitPrice": min_order - 50  # Below minimum
                }
            ]
        }
        
        resp = requests.post(f"{BASE_URL}/checkout", json=low_checkout_data, timeout=10)
        print(f"POST /api/checkout (below min): {resp.status_code}")
        
        if resp.status_code != 400:
            print_test("Minimum order enforcement", False, f"Expected 400, got {resp.status_code}")
            all_passed = False
        else:
            error_data = resp.json()
            error_msg = error_data.get('error', '')
            print(f"Error message: {error_msg}")
            
            # Check if error message contains ₹ symbol
            if '₹' not in error_msg and 'Minimum order' in error_msg:
                print_test("Minimum order enforcement", False, f"Error message uses wrong currency (should use ₹): {error_msg}")
                all_passed = False
            else:
                print_test("Minimum order enforcement", True, f"Returns 400 with error: {error_msg}")
    
    except Exception as e:
        print_test("POST /api/checkout", False, f"Exception: {str(e)}")
        all_passed = False
    
    return all_passed

def test_admin_auth():
    """Test admin authentication and JWT-protected endpoints"""
    print("=" * 80)
    print("TEST 5: ADMIN AUTH + JWT-PROTECTED ENDPOINTS")
    print("=" * 80)
    
    all_passed = True
    
    # Test login with correct credentials
    try:
        login_data = {
            "email": "owner@royalbakery.com",
            "password": "password123"
        }
        
        resp = requests.post(f"{BASE_URL}/admin/login", json=login_data, timeout=10)
        print(f"POST /api/admin/login (correct): {resp.status_code}")
        
        if resp.status_code != 200:
            print_test("POST /api/admin/login", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
            return False
        
        data = resp.json()
        
        if 'token' not in data:
            print_test("POST /api/admin/login", False, "No token in response")
            all_passed = False
            return False
        
        token = data['token']
        print(f"Token received: {token[:50]}...")
        print_test("POST /api/admin/login", True, "Login successful with token")
        
        # Test login with bad password
        bad_login_data = {
            "email": "owner@royalbakery.com",
            "password": "wrongpassword"
        }
        
        resp = requests.post(f"{BASE_URL}/admin/login", json=bad_login_data, timeout=10)
        print(f"POST /api/admin/login (bad password): {resp.status_code}")
        
        if resp.status_code != 401:
            print_test("POST /api/admin/login (bad password)", False, f"Expected 401, got {resp.status_code}")
            all_passed = False
        else:
            print_test("POST /api/admin/login (bad password)", True, "Returns 401 for bad password")
        
        # Test GET /api/admin/me with token
        headers = {"Authorization": f"Bearer {token}"}
        
        resp = requests.get(f"{BASE_URL}/admin/me", headers=headers, timeout=10)
        print(f"GET /api/admin/me (with token): {resp.status_code}")
        
        if resp.status_code != 200:
            print_test("GET /api/admin/me (with token)", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            if 'user' not in data or 'tenant' not in data:
                print_test("GET /api/admin/me (with token)", False, "Missing user or tenant in response")
                all_passed = False
            else:
                print_test("GET /api/admin/me (with token)", True, f"Returns user and tenant info")
        
        # Test GET /api/admin/me without token
        resp = requests.get(f"{BASE_URL}/admin/me", timeout=10)
        print(f"GET /api/admin/me (no token): {resp.status_code}")
        
        if resp.status_code != 401:
            print_test("GET /api/admin/me (no token)", False, f"Expected 401, got {resp.status_code}")
            all_passed = False
        else:
            print_test("GET /api/admin/me (no token)", True, "Returns 401 without token")
        
        # Test GET /api/admin/products
        resp = requests.get(f"{BASE_URL}/admin/products", headers=headers, timeout=10)
        print(f"GET /api/admin/products: {resp.status_code}")
        
        if resp.status_code != 200:
            print_test("GET /api/admin/products", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            products = data.get('products', [])
            categories = data.get('categories', [])
            print(f"Found {len(products)} products and {len(categories)} categories")
            print_test("GET /api/admin/products", True, f"Returns {len(products)} products, {len(categories)} categories")
        
        # Test POST /api/admin/products (create)
        new_product = {
            "name": "Test Product",
            "description": "Test description",
            "price": 999,
            "categoryId": categories[0]['id'] if categories else None
        }
        
        resp = requests.post(f"{BASE_URL}/admin/products", json=new_product, headers=headers, timeout=10)
        print(f"POST /api/admin/products: {resp.status_code}")
        
        if resp.status_code != 200:
            print_test("POST /api/admin/products", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            created_product = data.get('product', {})
            product_id = created_product.get('id')
            print(f"Created product ID: {product_id}")
            print_test("POST /api/admin/products", True, f"Product created with ID {product_id}")
            
            # Test PUT /api/admin/products/:id (update)
            update_data = {
                "name": "Updated Test Product",
                "price": 1299
            }
            
            resp = requests.put(f"{BASE_URL}/admin/products/{product_id}", json=update_data, headers=headers, timeout=10)
            print(f"PUT /api/admin/products/{product_id}: {resp.status_code}")
            
            if resp.status_code != 200:
                print_test("PUT /api/admin/products/:id", False, f"Expected 200, got {resp.status_code}")
                all_passed = False
            else:
                print_test("PUT /api/admin/products/:id", True, "Product updated")
            
            # Verify update
            resp = requests.get(f"{BASE_URL}/admin/products", headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                products = data.get('products', [])
                updated = next((p for p in products if p['id'] == product_id), None)
                if updated and updated['name'] == "Updated Test Product":
                    print_test("Product update verification", True, "Update persisted correctly")
                else:
                    print_test("Product update verification", False, "Update not persisted")
                    all_passed = False
            
            # Test DELETE /api/admin/products/:id
            resp = requests.delete(f"{BASE_URL}/admin/products/{product_id}", headers=headers, timeout=10)
            print(f"DELETE /api/admin/products/{product_id}: {resp.status_code}")
            
            if resp.status_code != 200:
                print_test("DELETE /api/admin/products/:id", False, f"Expected 200, got {resp.status_code}")
                all_passed = False
            else:
                print_test("DELETE /api/admin/products/:id", True, "Product deleted")
        
        # Test GET /api/admin/orders
        resp = requests.get(f"{BASE_URL}/admin/orders", headers=headers, timeout=10)
        print(f"GET /api/admin/orders: {resp.status_code}")
        
        if resp.status_code != 200:
            print_test("GET /api/admin/orders", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            orders = data.get('orders', [])
            print(f"Found {len(orders)} orders")
            print_test("GET /api/admin/orders", True, f"Returns {len(orders)} orders")
        
        # Test GET /api/admin/analytics
        resp = requests.get(f"{BASE_URL}/admin/analytics", headers=headers, timeout=10)
        print(f"GET /api/admin/analytics: {resp.status_code}")
        
        if resp.status_code != 200:
            print_test("GET /api/admin/analytics", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            days = data.get('days', [])
            top = data.get('top', [])
            totals = data.get('totals', {})
            
            if len(days) != 7:
                print_test("GET /api/admin/analytics", False, f"Expected 7 days, got {len(days)}")
                all_passed = False
            else:
                print(f"Analytics: {len(days)} days, {len(top)} top products, totals: {totals}")
                print_test("GET /api/admin/analytics", True, "Returns 7 days of analytics with top products and totals")
        
        # Test PUT /api/admin/tenant
        tenant_update = {
            "tagline": "Updated tagline for testing",
            "minOrder": 250
        }
        
        resp = requests.put(f"{BASE_URL}/admin/tenant", json=tenant_update, headers=headers, timeout=10)
        print(f"PUT /api/admin/tenant: {resp.status_code}")
        
        if resp.status_code != 200:
            print_test("PUT /api/admin/tenant", False, f"Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            print_test("PUT /api/admin/tenant", True, "Tenant settings updated")
            
            # Verify update persisted
            resp = requests.get(f"{BASE_URL}/tenant/royalbakery", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                tenant = data.get('tenant', {})
                if tenant.get('tagline') == "Updated tagline for testing":
                    print_test("Tenant update verification", True, "Update persisted via public endpoint")
                else:
                    print_test("Tenant update verification", False, f"Update not persisted. Got tagline: {tenant.get('tagline')}")
                    all_passed = False
    
    except Exception as e:
        print_test("Admin auth tests", False, f"Exception: {str(e)}")
        all_passed = False
    
    return all_passed

def test_multi_tenant_isolation():
    """Test multi-tenant isolation"""
    print("=" * 80)
    print("TEST 6: MULTI-TENANT ISOLATION")
    print("=" * 80)
    
    all_passed = True
    
    try:
        # Login as Royal Bakery owner
        login1 = {
            "email": "owner@royalbakery.com",
            "password": "password123"
        }
        
        resp1 = requests.post(f"{BASE_URL}/admin/login", json=login1, timeout=10)
        if resp1.status_code != 200:
            print_test("Multi-tenant test setup", False, "Could not login as Royal Bakery owner")
            return False
        
        token1 = resp1.json()['token']
        headers1 = {"Authorization": f"Bearer {token1}"}
        
        # Login as Sunrise Cafe owner
        login2 = {
            "email": "owner@sunrisecafe.com",
            "password": "password123"
        }
        
        resp2 = requests.post(f"{BASE_URL}/admin/login", json=login2, timeout=10)
        if resp2.status_code != 200:
            print_test("Multi-tenant test setup", False, "Could not login as Sunrise Cafe owner")
            return False
        
        token2 = resp2.json()['token']
        headers2 = {"Authorization": f"Bearer {token2}"}
        
        # Get products for Royal Bakery
        resp = requests.get(f"{BASE_URL}/admin/products", headers=headers1, timeout=10)
        if resp.status_code != 200:
            print_test("Multi-tenant isolation", False, "Could not fetch Royal Bakery products")
            return False
        
        bakery_products = resp.json()['products']
        bakery_product_ids = set(p['id'] for p in bakery_products)
        print(f"Royal Bakery has {len(bakery_products)} products")
        
        # Get products for Sunrise Cafe
        resp = requests.get(f"{BASE_URL}/admin/products", headers=headers2, timeout=10)
        if resp.status_code != 200:
            print_test("Multi-tenant isolation", False, "Could not fetch Sunrise Cafe products")
            return False
        
        cafe_products = resp.json()['products']
        cafe_product_ids = set(p['id'] for p in cafe_products)
        print(f"Sunrise Cafe has {len(cafe_products)} products")
        
        # Check for cross-leak
        cross_leak = bakery_product_ids & cafe_product_ids
        
        if cross_leak:
            print_test("Multi-tenant isolation", False, f"Found {len(cross_leak)} products shared between tenants (data leak!)")
            all_passed = False
        else:
            print_test("Multi-tenant isolation", True, "No cross-tenant data leak detected")
    
    except Exception as e:
        print_test("Multi-tenant isolation", False, f"Exception: {str(e)}")
        all_passed = False
    
    return all_passed

def main():
    print("\n" + "=" * 80)
    print("KIRANO FOOD-ORDERING SAAS - POSTGRES MIGRATION TEST SUITE")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print("=" * 80 + "\n")
    
    results = {}
    
    # Run all tests
    results['seed'] = test_seed()
    results['storefront'] = test_public_storefront()
    results['signup'] = test_signup_flow()
    results['checkout'] = test_checkout_inr()
    results['admin'] = test_admin_auth()
    results['isolation'] = test_multi_tenant_isolation()
    
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
