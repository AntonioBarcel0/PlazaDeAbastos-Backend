import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Proteger rutas - verificar token
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Obtener token del header
      token = req.headers.authorization.split(' ')[1];

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Obtener usuario del token (sin password)
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuario no encontrado' 
        });
      }

      next();
    } catch (error) {
      console.error('Error en autenticación:', error);
      return res.status(401).json({ 
        success: false, 
        message: 'No autorizado, token inválido' 
      });
    }
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No autorizado, sin token' 
    });
  }
};

// Verificar si es comerciante o admin
export const isComerciante = (req, res, next) => {
  if (req.user && (req.user.role === 'comerciante' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado. Solo comerciantes pueden realizar esta acción.' 
    });
  }
};

// Verificar si es admin
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado. Solo administradores.' 
    });
  }
};
