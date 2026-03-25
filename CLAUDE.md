# Gestión de Encomiendas — P05

## Contexto del proyecto
Proyecto para el curso Programación Profesional.
Sistema de gestión eficiente de paquetes y correspondencia en edificios residenciales.

## Equipo
- 2 desarrolladores
- Product Owner: Nicolás Cenzano
- Repositorio: https://github.com/TomTowerg/Gestion-de-encomiendas

## Stack tecnológico
- Framework: Next.js 14+ con App Router
- Lenguaje: TypeScript (todo el código en inglés)
- Estilos: Tailwind CSS
- Autenticación: NextAuth.js con SSO — dos roles: CONSERJE y RESIDENTE
- Base de datos: PostgreSQL con Prisma ORM
- Multilenguaje: next-intl (español e inglés, sin Google Translate)
- QR: qrcode.js para generación, html5-qrcode para escaneo
- Notificaciones: Web Push API
- Deploy: Vercel (frontend) + Railway (base de datos)

## Requisitos no negociables del ramo
- Todo el código debe estar en inglés (variables, funciones, comentarios)
- La documentación puede estar en español o inglés
- Completamente responsive: móvil, tablet, desktop
- Login SSO con exactamente 2 roles: CONSERJE y RESIDENTE
- Multilenguaje i18n (es/en) sin APIs externas de traducción
- Debe estar desplegado en una URL pública en la nube para el Sprint 5

## Skills disponibles (úsalas automáticamente según el contexto)
- .claude/skills/senior-backend → diseño de APIs, migraciones de BD, seguridad
- .claude/skills/senior-frontend → componentes Next.js, optimización de bundle
- .claude/skills/ui-ux-pro-max → sistema de diseño, paletas de color, reglas UX
- .claude/skills/frontend-design → diseño visual, animaciones, estética
- .claude/skills/authentication-setup → JWT, roles, middleware, SSO
- .claude/skills/i18n → internacionalización con estructura de claves planas
- .claude/skills/qr-code-generator → generación y decodificación de QR
- .claude/skills/code-reviewer → análisis de PRs, revisión de calidad de código

## Plan de sprints
- **Sprint 1 (24–31 mar)**: Setup del proyecto, SSO con 2 roles, base responsive, i18n
  - Tarea 1: Setup inicial ✓
  - **Tarea 2: [Auth] SSO login with NextAuth + Google provider** ✅ COMPLETADA (25 mar)
  - Tarea 3: i18n setup (pendiente)
  - Tarea 4: Responsive design audit (pendiente)
- Sprint 2 (31 mar–7 abr): Registro de encomiendas, base de datos, notificaciones
- Sprint 3 (7–14 abr): Generación y escaneo QR, verificación de retiro
- Sprint 4 (14–21 abr): Dashboard conserje, filtros, estadísticas
- Sprint 5 (21–28 abr): Deploy en la nube, CI/CD, pruebas E2E
- Sprint 6 (28 abr–5 may): Pulido final, preparación demo

## Estructura de carpetas
src/
├── app/              # Páginas con Next.js App Router
├── components/       # Componentes React reutilizables
├── lib/              # Utils, cliente de BD, configuración de auth
└── i18n/             # Archivos de mensajes es y en
prisma/               # Schema y migraciones
public/               # Archivos estáticos
docs/                 # Documentación técnica
.claude/skills/       # Skills de Claude Code.
