const express = require('express');
const router = express.Router();
const Reserva = require('../models/Reserva');
const Espacio = require('../models/Espacio');
const { auth, adminOnly } = require('../middleware/auth');

// Admin: todas las reservas (filtrable por edificio)
router.get('/admin', auth, adminOnly, async (req, res) => {
  try {
    const query = {};
    if (req.query.edificio) query.edificio = req.query.edificio;
    const reservas = await Reserva.find(query)
      .populate('espacio', 'nombre')
      .populate('edificio', 'nombre')
      .populate('cliente', 'nombre email')
      .sort({ fecha: -1 });
    res.json(reservas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cliente: sus reservas
router.get('/mis-reservas', auth, async (req, res) => {
  try {
    const reservas = await Reserva.find({ cliente: req.user._id })
      .populate('espacio', 'nombre')
      .populate('edificio', 'nombre')
      .sort({ fecha: -1 });
    res.json(reservas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disponibilidad: fechas bloqueadas para un espacio en un mes/año
router.get('/disponibilidad', auth, async (req, res) => {
  try {
    const { espacioId, mes, año } = req.query;
    if (!espacioId || !mes || !año) return res.status(400).json({ error: 'Faltan parámetros' });

    const inicio = new Date(Date.UTC(parseInt(año), parseInt(mes) - 1, 1));
    const fin = new Date(Date.UTC(parseInt(año), parseInt(mes), 1));

    const reservas = await Reserva.find({
      espacio: espacioId,
      estado: 'confirmada',
      fecha: { $gte: inicio, $lt: fin }
    }, 'fecha');

    const bloqueadas = reservas.map(r => {
      const d = new Date(r.fecha);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    });

    res.json(bloqueadas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cliente: crear reserva
router.post('/', auth, async (req, res) => {
  try {
    const espacio = await Espacio.findById(req.body.espacio);
    if (!espacio || !espacio.activo) return res.status(404).json({ error: 'Espacio no encontrado' });

    const fecha = new Date(req.body.fecha);
    fecha.setUTCHours(0, 0, 0, 0);

    // Validar que no sea en el pasado
    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);
    if (fecha < hoy) return res.status(400).json({ error: 'No se puede reservar en el pasado' });

    // Verificar conflicto
    const conflicto = await Reserva.findOne({ espacio: espacio._id, fecha, estado: 'confirmada' });
    if (conflicto) return res.status(409).json({ error: 'Ese día ya está reservado' });

    const reserva = new Reserva({
      espacio:  espacio._id,
      edificio: espacio.edificio,
      cliente:  req.user._id,
      fecha,
      notas:    req.body.notas
    });
    await reserva.save();
    const populated = await Reserva.findById(reserva._id)
      .populate('espacio', 'nombre')
      .populate('edificio', 'nombre')
      .populate('cliente', 'nombre email');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancelar reserva (cliente solo la suya; admin cualquiera)
router.delete('/:id', auth, async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.cliente = req.user._id;

    const reserva = await Reserva.findOne(query);
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });

    reserva.estado = 'cancelada';
    await reserva.save();
    res.json({ message: 'Reserva cancelada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
