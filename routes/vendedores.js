import express from 'express';
import {
  getVendedores,
  getVendedor,
  getCategorias
} from '../controllers/vendedorController.js';

const router = express.Router();

// Rutas públicas
router.get('/', getVendedores);
router.get('/categorias', getCategorias);
router.get('/:id', getVendedor);

export default router;
