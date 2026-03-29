# 📦 Gestión de Encomiendas (Parcel Management System)

Un sistema de gestión de encomiendas premium basado en roles, diseñado para complejos residenciales y comerciales. Desarrollado para optimizar el flujo de trabajo en conserjería, administrar las entregas de los departamentos y brindar visibilidad inmediata a los residentes mediante Dashboards seguros.

Construido con **Next.js 16 (App Router)**, **Prisma (PostgreSQL)** y **NextAuth v4**.

---

## 🚀 Inicio Rápido

Asegúrate de tener Node.js y PostgreSQL instalados y en ejecución, luego provisiona tu entorno de forma segura utilizando nuestro script de arranque rápido:

```bash
# MacOS / Linux
bash scripts/quick-start.sh

# Windows (Git Bash / WSL)
./scripts/quick-start.sh
```

Alternativamente, puedes instalar y ejecutar la aplicación manualmente:
```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Visita [http://localhost:3000](http://localhost:3000) para acceder a la aplicación.

## 📚 Documentación

Las guías detalladas de arquitectura y manuales de configuración se han consolidado en el directorio `/docs`.

- **[Guía de Configuración de Autenticación](docs/auth-setup-guide.md)**: Guía maestra para configurar Google OAuth 2.0, la lógica de NextAuth (JWT) y la inyección inicial de roles.

## 🏗️ Stack Tecnológico

- **Framework**: Next.js 16 (React 19)
- **Estilos**: Tailwind CSS v4 + Motion
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma
- **Autenticación**: NextAuth.js (Google Provider SSO)
- **Despliegue**: Listo para Vercel


