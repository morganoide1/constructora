const express = require('express');
const router = express.Router();
const Expensa = require('../models/Expensa');
const Venta = require('../models/Venta');
const { auth, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Admin: Obtener todas las expensas
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { propiedad, año } = req.query;
    const query = {};
    if (propiedad) query.propiedad = propiedad;
    if (año) query['periodo.año'] = parseInt(año);
    
    const expensas = await Expensa.find(query)
      .populate('propiedad', 'nombre codigo')
      .sort({ 'periodo.año': -1, 'periodo.mes': -1 });
    res.json(expensas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Crear expensa
router.post('/', auth, adminOnly, upload.single('archivo'), async (req, res) => {
  try {
    const data = {
      propiedad: req.body.propiedad,
      periodo: {
        mes: parseInt(req.body.mes),
        año: parseInt(req.body.año)
      },
      montoTotal: parseFloat(req.body.montoTotal),
      moneda: req.body.moneda || 'ARS',
      detalle: {
        ordinarias: parseFloat(req.body.ordinarias) || 0,
        extraordinarias: parseFloat(req.body.extraordinarias) || 0,
        servicios: parseFloat(req.body.servicios) || 0,
        otros: parseFloat(req.body.otros) || 0
      },
      fechaVencimiento: req.body.fechaVencimiento,
      notas: req.body.notas
    };
    
    if (req.file) {
      data.archivo = `/uploads/${req.file.filename}`;
    }
    
    const expensa = new Expensa(data);
    await expensa.save();
    res.status(201).json(expensa);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Marcar como pagada
router.put('/:id/pagar', auth, adminOnly, async (req, res) => {
  try {
    const expensa = await Expensa.findByIdAndUpdate(
      req.params.id,
      { estado: 'pagada', fechaPago: new Date() },
      { new: true }
    );
    res.json(expensa);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Eliminar expensa
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Expensa.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expensa eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cliente: Ver mis expensas
router.get('/mis-expensas', auth, async (req, res) => {
  try {
    // Obtener propiedades del cliente
    const ventas = await Venta.find({ cliente: req.user._id });
    const propiedadIds = ventas.map(v => v.propiedad);
    
    const expensas = await Expensa.find({ propiedad: { $in: propiedadIds } })
      .populate('propiedad', 'nombre codigo')
      .sort({ 'periodo.año': -1, 'periodo.mes': -1 });
    
    res.json(expensas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cliente: Resumen de expensas
router.get('/mis-expensas/resumen', auth, async (req, res) => {
  try {
    const ventas = await Venta.find({ cliente: req.user._id });
    const propiedadIds = ventas.map(v => v.propiedad);
    
    const expensas = await Expensa.find({ propiedad: { $in: propiedadIds } });
    
    const resumen = {
      totalPendiente: expensas.filter(e => e.estado === 'pendiente').reduce((sum, e) => sum + e.montoTotal, 0),
      totalPagado: expensas.filter(e => e.estado === 'pagada').reduce((sum, e) => sum + e.montoTotal, 0),
      cantidadPendiente: expensas.filter(e => e.estado === 'pendiente').length,
      cantidadPagada: expensas.filter(e => e.estado === 'pagada').length
    };
    
    res.json(resumen);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
