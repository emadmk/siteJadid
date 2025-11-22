#!/bin/bash

###############################################################################
# SafetyPro E-commerce - Deployment Testing Script
# Tests all services and endpoints after deployment
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Functions
log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Banner
echo -e "${GREEN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           SafetyPro Deployment Test Suite                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

APP_URL="${APP_URL:-http://localhost:3000}"
log_info "Testing application at: $APP_URL\n"

# Test 1: Check Docker Services
log_test "Checking Docker services..."
if docker-compose ps | grep -q "Up"; then
    log_pass "Docker services are running"
else
    log_fail "Docker services are not running"
fi

# Test 2: PostgreSQL Health
log_test "Testing PostgreSQL connection..."
if docker-compose exec -T postgres pg_isready >/dev/null 2>&1; then
    log_pass "PostgreSQL is healthy"
else
    log_fail "PostgreSQL is not healthy"
fi

# Test 3: PostgreSQL Database Exists
log_test "Checking if database exists..."
if docker-compose exec -T postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw "ecommerce_db\|safetypro"; then
    log_pass "Database exists"
else
    log_fail "Database does not exist"
fi

# Test 4: Redis Health
log_test "Testing Redis connection..."
if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
    log_pass "Redis is healthy"
else
    log_fail "Redis is not responding"
fi

# Test 5: Elasticsearch Health (if configured)
if docker-compose ps | grep -q elasticsearch; then
    log_test "Testing Elasticsearch health..."
    if curl -s http://localhost:9200/_cluster/health | grep -q "green\|yellow"; then
        log_pass "Elasticsearch is healthy"
    else
        log_fail "Elasticsearch is not healthy"
    fi
fi

# Test 6: Application Health Endpoint
log_test "Testing application health endpoint..."
if curl -f -s "$APP_URL/api/health" >/dev/null 2>&1; then
    log_pass "Application health endpoint responding"
else
    log_fail "Application health endpoint not responding"
fi

# Test 7: Homepage Loads
log_test "Testing homepage..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/")
if [ "$HTTP_CODE" = "200" ]; then
    log_pass "Homepage loads successfully (HTTP $HTTP_CODE)"
else
    log_fail "Homepage failed to load (HTTP $HTTP_CODE)"
fi

# Test 8: Products API
log_test "Testing products API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/products")
if [ "$HTTP_CODE" = "200" ]; then
    log_pass "Products API responding (HTTP $HTTP_CODE)"
else
    log_fail "Products API failed (HTTP $HTTP_CODE)"
fi

# Test 9: Cart API (requires auth, should return 401)
log_test "Testing cart API (auth required)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/cart")
if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "200" ]; then
    log_pass "Cart API responding correctly (HTTP $HTTP_CODE)"
else
    log_fail "Cart API unexpected response (HTTP $HTTP_CODE)"
fi

# Test 10: Categories API
log_test "Testing categories API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/categories")
if [ "$HTTP_CODE" = "200" ]; then
    log_pass "Categories API responding (HTTP $HTTP_CODE)"
else
    log_fail "Categories API failed (HTTP $HTTP_CODE)"
fi

# Test 11: Check Prisma Client
log_test "Checking Prisma Client generation..."
if [ -d "node_modules/.prisma/client" ]; then
    log_pass "Prisma Client is generated"
else
    log_fail "Prisma Client not found"
fi

# Test 12: Check Environment Variables
log_test "Checking critical environment variables..."
if [ -f ".env" ]; then
    MISSING_VARS=()

    # Check required variables
    grep -q "DATABASE_URL=" .env || MISSING_VARS+=("DATABASE_URL")
    grep -q "NEXTAUTH_SECRET=" .env || MISSING_VARS+=("NEXTAUTH_SECRET")

    if [ ${#MISSING_VARS[@]} -eq 0 ]; then
        log_pass "All critical environment variables present"
    else
        log_fail "Missing environment variables: ${MISSING_VARS[*]}"
    fi
else
    log_fail ".env file not found"
fi

# Test 13: Check Node Modules
log_test "Checking node_modules..."
if [ -d "node_modules" ]; then
    log_pass "Dependencies are installed"
else
    log_fail "node_modules directory not found"
fi

# Test 14: Check Build Output
log_test "Checking Next.js build..."
if [ -d ".next" ]; then
    log_pass "Next.js build exists"
else
    log_fail "Next.js build not found (.next directory)"
fi

# Test 15: Check Static Pages
log_test "Testing static pages..."
PAGES=("/products" "/auth/signin" "/cart" "/orders")
FAILED_PAGES=()

for PAGE in "${PAGES[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL$PAGE")
    if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "302" ]; then
        FAILED_PAGES+=("$PAGE")
    fi
done

if [ ${#FAILED_PAGES[@]} -eq 0 ]; then
    log_pass "All static pages accessible"
else
    log_fail "Failed pages: ${FAILED_PAGES[*]}"
fi

# Test 16: Database Tables
log_test "Checking database tables..."
TABLE_COUNT=$(docker-compose exec -T postgres psql -U postgres -d ecommerce_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';" 2>/dev/null | tr -d ' ')

if [ "$TABLE_COUNT" -gt 20 ]; then
    log_pass "Database has $TABLE_COUNT tables"
else
    log_fail "Database has insufficient tables ($TABLE_COUNT)"
fi

# Test 17: Check for Sample Data (if seeded)
log_test "Checking for sample data..."
PRODUCT_COUNT=$(docker-compose exec -T postgres psql -U postgres -d ecommerce_db -t -c "SELECT COUNT(*) FROM products;" 2>/dev/null | tr -d ' ')

if [ "$PRODUCT_COUNT" -gt 0 ]; then
    log_pass "Database contains $PRODUCT_COUNT products"
else
    log_fail "No products found in database"
fi

# Test 18: Check Disk Space
log_test "Checking disk space..."
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    log_pass "Disk usage is acceptable ($DISK_USAGE%)"
else
    log_fail "Disk usage is high ($DISK_USAGE%)"
fi

# Test 19: Check Memory Usage
log_test "Checking Docker memory usage..."
MEM_USAGE=$(docker stats --no-stream --format "{{.MemPerc}}" | head -1 | sed 's/%//')
if [ -n "$MEM_USAGE" ]; then
    log_pass "Docker containers running (Memory: ~${MEM_USAGE}%)"
else
    log_fail "Unable to check Docker memory usage"
fi

# Test 20: Response Time Check
log_test "Checking API response time..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$APP_URL/api/health")
if [ "$(echo "$RESPONSE_TIME < 2" | bc)" -eq 1 ]; then
    log_pass "API responds quickly (${RESPONSE_TIME}s)"
else
    log_fail "API response time slow (${RESPONSE_TIME}s)"
fi

# Summary
echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   Test Results Summary                       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "  Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "  Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "  Failed: ${RED}$FAILED_TESTS${NC}"

SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")
echo -e "  Success Rate: ${YELLOW}${SUCCESS_RATE}%${NC}\n"

if [ "$FAILED_TESTS" -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Deployment is successful!${NC}\n"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please review the errors above.${NC}\n"
    exit 1
fi
