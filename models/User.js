import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  apellidos: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('cliente', 'comerciante', 'admin', 'gestor'),
    defaultValue: 'cliente'
  },
  imagenPerfil: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Imagen de perfil del puesto (para la tarjeta en el marketplace)'
  },
  especialidad: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Especialidad del puesto, ej: Frutas, Pescadería, mariscos'
  },
  emailVerificado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  tokenVerificacion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  resetToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  resetTokenExpira: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }
  }
});

User.prototype.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.generateVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.tokenVerificacion = token;
  return token;
};

User.prototype.generateResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetToken = token;
  this.resetTokenExpira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
  return token;
};

export default User;