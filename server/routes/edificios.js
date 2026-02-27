const express = require('express');
const router = express.Router();
const Edificio = require('../models/Edificio');
const { auth, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', auth, async (req, res) => {
  try {
    const edificios = await Edificio.find({ activo: true }).sort({ nombre: 1 });
    res.json(edificios);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, adminOnly, upload.single('imagen'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.imagen = `/uploads/${req.file.filename}`;
    const edificio = new Edificio(data);
    await edificio.save();
    res.status(201).json(edificio);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', auth, adminOnly, upload.single('imagen'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.imagen = `/uploads/${req.file.filename}`;
    const edificio = await Edificio.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(edificio);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Edificio.findByIdAndUpdate(req.params.id, { activo: false });
    res.json({ message: 'Edificio eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
