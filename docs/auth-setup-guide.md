# Inicio de Sesión SSO con NextAuth + Proveedor Google - Guía de Configuración

Esta guía cubre cómo configurar el sistema de autenticación para el proyecto "Gestión de Encomiendas", el cual incluye la integración de NextAuth.js con el proveedor Google OAuth, la configuración del esquema Prisma con control de accesos basados en roles explícitos (`CONSERJE` y `RESIDENTE`), y el manejo persistente de sesiones sobre tokens JWT.

## 📋 Pasos de Configuración

### 1. Crear Credenciales de Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente.
3. Navega a "APIs y Servicios" > "Credenciales".
4. Haz clic en "Crear credenciales" > "ID de cliente de OAuth 2.0".
5. Selecciona el tipo "Aplicación web".
6. Agrega los URI de redireccionamiento autorizados:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://tu-dominio-en-produccion.com/api/auth/callback/google` (para el entorno en producción)
7. Copia el "ID de cliente" (Client ID) y el "Secreto de cliente" (Client Secret).

### 2. Configurar Variables de Entorno

Edita tu archivo `.env.local` o `.env` incorporando las credenciales recientemente creadas:

```bash
# Configuración NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-clave-secreta-generada-con-openssl-rand-base64-32

# Proveedor Google OAuth
GOOGLE_CLIENT_ID=tu-google-client-id-aqui
GOOGLE_CLIENT_SECRET=tu-google-client-secret-aqui

# Base de Datos (PostgreSQL via Prisma)
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/parcel_management_db
```

### 3. Generar NEXTAUTH_SECRET

Si aún no posees una cadena criptográfica segura para el cifrado interno de tu JWT, genera una ejecutando:

```bash
openssl rand -base64 32
```
Copia el resultado en el portapapeles y utilízalo como valor para tu variable de entorno `NEXTAUTH_SECRET`.

### 4. Setup de Base de Datos

#### Opción A: PostgreSQL de Forma Local
```bash
# Iniciar el motor PostgreSQL (el comando varía ligeramente según el SO)
# Crear la base de datos principal
createdb parcel_management_db
```

#### Opción B: Base de Datos en la Nube (Recomendado para Producción)
- Usa cualquier servicio administrado de confianza (Vercel Postgres, Supabase o Railway).
- Copia la cadena de conexión asignada y colócala en el `DATABASE_URL` de tu `.env.local`.

### 5. Ejecutar Migraciones con Prisma

```bash
# Generar el cliente TypeScript de Prisma
npx prisma generate

# Crear y aplicar las migraciones a la Base de Datos
npx prisma migrate dev --name init

# (Opcional) Abrir Prisma Studio para inspeccionar visualmente los datos
npx prisma studio
```

### 6. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

Ingresa a [http://localhost:3000](http://localhost:3000) en tu navegador local. Intentar navegar rudamente a vistas protegidas como `/dashboard/conserje` o `/dashboard/resident` cuando estás sin autenticar te redirigirá instantáneamente hacia la pantalla visual interactiva de login (SSO).

---

## 🔐 Consideraciones de Seguridad

1. **NEXTAUTH_SECRET**: Deberá ser robusta, única, y no compartirse nunca entre desarrollos y el ambiente final de despliegue en producción.
2. **Conexión a Base de Datos**: Asegúrate firmemente de forzar conexiones seguras (ej. TLS/SSL y pools autorizados) en producción.
3. **Credenciales de Google**: Nunca realices un `commit` que involucre las credenciales en duro dentro de tu control de versiones git. Apóyate en el archivo ignores `.env.local`.
4. **Asignación de Roles**: Actualmente la plataforma autoconfigura cada usuario unívoco que se crea mediante Google por vez primera bajo un rol predeterminado de `RESIDENTE`. La asignación técnica y ascensos de rango hacia `CONSERJE` deben manejarse a través del panel UI de administración, o manual/temporalmente editando la fila respectiva mediante Prisma Studio (`npx prisma studio`).

## 🐛 Troubleshooting / Solución de Problemas Frecuentes

### Errores del tipo "Cannot find module"
```bash
npm install
npx prisma generate
```

### Error de compilación por "NEXTAUTH_SECRET is not set"
- Asegúrate de que tu archivo oculto `.env` o `.env.local` realmente posea la variable de entorno `NEXTAUTH_SECRET` exportada de forma correcta (sin espacios ilegales y recargada tras crear el archivo).
- Reinicia tajantemente tu terminal del dev server al integrar una variable de entorno fresca.

### Fallas conectando a la Base de Datos
- Revisa si tu entorno PostgreSQL local está inicializado en caso opuesto revisa el consumo del proveedor en la nube.
- Valida si la anatomía del `DATABASE_URL` coincide exactamente con la requerida por el driver nativo.
- Si las tablas de migraciones están dando conflictos severos y asincrónicos, purga y resetea haciendo un `npx prisma db push --force-reset` para alinear urgentemente todos sus componentes nuevamente.

### Los Roles de mis Usuarios no persisten
- Asegúrate de certificar que tu base de datos esté reflejando y aceptando todos los Enums nativos; corre `npx prisma migrate status` para inspeccionar errores silenciados por asincronía.
- Revisa a primera vista con `npx prisma studio` el campo modelo y certifica que la columna "Role" no esté fallando durante inserciones SSO.
