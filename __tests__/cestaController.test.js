import { vi, describe, test, expect, afterEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../models/CestaPredefinida.js', () => ({
  default: {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create:  vi.fn(),
  },
}));

vi.mock('../models/User.js', () => ({ default: {} }));

import CestaPredefinida from '../models/CestaPredefinida.js';
import {
  getCestas,
  getMisCestas,
  createCesta,
  updateCesta,
  deleteCesta,
} from '../controllers/cestaController.js';

// ── Helper ────────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json   = vi.fn().mockReturnValue(res);
  return res;
};

// ── getCestas ─────────────────────────────────────────────────────────────────

describe('cestaController — getCestas', () => {

  afterEach(() => vi.clearAllMocks());

  // 1
  test('devuelve todas las cestas activas con success: true', async () => {
    const cestasMock = [{ id: 'c1', nombre: 'Cesta Frutas', tipo: 'frutas', activa: true }];
    CestaPredefinida.findAll.mockResolvedValue(cestasMock);

    const req = { query: {} };
    const res = mockRes();

    await getCestas(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      count: 1,
      cestas: cestasMock,
    }));
  });

  // 2
  test('filtra por tipo cuando se proporciona en query', async () => {
    CestaPredefinida.findAll.mockResolvedValue([]);

    const req = { query: { tipo: 'frutas' } };
    const res = mockRes();

    await getCestas(req, res);

    expect(CestaPredefinida.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ activa: true, tipo: 'frutas' }),
      })
    );
  });

  // 3
  test('devuelve lista vacía si no hay cestas activas', async () => {
    CestaPredefinida.findAll.mockResolvedValue([]);

    const req = { query: {} };
    const res = mockRes();

    await getCestas(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      count: 0,
      cestas: [],
    }));
  });

  // 4
  test('devuelve 500 si el modelo lanza una excepción', async () => {
    CestaPredefinida.findAll.mockRejectedValue(new Error('DB error'));

    const req = { query: {} };
    const res = mockRes();

    await getCestas(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

});

// ── getMisCestas ──────────────────────────────────────────────────────────────

describe('cestaController — getMisCestas', () => {

  afterEach(() => vi.clearAllMocks());

  // 5
  test('devuelve las cestas del vendedor autenticado', async () => {
    const cestasMock = [{ id: 'c1', nombre: 'Mi Cesta' }];
    CestaPredefinida.findAll.mockResolvedValue(cestasMock);

    const req = { user: { id: 'v1' } };
    const res = mockRes();

    await getMisCestas(req, res);

    expect(CestaPredefinida.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { vendedorId: 'v1' } })
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      count: 1,
    }));
  });

  // 6
  test('devuelve 500 si el modelo lanza una excepción', async () => {
    CestaPredefinida.findAll.mockRejectedValue(new Error('DB error'));

    const req = { user: { id: 'v1' } };
    const res = mockRes();

    await getMisCestas(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});

// ── createCesta ───────────────────────────────────────────────────────────────

describe('cestaController — createCesta', () => {

  afterEach(() => vi.clearAllMocks());

  // 7
  test('devuelve 400 si falta el campo tipo', async () => {
    const req = { user: { id: 'v1' }, body: { nombre: 'Cesta', precio: 10 } };
    const res = mockRes();

    await createCesta(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  // 8
  test('devuelve 400 si falta el campo nombre', async () => {
    const req = { user: { id: 'v1' }, body: { tipo: 'frutas', precio: 10 } };
    const res = mockRes();

    await createCesta(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // 9
  test('devuelve 400 si el tipo no es válido', async () => {
    const req = { user: { id: 'v1' }, body: { tipo: 'carnes', nombre: 'Cesta', precio: 10 } };
    const res = mockRes();

    await createCesta(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Tipo de cesta no válido',
    }));
  });

  // 10
  test('crea la cesta correctamente con status 201', async () => {
    const mockCesta = { id: 'c1', tipo: 'frutas', nombre: 'Cesta Primavera', precio: 15 };
    CestaPredefinida.create.mockResolvedValue(mockCesta);

    const req = {
      user: { id: 'v1' },
      body: { tipo: 'frutas', nombre: 'Cesta Primavera', precio: 15, descripcion: 'Rica cesta' },
    };
    const res = mockRes();

    await createCesta(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      cesta: mockCesta,
    }));
  });

  // 11
  test('acepta todos los tipos válidos: verduras, mixta, comestibles', async () => {
    CestaPredefinida.create.mockResolvedValue({ id: 'c1' });

    for (const tipo of ['verduras', 'mixta', 'comestibles']) {
      const req = { user: { id: 'v1' }, body: { tipo, nombre: 'Cesta', precio: 10 } };
      const res = mockRes();

      await createCesta(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      vi.clearAllMocks();
      CestaPredefinida.create.mockResolvedValue({ id: 'c1' });
    }
  });

  // 12
  test('devuelve 500 si el modelo lanza una excepción', async () => {
    CestaPredefinida.create.mockRejectedValue(new Error('DB error'));

    const req = { user: { id: 'v1' }, body: { tipo: 'frutas', nombre: 'Cesta', precio: 10 } };
    const res = mockRes();

    await createCesta(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});

// ── updateCesta ───────────────────────────────────────────────────────────────

describe('cestaController — updateCesta', () => {

  afterEach(() => vi.clearAllMocks());

  // 13
  test('devuelve 404 si la cesta no existe o no pertenece al vendedor', async () => {
    CestaPredefinida.findOne.mockResolvedValue(null);

    const req = { user: { id: 'v1' }, params: { id: 'c1' }, body: {} };
    const res = mockRes();

    await updateCesta(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  // 14
  test('devuelve 400 si el nuevo tipo no es válido', async () => {
    const mockCesta = { tipo: 'frutas', nombre: 'Cesta', precio: 10, save: vi.fn() };
    CestaPredefinida.findOne.mockResolvedValue(mockCesta);

    const req = { user: { id: 'v1' }, params: { id: 'c1' }, body: { tipo: 'invalido' } };
    const res = mockRes();

    await updateCesta(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Tipo de cesta no válido',
    }));
  });

  // 15
  test('actualiza nombre y precio correctamente', async () => {
    const mockCesta = {
      tipo: 'frutas', nombre: 'Cesta Vieja', precio: 10,
      save: vi.fn().mockResolvedValue(true),
    };
    CestaPredefinida.findOne.mockResolvedValue(mockCesta);

    const req = {
      user: { id: 'v1' },
      params: { id: 'c1' },
      body: { nombre: 'Cesta Nueva', precio: 20 },
    };
    const res = mockRes();

    await updateCesta(req, res);

    expect(mockCesta.nombre).toBe('Cesta Nueva');
    expect(mockCesta.precio).toBe(20);
    expect(mockCesta.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  // 16
  test('puede activar y desactivar una cesta', async () => {
    const mockCesta = { activa: true, save: vi.fn().mockResolvedValue(true) };
    CestaPredefinida.findOne.mockResolvedValue(mockCesta);

    const req = { user: { id: 'v1' }, params: { id: 'c1' }, body: { activa: false } };
    const res = mockRes();

    await updateCesta(req, res);

    expect(mockCesta.activa).toBe(false);
    expect(mockCesta.save).toHaveBeenCalledTimes(1);
  });

  // 17
  test('devuelve 500 si el modelo lanza una excepción', async () => {
    CestaPredefinida.findOne.mockRejectedValue(new Error('DB error'));

    const req = { user: { id: 'v1' }, params: { id: 'c1' }, body: {} };
    const res = mockRes();

    await updateCesta(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});

// ── deleteCesta ───────────────────────────────────────────────────────────────

describe('cestaController — deleteCesta', () => {

  afterEach(() => vi.clearAllMocks());

  // 18
  test('devuelve 404 si la cesta no existe o no pertenece al vendedor', async () => {
    CestaPredefinida.findOne.mockResolvedValue(null);

    const req = { user: { id: 'v1' }, params: { id: 'c1' } };
    const res = mockRes();

    await deleteCesta(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  // 19
  test('elimina la cesta y devuelve mensaje de confirmación', async () => {
    const mockCesta = { id: 'c1', destroy: vi.fn().mockResolvedValue(true) };
    CestaPredefinida.findOne.mockResolvedValue(mockCesta);

    const req = { user: { id: 'v1' }, params: { id: 'c1' } };
    const res = mockRes();

    await deleteCesta(req, res);

    expect(mockCesta.destroy).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Cesta eliminada correctamente',
    }));
  });

  // 20
  test('devuelve 500 si el modelo lanza una excepción', async () => {
    CestaPredefinida.findOne.mockRejectedValue(new Error('DB error'));

    const req = { user: { id: 'v1' }, params: { id: 'c1' } };
    const res = mockRes();

    await deleteCesta(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});
