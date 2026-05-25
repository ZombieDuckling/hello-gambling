#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

GREEN='\033[0;32m'
GOLD='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${GOLD}  ██╗  ██╗███████╗██╗     ██╗      ██████╗      ${NC}"
echo -e "${GOLD}  ██║  ██║██╔════╝██║     ██║     ██╔═══██╗     ${NC}"
echo -e "${GOLD}  ███████║█████╗  ██║     ██║     ██║   ██║     ${NC}"
echo -e "${GOLD}  ██╔══██║██╔══╝  ██║     ██║     ██║   ██║     ${NC}"
echo -e "${GOLD}  ██║  ██║███████╗███████╗███████╗╚██████╔╝     ${NC}"
echo -e "${GREEN}  ╔═╗╔═╗╔╦╗╔╗ ╦  ╦╔╗╔╔═╗          ${NC}"
echo -e "${GREEN}  ║ ╦╠═╣║║║╠╩╗║  ║║║║║ ╦          ${NC}"
echo -e "${GREEN}  ╚═╝╩ ╩╩ ╩╚═╝╩═╝╩╝╚╝╚═╝          ${NC}"
echo ""
echo -e "${GREEN}  SA Gambling Complaints Platform${NC}"
echo ""

# ── 1. Check Docker ──────────────────────────────────────────────────────────
echo "🐳 Checking Docker..."
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running. Please start Docker Desktop and try again.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"

# ── 2. Start PostgreSQL ───────────────────────────────────────────────────────
echo ""
echo "🐘 Starting PostgreSQL..."
docker-compose up -d

# ── 3. Wait for database ──────────────────────────────────────────────────────
echo "⏳ Waiting for database..."
MAX_WAIT=30
COUNT=0
until docker exec hello-gambling-db pg_isready -U hellogambling -p 5432 -q 2>/dev/null; do
  COUNT=$((COUNT + 1))
  if [ "$COUNT" -ge "$MAX_WAIT" ]; then
    echo -e "${RED}❌ Database did not become ready in time.${NC}"
    exit 1
  fi
  printf "."
  sleep 1
done
echo ""
echo -e "${GREEN}✓ Database is ready${NC}"

# ── 4. Load environment ───────────────────────────────────────────────────────
set -a
# shellcheck disable=SC1091
source .env.local
set +a

# ── 5. Install dependencies ───────────────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  echo ""
  echo "📦 Installing dependencies (first run only)..."
  npm install
  echo -e "${GREEN}✓ Dependencies installed${NC}"
fi

# ── 5. Generate Prisma client ─────────────────────────────────────────────────
echo ""
echo "⚙️  Generating Prisma client..."
npx prisma generate 2>/dev/null
echo -e "${GREEN}✓ Prisma client ready${NC}"

# ── 6. Push schema ────────────────────────────────────────────────────────────
echo ""
echo "🗄️  Applying database schema..."
npx prisma db push --skip-generate
echo -e "${GREEN}✓ Database schema up to date${NC}"

# ── 7. Seed on first run ──────────────────────────────────────────────────────
SEED_CHECK=$(docker exec hello-gambling-db psql -U hellogambling -d hellogambling -tAc "SELECT COUNT(*) FROM operators;" 2>/dev/null || echo "0")
if [ "$SEED_CHECK" = "0" ] || [ -z "$SEED_CHECK" ]; then
  echo ""
  echo "🌱 Seeding database with SA operators and sample data..."
  npx tsx prisma/seed.ts
  echo -e "${GREEN}✓ Database seeded${NC}"
fi

# ── 8. Launch ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${GOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Hello, Gambling is ready!${NC}"
echo ""
echo -e "  🌐 Open: ${GOLD}http://localhost:3000${NC}"
echo ""
echo -e "  📧 Test Accounts:"
echo -e "     Consumer: ${GOLD}consumer@test.com${NC} / consumer123"
echo -e "     Operator: ${GOLD}operator@hollywoodbets.com${NC} / operator123"
echo -e "     Admin:    ${GOLD}admin@hellogambling.co.za${NC} / admin123"
echo ""
echo -e "  ⚠️  Responsible Gambling Helpline: ${GOLD}0800 006 008${NC}"
echo -e "${GOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

npm run dev
