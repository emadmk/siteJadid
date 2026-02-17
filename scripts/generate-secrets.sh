#!/bin/bash
# ============================================
# Generate strong passwords for all services
# ============================================
# Usage: ./scripts/generate-secrets.sh
# This will output the values - copy them to your .env file
# ============================================

echo "============================================"
echo "  Strong Password Generator for .env"
echo "============================================"
echo ""
echo "Copy these values to your .env file:"
echo ""

# Generate passwords
DB_PASS=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 32)
REDIS_PASS=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 32)
ES_PASS=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9!@#$%' | head -c 32)
NEXTAUTH=$(openssl rand -base64 32)

echo "# Database"
echo "DB_PASSWORD=${DB_PASS}"
echo "POSTGRES_PASSWORD=${DB_PASS}"
echo ""
echo "# Redis"
echo "REDIS_PASSWORD=${REDIS_PASS}"
echo ""
echo "# Elasticsearch"
echo "ELASTICSEARCH_PASSWORD=${ES_PASS}"
echo ""
echo "# NextAuth"
echo "NEXTAUTH_SECRET=${NEXTAUTH}"
echo ""
echo "# Full DATABASE_URL (for .env)"
echo "DATABASE_URL=\"postgresql://siteuser:${DB_PASS}@localhost:5432/sitejadid?schema=public\""
echo ""
echo "============================================"
echo "  IMPORTANT NOTES:"
echo "============================================"
echo "1. Save these passwords somewhere safe (password manager)"
echo "2. NEVER commit .env to git"
echo "3. If you change DB password on running system:"
echo "   - Update .env first"
echo "   - Then run: docker exec -it sitejadid_postgres psql -U siteuser -c \"ALTER USER siteuser PASSWORD 'NEW_PASSWORD';\""
echo "   - Then restart: docker-compose restart"
echo "4. If you change Redis password on running system:"
echo "   - Update .env first"
echo "   - Then restart: docker-compose restart redis app"
echo "============================================"
