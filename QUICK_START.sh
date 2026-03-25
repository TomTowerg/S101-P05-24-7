#!/bin/bash
# Quick Start Guide for Sprint 1 Task 2: SSO Login Implementation

# This script helps you get started with the NextAuth + Google OAuth implementation

echo "🚀 SPRINT 1 TASK 2 - QUICK START SETUP"
echo "========================================"
echo ""

# Step 1: Install dependencies
echo "1️⃣  Installing dependencies..."
npm install @types/node --save-dev

echo ""
echo "✅ Dependencies installed!"
echo ""

# Step 2: Setup environment variables
echo "2️⃣  Generate NEXTAUTH_SECRET..."
echo "Run this command and copy the output to .env.local:"
echo ""
echo "  openssl rand -base64 32"
echo ""
echo "Then add to .env.local:"
echo "  NEXTAUTH_SECRET=<paste-here>"
echo ""

# Step 3: Show .env.local template
echo "3️⃣  Setup .env.local with:"
echo ""
cat > /dev/stdin << 'EOF'
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-here

# Google OAuth (create at https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/parcel_management_db
EOF

echo ""
echo "4️⃣  Create Google OAuth Credentials:"
echo "  1. Go to: https://console.cloud.google.com/"
echo "  2. Create new OAuth 2.0 Client ID (Web application)"
echo "  3. Add redirect URI:"
echo "     http://localhost:3000/api/auth/callback/google"
echo "  4. Copy Client ID and Client Secret to .env.local"
echo ""

# Step 4: Database setup
echo "5️⃣  Setup PostgreSQL Database:"
echo ""
echo "  Option A: Local PostgreSQL"
echo "    # Start PostgreSQL"
echo "    brew services start postgresql  # macOS"
echo "    # Create database"
echo "    createdb parcel_management_db"
echo ""
echo "  Option B: Cloud Database (Recommended)"
echo "    - Railway: https://railway.app"
echo "    - Supabase: https://supabase.com"
echo "    - Vercel Postgres: https://vercel.com/postgres"
echo ""

# Step 6: Prisma migrations
echo "6️⃣  Run Prisma Migrations:"
echo ""
echo "  npx prisma generate"
echo "  npx prisma migrate dev --name init"
echo ""

# Step 7: Start dev server
echo "7️⃣  Start Development Server:"
echo ""
echo "  npm run dev"
echo ""
echo "  Open: http://localhost:3000/login"
echo ""

# Step 8: Testing
echo "8️⃣  Testing Login Flow:"
echo ""
echo "  1. Go to http://localhost:3000/login"
echo "  2. Select role: Resident or Concierge"
echo "  3. Click 'Sign in with Google'"
echo "  4. Complete Google authentication"
echo "  5. You should see the dashboard for your role"
echo ""

# Step 9: View database
echo "9️⃣  View Database (Optional):"
echo ""
echo "  npx prisma studio"
echo ""
echo "  This opens a web interface to view/edit database"
echo ""

# Summary
echo "========================================"
echo "📋 SUMMARY"
echo "========================================"
echo ""
echo "Files to check:"
echo "  ✓ .env.local                   - Environment variables"
echo "  ✓ prisma/schema.prisma         - Database schema"
echo "  ✓ src/app/login/page.tsx       - Login page"
echo "  ✓ src/app/api/auth/[...nextauth]/route.ts  - Auth handler"
echo "  ✓ src/middleware.ts            - Route protection"
echo ""

echo "Documentation:"
echo "  📖 docs/SPRINT_1_TASK_2_SETUP.md     - Detailed setup"
echo "  📋 docs/SPRINT_1_TAREA_2_RESUMEN.md  - Technical details"
echo "  🎯 docs/STATUS_SPRINT_1_TAREA_2.md   - This overview"
echo ""

echo "🎉 You're all set!"
echo "Next: Configure .env.local and run: npm run dev"
echo ""
