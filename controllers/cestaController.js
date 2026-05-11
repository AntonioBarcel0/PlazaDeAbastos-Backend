import CestaPredefinida from '../models/CestaPredefinida.js';
import User from '../models/User.js';
import fs from 'fs';

// ── Obtener cestas (público, filtrado por tipo) ─────
export const getCestas = async (req, res) => {
  try {
    const { tipo } = req.query;

    const where = { activa: true };
    if (tipo) where.tipo = tipo;

    const cestas = await CestaPredefinida.findAll({
      where,
      include: [
        {
          model: User,
          as: 'vendedor',
          attributes: ['id', 'nombre', 'apellidos', 'especialidad', 'imagenPerfil']
        }
      ],
      order: [['precio', 'ASC']]
    });

    res.json({ success: true, count: cestas.length, cestas });
  } catch (error) {
    console.error('Error al obtener cestas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener las cestas' });
  }
};

// ── Obtener mis cestas (comerciante) ───────────────
export const getMisCestas = async (req, res) => {
  try {
    const vendedorId = req.user.id;

    const cestas = await CestaPredefinida.findAll({
      where: { vendedorId },
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, count: cestas.length, cestas });
  } catch (error) {
    console.error('Error al obtener mis cestas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener tus cestas' });
  }
};

// ── Crear cesta (comerciante) ──────────────────────
export const createCesta = async (req, res) => {
  try {
    const vendedorId = req.user.id;
    const { tipo, nombre, precio, descripcion, items } = req.body;

    if (!tipo || !nombre || !precio) {
      return res.status(400).json({ success: false, message: 'Tipo, nombre y precio son obligatorios' });
    }

    const tiposValidos = ['frutas', 'verduras', 'mixta', 'comestibles'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ success: false, message: 'Tipo de cesta no válido' });
    }

    // items llega como string JSON cuando se envía FormData
    let parsedItems = items || [];
    if (typeof parsedItems === 'string') {
      try { parsedItems = JSON.parse(parsedItems); } catch { parsedItems = []; }
    }

    const imagen = req.file ? `/uploads/${req.file.filename}` : null;

    const cesta = await CestaPredefinida.create({
      vendedorId,
      tipo,
      nombre,
      precio: parseFloat(precio),
      descripcion: descripcion || null,
      items: parsedItems,
      imagen,
      activa: true
    });

    res.status(201).json({ success: true, message: 'Cesta creada correctamente', cesta });
  } catch (error) {
    console.error('Error al crear cesta:', error);
    res.status(500).json({ success: false, message: 'Error al crear la cesta' });
  }
};

// ── Actualizar cesta (comerciante, propia) ─────────
export const updateCesta = async (req, res) => {
  try {
    const { id } = req.params;
    const vendedorId = req.user.id;

    const cesta = await CestaPredefinida.findOne({ where: { id, vendedorId } });
    if (!cesta) {
      return res.status(404).json({ success: false, message: 'Cesta no encontrada' });
    }

    const { tipo, nombre, precio, descripcion, items, activa } = req.body;

    if (tipo) {
      const tiposValidos = ['frutas', 'verduras', 'mixta', 'comestibles'];
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({ success: false, message: 'Tipo de cesta no válido' });
      }
      cesta.tipo = tipo;
    }
    if (nombre !== undefined) cesta.nombre = nombre;
    if (precio !== undefined) cesta.precio = parseFloat(precio);
    if (descripcion !== undefined) cesta.descripcion = descripcion;
    if (items !== undefined) {
      let parsedItems = items;
      if (typeof parsedItems === 'string') {
        try { parsedItems = JSON.parse(parsedItems); } catch { parsedItems = []; }
      }
      cesta.items = parsedItems;
    }
    if (activa !== undefined) cesta.activa = activa;
    if (req.file) {
      if (cesta.imagen) {
        const oldPath = `uploads/${cesta.imagen.split('/uploads/')[1]}`;
        fs.unlink(oldPath, () => {});
      }
      cesta.imagen = `/uploads/${req.file.filename}`;
    }

    await cesta.save();

    res.json({ success: true, message: 'Cesta actualizada correctamente', cesta });
  } catch (error) {
    console.error('Error al actualizar cesta:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar la cesta' });
  }
};

// ── Eliminar cesta (comerciante, propia) ───────────
export const deleteCesta = async (req, res) => {
  try {
    const { id } = req.params;
    const vendedorId = req.user.id;

    const cesta = await CestaPredefinida.findOne({ where: { id, vendedorId } });
    if (!cesta) {
      return res.status(404).json({ success: false, message: 'Cesta no encontrada' });
    }

    await cesta.destroy();

    res.json({ success: true, message: 'Cesta eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar cesta:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar la cesta' });
  }
};
