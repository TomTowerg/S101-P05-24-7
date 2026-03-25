# 🔐 Sprint 1 - Tarea 2: NextAuth SSO Implementation

**Status**: ✅ Completed on March 25, 2026

## 🎯 What Was Built

A complete Single Sign-On (SSO) authentication system using **NextAuth.js + Google OAuth** with role-based access control for a parcel management system.

### Key Features
- ✅ Google OAuth authentication
- ✅ 2 User roles: CONSERJE (Concierge) & RESIDENTE (Resident)
- ✅ JWT token management with role inclusion
- ✅ Protected routes with middleware
- ✅ Personalized dashboards per role
- ✅ PostgreSQL database with Prisma ORM
- ✅ Responsive design with Tailwind CSS

## 📂 Project Structure

```
src/
├── app/
│   ├── login/page.tsx                           # Login page with role selector
│   ├── api/auth/[...nextauth]/route.ts         # NextAuth configuration
│   └── dashboard/
│       ├── page.tsx                             # Role-based router
│       ├── conserje/page.tsx                   # Concierge dashboard
│       └── resident/page.tsx                   # Resident dashboard
├── middleware.ts                                # Route protection
└── lib/prisma.ts                               # Database client

prisma/
├── schema.prisma                               # Database schema
└── migrations/                                 # Database migrations

docs/
├── SPRINT_1_TASK_2_SETUP.md                   # Detailed setup guide
├── SPRINT_1_TAREA_2_RESUMEN.md                # Technical summary
└── STATUS_SPRINT_1_TAREA_2.md                 # Project status
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL (local or cloud)
- Google Cloud account for OAuth

### 1. Setup Environment

```bash
# Copy the template
cp .env.local.example .env.local

# Generate secret
openssl rand -base64 32  # Copy this to NEXTAUTH_SECRET

# Fill in .env.local with:
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
DATABASE_URL=postgresql://user:password@localhost:5432/parcel_db
```

### 2. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new OAuth 2.0 Client ID (Web application)
3. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy credentials to `.env.local`

### 3. Setup Database

```bash
# Run migrations
npx prisma migrate dev --name init

# (Optional) View database
npx prisma studio
```

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000/login](http://localhost:3000/login)

## 🧪 Testing

1. Go to login page
2. Select role (Resident or Concierge)
3. Click "Sign in with Google"
4. Complete Google authentication
5. You'll be redirected to your role's dashboard

### Test Role Protection

```bash
# Try accessing concierge dashboard as resident
# Should redirect to login

# Try accessing resident dashboard as concierge  
# Should redirect to login
```

## 📊 Authentication Flow

```
Login Page
    ↓ (Select Role)
Google OAuth
    ↓ (Authenticate)
Prisma (Create User in DB)
    ↓
JWT Token (with Role)
    ↓
Middleware Validation
    ↓
Role-Based Dashboard
```

## 🔐 Security Features

- ✓ JWT Token Signing with NEXTAUTH_SECRET
- ✓ Role-based Access Control (RBAC)
- ✓ Protected API routes with middleware
- ✓ Secure session management
- ✓ Google OAuth validation
- ✓ CORS protection on auth endpoints

## 📱 Responsive Design

- Mobile (< 640px): Stack layout, full-width buttons
- Tablet (640-1024px): 2-column grid
- Desktop (> 1024px): 3-column grid with max-width container

## 📚 Documentation Files

- **[SPRINT_1_TASK_2_SETUP.md](docs/SPRINT_1_TASK_2_SETUP.md)** - Complete setup instructions with troubleshooting
- **[SPRINT_1_TAREA_2_RESUMEN.md](docs/SPRINT_1_TAREA_2_RESUMEN.md)** - Technical implementation details
- **[STATUS_SPRINT_1_TAREA_2.md](docs/STATUS_SPRINT_1_TAREA_2.md)** - Project overview and status

## 🛠️ Database Schema

### User Model
```
User
├── id (String) - Primary key
├── name (String?)
├── email (String?) - Unique
├── emailVerified (DateTime?)
├── image (String?)
├── role (UserRole) - CONSERJE | RESIDENTE
├── createdAt (DateTime)
├── updatedAt (DateTime)
└── Relations: accounts, sessions
```

### UserRole Enum
```
- CONSERJE   (Concierge/Manager)
- RESIDENTE  (Resident/Customer)
```

## 🔧 Tech Stack

- **Framework**: Next.js 16.2.0
- **Language**: TypeScript
- **Authentication**: NextAuth.js v4.24.13
- **Database**: PostgreSQL + Prisma v7.5.0
- **Styling**: Tailwind CSS v4
- **OAuth**: Google Provider

## 📋 Checklist

- [x] NextAuth.js configuration
- [x] Google OAuth setup
- [x] Prisma schema with roles
- [x] Login page with role selector
- [x] Middleware route protection
- [x] Concierge dashboard
- [x] Resident dashboard
- [x] JWT token with role
- [x] Session management
- [x] Responsive design
- [x] Documentation

## 🚧 Next Steps

### Sprint 1 - Remaining Tasks
1. **Task 3**: Implement i18n (next-intl for ES/EN)
2. **Task 4**: Responsive design audit

### Sprint 2+
1. Parcel registration system
2. Real-time notifications
3. QR code generation & scanning
4. Dashboard analytics
5. Production deployment

## 🐛 Troubleshooting

### "NEXTAUTH_SECRET is not set"
```bash
# Add to .env.local
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

### Database connection error
```bash
# Check PostgreSQL is running
# Verify DATABASE_URL in .env.local
# Run migrations
npx prisma migrate dev
```

### Google OAuth not working
- Verify Client ID/Secret in .env.local
- Check redirect URI in Google Cloud Console
- Clear browser cookies

## 📞 Support

For detailed instructions, see:
- [Setup Guide](docs/SPRINT_1_TASK_2_SETUP.md)
- [Technical Summary](docs/SPRINT_1_TAREA_2_RESUMEN.md)
- [Project Status](docs/STATUS_SPRINT_1_TAREA_2.md)

---

**Completed**: March 25, 2026  
**Status**: ✅ Ready for Production  
**Sprint**: 1 of 6  
**Task**: 2 of 4
