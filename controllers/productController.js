import Product from '../models/Product.js';
import User from '../models/User.js';

// Obtener todos los productos (público)
export const getProducts = async (req, res) => {
  try {
    const { categoria, vendedor, disponible } = req.query;
    
    const where = {};
    if (categoria) where.categoria = categoria;
    if (vendedor) where.vendedorId = vendedor;
    if (disponible !== undefined) where.disponible = disponible === 'true';

    const products = await Product.findAll({
      where,
      include: {
        model: User,
        as: 'vendedor',
        attributes: ['id', 'nombre', 'apellidos', 'telefono']
      },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener productos' 
    });
  }
};

// Obtener un producto por ID
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: {
        model: User,
        as: 'vendedor',
        attributes: ['id', 'nombre', 'apellidos', 'telefono', 'direccion']
      }
    });

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Producto no encontrado' 
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener producto' 
    });
  }
};

// Obtener productos del vendedor autenticado
export const getMyProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { vendedorId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Error al obtener mis productos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener productos' 
    });
  }
};

// Crear producto (solo comerciantes)
export const createProduct = async (req, res) => {
  try {
    const { nombre, descripcion, precio, unidad, categoria, stock, disponible } = req.body;

    // Validación básica
    if (!nombre || !precio) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre y precio son obligatorios' 
      });
    }

    const product = await Product.create({
      nombre,
      descripcion,
      precio,
      unidad: unidad || 'kg',
      categoria,
      stock: stock || 0,
      disponible: disponible !== undefined ? disponible : true,
      imagen: req.file ? `/uploads/${req.file.filename}` : null,
      vendedorId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Producto creado correctamente',
      product
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear producto' 
    });
  }
};

// Actualizar producto (solo el propietario)
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Producto no encontrado' 
      });
    }

    // Verificar que el usuario sea el dueño del producto
    if (product.vendedorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permiso para editar este producto' 
      });
    }

    const { nombre, descripcion, precio, unidad, categoria, stock, disponible } = req.body;

    // Actualizar campos
    if (nombre) product.nombre = nombre;
    if (descripcion !== undefined) product.descripcion = descripcion;
    if (precio) product.precio = precio;
    if (unidad) product.unidad = unidad;
    if (categoria !== undefined) product.categoria = categoria;
    if (stock !== undefined) product.stock = stock;
    if (disponible !== undefined) product.disponible = disponible;
    if (req.file) product.imagen = `/uploads/${req.file.filename}`;

    await product.save();

    res.json({
      success: true,
      message: 'Producto actualizado correctamente',
      product
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar producto' 
    });
  }
};

// Eliminar producto (solo el propietario)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Producto no encontrado' 
      });
    }

    // Verificar que el usuario sea el dueño del producto
    if (product.vendedorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permiso para eliminar este producto' 
      });
    }

    await product.destroy();

    res.json({
      success: true,
      message: 'Producto eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar producto' 
    });
  }
};
