import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  clienteId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
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
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  direccionEntrega: {
    type: DataTypes.STRING,
    allowNull: true
  },
  telefonoContacto: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notasCliente: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notasVendedor: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fechaEntrega: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'Orders'
});

export default Order;
