import User from '../models/User.js';
import Product from '../models/Product.js';
import { Op } from 'sequelize';

// Obtener todos los comerciantes/vendedores
export const getVendedores = async (req, res) => {
  try {
    const { categoria, search } = req.query;
    
    const where = {
      role: {
        [Op.in]: ['comerciante', 'admin']
      }
    };

    // Filtrar por búsqueda
    if (search) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { apellidos: { [Op.like]: `%${search}%` } }
      ];
    }

    const vendedores = await User.findAll({
      where,
      attributes: ['id', 'nombre', 'apellidos', 'telefono', 'direccion'],
      include: [{
        model: Product,
        as: 'productos',
        attributes: ['categoria', 'imagen'],
        where: categoria ? { categoria } : {},
        required: false
      }]
    });

    // Agrupar vendedores por categorías de sus productos
    const vendedoresConCategoria = vendedores.map(vendedor => {
      const productos = vendedor.productos || [];
      const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
      const imagenPrincipal = productos.find(p => p.imagen)?.imagen || null;
      
      return {
        id: vendedor.id,
        nombre: vendedor.nombre,
        apellidos: vendedor.apellidos,
        telefono: vendedor.telefono,
        direccion: vendedor.direccion,
        nombreCompleto: `${vendedor.nombre} ${vendedor.apellidos}`,
        categorias,
        imagenPrincipal,
        totalProductos: productos.length
      };
    });

    res.json({
      success: true,
      count: vendedoresConCategoria.length,
      vendedores: vendedoresConCategoria
    });
  } catch (error) {
    console.error('Error al obtener vendedores:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener vendedores' 
    });
  }
};

// Obtener un vendedor por ID con sus productos
export const getVendedor = async (req, res) => {
  try {
    const vendedor = await User.findOne({
      where: { 
        id: req.params.id,
        role: {
          [Op.in]: ['comerciante', 'admin']
        }
      },
      attributes: ['id', 'nombre', 'apellidos', 'telefono', 'direccion'],
      include: [{
        model: Product,
        as: 'productos',
        where: { disponible: true },
        required: false
      }]
    });

    if (!vendedor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vendedor no encontrado' 
      });
    }

    res.json({
      success: true,
      vendedor: {
        ...vendedor.toJSON(),
        nombreCompleto: `${vendedor.nombre} ${vendedor.apellidos}`
      }
    });
  } catch (error) {
    console.error('Error al obtener vendedor:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener vendedor' 
    });
  }
};

// Obtener categorías disponibles
export const getCategorias = async (req, res) => {
  try {
    const productos = await Product.findAll({
      attributes: ['categoria'],
      where: {
        categoria: { [Op.ne]: null },
        disponible: true
      },
      group: ['categoria']
    });

    const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];

    res.json({
      success: true,
      categorias
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener categorías' 
    });
  }
};
