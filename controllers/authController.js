import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Registro
export const register = async (req, res) => {
  try {
    const { nombre, apellidos, email, password, telefono, direccion, role } = req.body;

    // Verificar si existe
    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(400).json({ 
        success: false, 
        message: 'El email ya está registrado' 
      });
    }

    // Validar rol permitido
    const allowedRoles = ['cliente', 'comerciante'];
    const userRole = allowedRoles.includes(role) ? role : 'cliente';

    // Crear usuario
    const user = await User.create({
      nombre,
      apellidos,
      email,
      password,
      telefono,
      direccion,
      role: userRole
    });

    // Generar token de verificación y enviar email
    const verifyToken = user.generateVerificationToken();
    await user.save();

    try {
      await sendVerificationEmail(email, nombre, verifyToken);
    } catch (emailErr) {
      console.error('Error al enviar email de verificación:', emailErr);
    }

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado. Revisa tu email para verificar tu cuenta.',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellidos: user.apellidos,
        email: user.email,
        role: user.role,
        emailVerificado: user.emailVerificado,
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario'
    });
  }
};

// Obtener perfil del usuario autenticado
export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ success: false, message: 'Error al obtener perfil' });
  }
};

// Actualizar perfil del usuario autenticado
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const { nombre, apellidos, telefono, direccion } = req.body;

    if (nombre !== undefined) user.nombre = nombre;
    if (apellidos !== undefined) user.apellidos = apellidos;
    if (telefono !== undefined) user.telefono = telefono;
    if (direccion !== undefined) user.direccion = direccion;

    await user.save();

    const userData = {
      id: user.id,
      nombre: user.nombre,
      apellidos: user.apellidos,
      email: user.email,
      telefono: user.telefono,
      direccion: user.direccion,
      role: user.role,
    };

    res.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      user: userData,
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar perfil' });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email y contraseña son obligatorios' 
      });
    }

    // Buscar usuario
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales incorrectas' 
      });
    }

    // Verificar contraseña
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales incorrectas' 
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellidos: user.apellidos,
        email: user.email,
        role: user.role,
        emailVerificado: user.emailVerificado,
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión'
    });
  }
};

// Verificar email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ where: { tokenVerificacion: token } });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token de verificación inválido' });
    }

    user.emailVerificado = true;
    user.tokenVerificacion = null;
    await user.save();

    res.json({ success: true, message: 'Email verificado correctamente' });
  } catch (error) {
    console.error('Error al verificar email:', error);
    res.status(500).json({ success: false, message: 'Error al verificar email' });
  }
};

// Reenviar email de verificación
export const resendVerification = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    if (user.emailVerificado) {
      return res.json({ success: true, message: 'El email ya está verificado' });
    }

    const verifyToken = user.generateVerificationToken();
    await user.save();

    await sendVerificationEmail(user.email, user.nombre, verifyToken);

    res.json({ success: true, message: 'Email de verificación reenviado' });
  } catch (error) {
    console.error('Error al reenviar verificación:', error);
    res.status(500).json({ success: false, message: 'Error al reenviar email' });
  }
};

// Solicitar reset de contraseña
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email es obligatorio' });
    }

    const user = await User.findOne({ where: { email } });
    // No revelar si el email existe o no
    if (!user) {
      return res.json({ success: true, message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.' });
    }

    const resetToken = user.generateResetToken();
    await user.save();

    await sendPasswordResetEmail(user.email, user.nombre, resetToken);

    res.json({ success: true, message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.' });
  } catch (error) {
    console.error('Error en forgot password:', error);
    res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
  }
};

// Restablecer contraseña con token
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const user = await User.findOne({
      where: { resetToken: token }
    });

    if (!user || !user.resetTokenExpira || user.resetTokenExpira < new Date()) {
      return res.status(400).json({ success: false, message: 'Token inválido o expirado' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetToken = null;
    user.resetTokenExpira = null;
    await user.save({ hooks: false });

    res.json({ success: true, message: 'Contraseña restablecida correctamente' });
  } catch (error) {
    console.error('Error en reset password:', error);
    res.status(500).json({ success: false, message: 'Error al restablecer contraseña' });
  }
};
