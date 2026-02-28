const express = require('express');
const router = express.Router();
const PlanAdelanto = require('../models/PlanAdelanto');
const { auth, adminOnly } = require('../middleware/auth');

// Cliente: ver planes activos y vigentes
router.get('/', auth, async (req, res) => {
  try {
    const hoy = new Date();
    const planes = await PlanAdelanto.find({
      activo: true,
      $or: [{ vigenciaHasta: null }, { vigenciaHasta: { $gte: hoy } }]
    }).populate('edificio', 'nombre').sort({ descuento: -1 });
    res.json(planes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: todos los planes
router.get('/admin', auth, adminOnly, async (req, res) => {
  try {
    const planes = await PlanAdelanto.find()
      .populate('edificio', 'nombre')
      .sort({ createdAt: -1 });
    res.json(planes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: crear plan
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const plan = await new PlanAdelanto({
      titulo:        req.body.titulo,
      descripcion:   req.body.descripcion,
      descuento:     parseFloat(req.body.descuento),
      cuotasMinimas: parseInt(req.body.cuotasMinimas) || 1,
      vigenciaHasta: req.body.vigenciaHasta || null,
      activo:        req.body.activo !== false,
      edificio:      req.body.edificio || null
    }).save();
    const populated = await PlanAdelanto.findById(plan._id).populate('edificio', 'nombre');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: editar plan
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const plan = await PlanAdelanto.findByIdAndUpdate(req.params.id, {
      titulo:        req.body.titulo,
      descripcion:   req.body.descripcion,
      descuento:     parseFloat(req.body.descuento),
      cuotasMinimas: parseInt(req.body.cuotasMinimas) || 1,
      vigenciaHasta: req.body.vigenciaHasta || null,
      activo:        req.body.activo !== false,
      edificio:      req.body.edificio || null
    }, { new: true }).populate('edificio', 'nombre');
    res.json(plan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: eliminar plan
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await PlanAdelanto.findByIdAndDelete(req.params.id);
    res.json({ message: 'Eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
