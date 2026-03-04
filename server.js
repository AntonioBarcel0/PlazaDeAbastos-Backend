import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from './config/database.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import vendedorRoutes from './routes/vendedores.js';
import orderRoutes from './routes/orders.js';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import OrderItem from './models/OrderItem.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Establecer relaciones entre modelos
User.hasMany(Product, { foreignKey: 'vendedorId', as: 'productos' });
Product.belongsTo(User, { foreignKey: 'vendedorId', as: 'vendedor' });

// Relaciones de pedidos
User.hasMany(Order, { foreignKey: 'clienteId', as: 'pedidosCliente' });
User.hasMany(Order, { foreignKey: 'vendedorId', as: 'pedidosVendedor' });
Order.belongsTo(User, { foreignKey: 'clienteId', as: 'cliente' });
Order.belongsTo(User, { foreignKey: 'vendedorId', as: 'vendedor' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'pedido' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'producto' });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vendedores', vendedorRoutes);
app.use('/api/orders', orderRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando ✅' });
});

const PORT = process.env.PORT || 5000;

// Conectar a MySQL y arrancar servidor
sequelize.authenticate()
  .then(() => {
    console.log('✅ MySQL conectado');

    // Sincronizar modelos
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('✅ Tablas creadas/actualizadas');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Error:', err);
  });