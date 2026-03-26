import { vi, describe, test, expect, afterEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../models/User.js', () => ({
  default: {
    findAll: vi.fn(),
    findOne: vi.fn(),
  },
}));

vi.mock('../models/Product.js', () => ({
  default: {},
}));

vi.mock('sequelize', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual };
});

import User from '../models/User.js';
import { getVendedores, getVendedor } from '../controllers/vendedorController.js';

// ── Helper ───────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json   = vi.fn().mockReturnValue(res);
  return res;
};

const vendedorBase = (overrides = {}) => ({
  id: 'uuid-1',
  nombre: 'Juan',
  apellidos: 'Jurado Ruíz',
  telefono: null,
  direccion: null,
  imagenPerfil: null,
  especialidad: 'Frutas',
  productos: [],
  ...overrides,
});

// ── Tests: getVendedores ─────────────────────────────────────────────────────

describe('vendedorController — getVendedores', () => {

  afterEach(() => vi.clearAllMocks());

  // 1 ─────────────────────────────────────────────────────────────────────────
  test('retorna lista de vendedores con success: true', async () => {
    User.findAll.mockResolvedValue([vendedorBase()]);

    const req = { query: {} };
    const res = mockRes();

    await getVendedores(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      count: 1,
      vendedores: expect.any(Array),
    }));
  });

  // 2 ─────────────────────────────────────────────────────────────────────────
  test('construye nombreCompleto combinando nombre y apellidos', async () => {
    User.findAll.mockResolvedValue([vendedorBase()]);

    const req = { query: {} };
    const res = mockRes();

    await getVendedores(req, res);

    const { vendedores } = res.json.mock.calls[0][0];
    expect(vendedores[0].nombreCompleto).toBe('Juan Jurado Ruíz');
  });

  // 3 ─────────────────────────────────────────────────────────────────────────
  test('las categorías se derivan de la especialidad cuando no hay productos', async () => {
    User.findAll.mockResolvedValue([
      vendedorBase({ especialidad: 'Frutas, Verduras', productos: [] }),
    ]);

    const req = { query: {} };
    const res = mockRes();

    await getVendedores(req, res);

    const { vendedores } = res.json.mock.calls[0][0];
    expect(vendedores[0].categorias).toEqual(['Frutas', 'Verduras']);
  });

  // 4 ─────────────────────────────────────────────────────────────────────────
  test('las categorías de productos tienen prioridad sobre la especialidad', async () => {
    User.findAll.mockResolvedValue([
      vendedorBase({
        especialidad: 'Frutas',
        productos: [
          { categoria: 'Verduras', imagen: null },
          { categoria: 'Frutas',   imagen: null },
        ],
      }),
    ]);

    const req = { query: {} };
    const res = mockRes();

    await getVendedores(req, res);

    const { vendedores } = res.json.mock.calls[0][0];
    // Categorías deben venir de productos, no de especialidad (Frutas, Verduras)
    expect(vendedores[0].categorias).toContain('Verduras');
    expect(vendedores[0].categorias).toContain('Frutas');
  });

  // 5 ─────────────────────────────────────────────────────────────────────────
  test('imagenPrincipal usa imagenPerfil del vendedor si existe', async () => {
    User.findAll.mockResolvedValue([
      vendedorBase({ imagenPerfil: '/uploads/juan.jpg' }),
    ]);

    const req = { query: {} };
    const res = mockRes();

    await getVendedores(req, res);

    const { vendedores } = res.json.mock.calls[0][0];
    expect(vendedores[0].imagenPrincipal).toBe('/uploads/juan.jpg');
  });

  // 6 ─────────────────────────────────────────────────────────────────────────
  test('imagenPrincipal usa la imagen de un producto si no hay imagenPerfil', async () => {
    User.findAll.mockResolvedValue([
      vendedorBase({
        imagenPerfil: null,
        productos: [{ categoria: 'Frutas', imagen: '/uploads/manzana.jpg' }],
      }),
    ]);

    const req = { query: {} };
    const res = mockRes();

    await getVendedores(req, res);

    const { vendedores } = res.json.mock.calls[0][0];
    expect(vendedores[0].imagenPrincipal).toBe('/uploads/manzana.jpg');
  });

  // 7 ─────────────────────────────────────────────────────────────────────────
  test('imagenPrincipal es null si no hay imagenPerfil ni productos con imagen', async () => {
    User.findAll.mockResolvedValue([vendedorBase({ imagenPerfil: null, productos: [] })]);

    const req = { query: {} };
    const res = mockRes();

    await getVendedores(req, res);

    const { vendedores } = res.json.mock.calls[0][0];
    expect(vendedores[0].imagenPrincipal).toBeNull();
  });

  // 8 ─────────────────────────────────────────────────────────────────────────
  test('retorna lista vacía si no hay vendedores', async () => {
    User.findAll.mockResolvedValue([]);

    const req = { query: {} };
    const res = mockRes();

    await getVendedores(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      count: 0,
      vendedores: [],
    }));
  });

  // 9 ─────────────────────────────────────────────────────────────────────────
  test('devuelve 500 si el modelo lanza una excepción', async () => {
    User.findAll.mockRejectedValue(new Error('DB error'));

    const req = { query: {} };
    const res = mockRes();

    await getVendedores(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

});

// ── Tests: getVendedor ───────────────────────────────────────────────────────

describe('vendedorController — getVendedor', () => {

  afterEach(() => vi.clearAllMocks());

  // 10 ────────────────────────────────────────────────────────────────────────
  test('retorna el vendedor con nombreCompleto si existe', async () => {
    const mockVendedor = {
      id: 'uuid-1',
      nombre: 'Juan',
      apellidos: 'Jurado Ruíz',
      toJSON: () => ({ id: 'uuid-1', nombre: 'Juan', apellidos: 'Jurado Ruíz' }),
    };
    User.findOne.mockResolvedValue(mockVendedor);

    const req = { params: { id: 'uuid-1' } };
    const res = mockRes();

    await getVendedor(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      vendedor: expect.objectContaining({ nombreCompleto: 'Juan Jurado Ruíz' }),
    }));
  });

  // 11 ────────────────────────────────────────────────────────────────────────
  test('devuelve 404 si el vendedor no existe', async () => {
    User.findOne.mockResolvedValue(null);

    const req = { params: { id: 'uuid-no-existe' } };
    const res = mockRes();

    await getVendedor(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Vendedor no encontrado',
    }));
  });

  // 12 ────────────────────────────────────────────────────────────────────────
  test('devuelve 500 si el modelo lanza una excepción', async () => {
    User.findOne.mockRejectedValue(new Error('DB error'));

    const req = { params: { id: 'uuid-1' } };
    const res = mockRes();

    await getVendedor(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

});
