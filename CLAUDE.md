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
.claude/skills/       # Criterios y estándares técnicos paramétricos
