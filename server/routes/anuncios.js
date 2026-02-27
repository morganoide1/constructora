const express = require('express');
const router = express.Router();
const Anuncio = require('../models/Anuncio');
const Venta = require('../models/Venta');
const { auth, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Cliente: Obtener anuncios activos (globales + los de sus edificios)
router.get('/', auth, async (req, res) => {
  try {
    const ventas = await Venta.find({ cliente: req.user._id }).populate({
      path: 'propiedad',
      select: 'edificio'
    });

    const edificioIds = [...new Set(
      ventas
        .filter(v => v.propiedad?.edificio)
        .map(v => v.propiedad.edificio.toString())
    )];

    const anuncios = await Anuncio.find({
      activo: true,
      $or: [
        { edificio: null },
        { edificio: { $in: edificioIds } }
      ]
    })
      .populate('edificio', 'nombre')
      .sort({ createdAt: -1 });

    res.json(anuncios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Obtener todos los anuncios
router.get('/admin', auth, adminOnly, async (req, res) => {
  try {
    const anuncios = await Anuncio.find()
      .populate('edificio', 'nombre')
      .populate('autor', 'nombre')
      .sort({ createdAt: -1 });
    res.json(anuncios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Crear anuncio
router.post('/', auth, adminOnly, upload.single('imagen'), async (req, res) => {
  try {
    const anuncio = new Anuncio({
      titulo:    req.body.titulo,
      contenido: req.body.contenido,
      imagen:    req.file ? `/uploads/${req.file.filename}` : (req.body.imagen || undefined),
      edificio:  req.body.edificio || null,
      autor:     req.user._id
    });
    await anuncio.save();
    const populated = await Anuncio.findById(anuncio._id).populate('edificio', 'nombre');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Editar anuncio
router.put('/:id', auth, adminOnly, upload.single('imagen'), async (req, res) => {
  try {
    const existing = await Anuncio.findById(req.params.id);
    const updates = {
      titulo:    req.body.titulo,
      contenido: req.body.contenido,
      imagen:    req.file ? `/uploads/${req.file.filename}` : (req.body.imagen || existing?.imagen),
      edificio:  req.body.edificio || null,
      activo:    req.body.activo
    };
    const anuncio = await Anuncio.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('edificio', 'nombre');
    res.json(anuncio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Eliminar anuncio (soft delete)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Anuncio.findByIdAndUpdate(req.params.id, { activo: false });
    res.json({ message: 'Anuncio eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle like
router.post('/:id/like', auth, async (req, res) => {
  try {
    const anuncio = await Anuncio.findById(req.params.id);
    if (!anuncio) return res.status(404).json({ error: 'Anuncio no encontrado' });

    const yaLikeo = anuncio.likes.some(id => id.toString() === req.user._id.toString());
    if (yaLikeo) {
      anuncio.likes.pull(req.user._id);
    } else {
      anuncio.likes.push(req.user._id);
    }
    await anuncio.save();
    res.json({ likes: anuncio.likes.length, liked: !yaLikeo });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
