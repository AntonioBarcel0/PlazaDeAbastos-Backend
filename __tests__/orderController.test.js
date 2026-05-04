import { vi, describe, test, expect, afterEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../config/database.js', () => ({
  default: { transaction: vi.fn() },
}));

vi.mock('../models/Order.js', () => ({
  default: { create: vi.fn(), findByPk: vi.fn(), update: vi.fn(), findAll: vi.fn() },
}));

vi.mock('../models/SubOrder.js', () => ({
  default: { create: vi.fn(), findOne: vi.fn(), findAll: vi.fn() },
}));

vi.mock('../models/OrderItem.js', () => ({
  default: { create: vi.fn() },
}));

vi.mock('../models/User.js', () => ({
  default: { findAll: vi.fn(), findOne: vi.fn() },
}));

vi.mock('../models/Product.js', () => ({
  default: { findByPk: vi.fn() },
}));

vi.mock('../models/CestaPredefinida.js', () => ({
  default: { findByPk: vi.fn() },
}));

import sequelize from '../config/database.js';
import Order from '../models/Order.js';
import SubOrder from '../models/SubOrder.js';
import OrderItem from '../models/OrderItem.js';
import Product from '../models/Product.js';
import CestaPredefinida from '../models/CestaPredefinida.js';
import { createOrder, updateOrderStatus } from '../controllers/orderController.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json   = vi.fn().mockReturnValue(res);
  return res;
};

const makeTx = () => ({ commit: vi.fn(), rollback: vi.fn() });

// ── createOrder ───────────────────────────────────────────────────────────────

describe('orderController — createOrder', () => {

  afterEach(() => vi.clearAllMocks());

  // 1
  test('devuelve 400 si items está vacío', async () => {
    const t = makeTx();
    sequelize.transaction.mockResolvedValue(t);

    const req = { body: { items: [] }, user: { id: 'u1' } };
    const res = mockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'El pedido debe contener al menos un producto',
    }));
    expect(t.rollback).toHaveBeenCalledTimes(1);
  });

  // 2
  test('devuelve 400 si modoEntrega es domicilio y falta la dirección', async () => {
    const t = makeTx();
    sequelize.transaction.mockResolvedValue(t);

    const req = {
      body: {
        items: [{ productId: 'p1', cantidad: 1 }],
        modoEntrega: 'domicilio',
        direccionEntrega: '',
      },
      user: { id: 'u1' },
    };
    const res = mockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'La dirección es obligatoria para entrega a domicilio',
    }));
    expect(t.rollback).toHaveBeenCalledTimes(1);
  });

  // 3
  test('devuelve 404 si el productId no existe en la BD', async () => {
    const t = makeTx();
    sequelize.transaction.mockResolvedValue(t);
    Product.findByPk.mockResolvedValue(null);

    const req = {
      body: { items: [{ productId: 'no-existe', cantidad: 1 }] },
      user: { id: 'u1' },
    };
    const res = mockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(t.rollback).toHaveBeenCalledTimes(1);
  });

  // 4
  test('devuelve 400 si el producto no está disponible', async () => {
    const t = makeTx();
    sequelize.transaction.mockResolvedValue(t);
    Product.findByPk.mockResolvedValue({
      id: 'p1', nombre: 'Tomate', disponible: false, vendedorId: 'v1',
    });

    const req = {
      body: { items: [{ productId: 'p1', cantidad: 1 }] },
      user: { id: 'u1' },
    };
    const res = mockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(t.rollback).toHaveBeenCalledTimes(1);
  });

  // 5
  test('devuelve 400 si el stock por unidades es insuficiente', async () => {
    const t = makeTx();
    sequelize.transaction.mockResolvedValue(t);
    Product.findByPk.mockResolvedValue({
      id: 'p1', nombre: 'Manzanas', precio: '2.00', unidad: 'ud',
      vendedorId: 'v1', disponible: true, stock: 2,
    });

    const req = {
      body: { items: [{ productId: 'p1', cantidad: 5 }] },
      user: { id: 'u1' },
    };
    const res = mockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Stock insuficiente'),
    }));
    expect(t.rollback).toHaveBeenCalledTimes(1);
  });

  // 6
  test('devuelve 400 si el stock por kg es insuficiente', async () => {
    const t = makeTx();
    sequelize.transaction.mockResolvedValue(t);
    Product.findByPk.mockResolvedValue({
      id: 'p1', nombre: 'Tomates', precio: '2.50', unidad: 'kg',
      vendedorId: 'v1', disponible: true, stock: 0.4, // 400 g disponibles
    });

    const req = {
      body: { items: [{ productId: 'p1', cantidad: 500 }] }, // piden 500 g
      user: { id: 'u1' },
    };
    const res = mockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(t.rollback).toHaveBeenCalledTimes(1);
  });

  // 7
  test('devuelve 404 si la cesta no existe', async () => {
    const t = makeTx();
    sequelize.transaction.mockResolvedValue(t);
    CestaPredefinida.findByPk.mockResolvedValue(null);

    const req = {
      body: { items: [{ cestaId: 'no-existe', cantidad: 1 }] },
      user: { id: 'u1' },
    };
    const res = mockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(t.rollback).toHaveBeenCalledTimes(1);
  });

  // 8
  test('devuelve 400 si la cesta no está activa', async () => {
    const t = makeTx();
    sequelize.transaction.mockResolvedValue(t);
    CestaPredefinida.findByPk.mockResolvedValue({
      id: 'c1', nombre: 'Cesta Inactiva', activa: false, vendedorId: 'v1',
    });

    const req = {
      body: { items: [{ cestaId: 'c1', cantidad: 1 }] },
      user: { id: 'u1' },
    };
    const res = mockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(t.rollback).toHaveBeenCalledTimes(1);
  });

  // 9
  test('crea un pedido de producto por unidad y devuelve 201', async () => {
    const t = makeTx();
    sequelize.transaction.mockResolvedValue(t);

    const mockProduct = {
      id: 'p1', nombre: 'Tomates', precio: '2.50', unidad: 'ud',
      vendedorId: 'v1', disponible: true, stock: 10,
      save: vi.fn().mockResolvedValue(true),
    };
    Product.findByPk.mockResolvedValue(mockProduct);
    Order.create.mockResolvedValue({ id: 'order-1' });
    SubOrder.create.mockResolvedValue({ id: 'so-1' });
    OrderItem.create.mockResolvedValue({});
    Order.findByPk.mockResolvedValue({ id: 'order-1', subOrders: [] });

    const req = {
      body: { items: [{ productId: 'p1', cantidad: 2 }], modoEntrega: 'recogida' },
      user: { id: 'u1' },
    };
    const res = mockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(t.commit).toHaveBeenCalledTimes(1);
    expect(t.rollback).not.toHaveBeenCalled();
  });

  // 10
  test('crea un pedido de cesta y devuelve 201', async () => {
    const t = makeTx();
    sequelize.transaction.mockResolvedValue(t);

    CestaPredefinida.findByPk.mockResolvedValue({
      id: 'c1', nombre: 'Cesta Frutas', precio: '15.00', activa: true, vendedorId: 'v1',
    });
    Order.create.mockResolvedValue({ id: 'order-2' });
    SubOrder.create.mockResolvedValue({ id: 'so-2' });
    OrderItem.create.mockResolvedValue({});
    Order.findByPk.mockResolvedValue({ id: 'order-2', subOrders: [] });

    const req = {
      body: { items: [{ cestaId: 'c1', cantidad: 1 }], modoEntrega: 'recogida' },
      user: { id: 'u1' },
    };
    const res = mockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(t.commit).toHaveBeenCalledTimes(1);
  });

  // 11
  test('devuelve 500 y hace rollback si ocurre un error inesperado', async () => {
    const t = makeTx();
    sequelize.transaction.mockResolvedValue(t);
    Product.findByPk.mockRejectedValue(new Error('DB error'));

    const req = {
      body: { items: [{ productId: 'p1', cantidad: 1 }] },
      user: { id: 'u1' },
    };
    const res = mockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(t.rollback).toHaveBeenCalledTimes(1);
  });

});

// ── updateOrderStatus ─────────────────────────────────────────────────────────

describe('orderController — updateOrderStatus', () => {

  afterEach(() => vi.clearAllMocks());

  // 12
  test('devuelve 400 si el estado no es válido', async () => {
    const req = {
      params: { id: 'so-1' },
      body: { estado: 'inventado' },
      user: { id: 'v1' },
    };
    const res = mockRes();

    await updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Estado no válido',
    }));
  });

  // 13
  test('acepta todos los estados válidos', async () => {
    const estadosValidos = ['pendiente', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado'];

    for (const estado of estadosValidos) {
      const mockSubOrder = {
        id: 'so-1', orderId: 'o-1', estado: 'pendiente',
        save: vi.fn().mockResolvedValue(true),
      };
      SubOrder.findOne.mockResolvedValue(mockSubOrder);
      SubOrder.findAll.mockResolvedValue([{ estado }]);
      Order.update.mockResolvedValue([1]);

      const req = { params: { id: 'so-1' }, body: { estado }, user: { id: 'v1' } };
      const res = mockRes();

      await updateOrderStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      vi.clearAllMocks();
    }
  });

  // 14
  test('devuelve 404 si el sub-pedido no pertenece al vendedor', async () => {
    SubOrder.findOne.mockResolvedValue(null);

    const req = {
      params: { id: 'so-1' },
      body: { estado: 'confirmado' },
      user: { id: 'v1' },
    };
    const res = mockRes();

    await updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Pedido no encontrado',
    }));
  });

  // 15
  test('actualiza el estado y recalcula el estado global del pedido', async () => {
    const mockSubOrder = {
      id: 'so-1', orderId: 'o-1', estado: 'pendiente',
      save: vi.fn().mockResolvedValue(true),
    };
    SubOrder.findOne.mockResolvedValue(mockSubOrder);
    SubOrder.findAll.mockResolvedValue([{ estado: 'confirmado' }]);
    Order.update.mockResolvedValue([1]);

    const req = {
      params: { id: 'so-1' },
      body: { estado: 'confirmado' },
      user: { id: 'v1' },
    };
    const res = mockRes();

    await updateOrderStatus(req, res);

    expect(mockSubOrder.estado).toBe('confirmado');
    expect(mockSubOrder.save).toHaveBeenCalledTimes(1);
    expect(Order.update).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  // 16
  test('devuelve 500 si el modelo lanza una excepción', async () => {
    SubOrder.findOne.mockRejectedValue(new Error('DB error'));

    const req = {
      params: { id: 'so-1' },
      body: { estado: 'confirmado' },
      user: { id: 'v1' },
    };
    const res = mockRes();

    await updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});
