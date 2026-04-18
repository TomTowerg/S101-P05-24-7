# Gestión de Encomiendas — P05

## Estado actual del proyecto

### Sprint en curso: Sprint 3 (13 abr – 19 abr) — QR & Pickup Flow

**Completado:**
- Sprint 1 ✅ — Setup, Auth base, i18n, schema Prisma
- #36 Onboarding flow ✅ — sin selección de rol (viene del login)
- #37 TOTP 2FA ✅ — Google Authenticator reemplaza email OTP
- #10 QR code generation ✅
- Fixes: Prisma sync (db push), cookies() async, proxy.ts routing, Resend SMTP

**En progreso:**
- #11 QR scanner implementation
- #12 Package pickup verification flow
- #26 Pickup record: log who retrieved each package

**Pendiente:**
- Sprint 4 (20 abr): Dashboard concierge, filtros, estadísticas, claims
- Sprint 5 (27 abr): Deploy Vercel + Supabase, CI/CD
- Sprint 6 (04 may): Polish, tests responsive, documentación

---

## Contexto del proyecto
Proyecto para el curso Programación Profesional.
Sistema de gestión eficiente de paquetes y correspondencia en edificios residenciales.

## Equipo
- 2 desarrolladores: TomTowerg, matildavasquezdevi
- Product Owner: Nicolás Escobar
- Repositorio: https://github.com/uai-cl-tics420/S101-P05-24-7

## Stack tecnológico
- Framework: Next.js 16.2 con App Router + Turbopack
- Runtime: Bun
- Lenguaje: TypeScript (todo el código en inglés)
- Estilos: Tailwind CSS v4 + Framer Motion
- Autenticación: NextAuth v4 — Google SSO + TOTP 2FA (Google Authenticator)
- Base de datos: PostgreSQL (Supabase en prod, Docker en local)
- ORM: Prisma
- Multilenguaje: next-intl (español e inglés)
- Email: Resend SMTP via nodemailer
- QR: qrcode (generación), html5-qrcode (escaneo)
- Notificaciones: Web Push API
- Deploy: Vercel (frontend) + Supabase (base de datos)

## Requisitos no negociables del ramo
- Todo el código debe estar en inglés (variables, funciones, comentarios)
- La documentación puede estar en español o inglés
- Completamente responsive: móvil, tablet, desktop
- Login SSO con exactamente 2 roles: CONSERJE y RESIDENTE
- Multilenguaje i18n (es/en) sin APIs externas de traducción
- Debe estar desplegado en una URL pública en la nube para el Sprint 5

## Comandos útiles

```bash
# Desarrollo
bun dev                          # servidor en localhost:3000
bunx prisma studio               # GUI de base de datos
bunx prisma db push              # sincronizar schema sin migraciones
bunx prisma generate             # regenerar cliente Prisma

# Base de datos (Supabase directa)
node -e "require('./scripts/db-clean.js')"   # limpiar usuarios de prueba

# Docker
docker compose up postgres -d    # solo BD local
docker compose up -d             # stack completo

# Matar servidor atascado (Windows)
taskkill /PID <PID> /F
```

## Arquitectura de autenticación

```
[Login page]
  Selección de rol (CONSERJE | RESIDENTE)
    → /api/auth/set-role  (guarda rol en DB)
    → Google OAuth callback
    → NextAuth JWT callback (carga role, onboardingComplete, totpEnabled)

[proxy.ts — ejecuta en cada request]
  Sin token            → /login
  onboardingComplete=false → /onboarding
  totpEnabled=false    → /auth/setup-totp  (primer login: escanear QR)
  totpEnabled=true,
  otpVerified=false    → /auth/verify-totp  (cada login: ingresar código)
  Todo OK              → /dashboard/conserje | /dashboard/resident

[JWT token contiene]
  id, email, role, apartment, onboardingComplete, totpEnabled, otpVerified
```

> **Importante:** Se usa `src/proxy.ts` en lugar de `src/middleware.ts`.
> Next.js 16.2 + Turbopack tiene problemas con `middleware.ts` en ciertos entornos.
> El archivo se referencia desde `next.config.ts` como middleware personalizado.

## Guías de Desarrollo avanzadas (implementar estrictamente según el contexto)
- .claude/skills/senior-backend → diseño de APIs, migraciones de BD, arquitectura robusta
- .claude/skills/senior-frontend → componentes Next.js, optimización de bundle y performance
- .claude/skills/ui-ux-pro-max → sistema de diseño premium, paletas de color unificadas
- .claude/skills/frontend-design → diseño visual avanzado, animaciones fluidas, hiper estética
- .claude/skills/authentication-setup → manejo de seguridad JWT, middlewares, estructura SSO
- .claude/skills/i18n → internacionalización escalable
- .claude/skills/qr-code-generator → flujos de inventarios
- .claude/skills/code-reviewer → estándares de revisión

## Plan de sprints
- **Sprint 1 (30 mar – 05 abr): Setup, Auth & UI Base** ✅ COMPLETADO
  - [i18n] Setup next-intl with ES/EN #6
  - [Setup] Next.js project structure and CI #1
  - [Auth] SSO login with NextAuth + Google provider #2
  - [DB] Prisma schema: Users, Apartments, Packages #4
  - [UI] Responsive base layout + navbar #5
  - [Auth] Role system: concierge and resident #3
- **Sprint 2 (06 abr – 12 abr): Package Management & Notifications** ✅ COMPLETADO
  - [Feature] Package registration form #7
  - [DB] Extend schema for package tracking #8
  - [Feature] Push Notifications setup and integration #9
  - [Feature] Urgent notification for perishable packages #25
  - [Auth] TOTP 2FA replacing email OTP #37
  - [Auth] Onboarding flow refactor #36
- **Sprint 3 (13 abr – 19 abr): QR & Pickup Flow** — EN CURSO
  - [Feature] QR code generation for packages #10 ✅
  - [Feature] QR scanner implementation #11
  - [Feature] Package pickup verification flow #12
  - [Feature] Pickup record: log who retrieved each package #26
- **Sprint 4 (20 abr – 26 abr): Dashboard & Reporting**
  - [UI] Concierge Dashboard layout #13
  - [Feature] Package filtering and search #14
  - [Feature] Statistics and reporting views #15
  - [Feature] Claims management for concierge #27
- **Sprint 5 (27 abr – 03 may): Deployment & Testing**
  - [Ops] Vercel & Supabase deployment setup #16
  - [Ops] GitHub Actions CI/CD pipeline #17
  - [Test] E2E testing implementation #18
- **Sprint 6 (04 may – 10 may): Polish & Handover**
  - [UI/UX] Final UI polish and animations #19
  - [Docs] Demo preparation and user documentation #20
  - [Test] Responsive verification on 3 required breakpoints #28

## Estructura de carpetas
```
src/
├── app/
│   ├── [locale]/
│   │   ├── auth/setup-totp/    # QR setup Google Authenticator
│   │   ├── auth/verify-totp/   # Verificación TOTP
│   │   ├── dashboard/          # conserje/ + resident/
│   │   ├── onboarding/         # Primer ingreso
│   │   └── login/              # Selección de rol + OAuth
│   └── api/
│       ├── auth/               # NextAuth + totp-setup + verify-totp
│       ├── onboarding/
│       ├── packages/
│       └── push/
├── lib/
│   ├── auth.ts                 # NextAuth config + JWT/session callbacks
│   ├── prisma.ts
│   ├── totp.ts                 # TOTP: generate, QR, verify
│   └── otp.ts                  # Email OTP legacy (Resend)
├── i18n/messages/              # es.json + en.json
└── proxy.ts                    # Middleware auth + i18n
prisma/schema.prisma
```
