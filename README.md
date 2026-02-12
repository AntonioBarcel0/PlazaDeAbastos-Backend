# 🛒 Plaza de Abastos - Backend API

API REST desarrollada con Node.js, Express y MySQL para el marketplace Plaza de Abastos. Sistema completo de autenticación, gestión de usuarios, productos, pedidos y chat en tiempo real.

## 🚀 Tecnologías

- **Node.js** v18+
- **Express** 4.18.2
- **MySQL** con Sequelize ORM
- **JWT** para autenticación
- **bcryptjs** para hash de contraseñas
- **Socket.IO** para chat en tiempo real (próximamente)

## 📋 Requisitos previos

Antes de comenzar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) v18 o superior
- [MySQL](https://dev.mysql.com/downloads/) 8.0 o superior
- [Git](https://git-scm.com/)

## ⚙️ Instalación

### 1. Clonar el repositorio

git clone https://github.com/AntonioBarcel0/PlazaDeAbastos-Backend.git
cd PlazaDeAbastos-Backend

### 2. Instalar dependencias

npm install

### 3. Configurar variables de entorno

Crea un archivo .env en la raíz del proyecto:
- cp .env.example .env

Editar el archivo .env con tus credenciales
1. Servidor
NODE_ENV=development
PORT=5001

2. Base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=plaza_abastos
DB_USER=root
DB_PASSWORD=tu_password_mysql

3. JWT
JWT_SECRET=tu_clave_secreta_super_larga_y_segura
JWT_EXPIRE=7d

### 4. Crear base de datos 

Abrir MySQL Workbench o preferente y ejecutar:
CREATE DATABASE plaza_abastos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

### 5. Iniciar el servidor 
1. Desarrollo (con nodemon)
npm run dev

2. Producción
npm start

El servidor estará disponible en http://localhost:5001

## 📄 Licencia
Este proyecto es complementario del siguiente repositorio: https://github.com/AntonioBarcel0/PlazaDeAbastos-Frontend.git 
Ambos repositorios son parte de un Trabajo de Fin de Grado (TFG) para el ciclo de Desarrollo de Aplicaciones Web (DAW).

## 🗺️ Roadmap

 ✅ Sistema de autenticación con JWT

 ✅ CRUD de usuarios

 CRUD de productos

 Sistema de pedidos

 Chat en tiempo real con Socket.IO

 Pasarela de pago con Stripe

 Generación de facturas PDF

 Envío de emails automáticos

 Panel de administración

 Tests unitarios y de integración

## 📞 Contacto

Antonio Barceló Lerlanga

GitHub: @AntonioBarcel0

Email: antoniogibarber99@gmail.com
