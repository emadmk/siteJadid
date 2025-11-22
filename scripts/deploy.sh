#!/bin/bash

# Enterprise E-commerce Platform - One-Click Deployment Script
# This script automates the entire deployment process

set -e

echo "=========================================="
echo "  Enterprise E-commerce Platform"
echo "  One-Click Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Copying from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created. Please update it with your credentials.${NC}"
    echo ""
    read -p "Press Enter after updating .env file to continue..."
fi

echo "Step 1: Installing dependencies..."
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

echo "Step 2: Starting Docker services (PostgreSQL, Redis, Elasticsearch)..."
docker-compose up -d postgres redis elasticsearch
echo "Waiting for services to be healthy..."
sleep 10
echo -e "${GREEN}✅ Docker services started${NC}"
echo ""

echo "Step 3: Generating Prisma Client..."
npx prisma generate
echo -e "${GREEN}✅ Prisma Client generated${NC}"
echo ""

echo "Step 4: Running database migrations..."
npx prisma migrate deploy
echo -e "${GREEN}✅ Database migrations completed${NC}"
echo ""

echo "Step 5: Seeding database with sample data..."
npm run prisma:seed
echo -e "${GREEN}✅ Database seeded successfully${NC}"
echo ""

echo "Step 6: Initializing Elasticsearch indices..."
# This will be done on first API call
echo -e "${GREEN}✅ Elasticsearch will initialize on first run${NC}"
echo ""

echo "Step 7: Building Next.js application..."
npm run build
echo -e "${GREEN}✅ Application built successfully${NC}"
echo ""

echo "=========================================="
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "=========================================="
echo ""
echo "To start the application:"
echo "  Development: npm run dev"
echo "  Production:  npm run start"
echo ""
echo "Or use Docker:"
echo "  docker-compose up -d"
echo ""
echo "Access the application at: http://localhost:3000"
echo ""
echo "Test Accounts:"
echo "  Super Admin: superadmin@ecommerce.com / password123"
echo "  Admin:       admin@ecommerce.com / password123"
echo "  Accountant:  accountant@ecommerce.com / password123"
echo "  Customer:    customer@example.com / password123"
echo "  B2B:         b2b@company.com / password123"
echo "  GSA:         gsa@agency.gov / password123"
echo ""
echo "=========================================="
