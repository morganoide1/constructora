const express = require('express');
const router = express.Router();
const Presupuesto = require('../models/Presupuesto');
const Movimiento = require('../models/Movimiento');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { edificio } = req.query;
    const query = { activo: true };
    if (edificio) query.edificio = edificio;
    
    const presupuestos = await Presupuesto.find(query)
      .populate('edificio', 'nombre')
      .sort({ createdAt: -1 });
    res.json(presupuestos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/edificio/:edificioId', auth, adminOnly, async (req, res) => {
  try {
    const presupuesto = await Presupuesto.findOne({ 
      edificio: req.params.edificioId, 
      activo: true 
    }).populate('edificio', 'nombre');
    res.json(presupuesto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    let presupuesto = await Presupuesto.findOne({ 
      edificio: req.body.edificio, 
      activo: true 
    });
    
    if (presupuesto) {
      presupuesto.lineas = req.body.lineas || presupuesto.lineas;
      presupuesto.nombre = req.body.nombre || presupuesto.nombre;
      presupuesto.notas = req.body.notas || presupuesto.notas;
      await presupuesto.save();
    } else {
      presupuesto = new Presupuesto(req.body);
      await presupuesto.save();
    }
    res.status(201).json(presupuesto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/linea', auth, adminOnly, async (req, res) => {
  try {
    const presupuesto = await Presupuesto.findById(req.params.id);
    if (!presupuesto) return res.status(404).json({ error: 'No encontrado' });
    
    presupuesto.lineas.push(req.body);
    await presupuesto.save();
    res.json(presupuesto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id/linea/:lineaId', auth, adminOnly, async (req, res) => {
  try {
    const presupuesto = await Presupuesto.findById(req.params.id);
    if (!presupuesto) return res.status(404).json({ error: 'No encontrado' });
    
    presupuesto.lineas = presupuesto.lineas.filter(l => l._id.toString() !== req.params.lineaId);
    await presupuesto.save();
    res.json(presupuesto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/comparativa/:edificioId', auth, adminOnly, async (req, res) => {
  try {
    const presupuesto = await Presupuesto.findOne({ 
      edificio: req.params.edificioId, 
      activo: true 
    });
    
    const movimientos = await Movimiento.find({ edificio: req.params.edificioId })
      .populate('caja', 'tipo');
    
    const real = { ingresos: { USD: 0, ARS: 0 }, egresos: { USD: 0, ARS: 0 } };
    movimientos.forEach(m => {
      const moneda = m.caja?.tipo || 'ARS';
      if (m.tipo === 'ingreso' || m.tipo === 'transferencia_entrada') {
        real.ingresos[moneda] += m.monto;
      } else if (m.tipo === 'egreso' || m.tipo === 'transferencia_salida') {
        real.egresos[moneda] += m.monto;
      }
    });
    real.resultado = {
      USD: real.ingresos.USD - real.egresos.USD,
      ARS: real.ingresos.ARS - real.egresos.ARS
    };
    
    const proyectado = { ingresos: { USD: 0, ARS: 0 }, egresos: { USD: 0, ARS: 0 }, lineas: [] };
    if (presupuesto) {
      proyectado.lineas = presupuesto.lineas;
      presupuesto.lineas.forEach(l => {
        if (l.tipo === 'ingreso') {
          proyectado.ingresos[l.moneda] += l.monto;
        } else {
          proyectado.egresos[l.moneda] += l.monto;
        }
      });
    }
    proyectado.resultado = {
      USD: proyectado.ingresos.USD - proyectado.egresos.USD,
      ARS: proyectado.ingresos.ARS - proyectado.egresos.ARS
    };
    
    const variacion = {
      ingresos: {
        USD: real.ingresos.USD - proyectado.ingresos.USD,
        ARS: real.ingresos.ARS - proyectado.ingresos.ARS
      },
      egresos: {
        USD: real.egresos.USD - proyectado.egresos.USD,
        ARS: real.egresos.ARS - proyectado.egresos.ARS
      },
      resultado: {
        USD: real.resultado.USD - proyectado.resultado.USD,
        ARS: real.resultado.ARS - proyectado.resultado.ARS
      }
    };
    
    res.json({ presupuesto, real, proyectado, variacion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Presupuesto.findByIdAndUpdate(req.params.id, { activo: false });
    res.json({ message: 'Eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
