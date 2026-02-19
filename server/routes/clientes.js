const express = require('express');
const User = require('../models/User');
const Venta = require('../models/Venta');
const Propiedad = require('../models/Propiedad');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Listar todos los clientes (solo admin)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const clientes = await User.find({ role: 'cliente' }).sort({ nombre: 1 });
    
    // Agregar info de propiedades para cada cliente
    const clientesConPropiedades = await Promise.all(
      clientes.map(async (cliente) => {
        const ventas = await Venta.find({ cliente: cliente._id })
          .populate('propiedad', 'codigo nombre');
        
        return {
          ...cliente.toJSON(),
          propiedades: ventas.map(v => ({
            id: v._id,
            propiedad: v.propiedad,
            estado: v.estado,
            totalPagado: v.totalPagado,
            saldoPendiente: v.saldoPendiente
          }))
        };
      })
    );

    res.json(clientesConPropiedades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un cliente específico
router.get('/:id', auth, async (req, res) => {
  try {
    // Clientes solo pueden ver su propia info
    if (req.user.role === 'cliente' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const cliente = await User.findById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Obtener ventas/propiedades del cliente
    const ventas = await Venta.find({ cliente: cliente._id })
      .populate('propiedad');

    res.json({
      cliente,
      propiedades: ventas
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Portal del cliente - ver sus propiedades
router.get('/mi-portal/propiedades', auth, async (req, res) => {
  try {
    const ventas = await Venta.find({ cliente: req.user._id })
      .populate('propiedad');

    const propiedades = ventas.map(venta => ({
      id: venta._id,
      propiedad: {
        codigo: venta.propiedad.codigo,
        nombre: venta.propiedad.nombre,
        tipo: venta.propiedad.tipo,
        ubicacion: venta.propiedad.ubicacion,
        superficie: venta.propiedad.superficie,
        valorFuturo: venta.propiedad.valorFuturo,
        caracteristicas: venta.propiedad.caracteristicas
      },
      precioVenta: venta.precioVenta,
      moneda: venta.moneda,
      totalPagado: venta.totalPagado,
      saldoPendiente: venta.saldoPendiente,
      estado: venta.estado,
      fechaVenta: venta.fechaVenta,
      cuotas: venta.cuotas.map(c => ({
        numero: c.numero,
        monto: c.monto,
        moneda: c.moneda,
        fechaVencimiento: c.fechaVencimiento,
        estado: c.estado,
        montoPagado: c.montoPagado
      })),
      anticipo: venta.anticipo,
      // Resumen de pagos
      resumen: {
        porcentajePagado: ((venta.totalPagado / venta.precioVenta) * 100).toFixed(1),
        cuotasPagadas: venta.cuotas.filter(c => c.estado === 'pagada').length,
        cuotasTotales: venta.cuotas.length,
        proximaCuota: venta.cuotas.find(c => c.estado === 'pendiente')
      }
    }));

    res.json(propiedades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resumen del cliente para dashboard
router.get('/mi-portal/resumen', auth, async (req, res) => {
  try {
    const ventas = await Venta.find({ cliente: req.user._id })
      .populate('propiedad', 'nombre valorFuturo');

    const resumen = {
      totalPropiedades: ventas.length,
      totalInvertido: ventas.reduce((sum, v) => sum + v.precioVenta, 0),
      totalPagado: ventas.reduce((sum, v) => sum + v.totalPagado, 0),
      saldoPendiente: ventas.reduce((sum, v) => sum + v.saldoPendiente, 0),
      valorFuturoTotal: ventas.reduce((sum, v) => sum + (v.propiedad.valorFuturo || v.precioVenta), 0),
      propiedades: ventas.map(v => ({
        nombre: v.propiedad.nombre,
        estado: v.estado,
        porcentajePagado: ((v.totalPagado / v.precioVenta) * 100).toFixed(1)
      }))
    };

    res.json(resumen);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
