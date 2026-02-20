const express = require('express');
const Caja = require('../models/Caja');
const Movimiento = require('../models/Movimiento');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Obtener todas las cajas con saldos
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const cajas = await Caja.find().sort({ categoria: 1, tipo: 1 });
    res.json(cajas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear caja
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const caja = new Caja(req.body);
    await caja.save();
    res.status(201).json(caja);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Setup inicial de cajas
router.post('/setup', auth, adminOnly, async (req, res) => {
  try {
    const cajasExistentes = await Caja.countDocuments();
    if (cajasExistentes > 0) {
      return res.status(400).json({ error: 'Las cajas ya fueron configuradas' });
    }

    const cajas = await Caja.insertMany([
      { nombre: 'Caja Principal USD', tipo: 'USD', categoria: 'principal', saldo: 0 },
      { nombre: 'Caja Chica 1 (Pesos)', tipo: 'ARS', categoria: 'chica', saldo: 0 },
      { nombre: 'Caja Chica 2 (Pesos)', tipo: 'ARS', categoria: 'chica', saldo: 0 }
    ]);

    res.status(201).json({ 
      message: 'Cajas creadas exitosamente',
      cajas 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar movimiento (ingreso/egreso)
router.post('/:id/movimiento', auth, adminOnly, async (req, res) => {
  try {
    const { tipo, monto, concepto, referencia, notas, edificio } = req.body;
    const caja = await Caja.findById(req.params.id);
    
    if (!caja) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    // Validar que haya saldo suficiente para egresos
    if (tipo === 'egreso' && caja.saldo < monto) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    // Actualizar saldo
    if (tipo === 'ingreso') {
      caja.saldo += monto;
    } else if (tipo === 'egreso') {
      caja.saldo -= monto;
    }
    await caja.save();

    // Crear movimiento
    const movimiento = new Movimiento({
      caja: caja._id,
      tipo,
      monto,
      concepto,
      referencia,
      notas,
      edificio,
      usuario: req.user._id,
    });
    await movimiento.save();

    res.status(201).json({ 
      movimiento,
      nuevoSaldo: caja.saldo 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener movimientos de una caja
router.get('/:id/movimientos', auth, adminOnly, async (req, res) => {
  try {
    const { desde, hasta, limit = 50 } = req.query;
    
    let query = { caja: req.params.id };
    
    if (desde || hasta) {
      query.fecha = {};
      if (desde) query.fecha.$gte = new Date(desde);
      if (hasta) query.fecha.$lte = new Date(hasta);
    }

    const movimientos = await Movimiento.find(query)
      .populate('usuario', 'nombre')
      .populate('edificio', 'nombre')
      .sort({ fecha: -1 })
      .limit(parseInt(limit));

    res.json(movimientos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard de cajas
router.get('/dashboard', auth, adminOnly, async (req, res) => {
  try {
    const cajas = await Caja.find();
    
    // Últimos movimientos
    const ultimosMovimientos = await Movimiento.find()
      .populate('caja', 'nombre tipo')
      .populate('usuario', 'nombre')
      .populate('edificio', 'nombre')
      .sort({ fecha: -1 })
      .limit(10);

    // Totales
    const totales = {
      USD: cajas.filter(c => c.tipo === 'USD').reduce((sum, c) => sum + c.saldo, 0),
      ARS: cajas.filter(c => c.tipo === 'ARS').reduce((sum, c) => sum + c.saldo, 0)
    };

    res.json({
      cajas,
      ultimosMovimientos,
      totales
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
