import express from 'express';
import {
  getProducts,
  getProduct,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { protect, isComerciante } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configurar multer para subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

// Rutas públicas
router.get('/', getProducts);
router.get('/:id', getProduct);

// Rutas protegidas para comerciantes
router.get('/my/products', protect, isComerciante, getMyProducts);
router.post('/', protect, isComerciante, upload.single('imagen'), createProduct);
router.put('/:id', protect, isComerciante, upload.single('imagen'), updateProduct);
router.delete('/:id', protect, isComerciante, deleteProduct);

export default router;
