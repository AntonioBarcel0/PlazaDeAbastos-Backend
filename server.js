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
import cestaRoutes from './routes/cestas.js';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import SubOrder from './models/SubOrder.js';
import OrderItem from './models/OrderItem.js';
import CestaPredefinida from './models/CestaPredefinida.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Establecer relaciones entre modelos
User.hasMany(Product, { foreignKey: 'vendedorId', as: 'productos' });
Product.belongsTo(User, { foreignKey: 'vendedorId', as: 'vendedor' });

// Relaciones de pedidos — Order pertenece al cliente
User.hasMany(Order, { foreignKey: 'clienteId', as: 'pedidosCliente' });
Order.belongsTo(User, { foreignKey: 'clienteId', as: 'cliente' });

// SubOrder — cada sub-pedido pertenece a un vendedor y a una Order
Order.hasMany(SubOrder, { foreignKey: 'orderId', as: 'subOrders' });
SubOrder.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

User.hasMany(SubOrder, { foreignKey: 'vendedorId', as: 'subPedidos' });
SubOrder.belongsTo(User, { foreignKey: 'vendedorId', as: 'vendedor' });

// OrderItem pertenece a SubOrder
SubOrder.hasMany(OrderItem, { foreignKey: 'subOrderId', as: 'items' });
OrderItem.belongsTo(SubOrder, { foreignKey: 'subOrderId', as: 'subOrder' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'producto', constraints: false });

// CestaPredefinida pertenece al vendedor
User.hasMany(CestaPredefinida, { foreignKey: 'vendedorId', as: 'cestas' });
CestaPredefinida.belongsTo(User, { foreignKey: 'vendedorId', as: 'vendedor' });
OrderItem.belongsTo(CestaPredefinida, { foreignKey: 'cestaId', as: 'cesta' });

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
app.use('/api/cestas', cestaRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando ✅' });
});

const PORT = process.env.PORT || 5000;

// Conectar a MySQL y arrancar servidor
sequelize.authenticate()
  .then(async () => {
    console.log('✅ MySQL conectado');

    // Eliminar FKs antiguas que bloquean el alter (si existen)
    const qi = sequelize.getQueryInterface();
    const tryDrop = async (table, fk) => {
      try { await qi.removeConstraint(table, fk); } catch (_) {}
    };
    await tryDrop('OrderItems', 'orderitems_ibfk_2');
    await tryDrop('OrderItems', 'OrderItems_productId_foreign_idx');

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
