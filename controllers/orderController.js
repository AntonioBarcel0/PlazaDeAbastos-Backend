import { Op } from 'sequelize';
import Order from '../models/Order.js';
import SubOrder from '../models/SubOrder.js';
import OrderItem from '../models/OrderItem.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import CestaPredefinida from '../models/CestaPredefinida.js';
import sequelize from '../config/database.js';

// ── Helpers ────────────────────────────────────────

// Calcula el estado global del pedido a partir de los estados de los sub-pedidos
const deriveOrderStatus = (subOrders) => {
  const estados = subOrders.map(so => so.estado);
  if (estados.every(e => e === 'entregado')) return 'entregado';
  if (estados.every(e => e === 'cancelado')) return 'cancelado';
  if (estados.some(e => e === 'preparando')) return 'preparando';
  if (estados.some(e => e === 'listo')) return 'listo';
  if (estados.some(e => e === 'confirmado')) return 'confirmado';
  return 'pendiente';
};

// ── Crear un pedido (clientes) ─────────────────────
// Ahora acepta items de MÚLTIPLES vendedores — se crean sub-pedidos automáticamente
export const createOrder = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { items, modoEntrega, direccionEntrega, telefonoContacto, notasCliente, fechaEntrega } = req.body;
    const clienteId = req.user.id;

    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'El pedido debe contener al menos un producto' });
    }

    // Validar modo entrega
    if (modoEntrega === 'domicilio' && !direccionEntrega?.trim()) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'La dirección es obligatoria para entrega a domicilio' });
    }

    // 1) Validar ítems y agrupar por vendedor (soporta productos y cestas)
    const byVendor = {}; // vendedorId → [{ type, product|cesta, cantidad }]

    for (const item of items) {
      if (item.cestaId) {
        // Ítem de tipo cesta predefinida
        const cesta = await CestaPredefinida.findByPk(item.cestaId, { transaction: t });
        if (!cesta) {
          await t.rollback();
          return res.status(404).json({ success: false, message: `Cesta ${item.cestaId} no encontrada` });
        }
        if (!cesta.activa) {
          await t.rollback();
          return res.status(400).json({ success: false, message: `La cesta "${cesta.nombre}" no está disponible` });
        }
        const vid = cesta.vendedorId;
        if (!byVendor[vid]) byVendor[vid] = [];
        byVendor[vid].push({ type: 'cesta', cesta, cantidad: item.cantidad || 1 });
      } else {
        // Ítem de tipo producto normal
        const product = await Product.findByPk(item.productId, { transaction: t });
        if (!product) {
          await t.rollback();
          return res.status(404).json({ success: false, message: `Producto ${item.productId} no encontrado` });
        }
        if (!product.disponible) {
          await t.rollback();
          return res.status(400).json({ success: false, message: `El producto ${product.nombre} no está disponible` });
        }
        const vid = product.vendedorId;
        if (!byVendor[vid]) byVendor[vid] = [];
        byVendor[vid].push({ type: 'producto', product, cantidad: item.cantidad });
      }
    }

    // 2) Calcular total global
    let totalGlobal = 0;
    const subOrdersData = [];

    for (const [vendedorId, vendorItems] of Object.entries(byVendor)) {
      let subtotalVendor = 0;
      const itemsData = [];

      for (const entry of vendorItems) {
        if (entry.type === 'cesta') {
          const { cesta, cantidad } = entry;
          const subtotal = parseFloat(cesta.precio) * cantidad;
          subtotalVendor += subtotal;
          itemsData.push({
            productId: null,
            cestaId: cesta.id,
            cantidad,
            precioUnitario: cesta.precio,
            subtotal: Math.round(subtotal * 100) / 100,
            nombreProducto: cesta.nombre,
            unidad: 'ud'
          });
        } else {
          const { product, cantidad } = entry;
          const isWeight = product.unidad === 'kg';
          const subtotal = isWeight
            ? (cantidad / 1000) * parseFloat(product.precio)
            : parseFloat(product.precio) * cantidad;

          // Validar stock
          if (isWeight) {
            const stockGramos = product.stock != null ? product.stock * 1000 : Infinity;
            if (cantidad > stockGramos) {
              await t.rollback();
              return res.status(400).json({ success: false, message: `Stock insuficiente para ${product.nombre}` });
            }
          } else {
            if (product.stock != null && cantidad > product.stock) {
              await t.rollback();
              return res.status(400).json({ success: false, message: `Stock insuficiente para ${product.nombre}` });
            }
          }

          subtotalVendor += subtotal;
          itemsData.push({
            productId: product.id,
            cestaId: null,
            cantidad,
            precioUnitario: product.precio,
            subtotal: Math.round(subtotal * 100) / 100,
            nombreProducto: product.nombre,
            unidad: product.unidad
          });
        }
      }

      subOrdersData.push({
        vendedorId,
        subtotal: Math.round(subtotalVendor * 100) / 100,
        items: itemsData
      });

      totalGlobal += subtotalVendor;
    }

    totalGlobal = Math.round(totalGlobal * 100) / 100;

    // 3) Crear la Order global
    const order = await Order.create({
      clienteId,
      total: totalGlobal,
      modoEntrega: modoEntrega || 'recogida',
      direccionEntrega: direccionEntrega?.trim() || null,
      telefonoContacto: telefonoContacto?.trim() || null,
      notasCliente: notasCliente?.trim() || null,
      fechaEntrega: fechaEntrega || null,
      estado: 'pendiente'
    }, { transaction: t });

    // 4) Crear SubOrders + OrderItems + actualizar stock
    for (const soData of subOrdersData) {
      const subOrder = await SubOrder.create({
        orderId: order.id,
        vendedorId: soData.vendedorId,
        subtotal: soData.subtotal,
        estado: 'pendiente'
      }, { transaction: t });

      for (const itemData of soData.items) {
        await OrderItem.create({
          subOrderId: subOrder.id,
          ...itemData
        }, { transaction: t });

        // Actualizar stock solo para productos (no cestas)
        if (itemData.productId) {
          const product = await Product.findByPk(itemData.productId, { transaction: t });
          if (product && product.stock != null) {
            const isWeight = product.unidad === 'kg';
            if (isWeight) {
              product.stock = Math.max(0, product.stock - (itemData.cantidad / 1000));
            } else {
              product.stock = Math.max(0, product.stock - itemData.cantidad);
            }
            await product.save({ transaction: t });
          }
        }
      }
    }

    await t.commit();

    // 5) Devolver el pedido completo
    const fullOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: User,
          as: 'cliente',
          attributes: ['id', 'nombre', 'apellidos', 'email', 'telefono']
        },
        {
          model: SubOrder,
          as: 'subOrders',
          include: [
            {
              model: User,
              as: 'vendedor',
              attributes: ['id', 'nombre', 'apellidos', 'telefono', 'direccion', 'especialidad']
            },
            {
              model: OrderItem,
              as: 'items',
              include: [{ model: Product, as: 'producto' }]
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
    await t.rollback();
    console.error('Error al crear pedido:', error);
    res.status(500).json({ success: false, message: 'Error al crear el pedido' });
  }
};

// ── Pedidos del vendedor (ve sus sub-pedidos) ──────
export const getMyOrders = async (req, res) => {
  try {
    const vendedorId = req.user.id;

    const subOrders = await SubOrder.findAll({
      where: { vendedorId },
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: User,
              as: 'cliente',
              attributes: ['id', 'nombre', 'apellidos', 'email', 'telefono']
            }
          ]
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

    const formattedOrders = subOrders.map(so => {
      const data = so.toJSON();
      return {
        id: data.id,
        orderId: data.orderId,
        estado: data.estado,
        subtotal: data.subtotal,
        notasVendedor: data.notasVendedor,
        createdAt: data.createdAt,
        modoEntrega: data.order.modoEntrega,
        direccionEntrega: data.order.direccionEntrega,
        telefonoContacto: data.order.telefonoContacto,
        notasCliente: data.order.notasCliente,
        fechaEntrega: data.order.fechaEntrega,
        clienteNombre: `${data.order.cliente.nombre} ${data.order.cliente.apellidos}`,
        cliente: data.order.cliente,
        items: data.items,
        totalItems: data.items.length
      };
    });

    res.json({
      success: true,
      count: formattedOrders.length,
      orders: formattedOrders
    });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener los pedidos' });
  }
};

// ── Detalles de un sub-pedido (vendedor) ───────────
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendedorId = req.user.id;

    const subOrder = await SubOrder.findOne({
      where: { id, vendedorId },
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: User,
              as: 'cliente',
              attributes: ['id', 'nombre', 'apellidos', 'email', 'telefono', 'direccion']
            }
          ]
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

    if (!subOrder) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }

    // Formatear para que el frontend tenga la misma forma que antes
    const data = subOrder.toJSON();
    const formatted = {
      id: data.id,
      orderId: data.orderId,
      estado: data.estado,
      total: data.subtotal,
      notasVendedor: data.notasVendedor,
      createdAt: data.createdAt,
      modoEntrega: data.order.modoEntrega,
      direccionEntrega: data.order.direccionEntrega,
      telefonoContacto: data.order.telefonoContacto,
      notasCliente: data.order.notasCliente,
      fechaEntrega: data.order.fechaEntrega,
      cliente: data.order.cliente,
      items: data.items
    };

    res.json({ success: true, order: formatted });
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    res.status(500).json({ success: false, message: 'Error al obtener el pedido' });
  }
};

// ── Actualizar estado de un sub-pedido (vendedor) ──
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const vendedorId = req.user.id;

    const estadosValidos = ['pendiente', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ success: false, message: 'Estado no válido' });
    }

    const subOrder = await SubOrder.findOne({ where: { id, vendedorId } });
    if (!subOrder) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }

    subOrder.estado = estado;
    await subOrder.save();

    // Recalcular estado global del pedido padre
    const allSubs = await SubOrder.findAll({ where: { orderId: subOrder.orderId } });
    const newGlobalStatus = deriveOrderStatus(allSubs);
    await Order.update({ estado: newGlobalStatus }, { where: { id: subOrder.orderId } });

    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      order: subOrder
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar el estado del pedido' });
  }
};

// ── Notas del vendedor en un sub-pedido ────────────
export const updateVendorNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notasVendedor } = req.body;
    const vendedorId = req.user.id;

    const subOrder = await SubOrder.findOne({ where: { id, vendedorId } });
    if (!subOrder) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }

    subOrder.notasVendedor = notasVendedor;
    await subOrder.save();

    res.json({ success: true, message: 'Notas actualizadas correctamente', order: subOrder });
  } catch (error) {
    console.error('Error al actualizar notas:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar las notas' });
  }
};

// ── Mis compras (vista del cliente) ────────────────
export const getMyPurchases = async (req, res) => {
  try {
    const clienteId = req.user.id;

    const orders = await Order.findAll({
      where: { clienteId },
      include: [
        {
          model: SubOrder,
          as: 'subOrders',
          include: [
            {
              model: User,
              as: 'vendedor',
              attributes: ['id', 'nombre', 'apellidos', 'especialidad', 'telefono']
            },
            {
              model: OrderItem,
              as: 'items',
              include: [
                {
                  model: Product,
                  as: 'producto',
                  attributes: ['id', 'nombre', 'imagen']
                }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({ success: false, message: 'Error al obtener tus pedidos' });
  }
};

// ── Todos los pedidos (gestor) ─────────────────────
export const getAllOrders = async (req, res) => {
  try {
    const { modoEntrega, estado } = req.query;

    const where = {};
    if (modoEntrega && modoEntrega !== 'todos') where.modoEntrega = modoEntrega;
    if (estado && estado !== 'todos') where.estado = estado;

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: User,
          as: 'cliente',
          attributes: ['id', 'nombre', 'apellidos', 'email', 'telefono']
        },
        {
          model: SubOrder,
          as: 'subOrders',
          include: [
            {
              model: User,
              as: 'vendedor',
              attributes: ['id', 'nombre', 'apellidos', 'especialidad']
            },
            {
              model: OrderItem,
              as: 'items'
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('Error al obtener todos los pedidos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener los pedidos' });
  }
};

// ── Marcar pedido completo como entregado (gestor) ─
export const deliverOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [{ model: SubOrder, as: 'subOrders' }]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }

    if (order.estado === 'cancelado') {
      return res.status(400).json({ success: false, message: 'No se puede entregar un pedido cancelado' });
    }

    for (const subOrder of order.subOrders) {
      subOrder.estado = 'entregado';
      await subOrder.save();
    }

    order.estado = 'entregado';
    await order.save();

    res.json({ success: true, message: 'Pedido marcado como entregado correctamente' });
  } catch (error) {
    console.error('Error al marcar como entregado:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar el pedido' });
  }
};

// ── Estadísticas globales (gestor) ────────────────
export const getGestorStats = async (_req, res) => {
  try {
    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);

    const [
      domicilioPendiente,
      listoParaEntregar,
      recogidaPendiente,
      entregadosHoy,
      total
    ] = await Promise.all([
      Order.count({
        where: {
          modoEntrega: 'domicilio',
          estado: { [Op.notIn]: ['entregado', 'cancelado'] }
        }
      }),
      Order.count({
        where: { modoEntrega: 'domicilio', estado: 'listo' }
      }),
      Order.count({
        where: {
          modoEntrega: 'recogida',
          estado: { [Op.notIn]: ['entregado', 'cancelado'] }
        }
      }),
      Order.count({
        where: {
          estado: 'entregado',
          updatedAt: { [Op.gte]: hoyInicio }
        }
      }),
      Order.count()
    ]);

    res.json({
      success: true,
      stats: { domicilioPendiente, listoParaEntregar, recogidaPendiente, entregadosHoy, total }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del gestor:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
};

// ── Cancelar pedido (cliente propietario, solo si pendiente) ──
export const cancelOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const clienteId = req.user.id;

    const order = await Order.findOne({
      where: { id, clienteId },
      include: [{
        model: SubOrder,
        as: 'subOrders',
        include: [{
          model: OrderItem,
          as: 'items'
        }]
      }],
      transaction: t
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }

    if (order.estado !== 'pendiente') {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: 'Solo puedes cancelar un pedido mientras esté pendiente de confirmación'
      });
    }

    // Restaurar stock de los productos del pedido
    for (const subOrder of order.subOrders) {
      for (const item of subOrder.items) {
        if (item.productId) {
          const product = await Product.findByPk(item.productId, { transaction: t });
          if (product && product.stock != null) {
            if (product.unidad === 'kg') {
              product.stock = product.stock + (item.cantidad / 1000);
            } else {
              product.stock = product.stock + item.cantidad;
            }
            await product.save({ transaction: t });
          }
        }
      }
      subOrder.estado = 'cancelado';
      await subOrder.save({ transaction: t });
    }

    order.estado = 'cancelado';
    await order.save({ transaction: t });

    await t.commit();
    res.json({ success: true, message: 'Pedido cancelado correctamente' });
  } catch (error) {
    await t.rollback();
    console.error('Error al cancelar pedido:', error);
    res.status(500).json({ success: false, message: 'Error al cancelar el pedido' });
  }
};

// ── Estadísticas del vendedor ──────────────────────
export const getOrderStats = async (req, res) => {
  try {
    const vendedorId = req.user.id;

    const stats = await SubOrder.findAll({
      where: { vendedorId },
      attributes: [
        'estado',
        [sequelize.fn('COUNT', sequelize.col('SubOrder.id')), 'cantidad'],
        [sequelize.fn('SUM', sequelize.col('subtotal')), 'totalVentas']
      ],
      group: ['estado']
    });

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener las estadísticas' });
  }
};
