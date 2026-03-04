import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import sequelize from '../config/database.js';

// Obtener todos los pedidos del vendedor
export const getMyOrders = async (req, res) => {
  try {
    const vendedorId = req.user.id;

    const orders = await Order.findAll({
      where: { vendedorId },
      include: [
        {
          model: User,
          as: 'cliente',
          attributes: ['id', 'nombre', 'apellidos', 'email', 'telefono']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'producto',
              attributes: ['id', 'nombre', 'imagen', 'categoria']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Formatear los datos
    const formattedOrders = orders.map(order => {
      const orderData = order.toJSON();
      return {
        ...orderData,
        clienteNombre: `${orderData.cliente.nombre} ${orderData.cliente.apellidos}`,
        totalItems: orderData.items.reduce((sum, item) => sum + item.cantidad, 0)
      };
    });

    res.json({
      success: true,
      count: formattedOrders.length,
      orders: formattedOrders
    });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los pedidos'
    });
  }
};

// Obtener detalles de un pedido específico
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendedorId = req.user.id;

    const order = await Order.findOne({
      where: { id, vendedorId },
      include: [
        {
          model: User,
          as: 'cliente',
          attributes: ['id', 'nombre', 'apellidos', 'email', 'telefono', 'direccion']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'producto',
              attributes: ['id', 'nombre', 'imagen', 'categoria', 'descripcion']
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el pedido'
    });
  }
};

// Actualizar estado del pedido
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const vendedorId = req.user.id;

    // Validar estado
    const estadosValidos = ['pendiente', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    const order = await Order.findOne({
      where: { id, vendedorId }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    order.estado = estado;
    await order.save();

    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      order
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado del pedido'
    });
  }
};

// Añadir/actualizar notas del vendedor
export const updateVendorNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notasVendedor } = req.body;
    const vendedorId = req.user.id;

    const order = await Order.findOne({
      where: { id, vendedorId }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    order.notasVendedor = notasVendedor;
    await order.save();

    res.json({
      success: true,
      message: 'Notas actualizadas correctamente',
      order
    });
  } catch (error) {
    console.error('Error al actualizar notas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar las notas'
    });
  }
};

// Crear un pedido (para testing o desde el cliente)
export const createOrder = async (req, res) => {
  try {
    const { vendedorId, items, direccionEntrega, telefonoContacto, notasCliente, fechaEntrega } = req.body;
    const clienteId = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El pedido debe contener al menos un producto'
      });
    }

    // Calcular el total
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Producto ${item.productId} no encontrado`
        });
      }

      if (product.vendedorId !== vendedorId) {
        return res.status(400).json({
          success: false,
          message: 'Todos los productos deben ser del mismo vendedor'
        });
      }

      if (!product.disponible) {
        return res.status(400).json({
          success: false,
          message: `El producto ${product.nombre} no está disponible`
        });
      }

      if (product.stock < item.cantidad) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${product.nombre}`
        });
      }

      const subtotal = parseFloat(product.precio) * item.cantidad;
      total += subtotal;

      orderItems.push({
        productId: product.id,
        cantidad: item.cantidad,
        precioUnitario: product.precio,
        subtotal: subtotal,
        nombreProducto: product.nombre,
        unidad: product.unidad
      });
    }

    // Crear el pedido
    const order = await Order.create({
      clienteId,
      vendedorId,
      total,
      direccionEntrega,
      telefonoContacto,
      notasCliente,
      fechaEntrega: fechaEntrega || null,
      estado: 'pendiente'
    });

    // Crear los items del pedido
    for (const item of orderItems) {
      await OrderItem.create({
        orderId: order.id,
        ...item
      });

      // Actualizar stock
      const product = await Product.findByPk(item.productId);
      product.stock -= item.cantidad;
      await product.save();
    }

    // Obtener el pedido completo con relaciones
    const fullOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: User,
          as: 'cliente',
          attributes: ['id', 'nombre', 'apellidos', 'email', 'telefono']
        },
        {
          model: User,
          as: 'vendedor',
          attributes: ['id', 'nombre', 'apellidos', 'telefono', 'direccion']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'producto'
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Pedido creado correctamente',
      order: fullOrder
    });
  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el pedido'
    });
  }
};

// Obtener estadísticas de pedidos del vendedor
export const getOrderStats = async (req, res) => {
  try {
    const vendedorId = req.user.id;

    const stats = await Order.findAll({
      where: { vendedorId },
      attributes: [
        'estado',
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
        [sequelize.fn('SUM', sequelize.col('total')), 'totalVentas']
      ],
      group: ['estado']
    });

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas'
    });
  }
};
