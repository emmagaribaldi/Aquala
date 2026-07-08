# 🧋 Aquala — E-commerce de Termos Premium

Aquala es una tienda online de termos premium desarrollada como proyecto final de la materia **Programación Web** en ITBA. Permite a los usuarios explorar productos, agregar al carrito, realizar compras con Mercado Pago y recibir confirmación automática mediante webhooks.

---

## 🚀 Deploy

**Producción:** [aquala-jade.vercel.app](https://aquala-jade.vercel.app)  
**Repositorio:** [github.com/emmagaribaldi/Aquala](https://github.com/emmagaribaldi/Aquala)

---

## 🛠️ Stack Técnico

| Componente | Herramienta |
|---|---|
| Frontend | Next.js 16 (App Router) + React |
| Estilos | CSS puro con variables y globals.css |
| Base de Datos | Supabase (PostgreSQL) |
| Pagos | Mercado Pago SDK |
| Validación | Zod |
| CI/CD | GitHub Actions + Vercel |
| Control de Versiones | Git + GitHub |

---

## ⚙️ Instalación y uso local

```bash
# 1. Clonar el repositorio
git clone https://github.com/emmagaribaldi/Aquala.git

# 2. Entrar a la carpeta del proyecto
cd Aquala/aquala-next

# 3. Instalar dependencias
npm install

# 4. Correr el servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

> **Nota importante:** Turbopack no lee `.env.local`, por lo que las credenciales de Supabase y Mercado Pago están hardcodeadas en `src/lib/supabase.js` y `src/lib/mercadopago.js`.

---

## 📁 Estructura del Proyecto
aquala-next/src/
├── middleware.js                    — Protege /admin, redirige a /login
├── lib/
│   ├── supabase.js                  — Cliente Supabase (credenciales hardcodeadas)
│   └── mercadopago.js               — Cliente Mercado Pago (credenciales hardcodeadas)
└── app/
├── page.js                      — Server Component, renderiza ClientLayout
├── layout.js                    — RootLayout
├── globals.css                  — Estilos globales con CSS variables
├── login/page.js                — Login admin (contraseña: admin123)
├── admin/
│   ├── page.jsx                 — Panel de administración
│   └── ordenes/page.js          — Tabla de órdenes desde Supabase
├── checkout/page.jsx            — Resumen de orden + botón pagar con MP
├── pago-completado/page.jsx     — Confirmación de pago exitoso
├── pago-fallido/page.jsx        — Pago rechazado
├── pago-pendiente/page.jsx      — Pago pendiente
├── api/
│   ├── productos/route.js       — GET todos los productos
│   ├── productos/[id]/route.js  — GET producto por ID
│   ├── contacto/route.js        — POST con validación Zod
│   ├── ordenes/route.js         — GET y POST órdenes
│   ├── ordenes/[id]/route.js    — GET orden por ID con order_items
    │   ├── admin/stats/route.js     — Estadísticas del panel admin
│   └── pagos/
│       ├── crear-preferencia/route.js  — Crea preferencia MP
│       └── webhook/route.js            — Recibe y verifica notificaciones MP
└── components/
├── ClientLayout.jsx         — Manejo de estado del carrito
├── Header.jsx               — Navegación principal
├── Hero.jsx                 — Sección principal
├── Productos.jsx            — Catálogo de productos desde /api/productos
├── Comentarios.jsx          — Sección de comentarios de clientes
├── Nosotros.jsx             — Historia y misión de la marca
├── Contacto.jsx             — Formulario de contacto con validación Zod
├── Carrito.jsx              — Carrito lateral, crea orden y redirige a /checkout
└── Footer.jsx               — Pie de página con navegación y contacto

---

## 🗄️ Base de Datos (Supabase)

### Tablas

**`products`** — productos del catálogo con nombre, precio, descripción, imagen y stock

**`orders`** — órdenes de compra con nombre, email, total, estado y status (actualizado por webhook)

**`order_items`** — items de cada orden con referencia a producto, cantidad y precio

### Políticas RLS

- `products`: SELECT público
- `orders`: INSERT, SELECT y UPDATE públicos
- `order_items`: INSERT y SELECT públicos

---

## 🛒 Flujo de Compra E2E

1. Usuario navega el catálogo de productos
2. Agrega productos al carrito (estado en memoria con useState)
3. "Finalizar compra" → ingresa nombre y email
4. `POST /api/ordenes` → se crea la orden en Supabase con estado `pendiente`
5. Redirige a `/checkout?orden_id=X`
6. "Pagar con Mercado Pago" → `POST /api/pagos/crear-preferencia`
7. `window.location.href = init_point` → redirige al checkout de MP
8. Usuario completa el pago
9. MP envía webhook a `/api/pagos/webhook`
10. Webhook verifica firma HMAC SHA256, consulta estado real a la API de MP
11. Actualiza `status` en Supabase y descuenta stock del producto
12. Usuario es redirigido a `/pago-completado`

### Casos edge contemplados

- **Stock agotado:** el stock nunca baja de 0 (`Math.max(0, stock - cantidad)`)
- **Pago fallido:** redirige a `/pago-fallido` con mensaje de error
- **Pago pendiente:** redirige a `/pago-pendiente`
- **Reintentos de webhook:** detecta órdenes ya con `status = pagado` y las ignora
- **Error de red en productos:** muestra mensaje en vez de crashear

---

## 🔔 Webhooks — Mercado Pago

- **Verificación de firma:** valida `x-signature` con HMAC SHA256 usando la clave secreta del panel de MP
- **Consulta a la API de MP:** verifica el estado real del pago con el `payment_id`
- **Actualización de estado:** actualiza `status` en Supabase
- **Actualización de stock:** descuenta stock de cada producto al aprobar un pago
- **Manejo de reintentos:** evita procesar órdenes duplicadas

### Estados de pago

| Estado MP | Estado en BD |
|---|---|
| `approved` | `pagado` |
| `rejected` | `rechazado` |
| `pending` | `pendiente` |
| `in_process` | `en_proceso` |

---

## 🔐 Panel de Administración

Acceso en `/admin` — login en `/login`

- **Contraseña:** `admin123`
- **Cookie:** `admin-token` verificada por middleware de Next.js

Funcionalidades:
- Vista de todas las órdenes con estados
- Estadísticas básicas de ventas

> La autenticación es manual con cookie. No usa Supabase Auth.

---

## 🧪 Testing con Sandbox de Mercado Pago

**Cuenta compradora de prueba:**
- Usuario: `TESTUSER7442435319000919767`
- Contraseña: `LOlyJVgkti`
- Código de verificación: `642768`

**Tarjeta de prueba (pago aprobado):**

| Campo | Valor |
|---|---|
| Número | 5031 7557 3453 0604 |
| Vencimiento | 11/30 |
| CVV | 123 |
| Nombre | APRO |
| DNI | 12345678 |

---

## 🌐 Testing local con ngrok

Para recibir webhooks de Mercado Pago en desarrollo local:

```powershell
# Terminal 1 — Next.js
cd aquala-next
npm run dev

# Terminal 2 — ngrok
& 'C:\Users\Emma\ngrok.exe' http 3000
```

Actualizar `notification_url` en `src/app/api/pagos/crear-preferencia/route.js` con la nueva URL de ngrok cada vez que se reinicie.

---

## 📡 API Reference

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/productos` | Lista todos los productos desde Supabase |
| GET | `/api/productos/[id]` | Obtiene un producto por ID |
| POST | `/api/ordenes` | Crea una nueva orden en Supabase |
| GET | `/api/ordenes` | Lista todas las órdenes |
| GET | `/api/ordenes/[id]` | Obtiene una orden con sus order_items |
| POST | `/api/contacto` | Envía formulario de contacto con validación Zod |
| GET | `/api/admin/stats` | Estadísticas del panel admin |
| POST | `/api/pagos/crear-preferencia` | Crea preferencia de pago en MP con metadata y notification_url |
| POST | `/api/pagos/webhook` | Recibe, verifica firma y procesa notificaciones de MP |

---

## ⚙️ CI/CD y Deploy

- Workflow de GitHub Actions en `.github/workflows/ci.yml` — checks automáticos en cada PR
- Cada `push` a `main` genera un deploy automático en Vercel
- Cada PR genera una **Preview URL** para revisión antes de mergear
- Root directory en Vercel: `aquala-next`

---

## 📋 Entregas y Criterios

| Entregable | Semana | % | Descripción | Estado |
|---|---|---|---|---|
| E1 | 2 | 10% | Repo operativo, pipeline CI/CD, preview por PR | ✅ |
| E2 | 4 | 15% | Maquetado semántico, responsive, accesible | ✅ |
| E3 | 6 | 15% | DOM dinámico, validación, fetch integrado | ✅ |
| E4 | 9 | 20% | Catálogo + API interna, lógica funcional | ✅ |
| E5 | 12 | 20% | BD modelada, CRUD completo, persistencia | ✅ |
| E6 | 15-16 | 20% | Pagos + webhooks, demo operativa | ✅ |

**Criterios transversales:** Funcionalidad (40%) | Código/estructura (20%) | Interfaz/Accesibilidad (15%) | Despliegue (15%) | Documentación (10%)

---

## 👩‍💻 Autora

**Emma Garibaldi**  
Programación Web — ITBA  
2026