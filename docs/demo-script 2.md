# Loombox — Guión de Demostración del Sistema (5-7 Minutos)

Esta guía detalla el paso a paso cronometrado para realizar una demostración en vivo de **Loombox** ante el Product Owner, profesores o clientes. El guión está diseñado para completarse en un rango de **5 a 7 minutos**, mostrando los flujos completos de los dos roles del sistema: **Conserje** y **Residente**.

---

## ⏱️ Estructura del Tiempo

| Sección | Duración | Rol Activo | Foco Principal |
| :--- | :--- | :--- | :--- |
| **1. Introducción y Contexto** | 0:00 - 0:45 (45s) | Presentador | Propósito del sistema, arquitectura y stack. |
| **2. Inicio de Sesión y Onboarding** | 0:45 - 2:00 (1m 15s) | Conserje / Residente | Google SSO, Selección de Rol y Configuración 2FA. |
| **3. Registro de Encomiendas (Conserje)** | 2:00 - 3:30 (1m 30s) | Conserje | Formulario de registro, flags de urgencia/perisible y QR. |
| **4. Notificación y Portal del Residente** | 3:30 - 4:45 (1m 15s) | Residente | Notificación push/email, listado de encomiendas y QR de retiro. |
| **5. Escaneo y Entrega Segura (Conserje)** | 4:45 - 6:00 (1m 15s) | Conserje | Escaneo de QR, verificación y registro de firma digital. |
| **6. Conclusión y Cierre** | 6:00 - 6:30 (30s) | Presentador | Resumen de valor de Loombox y planes futuros. |

---

## 📑 Paso a Paso de la Demostración

### 1. Introducción y Contexto (0:00 - 0:45)
* **Acción en pantalla**: Mostrar la página de inicio (Landing/Login) de Loombox en español. Alternar el selector de idioma (ES/EN) una vez para mostrar el soporte multilenguaje (`next-intl`).
* **Guión sugerido**:
  > *"Hola a todos. Hoy les presentaremos **Loombox**, un sistema inteligente y seguro de gestión de encomiendas diseñado para edificios residenciales. En comunidades grandes, la recepción de paquetes genera congestión y pérdidas. Loombox resuelve esto brindando trazabilidad completa desde que el paquete ingresa a conserjería hasta que el residente lo retira. El sistema está construido con Next.js 16.2, TypeScript, Tailwind CSS, Prisma, PostgreSQL y un flujo robusto de autenticación en dos pasos utilizando Google Authenticator."*

---

### 2. Autenticación y Onboarding (0:45 - 2:00)
* **Acción en pantalla**:
  1. Hacer clic en **"Iniciar Sesión"**.
  2. Seleccionar el rol de **Conserje**.
  3. Autenticarse usando el botón de **Google SSO**.
  4. Si es la primera vez que inicia sesión con esta cuenta: mostrar la vista de configuración 2FA TOTP (código QR). Abrir Google Authenticator en el teléfono (o simular) e introducir el código de 6 dígitos.
  5. Entrar al Dashboard del Conserje.
* **Guión sugerido**:
  > *"Comenzaremos iniciando sesión. Loombox cuenta con control de accesos basado en roles muy estricto. Al iniciar sesión por primera vez con Google SSO, el sistema nos exige configurar un segundo factor de autenticación (2FA TOTP) mediante Google Authenticator para garantizar que nadie pueda suplantar la identidad de un conserje. Escaneamos el código QR generado criptográficamente, ingresamos el código de 6 dígitos y ya estamos dentro del panel de control seguro del conserje."*

---

### 3. Registro de Encomienda - Flujo Conserje (2:00 - 3:30)
* **Acción en pantalla**:
  1. Hacer clic en **"Registrar Encomienda"** o ir al formulario.
  2. Rellenar los campos:
     * *Residente / Departamento*: Seleccionar el departamento del residente de prueba (ej. Depto 402 - Juan Pérez).
     * *Empresa Courier*: Seleccionar (Starken, Chilexpress, Mercadolibre).
     * *Código de seguimiento*: `ST-987654321`.
     * *Tipo de Paquete*: Seleccionar "Alimentos/Percedero" o marcar la casilla **"Urgente / Perecible"**.
  3. Hacer clic en **"Registrar Paquete"**.
  4. Mostrar el modal/tarjeta de éxito y el **código QR único** que se ha generado dinámicamente para esa encomienda.
* **Guión sugerido**:
  > *"Ahora simularemos la llegada de un paquete. Como conserje, completo el formulario seleccionando el departamento destinatario, el courier y el número de tracking. Muy importante: este paquete es un alimento que requiere refrigeración, por lo que marcamos la casilla de 'Perecible/Urgente'. Al registrar, la base de datos almacena el registro y genera de forma segura un código QR único para este paquete que servirá para su posterior trazabilidad."*

---

### 4. Notificación y Portal del Residente (3:30 - 4:45)
* **Acción en pantalla**:
  1. Abrir una pestaña en modo incógnito o cambiar de cuenta en el navegador e iniciar sesión como **Residente** (Depto 402).
  2. Mostrar la notificación push en pantalla o mencionar el correo recibido por el sistema a través de Resend.
  3. Ir al dashboard del Residente.
  4. En la sección **"Mis Encomiendas"**, destacar el paquete recién registrado que aparece con una etiqueta llamativa de **"Urgente - Requiere Frío"**.
  5. Hacer clic en el paquete y mostrar el **QR de Retiro** del residente.
* **Guión sugerido**:
  > *"En este mismo instante, el residente recibe una notificación automática por correo electrónico y una alerta Web Push en su dispositivo informándole del arribo de su encomienda urgente. Al iniciar sesión en su portal privado, el residente puede ver de inmediato su lista de paquetes pendientes de retiro. Para retirar este paquete de forma segura, el sistema le provee de un código QR personal de retiro, el cual presentará en conserjería."*

---

### 5. Escaneo y Entrega Segura (4:45 - 6:00)
* **Acción en pantalla**:
  1. Volver a la pestaña del **Conserje**.
  2. Hacer clic en **"Escanear QR de Entrega"** (lo que activará la cámara web/cámara del dispositivo).
  3. Simular o realizar el escaneo del código QR de retiro del residente (puedes mostrar el QR desde el celular a la cámara).
  4. Mostrar el panel de verificación: el sistema valida el QR del paquete, muestra los datos del residente y solicita al conserje confirmar quién retira (ej: "Titular", "Familiar", "Conserje autorizado").
  5. Hacer clic en **"Confirmar Entrega"**.
  6. Mostrar cómo el estado del paquete cambia instantáneamente a **"Entregado"** con la marca de tiempo exacta y el nombre de la persona que retiró.
* **Guión sugerido**:
  > *"El residente baja a conserjería y presenta su código QR. El conserje simplemente abre el lector de códigos QR integrado en Loombox. Al escanear el código desde la cámara, el sistema consulta la base de datos en tiempo real, verifica que el paquete corresponde al residente y abre la pantalla de entrega segura. El conserje registra que el retiro fue realizado por el titular y confirma. El paquete cambia inmediatamente a estado 'Entregado', guardando un log completo con fecha, hora y firma digital del retiro. Cero papeles, trazabilidad total."*

---

### 6. Conclusión y Cierre (6:00 - 6:30)
* **Acción en pantalla**: Volver al Dashboard principal del Conserje y mostrar brevemente el gráfico/gráfico de estadísticas (paquetes recibidos hoy, pendientes, tiempo promedio de retiro).
* **Guión sugerido**:
  > *"Como pueden observar, Loombox digitaliza todo el flujo de correspondencia de manera eficiente, eliminando pérdidas y manteniendo a los residentes informados mediante Web Push y correos inmediatos. Con un robusto esquema de seguridad 2FA y generación de QR dinámica, garantizamos la seguridad del condominio. En el próximo sprint, implementaremos el despliegue automático en la nube con pipelines de integración continua en Vercel y Supabase. Muchas gracias."*

---

## 💡 Consejos para una Demo Exitosa
1. **Datos de prueba listos**: Antes de iniciar la demo, asegúrate de tener al menos un usuario residente registrado en tu base de datos local y el Authenticator listo en tu celular para no perder tiempo en el registro.
2. **Entorno Local Limpio**: Reinicia la base de datos si es necesario usando los scripts del proyecto para que la lista de paquetes empiece limpia y se aprecie mejor el registro en vivo.
3. **Simular Cámara**: Si ejecutas la demo en un computador sin cámara secundaria, puedes preparar una imagen del código QR de retiro en tu celular y mostrarlo frente a tu cámara web para simular el escaneo real en vivo.
