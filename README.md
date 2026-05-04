# Plaza de Abastos — Backend API

API REST para el marketplace **Plaza de Abastos**, un sistema multivendedor de mercado local desarrollado como Trabajo de Fin de Grado (TFG) del ciclo de Desarrollo de Aplicaciones Web (DAW).

Repositorio frontend: [PlazaDeAbastos-Frontend](https://github.com/AntonioBarcel0/PlazaDeAbastos-Frontend)

---

## Tabla de contenidos

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Documentación de la API](#documentación-de-la-api)
  - [Autenticación](#autenticación)
  - [Productos](#productos)
  - [Vendedores](#vendedores)
  - [Pedidos](#pedidos)
  - [Cestas predefinidas](#cestas-predefinidas)
- [Modelos de datos](#modelos-de-datos)
- [Roles y permisos](#roles-y-permisos)
- [Subida de imágenes](#subida-de-imágenes)
- [Contacto](#contacto)

---

## Características

- Autenticación mediante JWT con control de acceso basado en roles (RBAC)
- Sistema de pedidos multivendedor: un único pedido genera subpedidos automáticos por vendedor
- Gestión de stock automática (productos por kg y por unidad)
- Cestas predefinidas por tipo (frutas, verduras, mixta, comestibles)
- Subida de imágenes de productos y perfiles de vendedor
- Panel de estadísticas para vendedores y gestores
- Sincronización automática del esquema de base de datos con Sequelize

---

## Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| Runtime | Node.js 18+ |
| Framework | Express 4.x |
| ORM | Sequelize 6.x |
| Base de datos | MySQL 8.x |
| Autenticación | JSON Web Tokens (jsonwebtoken) |
| Hashing | bcryptjs |
| Subida de archivos | Multer |
| Variables de entorno | dotenv |
| Desarrollo | Nodemon |
| Testing | Vitest |

---

## Arquitectura

El sistema implementa un modelo de pedido **multivendedor** donde:

1. El cliente crea un único pedido con artículos de distintos vendedores.
2. El backend agrupa los artículos por vendedor y genera un **SubOrder** por cada uno.
3. Cada vendedor gestiona únicamente su subpedido (estado, notas).
4. El estado global del **Order** se recalcula automáticamente a partir del estado de sus subpedidos.
5. El gestor de mercado tiene visibilidad total y puede marcar pedidos como entregados.

```text
Order (cliente)
  └── SubOrder (vendedor A)
  │     └── OrderItem (producto 1)
  │     └── OrderItem (cesta predefinida)
  └── SubOrder (vendedor B)
        └── OrderItem (producto 2)
```

---

## Estructura del proyecto

```text
PlazaDeAbastos-Backend/
├── config/
│   └── database.js           # Conexión Sequelize / MySQL
├── controllers/
│   ├── authController.js     # Registro y login
│   ├── cestaController.js    # CRUD cestas predefinidas
│   ├── orderController.js    # Pedidos, subpedidos y estadísticas
│   ├── productController.js  # CRUD productos
│   └── vendedorController.js # Perfiles de vendedor
├── middleware/
│   └── auth.js               # JWT y guards de rol
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
├── uploads/                  # Imágenes subidas (generado en runtime)
├── migrate-multivendor.js    # Script de migración al modelo multivendedor
├── server.js                 # Punto de entrada, relaciones y sync
├── package.json
└── .env                      # Variables de entorno (no incluido en git)
```

---

## Instalación y puesta en marcha

### 1. Clonar el repositorio

```bash
git clone https://github.com/AntonioBarcel0/PlazaDeAbastos-Backend.git
cd PlazaDeAbastos-Backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea el archivo `.env` en la raíz (ver [Variables de entorno](#variables-de-entorno)).

### 4. Crear la base de datos

Ejecuta este comando en MySQL Workbench o en tu cliente preferido:

```sql
CREATE DATABASE plaza_abastos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Arrancar el servidor

```bash
npm run dev
```

El servidor arranca en `http://localhost:5000` (o el puerto definido en `PORT`).

> **Primera vez / migración:** Si previamente tenías una versión anterior de la base de datos (esquema mono-vendedor), ejecuta el script de migración **una sola vez** antes de arrancar el servidor:
> ```bash
> node migrate-multivendor.js
> ```
> Esto elimina las tablas antiguas y las recrea con el nuevo esquema multivendedor.

---

## Variables de entorno

Crea un archivo `.env` en la raíz con el siguiente contenido:

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

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor con Nodemon (recarga automática) |
| `npm start` | Inicia el servidor en modo producción |
| `npm test` | Ejecuta los tests con Vitest |
| `npm run test:watch` | Ejecuta los tests en modo watch |
| `npm run seed` | Puebla la base de datos con datos de prueba |

---

## Documentación de la API

Base URL: `http://localhost:5000/api`

Las rutas protegidas requieren el header:

```http
Authorization: Bearer <token>
```

---

### Autenticación

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/auth/register` | Público | Registrar nuevo usuario |
| POST | `/auth/login` | Público | Login, devuelve JWT |

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
{
  "email": "juan@email.com",
  "password": "contraseña123"
}
```

Respuesta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "nombre": "Juan", "role": "cliente" }
}
```

---

### Productos

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| GET | `/products` | Público | Listar productos (filtros: `categoria`, `vendedor`, `disponible`) |
| GET | `/products/:id` | Público | Detalle de un producto |
| GET | `/products/my/products` | Comerciante | Productos del vendedor autenticado |
| POST | `/products` | Comerciante | Crear producto (multipart/form-data) |
| PUT | `/products/:id` | Comerciante | Actualizar producto (solo propietario) |
| DELETE | `/products/:id` | Comerciante | Eliminar producto (solo propietario) |

#### Campos del producto

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `nombre` | String | Sí | Nombre del producto |
| `precio` | Decimal | Sí | Precio |
| `unidad` | String | No | `kg`, `unidad`, `litro`, etc. (por defecto: `kg`) |
| `categoria` | String | Sí | Categoría |
| `stock` | Integer | Sí | Unidades disponibles |
| `descripcion` | Text | No | Descripción |
| `imagen` | File | No | Imagen (jpeg, png, webp — máx. 5 MB) |
| `disponible` | Boolean | No | Por defecto `true` |

---

### Vendedores

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| GET | `/vendedores` | Público | Listar vendedores (filtros: `categoria`, `search`) |
| GET | `/vendedores/categorias` | Público | Categorías disponibles |
| GET | `/vendedores/:id` | Público | Perfil del vendedor con sus productos |
| PATCH | `/vendedores/profile` | Comerciante | Actualizar imagen de perfil y especialidad |

---

### Pedidos

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/orders` | Cliente | Crear pedido multivendedor |
| GET | `/orders/my-purchases` | Cliente | Historial de compras del cliente |
| GET | `/orders/my-orders` | Comerciante | Subpedidos del vendedor |
| GET | `/orders/stats` | Comerciante | Estadísticas del vendedor |
| GET | `/orders/:id` | Comerciante | Detalle de un subpedido |
| PATCH | `/orders/:id/status` | Comerciante | Actualizar estado del subpedido |
| PATCH | `/orders/:id/notes` | Comerciante | Añadir notas al subpedido |
| GET | `/orders/all` | Gestor | Todos los pedidos del mercado |
| GET | `/orders/gestor-stats` | Gestor | Estadísticas globales |
| PATCH | `/orders/:id/deliver` | Gestor | Marcar pedido como entregado |

#### POST `/orders` — Crear pedido

```json
{
  "items": [
    { "productId": "uuid-producto", "cantidad": 2 },
    { "cestaId": "uuid-cesta", "cantidad": 1 }
  ],
  "modoEntrega": "domicilio",
  "direccionEntrega": "Calle Mayor 1",
  "telefonoContacto": "600000000",
  "notasCliente": "Sin gluten si es posible",
  "fechaEntrega": "2025-06-01"
}
```

#### Estados del subpedido

```text
pendiente → confirmado → preparando → listo → entregado
                                             ↘ cancelado
```

---

### Cestas predefinidas

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| GET | `/cestas` | Público | Listar cestas activas (filtro: `?tipo=`) |
| GET | `/cestas/mis-cestas` | Comerciante | Cestas del vendedor autenticado |
| POST | `/cestas` | Comerciante | Crear cesta |
| PUT | `/cestas/:id` | Comerciante | Actualizar cesta |
| DELETE | `/cestas/:id` | Comerciante | Eliminar cesta |

#### Tipos de cesta

`frutas` · `verduras` · `mixta` · `comestibles`

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

## Modelos de datos

### User

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | UUID | Clave primaria |
| `nombre` | String(100) | Nombre |
| `apellidos` | String(100) | Apellidos |
| `email` | String(255) | Email único |
| `password` | String(255) | Hash bcrypt |
| `telefono` | String(20) | Teléfono |
| `direccion` | Text | Dirección |
| `role` | ENUM | `cliente`, `comerciante`, `admin`, `gestor` |
| `imagenPerfil` | String(500) | URL imagen |
| `especialidad` | String(200) | Especialidad del vendedor |

### Product

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | UUID | Clave primaria |
| `nombre` | String(200) | Nombre |
| `descripcion` | Text | Descripción |
| `precio` | Decimal(10,2) | Precio |
| `unidad` | String(50) | `kg`, `unidad`, `litro`... |
| `categoria` | String(100) | Categoría |
| `stock` | Integer | Stock disponible |
| `imagen` | String(500) | URL imagen |
| `disponible` | Boolean | Visibilidad en el catálogo |
| `vendedorId` | UUID (FK) | Referencia a User |

### Order

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | UUID | Clave primaria |
| `clienteId` | UUID (FK) | Referencia a User |
| `estado` | ENUM | `pendiente`, `confirmado`, `preparando`, `listo`, `entregado`, `cancelado` |
| `total` | Decimal(10,2) | Total del pedido |
| `modoEntrega` | ENUM | `recogida`, `domicilio` |
| `direccionEntrega` | String | Dirección de entrega |
| `telefonoContacto` | String | Teléfono |
| `notasCliente` | Text | Notas del cliente |
| `fechaEntrega` | Date | Fecha deseada |

### SubOrder

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | UUID | Clave primaria |
| `orderId` | UUID (FK) | Referencia a Order |
| `vendedorId` | UUID (FK) | Referencia a User |
| `estado` | ENUM | Estado del subpedido |
| `subtotal` | Decimal(10,2) | Subtotal del vendedor |
| `notasVendedor` | Text | Notas internas del vendedor |

### OrderItem

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | UUID | Clave primaria |
| `subOrderId` | UUID (FK) | Referencia a SubOrder |
| `productId` | UUID (FK) | Referencia a Product (nullable) |
| `cestaId` | UUID (FK) | Referencia a CestaPredefinida (nullable) |
| `cantidad` | Integer | Cantidad |
| `precioUnitario` | Decimal(10,2) | Precio unitario en el momento del pedido |
| `subtotal` | Decimal(10,2) | Subtotal de la línea |
| `nombreProducto` | String | Nombre capturado en el momento del pedido |
| `unidad` | String | Unidad de medida |

### CestaPredefinida

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `id` | UUID | Clave primaria |
| `vendedorId` | UUID (FK) | Referencia a User |
| `tipo` | ENUM | `frutas`, `verduras`, `mixta`, `comestibles` |
| `nombre` | String | Nombre de la cesta |
| `precio` | Decimal(10,2) | Precio |
| `descripcion` | Text | Descripción |
| `items` | JSON | Listado de artículos incluidos |
| `activa` | Boolean | Disponible para compra |

---

## Roles y permisos

| Acción | Cliente | Comerciante | Gestor | Admin |
| --- | :---: | :---: | :---: | :---: |
| Ver productos y vendedores | ✅ | ✅ | ✅ | ✅ |
| Crear pedido | ✅ | — | — | ✅ |
| Ver historial de compras | ✅ | — | — | ✅ |
| Gestionar sus productos | — | ✅ | — | ✅ |
| Gestionar sus cestas | — | ✅ | — | ✅ |
| Ver y gestionar sus subpedidos | — | ✅ | — | ✅ |
| Ver todos los pedidos | — | — | ✅ | ✅ |
| Marcar pedido como entregado | — | — | ✅ | ✅ |
| Estadísticas globales | — | — | ✅ | ✅ |

---

## Subida de imágenes

Las imágenes se almacenan en la carpeta `/uploads/` y se sirven como archivos estáticos en `/uploads/<nombre-archivo>`.

- **Formatos aceptados:** JPEG, JPG, PNG, GIF, WebP
- **Tamaño máximo:** 5 MB
- **Endpoints que aceptan imagen:** `POST /products`, `PUT /products/:id`, `PATCH /vendedores/profile`
- **Content-Type requerido:** `multipart/form-data`

---

## Contacto

**Antonio Barceló Lerlanga**
- GitHub: [@AntonioBarcel0](https://github.com/AntonioBarcel0)
- Email: antoniogibarber99@gmail.com

Proyecto académico — Desarrollo de Aplicaciones Web (DAW)
