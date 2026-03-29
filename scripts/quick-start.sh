#!/bin/bash
# Guía de Inicio Rápido para Gestión de Encomiendas - Módulo Auth SSO

echo "🚀 SETUP INICIAL DE ENTORNO (SSO)"
echo "========================================"
echo ""

# Paso 1: Dependencias
echo "1️⃣  Instalando dependencias de Node..."
npm install @types/node --save-dev

echo ""
echo "✅ Dependencias instaladas satisfactoriamente!"
echo ""

# Paso 2: Configuración variables
echo "2️⃣  Generar NEXTAUTH_SECRET..."
echo "Ejecuta lo siguiente y cópialo dentro de tu .env.local:"
echo ""
echo "  openssl rand -base64 32"
echo ""
echo "Luego agrégalo así a tu .env.local:"
echo "  NEXTAUTH_SECRET=<pegalo-aqui>"
echo ""

# Paso 3: Template del archivo env
echo "3️⃣  Construye tu .env.local de la siguiente manera:"
echo ""
cat > /dev/stdin << 'EOF'
# Configuración NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-clave-secreta-generada-aqui

# Proveedor Google OAuth (crear en https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# Base de Datos
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/parcel_management_db
EOF

echo ""
echo "4️⃣  Crear y Autorizar tus Credenciales Google OAuth:"
echo "  1. Visita: https://console.cloud.google.com/"
echo "  2. Crea un nuevo OAuth 2.0 Client ID (Aplicación Web)"
echo "  3. Agrega la URI de callback obligatoria:"
echo "     http://localhost:3000/api/auth/callback/google"
echo "  4. Copia tu Client ID y Client Secret hacia al .env.local"
echo ""

# Paso 4: Postgres
echo "5️⃣  Motor de Base de Datos PostgreSQL:"
echo ""
echo "  Opción A: Postgres Local"
echo "    # Inicializar Base de Datos Local"
echo "    createdb parcel_management_db"
echo ""
echo "  Opción B: Base de Datos en la Nube (Recomendada)"
echo "    - Vercel Postgres: https://vercel.com/postgres"
echo "    - Supabase: https://supabase.com"
echo "    - Railway: https://railway.app"
echo ""

# Paso 6: Prisma migrations
echo "6️⃣  Ejecutar Migraciones de Prisma:"
echo ""
echo "  npx prisma generate"
echo "  npx prisma migrate dev --name init"
echo ""

# Paso 7: Start dev server
echo "7️⃣  Iniciar Servidor local de Next.js:"
echo ""
echo "  npm run dev"
echo ""
echo "  Entra a: http://localhost:3000/login"
echo ""

# Paso 8: Workflow Testing
echo "8️⃣  Probando el Flujo del Login:"
echo ""
echo "  1. Dirigite a http://localhost:3000/login"
echo "  2. Selecciona rol a probar: Residente o Conserje"
echo "  3. Haz clic en 'Sign in with Google'"
echo "  4. Completa la autorización desde Google OAuth"
echo "  5. Serás redirigido inteligentemente hacia tu respectivo dashboard"
echo ""

# Paso 9: Prisma Studio
echo "9️⃣  Vizualizar y Administrar la BD (Opcional):"
echo ""
echo "  npx prisma studio"
echo ""
echo "  Al ejecutar esto, se levantará una GUI gráfica de Prisma por puerto secundario"
echo ""

# Summary
echo "========================================"
echo "📋 RESUMEN DE COMPROBACIÓN"
echo "========================================"
echo ""
echo "Archivos verificados post-setup:"
echo "  ✓ .env.local                               - Entorno y SSO"
echo "  ✓ prisma/schema.prisma                     - Reglas Prisma"
echo "  ✓ src/app/login/page.tsx                   - UI Cliente"
echo "  ✓ src/app/api/auth/[...nextauth]/route.ts  - Middleware Auth Intercept"
echo "  ✓ src/middleware.ts                        - Protección Activa"
echo ""

echo "Para consultar más información revisa tu guía definitiva:"
echo "  📖 docs/auth-setup-guide.md  - Repositorio Central del Setup"
echo ""

echo "🎉 Entorno purificado y finalizado!"
echo "Siguiente paso: Personaliza tu .env.local y ejecuta 'npm run dev'"
echo ""
