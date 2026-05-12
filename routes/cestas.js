import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getCestas,
  getMisCestas,
  createCesta,
  updateCesta,
  deleteCesta
} from '../controllers/cestaController.js';
import { protect, isComerciante } from '../middleware/auth.js';

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
    return cb(null, true);
  }
  cb(new Error('Solo se permiten imágenes'));
};
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

// Público: obtener cestas activas (con filtro opcional ?tipo=frutas)
router.get('/', getCestas);

// Comerciante: CRUD de sus propias cestas
router.get('/mis-cestas', protect, isComerciante, getMisCestas);
router.post('/', protect, isComerciante, upload.single('imagen'), createCesta);
router.put('/:id', protect, isComerciante, upload.single('imagen'), updateCesta);
router.delete('/:id', protect, isComerciante, deleteCesta);

export default router;
