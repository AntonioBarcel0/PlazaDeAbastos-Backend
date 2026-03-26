import { vi, describe, test, expect, afterEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────────
// Se deben declarar antes de importar los módulos que los usan

vi.mock('../models/User.js', () => ({
  default: {
    findOne: vi.fn(),
    create:  vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign:   vi.fn(() => 'test-token'),
    verify: vi.fn(),
  },
}));

import User from '../models/User.js';
import { login, register } from '../controllers/authController.js';

// ── Helper ───────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json   = vi.fn().mockReturnValue(res);
  return res;
};

// ── Tests: login ─────────────────────────────────────────────────────────────

describe('authController — login', () => {

  afterEach(() => vi.clearAllMocks());

  // 1 ─────────────────────────────────────────────────────────────────────────
  test('devuelve token y datos de usuario con credenciales correctas', async () => {
    const mockUser = {
      id: 'uuid-1',
      nombre: 'Juan',
      apellidos: 'Jurado',
      email: 'juan@test.com',
      role: 'cliente',
      comparePassword: vi.fn().mockResolvedValue(true),
    };
    User.findOne.mockResolvedValue(mockUser);

    const req = { body: { email: 'juan@test.com', password: '123456' } };
    const res = mockRes();

    await login(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      token: 'test-token',
      user: expect.objectContaining({ email: 'juan@test.com' }),
    }));
  });

  // 2 ─────────────────────────────────────────────────────────────────────────
  test('devuelve 401 si el email no existe', async () => {
    User.findOne.mockResolvedValue(null);

    const req = { body: { email: 'noexiste@test.com', password: '123456' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  // 3 ─────────────────────────────────────────────────────────────────────────
  test('devuelve 401 si la contraseña es incorrecta', async () => {
    User.findOne.mockResolvedValue({
      comparePassword: vi.fn().mockResolvedValue(false),
    });

    const req = { body: { email: 'juan@test.com', password: 'wrong' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Credenciales incorrectas',
    }));
  });

  // 4 ─────────────────────────────────────────────────────────────────────────
  test('devuelve 400 si faltan email o contraseña en el body', async () => {
    const req = { body: { email: 'juan@test.com' } }; // sin password
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  // 5 ─────────────────────────────────────────────────────────────────────────
  test('devuelve 500 si el modelo lanza una excepción inesperada', async () => {
    User.findOne.mockRejectedValue(new Error('DB error'));

    const req = { body: { email: 'juan@test.com', password: '123456' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

});

// ── Tests: register ──────────────────────────────────────────────────────────

describe('authController — register', () => {

  afterEach(() => vi.clearAllMocks());

  // 6 ─────────────────────────────────────────────────────────────────────────
  test('crea usuario correctamente y devuelve token con status 201', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      id: 'uuid-1', nombre: 'Juan', apellidos: 'Jurado', email: 'juan@test.com', role: 'cliente',
    });

    const req = {
      body: { nombre: 'Juan', apellidos: 'Jurado', email: 'juan@test.com', password: '123456' },
    };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      token: 'test-token',
    }));
  });

  // 7 ─────────────────────────────────────────────────────────────────────────
  test('devuelve 400 si el email ya está registrado', async () => {
    User.findOne.mockResolvedValue({ id: 'uuid-existing' });

    const req = { body: { email: 'duplicado@test.com', password: '123456' } };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'El email ya está registrado',
    }));
  });

  // 8 ─────────────────────────────────────────────────────────────────────────
  test('un role no permitido (admin) se registra como "cliente"', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      id: 'uuid-1', nombre: 'Malicioso', apellidos: 'Test', email: 'malicioso@test.com', role: 'cliente',
    });

    const req = {
      body: { nombre: 'Malicioso', apellidos: 'Test', email: 'malicioso@test.com', password: '123', role: 'admin' },
    };
    const res = mockRes();

    await register(req, res);

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'cliente' }));
  });

  // 9 ─────────────────────────────────────────────────────────────────────────
  test('el role "comerciante" sí está permitido en el registro', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      id: 'uuid-2', nombre: 'Vendedor', apellidos: 'Test', email: 'vendedor@test.com', role: 'comerciante',
    });

    const req = {
      body: { nombre: 'Vendedor', apellidos: 'Test', email: 'vendedor@test.com', password: '123', role: 'comerciante' },
    };
    const res = mockRes();

    await register(req, res);

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'comerciante' }));
  });

  // 10 ────────────────────────────────────────────────────────────────────────
  test('devuelve 500 si el modelo lanza una excepción inesperada', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockRejectedValue(new Error('DB error'));

    const req = {
      body: { nombre: 'Juan', apellidos: 'Jurado', email: 'juan@test.com', password: '123456' },
    };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

});
