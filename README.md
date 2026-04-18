# Loombox — Gestión de Encomiendas

Sistema de gestión de paquetes y correspondencia para edificios residenciales.
Desarrollado como proyecto P05 del curso TICS420 — Universidad Adolfo Ibáñez.

Cada paquete queda registrado, notificado y entregado con trazabilidad completa.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Runtime | Bun |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 + Framer Motion |
| Base de datos | PostgreSQL (Supabase / Docker) |
| ORM | Prisma |
| Auth | NextAuth v4 — Google SSO + TOTP 2FA (Google Authenticator) |
| i18n | next-intl (ES / EN) |
| Email | Resend SMTP (nodemailer) |
| QR | qrcode (generación), html5-qrcode (escaneo) |
| Notificaciones | Web Push API |
| Deploy | Vercel + Supabase |

---

## Inicio rápido

```bash
cp .env.example .env        # configurar variables de entorno
bun install                 # instalar dependencias
bunx prisma generate        # generar cliente Prisma
bunx prisma db push         # sincronizar schema con la BD
bun dev                     # iniciar servidor en localhost:3000
```

### Con Docker (desarrollo local)

```bash
# Solo base de datos local + servidor Next.js
docker compose up postgres -d
bun dev

# Stack completo en contenedores
docker compose up -d
```

### Variables de entorno requeridas

```env
DATABASE_URL=           # URL de conexión PostgreSQL (pooler)
DIRECT_URL=             # URL de conexión directa PostgreSQL
NEXTAUTH_SECRET=        # secreto JWT (openssl rand -base64 32)
NEXTAUTH_URL=           # URL pública de la app (ej. http://localhost:3000)
GOOGLE_CLIENT_ID=       # Google OAuth 2.0 Client ID
GOOGLE_CLIENT_SECRET=   # Google OAuth 2.0 Client Secret
EMAIL_SERVER=           # SMTP URL (ej. smtp://user:pass@smtp.resend.com:465)
EMAIL_FROM=             # dirección remitente
```

---

## Flujo de autenticación

```
Login page
  └── Selección de rol (CONSERJE / RESIDENTE)
        └── Google SSO (NextAuth)
              └── Onboarding
                    ├── CONSERJE → Confirmación → setup-totp
                    └── RESIDENTE → Selección de departamento → Confirmación → setup-totp
                          └── Google Authenticator (QR scan)
                                └── verify-totp
                                      └── Dashboard
```

El middleware (`src/proxy.ts`) protege todas las rutas y dirige según el estado del token JWT:
- Sin sesión → `/login`
- Sin onboarding → `/onboarding`
- Sin TOTP configurado → `/auth/setup-totp`
- TOTP configurado pero no verificado → `/auth/verify-totp`
- Todo completo → `/dashboard/conserje` o `/dashboard/resident`

---

## Roles

| Funcionalidad | CONSERJE | RESIDENTE |
|---|:---:|:---:|
| Registrar paquetes | ✅ | — |
| Ver todos los paquetes | ✅ | — |
| Generar QR de paquete | ✅ | — |
| Escanear QR para entrega | ✅ | — |
| Reportes y estadísticas | ✅ | — |
| Ver mis encomiendas | — | ✅ |
| Notificaciones push | — | ✅ |
| Código QR para retiro | — | ✅ |

---

## Estructura de carpetas

```
src/
├── app/
│   ├── [locale]/
│   │   ├── auth/
│   │   │   ├── setup-totp/     # Configuración inicial Google Authenticator
│   │   │   └── verify-totp/    # Verificación TOTP en cada login
│   │   ├── dashboard/
│   │   │   ├── conserje/       # Panel del conserje
│   │   │   └── resident/       # Portal del residente
│   │   ├── onboarding/         # Flujo de primer ingreso
│   │   └── login/              # Selección de rol + OAuth
│   └── api/
│       ├── auth/               # NextAuth + TOTP endpoints
│       ├── onboarding/         # Completar perfil
│       ├── packages/           # CRUD encomiendas
│       └── push/               # Web Push subscriptions
├── lib/
│   ├── auth.ts                 # NextAuth config + JWT callbacks
│   ├── prisma.ts               # Cliente Prisma singleton
│   ├── totp.ts                 # Generación y verificación TOTP
│   └── otp.ts                  # Envío de email OTP (Resend)
├── i18n/
│   └── messages/
│       ├── es.json
│       └── en.json
└── proxy.ts                    # Middleware de rutas (auth + i18n)
prisma/
└── schema.prisma
```

> **Nota:** Se usa `src/proxy.ts` en lugar de `src/middleware.ts` por compatibilidad con Next.js 16.2 + Turbopack.

---

## Equipo

| GitHub | Rol |
|---|---|
| [@TomTowerg](https://github.com/TomTowerg) | Desarrollo |
| [@matildavasquezdevi](https://github.com/matildavasquezdevi) | Desarrollo |

Product Owner: Nicolás Escobar
Repositorio: [uai-cl-tics420/S101-P05-24-7](https://github.com/uai-cl-tics420/S101-P05-24-7)
Curso: TICS420 — Programación Profesional · Universidad Adolfo Ibáñez · 2026
