const express = require('express');
const router = express.Router();
const Mantenimiento = require('../models/Mantenimiento');
const Venta = require('../models/Venta');
const { auth, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Admin: todas las entradas
router.get('/admin', auth, adminOnly, async (req, res) => {
  try {
    const query = {};
    if (req.query.edificio) query.edificio = req.query.edificio;
    const registros = await Mantenimiento.find(query)
      .populate('edificio', 'nombre')
      .populate('creadoPor', 'nombre')
      .sort({ fecha: -1 });
    res.json(registros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cliente: historial de sus edificios
router.get('/', auth, async (req, res) => {
  try {
    const ventas = await Venta.find({ cliente: req.user._id }).populate({ path: 'propiedad', select: 'edificio' });
    const edificioIds = [...new Set(ventas.filter(v => v.propiedad?.edificio).map(v => v.propiedad.edificio.toString()))];

    const registros = await Mantenimiento.find({ edificio: { $in: edificioIds } })
      .populate('edificio', 'nombre')
      .sort({ fecha: -1 });
    res.json(registros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: crear
router.post('/', auth, adminOnly, upload.single('imagen'), async (req, res) => {
  try {
    const data = {
      edificio:    req.body.edificio,
      tipo:        req.body.tipo || 'mantenimiento',
      titulo:      req.body.titulo,
      descripcion: req.body.descripcion,
      fecha:       req.body.fecha,
      creadoPor:   req.user._id
    };
    if (req.file) data.imagen = `/uploads/${req.file.filename}`;
    const registro = await new Mantenimiento(data).save();
    const populated = await Mantenimiento.findById(registro._id).populate('edificio', 'nombre').populate('creadoPor', 'nombre');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: editar
router.put('/:id', auth, adminOnly, upload.single('imagen'), async (req, res) => {
  try {
    const updates = { tipo: req.body.tipo, titulo: req.body.titulo, descripcion: req.body.descripcion, fecha: req.body.fecha, edificio: req.body.edificio };
    if (req.file) updates.imagen = `/uploads/${req.file.filename}`;
    const registro = await Mantenimiento.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('edificio', 'nombre').populate('creadoPor', 'nombre');
    res.json(registro);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: eliminar
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Mantenimiento.findByIdAndDelete(req.params.id);
    res.json({ message: 'Eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
