import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  unidad: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'kg',
    comment: 'Unidad de medida: kg, unidad, litro, etc.'
  },
  categoria: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Frutas, Verduras, Pescado, Carne, etc.'
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  imagen: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL o ruta de la imagen del producto'
  },
  disponible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  vendedorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  timestamps: true,
  tableName: 'Products'
});

export default Product;
