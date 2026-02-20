const express = require('express');
const router = express.Router();
const Beneficio = require('../models/Beneficio');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const beneficios = await Beneficio.find({ activo: true }).sort({ createdAt: -1 });
    res.json(beneficios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/admin', auth, adminOnly, async (req, res) => {
  try {
    const beneficios = await Beneficio.find().sort({ createdAt: -1 });
    res.json(beneficios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const beneficio = new Beneficio(req.body);
    await beneficio.save();
    res.status(201).json(beneficio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const beneficio = await Beneficio.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(beneficio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Beneficio.findByIdAndUpdate(req.params.id, { activo: false });
    res.json({ message: 'Beneficio eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
