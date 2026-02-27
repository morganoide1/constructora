const express = require('express');
const router = express.Router();
const Espacio = require('../models/Espacio');
const Venta = require('../models/Venta');
const { auth, adminOnly } = require('../middleware/auth');

// Cliente: espacios activos de sus edificios
router.get('/', auth, async (req, res) => {
  try {
    let edificioIds = [];
    if (req.user.role === 'admin') {
      const Edificio = require('../models/Edificio');
      const edificios = await Edificio.find({ activo: true }, '_id');
      edificioIds = edificios.map(e => e._id);
    } else {
      const Propiedad = require('../models/Propiedad');
      const ventas = await Venta.find({ cliente: req.user._id }).populate('propiedad', 'edificio');
      const edificioSet = new Set();
      ventas.forEach(v => { if (v.propiedad?.edificio) edificioSet.add(v.propiedad.edificio.toString()); });
      edificioIds = [...edificioSet];
    }
    const espacios = await Espacio.find({ edificio: { $in: edificioIds }, activo: true })
      .populate('edificio', 'nombre')
      .sort({ 'edificio': 1, nombre: 1 });
    res.json(espacios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: todos los espacios
router.get('/admin', auth, adminOnly, async (req, res) => {
  try {
    const espacios = await Espacio.find()
      .populate('edificio', 'nombre')
      .sort({ createdAt: -1 });
    res.json(espacios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: crear espacio
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const espacio = new Espacio({
      edificio:    req.body.edificio,
      nombre:      req.body.nombre,
      descripcion: req.body.descripcion,
      capacidad:   req.body.capacidad
    });
    await espacio.save();
    const populated = await Espacio.findById(espacio._id).populate('edificio', 'nombre');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: editar espacio
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const espacio = await Espacio.findByIdAndUpdate(
      req.params.id,
      { nombre: req.body.nombre, descripcion: req.body.descripcion, capacidad: req.body.capacidad, edificio: req.body.edificio },
      { new: true }
    ).populate('edificio', 'nombre');
    if (!espacio) return res.status(404).json({ error: 'Espacio no encontrado' });
    res.json(espacio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: soft delete
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Espacio.findByIdAndUpdate(req.params.id, { activo: false });
    res.json({ message: 'Espacio desactivado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
