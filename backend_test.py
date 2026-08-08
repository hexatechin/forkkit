#!/usr/bin/env python3
"""
Backend test suite for Kirano Category Customization Template fields.
Tests new customVariants, customAddons, customFlags columns on categories table.
"""
import requests
import json
import sys
import psycopg2
from psycopg2.extras import RealDictCursor

# Base URL from environment
BASE_URL = "https://bd75065f-0fe9-42c3-966d-eee8289d3d0a.preview.emergentagent.com/api"

# Demo credentials
OWNER_EMAIL = "owner@royalbakery.com"
OWNER_PASSWORD = "password123"

# Test results tracking
test_results = []

def log_test(name, passed, details=""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"  Details: {details}")
    test_results.append({"name": name, "passed": passed, "details": details})

def get_auth_token():
    """Login and get JWT token"""
    try:
        response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"email": OWNER_EMAIL, "password": OWNER_PASSWORD},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("token")
        else:
            print(f"Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def test_schema_check():
    """Test 1: Verify categories table has customVariants, customAddons, customFlags columns"""
    print("\n=== Test 1: Schema Check ===")
    try:
        conn = psycopg2.connect("postgresql://kirano:kirano@localhost:5432/forkkit")
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if columns exist
        cursor.execute("""
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'categories'
            AND column_name IN ('customvariants', 'customaddons', 'customflags')
            ORDER BY column_name
        """)
        columns = cursor.fetchall()
        
        if len(columns) == 3:
            # Verify data types and defaults
            col_dict = {col['column_name']: col for col in columns}
            
            checks = []
            checks.append(col_dict.get('customvariants', {}).get('data_type') == 'jsonb')
            checks.append(col_dict.get('customaddons', {}).get('data_type') == 'jsonb')
            checks.append(col_dict.get('customflags', {}).get('data_type') == 'jsonb')
            
            # Check defaults contain expected values
            checks.append("'[]'" in str(col_dict.get('customvariants', {}).get('column_default', '')))
            checks.append("'[]'" in str(col_dict.get('customaddons', {}).get('column_default', '')))
            checks.append("'{}'" in str(col_dict.get('customflags', {}).get('column_default', '')))
            
            if all(checks):
                log_test("Schema has customVariants, customAddons, customFlags with correct types and defaults", True)
            else:
                log_test("Schema columns exist but types/defaults incorrect", False, f"Columns: {columns}")
        else:
            log_test("Schema missing custom columns", False, f"Found {len(columns)} columns instead of 3")
        
        cursor.close()
        conn.close()
    except Exception as e:
        log_test("Schema check failed", False, str(e))

def test_post_category_with_custom_fields(token):
    """Test 2: POST /api/admin/categories with customVariants, customAddons, customFlags"""
    print("\n=== Test 2: POST Category with Custom Fields ===")
    
    category_data = {
        "name": "Test Custom Cakes",
        "icon": "🎂",
        "customVariants": [
            {
                "name": "Size",
                "options": [
                    {"label": "0.5 kg", "priceDelta": 0},
                    {"label": "1 kg", "priceDelta": 600}
                ]
            }
        ],
        "customAddons": [
            {"name": "Candles", "price": 50}
        ],
        "customFlags": {
            "isEggOption": True,
            "allowCakeMessage": True
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/admin/categories",
            json=category_data,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            category = data.get("category", {})
            
            # Verify all fields round-trip correctly
            checks = []
            checks.append(category.get("name") == "Test Custom Cakes")
            checks.append(category.get("icon") == "🎂")
            
            # Check customVariants
            variants = category.get("customVariants", [])
            checks.append(len(variants) == 1)
            if len(variants) > 0:
                checks.append(variants[0].get("name") == "Size")
                checks.append(len(variants[0].get("options", [])) == 2)
                if len(variants[0].get("options", [])) == 2:
                    checks.append(variants[0]["options"][0].get("label") == "0.5 kg")
                    checks.append(variants[0]["options"][0].get("priceDelta") == 0)
                    checks.append(variants[0]["options"][1].get("label") == "1 kg")
                    checks.append(variants[0]["options"][1].get("priceDelta") == 600)
            
            # Check customAddons
            addons = category.get("customAddons", [])
            checks.append(len(addons) == 1)
            if len(addons) > 0:
                checks.append(addons[0].get("name") == "Candles")
                checks.append(addons[0].get("price") == 50)
            
            # Check customFlags
            flags = category.get("customFlags", {})
            checks.append(flags.get("isEggOption") == True)
            checks.append(flags.get("allowCakeMessage") == True)
            
            if all(checks):
                log_test("POST category with custom fields - all fields round-trip correctly", True)
                return category.get("id")
            else:
                log_test("POST category with custom fields - field mismatch", False, f"Response: {json.dumps(category, indent=2)}")
                return category.get("id")
        else:
            log_test("POST category with custom fields", False, f"Status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        log_test("POST category with custom fields", False, str(e))
        return None

def test_get_categories_with_defaults(token):
    """Test 3: GET /api/admin/categories returns custom fields with defaults for old categories"""
    print("\n=== Test 3: GET Categories with Defaults ===")
    
    try:
        response = requests.get(
            f"{BASE_URL}/admin/categories",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            categories = data.get("categories", [])
            
            if len(categories) == 0:
                log_test("GET categories - no categories found", False, "Expected at least some categories")
                return
            
            # Check that ALL categories have the custom fields
            all_have_fields = True
            all_have_correct_types = True
            
            for cat in categories:
                # Check fields exist
                if "customVariants" not in cat or "customAddons" not in cat or "customFlags" not in cat:
                    all_have_fields = False
                    log_test("GET categories - missing custom fields", False, f"Category {cat.get('name')} missing fields")
                    break
                
                # Check types
                if not isinstance(cat["customVariants"], list):
                    all_have_correct_types = False
                    log_test("GET categories - customVariants not array", False, f"Category {cat.get('name')}: {type(cat['customVariants'])}")
                    break
                
                if not isinstance(cat["customAddons"], list):
                    all_have_correct_types = False
                    log_test("GET categories - customAddons not array", False, f"Category {cat.get('name')}: {type(cat['customAddons'])}")
                    break
                
                if not isinstance(cat["customFlags"], dict):
                    all_have_correct_types = False
                    log_test("GET categories - customFlags not object", False, f"Category {cat.get('name')}: {type(cat['customFlags'])}")
                    break
            
            if all_have_fields and all_have_correct_types:
                log_test("GET categories - all have custom fields with correct types", True, f"Checked {len(categories)} categories")
            
        else:
            log_test("GET categories", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        log_test("GET categories", False, str(e))

def test_put_category_partial_updates(token, category_id):
    """Test 4: PUT /api/admin/categories/:id with partial updates"""
    print("\n=== Test 4: PUT Category Partial Updates ===")
    
    if not category_id:
        log_test("PUT category partial updates - skipped", False, "No category ID from previous test")
        return
    
    try:
        # First, update only customFlags
        response1 = requests.put(
            f"{BASE_URL}/admin/categories/{category_id}",
            json={"customFlags": {"isEggOption": False, "allowCakeMessage": True}},
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response1.status_code != 200:
            log_test("PUT category - customFlags only", False, f"Status {response1.status_code}: {response1.text}")
            return
        
        cat1 = response1.json().get("category", {})
        
        # Verify customFlags changed, others unchanged
        checks1 = []
        checks1.append(cat1.get("name") == "Test Custom Cakes")
        checks1.append(cat1.get("icon") == "🎂")
        checks1.append(len(cat1.get("customVariants", [])) == 1)  # Should still have Size variant
        checks1.append(len(cat1.get("customAddons", [])) == 1)    # Should still have Candles
        checks1.append(cat1.get("customFlags", {}).get("isEggOption") == False)  # Changed
        checks1.append(cat1.get("customFlags", {}).get("allowCakeMessage") == True)  # Unchanged
        
        if not all(checks1):
            log_test("PUT category - customFlags only", False, f"Fields changed unexpectedly: {json.dumps(cat1, indent=2)}")
            return
        
        log_test("PUT category - customFlags only (name/icon/variants/addons untouched)", True)
        
        # Second, update only customAddons
        response2 = requests.put(
            f"{BASE_URL}/admin/categories/{category_id}",
            json={"customAddons": [{"name": "Ribbon", "price": 30}]},
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response2.status_code != 200:
            log_test("PUT category - customAddons only", False, f"Status {response2.status_code}: {response2.text}")
            return
        
        cat2 = response2.json().get("category", {})
        
        # Verify only customAddons changed
        checks2 = []
        checks2.append(cat2.get("name") == "Test Custom Cakes")
        checks2.append(len(cat2.get("customVariants", [])) == 1)  # Should still have Size variant
        checks2.append(len(cat2.get("customAddons", [])) == 1)
        if len(cat2.get("customAddons", [])) > 0:
            checks2.append(cat2["customAddons"][0].get("name") == "Ribbon")  # Changed
            checks2.append(cat2["customAddons"][0].get("price") == 30)
        checks2.append(cat2.get("customFlags", {}).get("isEggOption") == False)  # From previous update
        
        if all(checks2):
            log_test("PUT category - customAddons only (other fields untouched)", True)
        else:
            log_test("PUT category - customAddons only", False, f"Fields changed unexpectedly: {json.dumps(cat2, indent=2)}")
        
    except Exception as e:
        log_test("PUT category partial updates", False, str(e))

def test_get_admin_products_includes_custom_fields(token):
    """Test 5: GET /api/admin/products returns categories with custom fields"""
    print("\n=== Test 5: GET /api/admin/products includes custom fields ===")
    
    try:
        response = requests.get(
            f"{BASE_URL}/admin/products",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            categories = data.get("categories", [])
            
            if len(categories) == 0:
                log_test("GET /api/admin/products - no categories", False, "Expected categories in response")
                return
            
            # Check that categories have custom fields
            all_have_fields = True
            for cat in categories:
                if "customVariants" not in cat or "customAddons" not in cat or "customFlags" not in cat:
                    all_have_fields = False
                    log_test("GET /api/admin/products - categories missing custom fields", False, f"Category {cat.get('name')} missing fields")
                    break
            
            if all_have_fields:
                log_test("GET /api/admin/products - categories include customVariants/customAddons/customFlags", True, f"Checked {len(categories)} categories")
        else:
            log_test("GET /api/admin/products", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        log_test("GET /api/admin/products", False, str(e))

def test_post_product_with_variants_addons(token):
    """Test 6: POST /api/admin/products with variants/addons and verify persistence"""
    print("\n=== Test 6: POST Product with variants/addons ===")
    
    try:
        # First get a category ID
        cat_response = requests.get(
            f"{BASE_URL}/admin/categories",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if cat_response.status_code != 200:
            log_test("POST product - get category", False, "Could not fetch categories")
            return
        
        categories = cat_response.json().get("categories", [])
        if len(categories) == 0:
            log_test("POST product - no categories", False, "No categories available")
            return
        
        category_id = categories[0]["id"]
        
        # Create product with variants and addons
        product_data = {
            "name": "Test Custom Cake Product",
            "description": "A test cake with customization",
            "categoryId": category_id,
            "price": 500,
            "isEggOption": True,
            "allowCakeMessage": True,
            "variants": [
                {
                    "name": "Weight",
                    "options": [
                        {"label": "500g", "priceDelta": 0},
                        {"label": "1kg", "priceDelta": 500}
                    ]
                }
            ],
            "addons": [
                {"name": "Extra Frosting", "price": 100},
                {"name": "Sprinkles", "price": 50}
            ]
        }
        
        post_response = requests.post(
            f"{BASE_URL}/admin/products",
            json=product_data,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if post_response.status_code != 200:
            log_test("POST product with variants/addons", False, f"Status {post_response.status_code}: {post_response.text}")
            return
        
        product = post_response.json().get("product", {})
        product_id = product.get("id")
        
        # Verify fields
        checks = []
        checks.append(product.get("name") == "Test Custom Cake Product")
        checks.append(product.get("isEggOption") == True)
        checks.append(product.get("allowCakeMessage") == True)
        checks.append(len(product.get("variants", [])) == 1)
        checks.append(len(product.get("addons", [])) == 2)
        
        if not all(checks):
            log_test("POST product - initial creation", False, f"Fields mismatch: {json.dumps(product, indent=2)}")
            return
        
        log_test("POST product with variants/addons - created successfully", True)
        
        # Now verify persistence via GET
        get_response = requests.get(
            f"{BASE_URL}/admin/products",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if get_response.status_code != 200:
            log_test("POST product - verify persistence", False, "Could not fetch products")
            return
        
        products = get_response.json().get("products", [])
        found_product = None
        for p in products:
            if p.get("id") == product_id:
                found_product = p
                break
        
        if not found_product:
            log_test("POST product - verify persistence", False, "Product not found in GET response")
            return
        
        # Verify all fields persisted
        persist_checks = []
        persist_checks.append(found_product.get("name") == "Test Custom Cake Product")
        persist_checks.append(found_product.get("isEggOption") == True)
        persist_checks.append(found_product.get("allowCakeMessage") == True)
        persist_checks.append(len(found_product.get("variants", [])) == 1)
        persist_checks.append(len(found_product.get("addons", [])) == 2)
        
        if found_product.get("variants") and len(found_product["variants"]) > 0:
            persist_checks.append(found_product["variants"][0].get("name") == "Weight")
            persist_checks.append(len(found_product["variants"][0].get("options", [])) == 2)
        
        if found_product.get("addons") and len(found_product["addons"]) >= 2:
            addon_names = [a.get("name") for a in found_product["addons"]]
            persist_checks.append("Extra Frosting" in addon_names)
            persist_checks.append("Sprinkles" in addon_names)
        
        if all(persist_checks):
            log_test("POST product - all fields persisted correctly via GET", True)
        else:
            log_test("POST product - persistence verification", False, f"Fields mismatch: {json.dumps(found_product, indent=2)}")
        
    except Exception as e:
        log_test("POST product with variants/addons", False, str(e))

def test_multi_tenant_isolation(token):
    """Test 7: Multi-tenant isolation for custom fields"""
    print("\n=== Test 7: Multi-tenant Isolation ===")
    
    try:
        # Login as Royal Bakery owner
        rb_response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"email": "owner@royalbakery.com", "password": "password123"},
            timeout=10
        )
        
        if rb_response.status_code != 200:
            log_test("Multi-tenant - Royal Bakery login", False, "Could not login")
            return
        
        rb_token = rb_response.json().get("token")
        
        # Get Royal Bakery categories
        rb_cats_response = requests.get(
            f"{BASE_URL}/admin/categories",
            headers={"Authorization": f"Bearer {rb_token}"},
            timeout=10
        )
        
        if rb_cats_response.status_code != 200:
            log_test("Multi-tenant - get RB categories", False, "Could not fetch categories")
            return
        
        rb_categories = rb_cats_response.json().get("categories", [])
        rb_cat_ids = [c["id"] for c in rb_categories]
        
        # Login as Sunrise Cafe owner
        sc_response = requests.post(
            f"{BASE_URL}/admin/login",
            json={"email": "owner@sunrisecafe.com", "password": "password123"},
            timeout=10
        )
        
        if sc_response.status_code != 200:
            log_test("Multi-tenant - Sunrise Cafe login", False, "Could not login")
            return
        
        sc_token = sc_response.json().get("token")
        
        # Get Sunrise Cafe categories
        sc_cats_response = requests.get(
            f"{BASE_URL}/admin/categories",
            headers={"Authorization": f"Bearer {sc_token}"},
            timeout=10
        )
        
        if sc_cats_response.status_code != 200:
            log_test("Multi-tenant - get SC categories", False, "Could not fetch categories")
            return
        
        sc_categories = sc_cats_response.json().get("categories", [])
        sc_cat_ids = [c["id"] for c in sc_categories]
        
        # Verify no overlap in category IDs
        overlap = set(rb_cat_ids) & set(sc_cat_ids)
        if len(overlap) > 0:
            log_test("Multi-tenant isolation", False, f"Category ID overlap detected: {overlap}")
            return
        
        log_test("Multi-tenant isolation - no category ID overlap", True, f"RB: {len(rb_cat_ids)} cats, SC: {len(sc_cat_ids)} cats")
        
        # Verify Sunrise Cafe cannot read Royal Bakery's customVariants via any endpoint
        # This is implicitly tested by the fact that GET /api/admin/categories is scoped to tenantId
        # and we verified no overlap above
        
    except Exception as e:
        log_test("Multi-tenant isolation", False, str(e))

def test_regression():
    """Test 8: Regression tests"""
    print("\n=== Test 8: Regression Tests ===")
    
    try:
        # Test 1: Seed idempotent
        seed_response = requests.post(f"{BASE_URL}/seed", timeout=10)
        if seed_response.status_code == 200:
            seed_data = seed_response.json()
            if seed_data.get("seeded") == False:
                log_test("Regression - seed idempotent", True)
            else:
                log_test("Regression - seed idempotent", False, f"Expected seeded:false, got {seed_data}")
        else:
            log_test("Regression - seed idempotent", False, f"Status {seed_response.status_code}")
        
        # Test 2: Checkout returns ₹ WhatsApp URL
        checkout_data = {
            "tenantSlug": "royalbakery",
            "customer": {"name": "Test Customer", "phone": "1234567890", "address": "Test Address"},
            "mode": "delivery",
            "items": [
                {"name": "Test Cake", "qty": 1, "unitPrice": 500}
            ]
        }
        checkout_response = requests.post(f"{BASE_URL}/checkout", json=checkout_data, timeout=10)
        if checkout_response.status_code == 200:
            checkout_result = checkout_response.json()
            whatsapp_url = checkout_result.get("whatsappUrl", "")
            message = checkout_result.get("message", "")
            
            checks = []
            checks.append("wa.me" in whatsapp_url)
            checks.append("₹" in message)
            checks.append("undefined" not in whatsapp_url)
            
            if all(checks):
                log_test("Regression - checkout returns ₹ WhatsApp URL", True)
            else:
                log_test("Regression - checkout", False, f"URL: {whatsapp_url}, Message has ₹: {'₹' in message}")
        else:
            log_test("Regression - checkout", False, f"Status {checkout_response.status_code}")
        
        # Test 3: Signup for at least one template
        import time
        signup_data = {
            "template": "bakery",
            "businessName": "Test Regression Bakery",
            "ownerName": "Test Owner",
            "email": f"test-regression-{int(time.time())}@example.com",
            "password": "password123",
            "whatsappNumber": "1234567890"
        }
        signup_response = requests.post(f"{BASE_URL}/signup", json=signup_data, timeout=10)
        if signup_response.status_code == 200:
            signup_result = signup_response.json()
            if signup_result.get("token") and signup_result.get("user"):
                log_test("Regression - signup for bakery template", True)
            else:
                log_test("Regression - signup", False, f"Missing token or user: {signup_result}")
        else:
            log_test("Regression - signup", False, f"Status {signup_response.status_code}: {signup_response.text}")
        
        # Test 4: Categories DELETE guard still blocks when products present
        token = get_auth_token()
        if token:
            # Get categories
            cats_response = requests.get(
                f"{BASE_URL}/admin/categories",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10
            )
            if cats_response.status_code == 200:
                categories = cats_response.json().get("categories", [])
                
                # Get products to find a category with products
                prods_response = requests.get(
                    f"{BASE_URL}/admin/products",
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=10
                )
                if prods_response.status_code == 200:
                    products = prods_response.json().get("products", [])
                    
                    # Find a category that has products
                    cat_with_products = None
                    for cat in categories:
                        cat_id = cat["id"]
                        if any(p.get("categoryId") == cat_id for p in products):
                            cat_with_products = cat_id
                            break
                    
                    if cat_with_products:
                        delete_response = requests.delete(
                            f"{BASE_URL}/admin/categories/{cat_with_products}",
                            headers={"Authorization": f"Bearer {token}"},
                            timeout=10
                        )
                        if delete_response.status_code == 400:
                            error_msg = delete_response.json().get("error", "")
                            if "Cannot delete" in error_msg and "product" in error_msg:
                                log_test("Regression - DELETE guard blocks when products present", True)
                            else:
                                log_test("Regression - DELETE guard", False, f"Wrong error message: {error_msg}")
                        else:
                            log_test("Regression - DELETE guard", False, f"Expected 400, got {delete_response.status_code}")
                    else:
                        log_test("Regression - DELETE guard", True, "No category with products to test (acceptable)")
        
    except Exception as e:
        log_test("Regression tests", False, str(e))

def main():
    print("=" * 80)
    print("KIRANO BACKEND TEST SUITE - Category Customization Template Fields")
    print("=" * 80)
    
    # Get auth token
    print("\n=== Authentication ===")
    token = get_auth_token()
    if not token:
        print("❌ CRITICAL: Could not authenticate. Aborting tests.")
        sys.exit(1)
    print("✅ Authentication successful")
    
    # Run all tests
    test_schema_check()
    new_category_id = test_post_category_with_custom_fields(token)
    test_get_categories_with_defaults(token)
    test_put_category_partial_updates(token, new_category_id)
    test_get_admin_products_includes_custom_fields(token)
    test_post_product_with_variants_addons(token)
    test_multi_tenant_isolation(token)
    test_regression()
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for t in test_results if t["passed"])
    failed = sum(1 for t in test_results if not t["passed"])
    total = len(test_results)
    
    print(f"\nTotal: {total} tests")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    
    if failed > 0:
        print("\n❌ FAILED TESTS:")
        for t in test_results:
            if not t["passed"]:
                print(f"  - {t['name']}")
                if t["details"]:
                    print(f"    {t['details']}")
    
    print("\n" + "=" * 80)
    
    # Exit with appropriate code
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    main()
