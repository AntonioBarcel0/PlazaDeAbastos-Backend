import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SubOrder = sequelize.define('SubOrder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Orders',
      key: 'id'
    }
  },
  vendedorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado'),
    defaultValue: 'pendiente'
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  notasVendedor: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'SubOrders'
});

export default SubOrder;
