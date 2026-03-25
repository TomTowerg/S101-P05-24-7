# [Auth] SSO Login with NextAuth + Google Provider - Setup Instructions

## ✅ Completed Implementation

This implementation includes:

- ✓ NextAuth.js configuration with Google OAuth provider
- ✓ Prisma schema with User, Account, Session, VerificationToken models
- ✓ Role-based access control (CONSERJE and RESIDENTE)
- ✓ Protected middleware for role-specific dashboards
- ✓ Beautiful login page with role selector
- ✓ Dashboard pages for both roles
- ✓ Session management with JWT tokens

## 📋 Setup Steps

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for production, add your domain)
7. Copy the Client ID and Client Secret

### 2. Configure Environment Variables

Edit `.env.local` with your credentials:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-generate-with-openssl-rand-base64-32

# Google OAuth Provider
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Database (PostgreSQL via Prisma)
DATABASE_URL=postgresql://user:password@localhost:5432/parcel_management_db
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copy the output to `.env.local` as the value for `NEXTAUTH_SECRET`.

### 4. Set Up Database

#### Option A: PostgreSQL Locally
```bash
# Install PostgreSQL if not already installed
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql postgresql-contrib
# Windows: Download from https://www.postgresql.org/download/windows/

# Start PostgreSQL
pg_ctl -D /usr/local/var/postgres start

# Create database
createdb parcel_management_db
```

#### Option B: Cloud Database (Recommended for Production)
- Use Railway, Supabase, or Vercel Postgres
- Copy the connection string to `DATABASE_URL` in `.env.local`

### 5. Run Prisma Migrations

```bash
# Generate Prisma client
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view/manage data
npx prisma studio
```

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing the Implementation

### Test Login Flow

1. **Navigate to Login Page**
   - Go to `http://localhost:3000/login`
   - You should see the login page with role selector

2. **Select Role and Sign In**
   - Choose "Resident" or "Concierge" role
   - Click "Sign in with Google"
   - Complete Google authentication

3. **Verify Redirection**
   - Resident users → `/dashboard/resident`
   - Concierge users → `/dashboard/conserje`
   - Should see personalized dashboard

4. **Test Role Protection**
   - Try accessing `/dashboard/conserje` as resident (should redirect to login)
   - Try accessing `/dashboard/resident` as concierge (should redirect to login)

5. **Test Logout**
   - Click "Sign Out" button
   - Should redirect to home page
   - Should be able to login again

## 🔧 Important Files

```
src/
├── app/
│   ├── api/auth/[...nextauth]/route.ts  # NextAuth configuration
│   ├── login/page.tsx                    # Login page with role selector
│   ├── dashboard/
│   │   ├── page.tsx                      # Dashboard router (redirects by role)
│   │   ├── conserje/page.tsx            # Concierge dashboard
│   │   └── resident/page.tsx            # Resident dashboard
│   └── layout.tsx                        # Root layout (Navbar)
├── middleware.ts                          # Route protection middleware
├── lib/
│   └── prisma.ts                         # Prisma client singleton
│
prisma/
├── schema.prisma                          # Database schema with role enum
└── migrations/                            # Database migrations (auto-generated)

.env.local                                 # Environment variables (local only)
```

## 🔐 Security Considerations

1. **NEXTAUTH_SECRET**: Must be different in development and production
2. **Database Connection**: Always use secure connections (TLS/SSL) in production
3. **Google Credentials**: Never commit `.env.local` to version control
4. **CORS**: NextAuth handles CORS automatically for `/api/auth/*` routes
5. **Role Assignment**: Currently users are created with default role `RESIDENTE`
   - To assign admin/concierge roles, use Prisma Studio or create an admin panel (future task)

## 📝 Next Steps (Sprint 2+)

1. **Internationalization**: Add i18n support with next-intl (Spanish/English)
2. **Parcel Management**: Create API endpoints and UI for registering parcels
3. **QR Code**: Implement QR generation and scanning
4. **Notifications**: Add Web Push API for real-time alerts
5. **Admin Panel**: Create interface to assign user roles

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
npm install
npx prisma generate
```

### "NEXTAUTH_SECRET is not set" error
- Ensure `.env.local` has `NEXTAUTH_SECRET` defined
- Restart dev server after adding env variables

### Database connection errors
- Check PostgreSQL is running
- Verify `DATABASE_URL` is correct
- Run `npx prisma db push` to sync schema

### Google OAuth not working
- Verify Client ID and Secret in `.env.local`
- Check redirect URI is added to Google Cloud Console
- Clear browser cookies and try again

### User roles not persisting
- Check Prisma migrations ran successfully: `npx prisma migrate status`
- Verify User model has role field: `npx prisma studio`

## 📚 Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Middleware](https://nextjs.org/docs/advanced-features/middleware)
