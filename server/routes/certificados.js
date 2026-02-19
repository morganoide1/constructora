const express = require('express');
const Certificado = require('../models/Certificado');
const Caja = require('../models/Caja');
const Movimiento = require('../models/Movimiento');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Listar certificados
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { estado, obra } = req.query;
    let query = {};
    if (estado) query.estado = estado;
    if (obra) query.obra = new RegExp(obra, 'i');

    const certificados = await Certificado.find(query)
      .populate('aprobadoPor', 'nombre')
      .sort({ fechaEmision: -1 });
    
    res.json(certificados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener certificado específico
router.get('/:id', auth, adminOnly, async (req, res) => {
  try {
    const certificado = await Certificado.findById(req.params.id)
      .populate('aprobadoPor', 'nombre')
      .populate('movimiento');

    if (!certificado) {
      return res.status(404).json({ error: 'Certificado no encontrado' });
    }

    res.json(certificado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear certificado
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    // Generar número de certificado
    const ultimoCert = await Certificado.findOne().sort({ createdAt: -1 });
    const numero = ultimoCert 
      ? `CERT-${String(parseInt(ultimoCert.numero.split('-')[1] || 0) + 1).padStart(4, '0')}`
      : 'CERT-0001';

    const certificado = new Certificado({
      ...req.body,
      numero
    });

    // Calcular subtotales de items
    if (certificado.items) {
      certificado.items = certificado.items.map(item => ({
        ...item,
        subtotal: item.cantidad * item.precioUnitario
      }));
    }

    await certificado.save();
    res.status(201).json(certificado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar certificado
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const certificado = await Certificado.findById(req.params.id);
    
    if (!certificado) {
      return res.status(404).json({ error: 'Certificado no encontrado' });
    }

    if (certificado.estado === 'pagado') {
      return res.status(400).json({ error: 'No se puede modificar un certificado pagado' });
    }

    // Recalcular subtotales si hay items
    if (req.body.items) {
      req.body.items = req.body.items.map(item => ({
        ...item,
        subtotal: item.cantidad * item.precioUnitario
      }));
    }

    Object.assign(certificado, req.body);
    await certificado.save();

    res.json(certificado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Aprobar certificado
router.post('/:id/aprobar', auth, adminOnly, async (req, res) => {
  try {
    const certificado = await Certificado.findById(req.params.id);
    
    if (!certificado) {
      return res.status(404).json({ error: 'Certificado no encontrado' });
    }

    if (certificado.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Solo se pueden aprobar certificados pendientes' });
    }

    certificado.estado = 'aprobado';
    certificado.fechaAprobacion = new Date();
    certificado.aprobadoPor = req.user._id;

    await certificado.save();

    res.json({
      message: 'Certificado aprobado exitosamente',
      certificado
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pagar certificado
router.post('/:id/pagar', auth, adminOnly, async (req, res) => {
  try {
    const { cajaId, notas } = req.body;

    const certificado = await Certificado.findById(req.params.id);
    
    if (!certificado) {
      return res.status(404).json({ error: 'Certificado no encontrado' });
    }

    if (certificado.estado !== 'aprobado') {
      return res.status(400).json({ error: 'Solo se pueden pagar certificados aprobados' });
    }

    // Verificar caja
    const caja = await Caja.findById(cajaId);
    if (!caja) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    // Verificar que la moneda coincida
    if (caja.tipo !== certificado.moneda) {
      return res.status(400).json({ 
        error: `La caja es en ${caja.tipo} pero el certificado es en ${certificado.moneda}` 
      });
    }

    // Verificar saldo suficiente
    if (caja.saldo < certificado.montoTotal) {
      return res.status(400).json({ error: 'Saldo insuficiente en la caja' });
    }

    // Descontar de caja
    caja.saldo -= certificado.montoTotal;
    await caja.save();

    // Crear movimiento
    const movimiento = new Movimiento({
      caja: cajaId,
      tipo: 'egreso',
      monto: certificado.montoTotal,
      concepto: `Pago certificado ${certificado.numero} - ${certificado.contratista.nombre}`,
      certificado: certificado._id,
      usuario: req.user._id,
      notas
    });
    await movimiento.save();

    // Actualizar certificado
    certificado.estado = 'pagado';
    certificado.fechaPago = new Date();
    certificado.movimiento = movimiento._id;
    await certificado.save();

    res.json({
      message: 'Certificado pagado exitosamente',
      certificado,
      nuevoSaldoCaja: caja.saldo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rechazar certificado
router.post('/:id/rechazar', auth, adminOnly, async (req, res) => {
  try {
    const { motivo } = req.body;

    const certificado = await Certificado.findById(req.params.id);
    
    if (!certificado) {
      return res.status(404).json({ error: 'Certificado no encontrado' });
    }

    if (certificado.estado === 'pagado') {
      return res.status(400).json({ error: 'No se puede rechazar un certificado pagado' });
    }

    certificado.estado = 'rechazado';
    certificado.notas = motivo ? `Rechazado: ${motivo}` : certificado.notas;
    await certificado.save();

    res.json({
      message: 'Certificado rechazado',
      certificado
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard de certificados
router.get('/dashboard/stats', auth, adminOnly, async (req, res) => {
  try {
    const certificados = await Certificado.find();

    const stats = {
      total: certificados.length,
      pendientes: certificados.filter(c => c.estado === 'pendiente').length,
      aprobados: certificados.filter(c => c.estado === 'aprobado').length,
      pagados: certificados.filter(c => c.estado === 'pagado').length,
      rechazados: certificados.filter(c => c.estado === 'rechazado').length,
      montosPendientes: {
        ARS: certificados
          .filter(c => c.estado === 'aprobado' && c.moneda === 'ARS')
          .reduce((sum, c) => sum + c.montoTotal, 0),
        USD: certificados
          .filter(c => c.estado === 'aprobado' && c.moneda === 'USD')
          .reduce((sum, c) => sum + c.montoTotal, 0)
      },
      montosPagados: {
        ARS: certificados
          .filter(c => c.estado === 'pagado' && c.moneda === 'ARS')
          .reduce((sum, c) => sum + c.montoTotal, 0),
        USD: certificados
          .filter(c => c.estado === 'pagado' && c.moneda === 'USD')
          .reduce((sum, c) => sum + c.montoTotal, 0)
      }
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
