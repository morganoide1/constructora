const express = require('express');
const router = express.Router();
const Denuncia = require('../models/Denuncia');
const Venta = require('../models/Venta');
const { auth, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Cliente: Obtener mis denuncias
router.get('/mis-denuncias', auth, async (req, res) => {
  try {
    const denuncias = await Denuncia.find({ cliente: req.user._id, visibleCliente: true })
      .populate('propiedad', 'nombre codigo')
      .sort({ createdAt: -1 });
    res.json(denuncias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cliente: Crear denuncia
router.post('/', auth, upload.single('archivo'), async (req, res) => {
  try {
    const data = {
      cliente: req.user._id,
      propiedad: req.body.propiedad || undefined,
      tipo: req.body.tipo,
      asunto: req.body.asunto,
      descripcion: req.body.descripcion,
      prioridad: req.body.prioridad || 'media'
    };
    if (req.file) {
      data.archivo = `/uploads/${req.file.filename}`;
    }
    const denuncia = new Denuncia(data);
    await denuncia.save();
    res.status(201).json(denuncia);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cliente: Agregar mensaje a denuncia
router.post('/:id/mensaje', auth, async (req, res) => {
  try {
    const denuncia = await Denuncia.findOne({ _id: req.params.id, cliente: req.user._id });
    if (!denuncia) return res.status(404).json({ error: 'Denuncia no encontrada' });
    
    denuncia.respuestas.push({
      mensaje: req.body.mensaje,
      usuario: req.user._id
    });
    await denuncia.save();
    res.json(denuncia);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Obtener todas las denuncias
router.get('/admin', auth, adminOnly, async (req, res) => {
  try {
    const { estado, prioridad } = req.query;
    const query = {};
    if (estado) query.estado = estado;
    if (prioridad) query.prioridad = prioridad;
    
    const denuncias = await Denuncia.find(query)
      .populate('cliente', 'nombre email')
      .populate('propiedad', 'nombre codigo')
      .populate('respuestas.usuario', 'nombre')
      .sort({ createdAt: -1 });
    res.json(denuncias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Actualizar denuncia
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const updates = {
      estado: req.body.estado,
      prioridad: req.body.prioridad,
      visibleCliente: req.body.visibleCliente
    };
    if (req.body.estado === 'cerrado' || req.body.estado === 'resuelto') {
      updates.fechaCierre = new Date();
    }
    const denuncia = await Denuncia.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('cliente', 'nombre email')
      .populate('propiedad', 'nombre codigo');
    res.json(denuncia);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Responder denuncia
router.post('/:id/respuesta', auth, adminOnly, async (req, res) => {
  try {
    const denuncia = await Denuncia.findById(req.params.id);
    if (!denuncia) return res.status(404).json({ error: 'Denuncia no encontrada' });
    
    denuncia.respuestas.push({
      mensaje: req.body.mensaje,
      usuario: req.user._id
    });
    if (req.body.cambiarEstado) {
      denuncia.estado = req.body.cambiarEstado;
    }
    await denuncia.save();
    
    const populated = await Denuncia.findById(denuncia._id)
      .populate('cliente', 'nombre email')
      .populate('propiedad', 'nombre codigo')
      .populate('respuestas.usuario', 'nombre');
    res.json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Eliminar denuncia
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Denuncia.findByIdAndDelete(req.params.id);
    res.json({ message: 'Denuncia eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
