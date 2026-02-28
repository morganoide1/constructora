const express = require('express');
const router = express.Router();
const Gasto = require('../models/Gasto');
const Venta = require('../models/Venta');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/mis-gastos', auth, async (req, res) => {
  try {
    const gastos = await Gasto.find({ cliente: req.user._id })
      .populate('propiedad', 'nombre codigo')
      .sort({ fecha: -1 });
    res.json(gastos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/mis-propiedades', auth, async (req, res) => {
  try {
    const ventas = await Venta.find({ $or: [{ cliente: req.user._id }, { coTitulares: req.user._id }] })
      .populate('propiedad', 'nombre codigo');
    const propiedades = ventas.map(v => v.propiedad);
    res.json(propiedades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, upload.single('archivo'), async (req, res) => {
  try {
    const gastoData = {
      cliente: req.user._id,
      propiedad: req.body.propiedad || undefined,
      tipo: req.body.tipo,
      descripcion: req.body.descripcion,
      monto: parseFloat(req.body.monto),
      moneda: req.body.moneda || 'ARS',
      fecha: req.body.fecha || new Date()
    };
    if (req.file) {
      gastoData.archivo = `/uploads/${req.file.filename}`;
      gastoData.archivoNombre = req.file.originalname;
    }
    const gasto = new Gasto(gastoData);
    await gasto.save();
    res.status(201).json(gasto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const gasto = await Gasto.findOne({ _id: req.params.id, cliente: req.user._id });
    if (!gasto) return res.status(404).json({ error: 'Gasto no encontrado' });
    await Gasto.findByIdAndDelete(req.params.id);
    res.json({ message: 'Gasto eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
