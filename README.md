# Florería — Sistema web con Firebase

## Fase 1: Fundaciones (completada)

Contenido de esta entrega:
- Estructura del proyecto React (Vite)
- Configuración centralizada de Firebase (`src/firebase/config.js`)
- Servicio de autenticación (`src/services/authService.js`)
- Contexto de autenticación con ruta protegida para `/admin`
- Borrador de reglas de seguridad de Firestore (`firestore.rules`)

Nada de esto tiene lógica de negocio todavía — son las bases sobre las
que se construyen las siguientes fases (catálogo, carrito, pedidos, panel admin, etc).

---

## Paso 1: Crear el proyecto en Firebase

1. Ve a https://console.firebase.google.com
2. "Agregar proyecto" → ponle el nombre del negocio (ej. `floreria-nombre`)
3. Puedes desactivar Google Analytics si no lo vas a usar (no es necesario para este sistema)

## Paso 2: Habilitar los servicios necesarios

En el panel del proyecto:

- **Authentication** → Sign-in method → habilita **Correo electrónico/contraseña**
  (los 3 administradores iniciarán sesión así, sin cuentas de cliente)
- **Firestore Database** → Crear base de datos → modo producción → elige la región más cercana
- **Storage** → Crear (solo si vas a subir imágenes directamente; si usarás
  URLs externas para las fotos de productos, puedes omitir esto por ahora)

## Paso 3: Registrar la app web

1. En la página principal del proyecto → ícono `</>` (Agregar app web)
2. Ponle un nombre (ej. `floreria-web`)
3. Copia el objeto `firebaseConfig` que te muestra

## Paso 4: Configurar variables de entorno

1. Copia `.env.example` a un archivo nuevo llamado `.env`
2. Pega los valores del `firebaseConfig` del paso anterior en las variables correspondientes
3. Agrega el número de WhatsApp del negocio en `VITE_WHATSAPP_NUMBER`

`.env` no debe subirse nunca a un repositorio público — asegúrate de que
esté en `.gitignore` (Vite lo agrega por defecto).

## Paso 5: Crear el primer administrador

Como las reglas de seguridad no permiten crear admins desde el cliente,
el primero se crea manualmente:

1. Firebase Console → Authentication → Users → "Agregar usuario" (correo + contraseña)
2. Copia el UID que se genera para ese usuario
3. Firestore Database → "Iniciar colección" → ID: `admins`
4. Crea un documento con **ID igual al UID copiado** (no autogenerado)
   y puedes dejarlo con un solo campo, ej: `nombre: "Tu Nombre"`

Los siguientes 2 administradores (máximo 3 en total) se crean repitiendo
este mismo proceso.

## Paso 6: Publicar las reglas de seguridad

1. Firestore Database → pestaña "Reglas"
2. Reemplaza el contenido con lo que está en `firestore.rules` de este proyecto
3. Publicar

## Paso 7: Instalar dependencias y correr el proyecto

```bash
npm install
npm run dev
```

Esto levanta el servidor de desarrollo. Al entrar verás dos rutas base:
- `/` → catálogo público (placeholder, se construye en Fase 2)
- `/admin` → panel administrativo, protegido por login (placeholder, Fase 4+)
- `/admin/login` → pantalla de login

---

## Próxima fase

**Fase 2 — Catálogo público base:** estructura de datos de productos y
categorías en Firestore, home pública con banner/categorías/destacados,
diseño responsive mobile-first.

Avísame cuando hayas completado los pasos 1-6 (o si prefieres que
avancemos con el código de la Fase 2 mientras tú configuras Firebase
en paralelo).
