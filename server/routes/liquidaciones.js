const express = require('express');
const router = express.Router();
const LiquidacionEdificio = require('../models/LiquidacionEdificio');
const Expensa = require('../models/Expensa');
const Propiedad = require('../models/Propiedad');
const { auth, adminOnly } = require('../middleware/auth');

// GET ?edificio=X&mes=M&año=A
// Devuelve la liquidacion del periodo, o sugiere recurrentes del mes anterior
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { edificio, mes, año } = req.query;
    if (!edificio || !mes || !año) return res.status(400).json({ error: 'Faltan parámetros' });

    const existente = await LiquidacionEdificio.findOne({
      edificio,
      'periodo.mes': parseInt(mes),
      'periodo.año': parseInt(año)
    }).populate('edificio', 'nombre');

    if (existente) return res.json(existente);

    // No existe: buscar recurrentes del mes anterior para pre-cargar
    let mesAnterior = parseInt(mes) - 1;
    let añoAnterior = parseInt(año);
    if (mesAnterior === 0) { mesAnterior = 12; añoAnterior--; }

    const anterior = await LiquidacionEdificio.findOne({
      edificio,
      'periodo.mes': mesAnterior,
      'periodo.año': añoAnterior
    });

    const gastosPreCargados = anterior
      ? anterior.gastos.filter(g => g.esRecurrente).map(g => ({
          descripcion: g.descripcion,
          monto: g.monto,
          esRecurrente: true
        }))
      : [];

    // Devolver estructura vacía con sugerencias (sin _id = no guardada)
    res.json({
      edificio,
      periodo: { mes: parseInt(mes), año: parseInt(año) },
      gastos: gastosPreCargados,
      moneda: anterior?.moneda || 'ARS',
      fechaVencimiento: null,
      estado: 'nueva',
      _id: null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /edificio/:edificioId — historial de liquidaciones de un edificio
router.get('/edificio/:edificioId', auth, adminOnly, async (req, res) => {
  try {
    const liquidaciones = await LiquidacionEdificio.find({ edificio: req.params.edificioId })
      .populate('edificio', 'nombre')
      .sort({ 'periodo.año': -1, 'periodo.mes': -1 });
    res.json(liquidaciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST — crear o actualizar borrador
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { edificio, periodo, gastos, moneda, fechaVencimiento, notas } = req.body;

    const existente = await LiquidacionEdificio.findOne({
      edificio,
      'periodo.mes': periodo.mes,
      'periodo.año': periodo.año
    });

    if (existente && existente.estado === 'liquidada') {
      return res.status(400).json({ error: 'Este período ya fue liquidado' });
    }

    const data = { edificio, periodo, gastos, moneda, fechaVencimiento, notas };

    let liquidacion;
    if (existente) {
      liquidacion = await LiquidacionEdificio.findByIdAndUpdate(existente._id, data, { new: true });
    } else {
      liquidacion = await new LiquidacionEdificio(data).save();
    }

    const populated = await LiquidacionEdificio.findById(liquidacion._id).populate('edificio', 'nombre');
    res.status(existente ? 200 : 201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /:id/liquidar — generar expensas por propiedad
router.post('/:id/liquidar', auth, adminOnly, async (req, res) => {
  try {
    const liquidacion = await LiquidacionEdificio.findById(req.params.id);
    if (!liquidacion) return res.status(404).json({ error: 'Liquidación no encontrada' });
    if (liquidacion.estado === 'liquidada') return res.status(400).json({ error: 'Ya fue liquidada' });
    if (!liquidacion.gastos.length) return res.status(400).json({ error: 'No hay gastos cargados' });

    const montoTotal = liquidacion.gastos.reduce((sum, g) => sum + g.monto, 0);

    // Propiedades del edificio con coeficiente > 0
    const propiedades = await Propiedad.find({
      edificio: liquidacion.edificio,
      coeficiente: { $gt: 0 }
    });

    if (!propiedades.length) {
      return res.status(400).json({ error: 'No hay propiedades con coeficiente asignado en este edificio' });
    }

    let generadas = 0;
    let omitidas = 0;
    const expensasCreadas = [];

    for (const prop of propiedades) {
      // Verificar si ya existe expensa para este periodo/propiedad
      const yaExiste = await Expensa.findOne({
        propiedad: prop._id,
        'periodo.mes': liquidacion.periodo.mes,
        'periodo.año': liquidacion.periodo.año
      });

      if (yaExiste) { omitidas++; continue; }

      const montoProp = Math.round((montoTotal * prop.coeficiente / 100) * 100) / 100;

      const expensa = await new Expensa({
        propiedad:        prop._id,
        periodo:          liquidacion.periodo,
        montoTotal:       montoProp,
        moneda:           liquidacion.moneda,
        fechaVencimiento: liquidacion.fechaVencimiento,
        notas:            `Liquidación edificio - coef. ${prop.coeficiente}%`
      }).save();

      expensasCreadas.push(expensa);
      generadas++;
    }

    liquidacion.estado = 'liquidada';
    await liquidacion.save();

    res.json({ generadas, omitidas, montoTotal, expensas: expensasCreadas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /:id/coeficiente-propiedad — actualizar coeficiente de una propiedad
router.put('/propiedad/:propId/coeficiente', auth, adminOnly, async (req, res) => {
  try {
    const prop = await Propiedad.findByIdAndUpdate(
      req.params.propId,
      { coeficiente: parseFloat(req.body.coeficiente) },
      { new: true }
    );
    if (!prop) return res.status(404).json({ error: 'Propiedad no encontrada' });
    res.json({ _id: prop._id, nombre: prop.nombre, coeficiente: prop.coeficiente });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /:id — solo borradores
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const liq = await LiquidacionEdificio.findById(req.params.id);
    if (!liq) return res.status(404).json({ error: 'No encontrada' });
    if (liq.estado === 'liquidada') return res.status(400).json({ error: 'No se puede eliminar una liquidación ya procesada' });
    await liq.deleteOne();
    res.json({ message: 'Eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
