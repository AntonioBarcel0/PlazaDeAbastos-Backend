import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
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

// Garantizar que la carpeta uploads existe (no está en git)
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

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

    // Limpiar índices duplicados en email que genera sync({ alter:true })
    // (bug conocido de Sequelize: añade un nuevo unique index en cada restart)
    const qi = sequelize.getQueryInterface();
    try {
      const indexes = await qi.showIndex('Users');
      const duplicates = indexes.filter(ix => ix.name !== 'PRIMARY' && ix.name !== 'email');
      for (const ix of duplicates) {
        try { await qi.removeIndex('Users', ix.name); } catch (_) {}
      }
    } catch (_) {}

    // Añadir columnas nuevas si no existen (email verification + password reset)
    const cols = await qi.describeTable('Users').catch(() => ({}));
    if (!cols.emailVerificado) {
      await qi.addColumn('Users', 'emailVerificado', { type: sequelize.constructor.DataTypes.BOOLEAN, defaultValue: false }).catch(() => {});
    }
    if (!cols.tokenVerificacion) {
      await qi.addColumn('Users', 'tokenVerificacion', { type: sequelize.constructor.DataTypes.STRING(255), allowNull: true }).catch(() => {});
    }
    if (!cols.resetToken) {
      await qi.addColumn('Users', 'resetToken', { type: sequelize.constructor.DataTypes.STRING(255), allowNull: true }).catch(() => {});
    }
    if (!cols.resetTokenExpira) {
      await qi.addColumn('Users', 'resetTokenExpira', { type: sequelize.constructor.DataTypes.DATE, allowNull: true }).catch(() => {});
    }

    // Crear tablas que falten sin modificar las existentes
    // (evita el bug de sync({ alter: true }) que acumula índices unique)
    return sequelize.sync({ alter: false });
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
