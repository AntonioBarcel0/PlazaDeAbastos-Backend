import express from 'express';
import {
  getCestas,
  getMisCestas,
  createCesta,
  updateCesta,
  deleteCesta
} from '../controllers/cestaController.js';
import { protect, isComerciante } from '../middleware/auth.js';

const router = express.Router();

// Público: obtener cestas activas (con filtro opcional ?tipo=frutas)
router.get('/', getCestas);

// Comerciante: CRUD de sus propias cestas
router.get('/mis-cestas', protect, isComerciante, getMisCestas);
router.post('/', protect, isComerciante, createCesta);
router.put('/:id', protect, isComerciante, updateCesta);
router.delete('/:id', protect, isComerciante, deleteCesta);

export default router;
