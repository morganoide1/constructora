const express = require('express');
const Venta = require('../models/Venta');
const Propiedad = require('../models/Propiedad');
const Caja = require('../models/Caja');
const Movimiento = require('../models/Movimiento');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ===== PROPIEDADES =====

// Listar propiedades
router.get('/propiedades', auth, async (req, res) => {
  try {
    const { estado, edificio } = req.query;
    let query = {};
    if (estado)   query.estado   = estado;
    if (edificio) query.edificio = edificio;

    const propiedades = await Propiedad.find(query).sort({ codigo: 1 });
    res.json(propiedades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear propiedad
router.post('/propiedades', auth, adminOnly, async (req, res) => {
  try {
    const propiedad = new Propiedad(req.body);
    await propiedad.save();
    res.status(201).json(propiedad);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar propiedad
router.put('/propiedades/:id', auth, adminOnly, async (req, res) => {
  try {
    const propiedad = await Propiedad.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!propiedad) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }
    res.json(propiedad);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== VENTAS =====

// Listar ventas
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const ventas = await Venta.find()
      .populate('propiedad', 'codigo nombre')
      .populate('cliente', 'nombre email')
      .populate('coTitulares', 'nombre email')
      .sort({ fechaVenta: -1 });
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener venta específica
router.get('/:id', auth, async (req, res) => {
  try {
    const venta = await Venta.findById(req.params.id)
      .populate('propiedad')
      .populate('cliente', 'nombre email telefono')
      .populate('coTitulares', 'nombre email');

    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    // Clientes solo pueden ver sus propias ventas (o si son co-titulares)
    if (req.user.role === 'cliente') {
      const esTitular = venta.cliente._id.toString() === req.user._id.toString();
      const esCoTitular = (venta.coTitulares || []).some(ct => ct._id.toString() === req.user._id.toString());
      if (!esTitular && !esCoTitular) {
        return res.status(403).json({ error: 'Acceso denegado' });
      }
    }

    res.json(venta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear venta
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { propiedadId, clienteId, precioVenta, moneda, anticipo, cuotas, notas } = req.body;

    // Verificar que la propiedad esté disponible
    const propiedad = await Propiedad.findById(propiedadId);
    if (!propiedad) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }
    if (propiedad.estado !== 'disponible') {
      return res.status(400).json({ error: 'La propiedad no está disponible' });
    }

    // Crear la venta
    const venta = new Venta({
      propiedad: propiedadId,
      cliente: clienteId,
      precioVenta,
      moneda: moneda || 'USD',
      anticipo,
      cuotas,
      notas,
      vendedor: req.user._id
    });

    await venta.save();

    // Actualizar estado de la propiedad
    propiedad.estado = 'reservado';
    await propiedad.save();

    res.status(201).json(venta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar venta
router.put("/:id", auth, adminOnly, async (req, res) => {
  try {
    const { precioVenta, anticipo, clienteId, coTitulares } = req.body;
    const venta = await Venta.findById(req.params.id);
    if (!venta) return res.status(404).json({ error: "Venta no encontrada" });

    if (precioVenta) venta.precioVenta = precioVenta;
    if (anticipo) venta.anticipo = anticipo;
    if (clienteId) venta.cliente = clienteId;
    if (Array.isArray(coTitulares)) venta.coTitulares = coTitulares;

    // Recalcular saldo pendiente
    const totalPagado = venta.cuotas.filter(c => c.estado === "pagada").reduce((sum, c) => sum + c.monto, 0) + (venta.anticipo?.pagado ? venta.anticipo.monto : 0);
    venta.totalPagado = totalPagado;
    venta.saldoPendiente = venta.precioVenta - totalPagado;

    await venta.save();
    res.json(venta);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// Registrar pago de cuota (o pago libre sin cuota específica)
router.post('/:id/pago', auth, adminOnly, async (req, res) => {
  try {
    const { cuotaNumero, monto, cajaId, comprobante, notas, pagoLibre } = req.body;

    const venta = await Venta.findById(req.params.id).populate('propiedad');
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    let concepto;
    let cuota;

    if (pagoLibre) {
      // Pago libre: acumular monto sin asociar a cuota específica
      // Intentar aplicar al anticipo si no está pagado
      if (venta.anticipo?.monto > 0 && !venta.anticipo.pagado) {
        venta.anticipo.pagado = true;
        venta.anticipo.fechaPago = new Date();
      }
      concepto = notas || `Pago libre - ${venta.propiedad.nombre}`;
    } else {
      // Buscar la cuota
      cuota = venta.cuotas.find(c => c.numero === cuotaNumero);
      if (!cuota) {
        return res.status(404).json({ error: 'Cuota no encontrada' });
      }

      // Actualizar cuota
      cuota.montoPagado += monto;
      cuota.comprobante = comprobante;
      cuota.notas = notas;

      if (cuota.montoPagado >= cuota.monto) {
        cuota.estado = 'pagada';
        cuota.fechaPago = new Date();
      } else {
        cuota.estado = 'parcial';
      }
      concepto = `Pago cuota ${cuotaNumero} - ${venta.propiedad.nombre}`;
    }

    // Actualizar total pagado de la venta
    venta.totalPagado += monto;
    await venta.save();

    // Registrar movimiento en caja si se especificó
    if (cajaId) {
      const caja = await Caja.findById(cajaId);
      if (caja) {
        caja.saldo += monto;
        await caja.save();

        const movimiento = new Movimiento({
          caja: cajaId,
          tipo: 'ingreso',
          monto,
          concepto,
          venta: venta._id,
          usuario: req.user._id,
          notas
        });
        await movimiento.save();
      }
    }

    res.json({
      message: 'Pago registrado exitosamente',
      cuota,
      totalPagado: venta.totalPagado,
      saldoPendiente: venta.saldoPendiente
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar pago de anticipo
router.post('/:id/anticipo', auth, adminOnly, async (req, res) => {
  try {
    const { monto, cajaId, comprobante, notas } = req.body;

    const venta = await Venta.findById(req.params.id).populate('propiedad');
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    if (venta.anticipo.pagado) {
      return res.status(400).json({ error: 'El anticipo ya fue pagado' });
    }

    venta.anticipo.pagado = true;
    venta.anticipo.fechaPago = new Date();
    venta.totalPagado += monto;
    await venta.save();

    // Registrar movimiento en caja
    if (cajaId) {
      const caja = await Caja.findById(cajaId);
      if (caja) {
        caja.saldo += monto;
        await caja.save();

        const movimiento = new Movimiento({
          caja: cajaId,
          tipo: 'ingreso',
          monto,
          concepto: `Anticipo - ${venta.propiedad.nombre}`,
          venta: venta._id,
          usuario: req.user._id,
          notas
        });
        await movimiento.save();
      }
    }

    res.json({
      message: 'Anticipo registrado exitosamente',
      totalPagado: venta.totalPagado,
      saldoPendiente: venta.saldoPendiente
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard de ventas
router.get('/dashboard/stats', auth, adminOnly, async (req, res) => {
  try {
    const ventas = await Venta.find().populate('propiedad', 'nombre precioLista');
    const propiedades = await Propiedad.find();

    const stats = {
      ventasTotales: ventas.length,
      montoTotalVendido: ventas.reduce((sum, v) => sum + v.precioVenta, 0),
      totalCobrado: ventas.reduce((sum, v) => sum + v.totalPagado, 0),
      totalPorCobrar: ventas.reduce((sum, v) => sum + v.saldoPendiente, 0),
      propiedades: {
        total: propiedades.length,
        disponibles: propiedades.filter(p => p.estado === 'disponible').length,
        reservadas: propiedades.filter(p => p.estado === 'reservado').length,
        vendidas: propiedades.filter(p => p.estado === 'vendido').length
      },
      ultimasVentas: ventas.slice(0, 5).map(v => ({
        propiedad: v.propiedad.nombre,
        monto: v.precioVenta,
        estado: v.estado
      }))
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
