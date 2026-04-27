import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getVendedores,
  getVendedor,
  getCategorias,
  updateVendorProfile
} from '../controllers/vendedorController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  if (allowed.test(file.mimetype) && allowed.test(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

// Rutas protegidas — deben ir ANTES de /:id
router.patch('/profile', protect, upload.single('imagenPerfil'), updateVendorProfile);

// Rutas públicas
router.get('/', getVendedores);
router.get('/categorias', getCategorias);
router.get('/:id', getVendedor);

export default router;
