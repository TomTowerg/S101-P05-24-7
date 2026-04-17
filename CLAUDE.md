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
- **Sprint 1 (30 mar – 05 abr): Setup, Auth & UI Base** ✅ COMPLETADO
  - [i18n] Setup next-intl with ES/EN #6
  - [Setup] Next.js project structure and CI #1
  - [Auth] SSO login with NextAuth + Google provider #2
  - [DB] Prisma schema: Users, Apartments, Packages #4
  - [UI] Responsive base layout + navbar #5
  - [Auth] Role system: concierge and resident #3
- **Sprint 2 (06 abr – 12 abr): Package Management & Notifications** [/] EN PROGRESO (Actual)
  - [Feature] Package registration form #7
  - [DB] Extend schema for package tracking #8
  - [Feature] Push Notifications setup and integration #9
  - [Feature] Urgent notification for perishable packages #25
- **Sprint 3 (13 abr – 19 abr): QR & Pickup Flow**
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
  - [Ops] Vercel & Railway deployment setup #16
  - [Ops] GitHub Actions CI/CD pipeline #17
  - [Test] E2E testing implementation #18
- **Sprint 6 (04 may – 10 may): Polish & Handover**
  - [UI/UX] Final UI polish and animations #19
  - [Docs] Demo preparation and user documentation #20
  - [Test] Responsive verification on 3 required breakpoints #28

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
