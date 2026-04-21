import express from 'express';
import {
  getMyOrders,
  getMyPurchases,
  getOrderById,
  updateOrderStatus,
  updateVendorNotes,
  createOrder,
  getOrderStats
} from '../controllers/orderController.js';
import { protect, isComerciante } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Crear un pedido (clientes)
router.post('/', createOrder);

// Pedidos del cliente autenticado
router.get('/my-purchases', getMyPurchases);

// Rutas solo para comerciantes
router.get('/my-orders', isComerciante, getMyOrders);
router.get('/stats', isComerciante, getOrderStats);
router.get('/:id', isComerciante, getOrderById);
router.patch('/:id/status', isComerciante, updateOrderStatus);
router.patch('/:id/notes', isComerciante, updateVendorNotes);

export default router;
