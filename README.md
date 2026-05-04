<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=8b2332&height=220&section=header&text=Plaza%20de%20Abastos%20API&fontSize=58&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Backend%20REST%20del%20Mercado%20Digital%20de%20Úbeda&descAlignY=58&descSize=20" width="100%"/>

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com)
[![Sequelize](https://img.shields.io/badge/Sequelize-6.x-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org)
[![Vitest](https://img.shields.io/badge/Vitest-58%20tests-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)

[![Estado](https://img.shields.io/badge/Estado-En%20desarrollo-orange?style=for-the-badge)](https://github.com/AntonioBarcel0/PlazaDeAbastos-Backend)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-green?style=for-the-badge)](LICENSE)
[![TFG](https://img.shields.io/badge/TFG-DAW%202025-8b2332?style=for-the-badge)](https://github.com/AntonioBarcel0)

</div>

---

## Índice

- [Descripción](#descripción)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Modelos de datos](#modelos-de-datos)
- [API Reference](#api-reference)
  - [Autenticación](#autenticación)
  - [Productos](#productos)
  - [Vendedores](#vendedores)
  - [Pedidos](#pedidos)
  - [Cestas predefinidas](#cestas-predefinidas)
- [Roles y permisos](#roles-y-permisos)
- [Testing](#testing)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Scripts](#scripts)
- [Frontend](#frontend)
- [Autor](#autor)

---

## Descripción

**Plaza de Abastos API** es el backend REST de la aplicación homónima, desarrollada como Trabajo de Fin de Grado del ciclo superior de **Desarrollo de Aplicaciones Web (DAW)**.

Proporciona autenticación JWT, gestión de productos y vendedores, un sistema de pedidos **multivendedor** (un pedido de cliente → N subpedidos por vendedor) y cestas predefinidas. Todo construido sobre **Node.js + Express + Sequelize + MySQL**.

> **Repositorio frontend:** [PlazaDeAbastos-Frontend](https://github.com/AntonioBarcel0/PlazaDeAbastos-Frontend)

---

## Tecnologías

<div align="center">

| Categoría | Tecnología | Versión |
|---|---|---|
| Runtime | Node.js | 18+ |
| Framework | Express | 4.x |
| ORM | Sequelize | 6.x |
| Base de datos | MySQL | 8.x |
| Autenticación | JSON Web Tokens (jsonwebtoken) | — |
| Hashing | bcryptjs | — |
| Subida de archivos | Multer | — |
| Imágenes en nube | Cloudinary | — |
| Variables de entorno | dotenv | — |
| Desarrollo | Nodemon | — |
| Testing | Vitest | 2.x |

</div>

---

## Arquitectura

### Modelo multivendedor

El sistema implementa un modelo de pedido **multivendedor** donde un único pedido de cliente genera subpedidos independientes por cada vendedor implicado:

```text
POST /orders  (cliente)
      │
      ▼
  Order  ──── clienteId, total, estado global
      │
      ├── SubOrder (vendedor A)  ← el comerciante A solo ve y gestiona este
      │     ├── OrderItem → Producto 1
      │     └── OrderItem → Cesta predefinida
      │
      └── SubOrder (vendedor B)  ← el comerciante B solo ve y gestiona este
            └── OrderItem → Producto 2
```

1. El cliente crea un único pedido con artículos de distintos vendedores.
2. El backend agrupa los artículos por `vendedorId` y crea un `SubOrder` por cada grupo.
3. Cada comerciante gestiona únicamente su subpedido (estado, notas).
4. El estado global de `Order` se recalcula automáticamente a partir de los estados de sus `SubOrder`.
5. El gestor de mercado tiene visibilidad total y puede marcar pedidos como entregados.

### Estado de los subpedidos

```text
pendiente → confirmado → preparando → listo → entregado
                                            ↘ cancelado
```

### Flujo de autenticación

```text
POST /auth/login
      │
      ▼
bcryptjs.compare(password, hash)
      │
      ▼
jwt.sign({ id, role }) → token (7 días)
      │
      ▼
Authorization: Bearer <token>  →  middleware auth.js  →  req.user
```

---

## Estructura del proyecto

```text
PlazaDeAbastos-Backend/
├── __tests__/
│   ├── authController.test.js       # 10 tests — registro y login
│   ├── vendedorController.test.js   # 12 tests — perfil y listado
│   ├── cestaController.test.js      # 20 tests — CRUD cestas
│   └── orderController.test.js      # 16 tests — pedidos y estados
├── config/
│   └── database.js                  # Conexión Sequelize / MySQL
├── controllers/
│   ├── authController.js            # Registro y login
│   ├── cestaController.js           # CRUD cestas predefinidas
│   ├── orderController.js           # Pedidos, subpedidos y estadísticas
│   ├── productController.js         # CRUD productos
│   └── vendedorController.js        # Perfiles de vendedor
├── middleware/
│   └── auth.js                      # JWT y guards de rol
├── models/
│   ├── CestaPredefinida.js
│   ├── Order.js
│   ├── OrderItem.js
│   ├── Product.js
│   ├── SubOrder.js
│   └── User.js
├── routes/
│   ├── auth.js
│   ├── cestas.js
│   ├── orders.js
│   ├── products.js
│   └── vendedores.js
├── uploads/                         # Imágenes subidas (generado en runtime)
├── migrate-multivendor.js           # Script de migración al modelo multivendedor
├── server.js                        # Punto de entrada, relaciones y sync
├── vitest.config.js
├── package.json
└── .env                             # Variables de entorno (no incluido en git)
```

---

## Modelos de datos

### Diagrama ER (simplificado)

```text
User ──────────────────────────────────────────────────┐
 │  id (PK, UUID)                                       │
 │  nombre, apellidos, email, password (bcrypt)         │
 │  role: cliente | comerciante | gestor | admin        │
 │  imagenPerfil, especialidad                          │
 │                                                      │
 ├──< Product                                           │
 │     id, nombre, descripcion, precio, unidad          │
 │     categoria, stock, imagen, disponible             │
 │     vendedorId (FK → User)                           │
 │                                                      │
 ├──< CestaPredefinida                                  │
 │     id, tipo, nombre, precio, descripcion            │
 │     items (JSON), activa                             │
 │     vendedorId (FK → User)                           │
 │                                                      │
 └──< Order (cliente)                                   │
       id, total, estado, modoEntrega                   │
       direccionEntrega, notasCliente, fechaEntrega      │
       clienteId (FK → User)                            │
        │                                               │
        └──< SubOrder                                   │
              id, subtotal, estado, notasVendedor        │
              orderId (FK → Order)                       │
              vendedorId (FK → User) ───────────────────┘
               │
               └──< OrderItem
                     id, cantidad, precioUnitario, subtotal
                     nombreProducto, unidad
                     productId (FK → Product, nullable)
                     cestaId (FK → CestaPredefinida, nullable)
```

### Tablas de campos

#### User

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Clave primaria |
| `nombre` | String(100) | Nombre |
| `apellidos` | String(100) | Apellidos |
| `email` | String(255) | Email único |
| `password` | String(255) | Hash bcrypt |
| `telefono` | String(20) | Teléfono |
| `direccion` | Text | Dirección |
| `role` | ENUM | `cliente`, `comerciante`, `gestor`, `admin` |
| `imagenPerfil` | String(500) | URL imagen (local o Cloudinary) |
| `especialidad` | String(200) | Especialidad del vendedor |

#### Product

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Clave primaria |
| `nombre` | String(200) | Nombre del producto |
| `descripcion` | Text | Descripción |
| `precio` | Decimal(10,2) | Precio |
| `unidad` | String(50) | `kg`, `ud`, `litro`… |
| `categoria` | String(100) | Categoría |
| `stock` | Integer / Float | Stock disponible |
| `imagen` | String(500) | URL imagen (local o Cloudinary) |
| `disponible` | Boolean | Visible en el catálogo |
| `vendedorId` | UUID (FK) | Referencia a User |

#### Order

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Clave primaria |
| `clienteId` | UUID (FK) | Referencia a User |
| `estado` | ENUM | `pendiente` → `confirmado` → `preparando` → `listo` → `entregado` / `cancelado` |
| `total` | Decimal(10,2) | Total del pedido |
| `modoEntrega` | ENUM | `recogida`, `domicilio` |
| `direccionEntrega` | String | Dirección de entrega |
| `telefonoContacto` | String | Teléfono de contacto |
| `notasCliente` | Text | Notas del cliente |
| `fechaEntrega` | Date | Fecha deseada |

#### SubOrder

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Clave primaria |
| `orderId` | UUID (FK) | Referencia a Order |
| `vendedorId` | UUID (FK) | Referencia a User |
| `estado` | ENUM | Estado del subpedido |
| `subtotal` | Decimal(10,2) | Subtotal del vendedor |
| `notasVendedor` | Text | Notas internas |

#### OrderItem

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Clave primaria |
| `subOrderId` | UUID (FK) | Referencia a SubOrder |
| `productId` | UUID (FK) | Referencia a Product (nullable) |
| `cestaId` | UUID (FK) | Referencia a CestaPredefinida (nullable) |
| `cantidad` | Integer | Cantidad pedida |
| `precioUnitario` | Decimal(10,2) | Precio en el momento del pedido |
| `subtotal` | Decimal(10,2) | Subtotal de la línea |
| `nombreProducto` | String | Nombre capturado en el momento del pedido |
| `unidad` | String | Unidad de medida |

#### CestaPredefinida

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | Clave primaria |
| `vendedorId` | UUID (FK) | Referencia a User |
| `tipo` | ENUM | `frutas`, `verduras`, `mixta`, `comestibles` |
| `nombre` | String | Nombre de la cesta |
| `precio` | Decimal(10,2) | Precio |
| `descripcion` | Text | Descripción |
| `items` | JSON | Artículos incluidos en la cesta |
| `activa` | Boolean | Disponible para compra |

---

## API Reference

**Base URL:** `http://localhost:5000/api`

Las rutas protegidas requieren el header:

```http
Authorization: Bearer <token>
```

---

### Autenticación

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/auth/register` | Público | Registrar nuevo usuario |
| `POST` | `/auth/login` | Público | Login, devuelve JWT |

#### POST `/auth/register`

```json
{
  "nombre": "Juan",
  "apellidos": "García López",
  "email": "juan@email.com",
  "password": "contraseña123",
  "telefono": "600000000",
  "role": "cliente"
}
```

#### POST `/auth/login`

```json
{ "email": "juan@email.com", "password": "contraseña123" }
```

Respuesta `200`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "uuid", "nombre": "Juan", "role": "cliente" }
}
```

---

### Productos

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/products` | Público | Listar productos (filtros: `categoria`, `vendedor`, `disponible`) |
| `GET` | `/products/:id` | Público | Detalle de un producto |
| `GET` | `/products/my/products` | Comerciante | Productos del vendedor autenticado |
| `POST` | `/products` | Comerciante | Crear producto (`multipart/form-data`) |
| `PUT` | `/products/:id` | Comerciante | Actualizar producto (solo propietario) |
| `DELETE` | `/products/:id` | Comerciante | Eliminar producto (solo propietario) |

#### Campos del producto (`multipart/form-data`)

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `nombre` | String | Sí | Nombre del producto |
| `precio` | Decimal | Sí | Precio |
| `categoria` | String | Sí | Categoría |
| `unidad` | String | No | `kg`, `ud`, `litro`… (por defecto `kg`) |
| `stock` | Number | No | Stock disponible |
| `descripcion` | Text | No | Descripción |
| `imagen` | File | No | JPEG / PNG / WebP — máx. 5 MB |
| `disponible` | Boolean | No | Por defecto `true` |

---

### Vendedores

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/vendedores` | Público | Listar vendedores (filtros: `categoria`, `search`) |
| `GET` | `/vendedores/categorias` | Público | Categorías disponibles |
| `GET` | `/vendedores/:id` | Público | Perfil del vendedor con sus productos |
| `PATCH` | `/vendedores/profile` | Comerciante | Actualizar imagen de perfil y especialidad |

---

### Pedidos

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/orders` | Cliente | Crear pedido multivendedor |
| `GET` | `/orders/my-purchases` | Cliente | Historial de compras del cliente |
| `GET` | `/orders/my-orders` | Comerciante | Subpedidos del vendedor |
| `GET` | `/orders/stats` | Comerciante | Estadísticas del vendedor |
| `GET` | `/orders/:id` | Comerciante | Detalle de un subpedido |
| `PATCH` | `/orders/:id/status` | Comerciante | Actualizar estado del subpedido |
| `PATCH` | `/orders/:id/notes` | Comerciante | Añadir notas al subpedido |
| `GET` | `/orders/all` | Gestor | Todos los pedidos del mercado |
| `GET` | `/orders/gestor-stats` | Gestor | Estadísticas globales |
| `PATCH` | `/orders/:id/deliver` | Gestor | Marcar pedido como entregado |

#### POST `/orders` — Crear pedido

```json
{
  "items": [
    { "productId": "uuid-producto", "cantidad": 2 },
    { "cestaId": "uuid-cesta", "cantidad": 1 }
  ],
  "modoEntrega": "domicilio",
  "direccionEntrega": "Calle Mayor 1, Úbeda",
  "telefonoContacto": "600000000",
  "notasCliente": "Sin gluten si es posible",
  "fechaEntrega": "2025-06-01"
}
```

Respuesta `201`:

```json
{
  "success": true,
  "order": {
    "id": "uuid-order",
    "total": 17.50,
    "estado": "pendiente",
    "subOrders": [ { "id": "uuid-suborder", "vendedorId": "...", "subtotal": 17.50 } ]
  }
}
```

---

### Cestas predefinidas

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/cestas` | Público | Listar cestas activas (filtro: `?tipo=`) |
| `GET` | `/cestas/mis-cestas` | Comerciante | Cestas del vendedor autenticado |
| `POST` | `/cestas` | Comerciante | Crear cesta |
| `PUT` | `/cestas/:id` | Comerciante | Actualizar cesta |
| `DELETE` | `/cestas/:id` | Comerciante | Eliminar cesta |

**Tipos válidos:** `frutas` · `verduras` · `mixta` · `comestibles`

#### POST `/cestas` — Crear cesta

```json
{
  "nombre": "Cesta de temporada",
  "tipo": "mixta",
  "precio": 15.00,
  "descripcion": "Selección de frutas y verduras de temporada",
  "items": [
    { "nombre": "Manzanas", "cantidad": "1 kg" },
    { "nombre": "Tomates", "cantidad": "500 g" }
  ]
}
```

---

## Roles y permisos

| Acción | Cliente | Comerciante | Gestor | Admin |
|---|:---:|:---:|:---:|:---:|
| Ver productos y vendedores | ✅ | ✅ | ✅ | ✅ |
| Crear pedido | ✅ | — | — | ✅ |
| Ver historial de compras | ✅ | — | — | ✅ |
| Gestionar sus productos | — | ✅ | — | ✅ |
| Gestionar sus cestas | — | ✅ | — | ✅ |
| Ver y gestionar sus subpedidos | — | ✅ | — | ✅ |
| Ver todos los pedidos del mercado | — | — | ✅ | ✅ |
| Marcar pedido como entregado | — | — | ✅ | ✅ |
| Estadísticas globales | — | — | ✅ | ✅ |

El middleware `auth.js` expone los guards:

```js
protect          // requiere token JWT válido
authorize(roles) // restringe a uno o varios roles
```

---

## Testing

El proyecto cuenta con **4 suites de tests** y **58 tests** que cubren los controladores críticos con mocks de Sequelize y transacciones.

```
 ✓  __tests__/authController.test.js       (10 tests)
 ✓  __tests__/vendedorController.test.js   (12 tests)
 ✓  __tests__/cestaController.test.js      (20 tests)
 ✓  __tests__/orderController.test.js      (16 tests)

 Test Files  4 passed (4)
      Tests  58 passed (58)
```

### Cobertura por suite

| Suite | Tests | Qué se verifica |
|---|---|---|
| `authController` | 10 | Registro (validación email, contraseña, duplicados), login (credenciales inválidas, JWT devuelto), protección de rutas |
| `vendedorController` | 12 | Listado con filtros, detalle de perfil, actualización de imagen y especialidad, acceso restringido |
| `cestaController` | 20 | `getCestas` (filtro tipo, lista vacía), `getMisCestas`, `createCesta` (tipos válidos/inválidos, campos requeridos), `updateCesta` (404, tipo inválido, activar/desactivar), `deleteCesta` |
| `orderController` | 16 | `createOrder` (items vacíos, domicilio sin dirección, producto/cesta no encontrado, stock insuficiente ud/kg, cesta inactiva, éxito, rollback en error), `updateOrderStatus` (estados válidos/inválidos, 404, recálculo global) |

### Patrón de mocks

```js
// Mock de transacción Sequelize
vi.mock('../config/database.js', () => ({
  default: { transaction: vi.fn() },
}));

const t = { commit: vi.fn(), rollback: vi.fn() };
sequelize.transaction.mockResolvedValue(t);

// Verificación de transaccionalidad
expect(t.commit).toHaveBeenCalledTimes(1);
expect(t.rollback).not.toHaveBeenCalled();
```

### Ejecutar los tests

```bash
npm test              # Una sola vez
npm run test:watch    # Modo watch
```

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/AntonioBarcel0/PlazaDeAbastos-Backend.git
cd PlazaDeAbastos-Backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear la base de datos

```sql
CREATE DATABASE plaza_abastos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Configurar variables de entorno

Crea el archivo `.env` en la raíz (ver [Variables de entorno](#variables-de-entorno)).

### 5. Arrancar el servidor

```bash
npm run dev
```

El servidor arranca en `http://localhost:5000`.

> **Primera migración:** Si tenías una versión anterior (esquema mono-vendedor), ejecuta el script de migración **una sola vez** antes de arrancar:
> ```bash
> node migrate-multivendor.js
> ```

---

## Variables de entorno

```env
# Servidor
NODE_ENV=development
PORT=5000

# Base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=plaza_abastos
DB_USER=root
DB_PASSWORD=tu_password_mysql

# JWT
JWT_SECRET=clave_secreta_larga_y_aleatoria
JWT_EXPIRE=7d
```

---

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor con Nodemon (recarga automática) |
| `npm start` | Inicia el servidor en modo producción |
| `npm test` | Ejecuta los tests con Vitest |
| `npm run test:watch` | Ejecuta los tests en modo watch |

---

## Frontend

Este backend da servicio al frontend React de Plaza de Abastos:

**[➜ PlazaDeAbastos-Frontend](https://github.com/AntonioBarcel0/PlazaDeAbastos-Frontend)**

Stack: React 18 · Vite 5 · CSS3 · Context API · Vitest (74 tests)

---

## Autor

<div align="center">

**Antonio Barceló Berlanga**

[![GitHub](https://img.shields.io/badge/GitHub-AntonioBarcel0-181717?style=for-the-badge&logo=github)](https://github.com/AntonioBarcel0)
[![Email](https://img.shields.io/badge/Email-antoniogibarber99%40gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:antoniogibarber99@gmail.com)

*Trabajo de Fin de Grado · Ciclo Superior de Desarrollo de Aplicaciones Web (DAW) · 2025*

</div>

<img src="https://capsule-render.vercel.app/api?type=waving&color=8b2332&height=120&section=footer" width="100%"/>
