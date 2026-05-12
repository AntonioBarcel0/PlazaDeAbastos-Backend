import express from 'express';
import {
  getMyOrders,
  getMyPurchases,
  getOrderById,
  updateOrderStatus,
  updateVendorNotes,
  createOrder,
  cancelOrder,
  getOrderStats,
  getAllOrders,
  deliverOrder,
  getGestorStats
} from '../controllers/orderController.js';
import { protect, isComerciante, isGestor } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Crear un pedido (clientes)
router.post('/', createOrder);

// Pedidos del cliente autenticado
router.get('/my-purchases', getMyPurchases);
router.patch('/:id/cancel', cancelOrder);

// Rutas del gestor del mercado
router.get('/all', isGestor, getAllOrders);
router.get('/gestor-stats', isGestor, getGestorStats);
router.patch('/:id/deliver', isGestor, deliverOrder);

// Rutas solo para comerciantes
router.get('/my-orders', isComerciante, getMyOrders);
router.get('/stats', isComerciante, getOrderStats);
router.get('/:id', isComerciante, getOrderById);
router.patch('/:id/status', isComerciante, updateOrderStatus);
router.patch('/:id/notes', isComerciante, updateVendorNotes);

export default router;
