const express = require('express');
const router = express.Router();
const Movimiento = require('../models/Movimiento');
const Edificio = require('../models/Edificio');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { edificio } = req.query;
    
    let query = {};
    if (edificio) {
      query.edificio = edificio;
    }

    const movimientos = await Movimiento.find(query)
      .populate('caja', 'tipo')
      .populate('edificio', 'nombre');

    // Calcular totales
    const ingresos = { USD: 0, ARS: 0 };
    const egresos = { USD: 0, ARS: 0 };
    const conceptosEgresos = {};

    movimientos.forEach(m => {
      const moneda = m.caja?.tipo || 'ARS';
      
      if (m.tipo === 'ingreso' || m.tipo === 'transferencia_entrada') {
        ingresos[moneda] += m.monto;
      } else if (m.tipo === 'egreso' || m.tipo === 'transferencia_salida') {
        egresos[moneda] += m.monto;
        
        // Agrupar egresos por concepto
        const concepto = m.concepto || 'Sin concepto';
        if (!conceptosEgresos[concepto]) {
          conceptosEgresos[concepto] = { USD: 0, ARS: 0 };
        }
        conceptosEgresos[concepto][moneda] += m.monto;
      }
    });

    const resultado = {
      USD: ingresos.USD - egresos.USD,
      ARS: ingresos.ARS - egresos.ARS
    };

    const detalleEgresos = Object.entries(conceptosEgresos)
      .map(([concepto, montos]) => ({ concepto, ...montos }))
      .sort((a, b) => (b.USD + b.ARS) - (a.USD + a.ARS));

    // Si es vista general, calcular por edificio
    let porEdificio = [];
    if (!edificio) {
      const edificios = await Edificio.find({ activo: true });
      
      for (const ed of edificios) {
        const movEd = movimientos.filter(m => m.edificio && m.edificio._id && m.edificio._id.toString() === ed._id.toString());
        
        const ingEd = { USD: 0, ARS: 0 };
        const egrEd = { USD: 0, ARS: 0 };
        
        movEd.forEach(m => {
          const moneda = m.caja?.tipo || 'ARS';
          if (m.tipo === 'ingreso' || m.tipo === 'transferencia_entrada') {
            ingEd[moneda] += m.monto;
          } else if (m.tipo === 'egreso' || m.tipo === 'transferencia_salida') {
            egrEd[moneda] += m.monto;
          }
        });

        porEdificio.push({
          nombre: ed.nombre,
          ingresos: ingEd,
          egresos: egrEd,
          resultado: {
            USD: ingEd.USD - egrEd.USD,
            ARS: ingEd.ARS - egrEd.ARS
          }
        });
      }

      // Agregar "Sin asignar"
      const sinAsignar = movimientos.filter(m => !m.edificio);
      if (sinAsignar.length > 0) {
        const ingSA = { USD: 0, ARS: 0 };
        const egrSA = { USD: 0, ARS: 0 };
        
        sinAsignar.forEach(m => {
          const moneda = m.caja?.tipo || 'ARS';
          if (m.tipo === 'ingreso' || m.tipo === 'transferencia_entrada') {
            ingSA[moneda] += m.monto;
          } else if (m.tipo === 'egreso' || m.tipo === 'transferencia_salida') {
            egrSA[moneda] += m.monto;
          }
        });

        porEdificio.push({
          nombre: 'Sin asignar',
          ingresos: ingSA,
          egresos: egrSA,
          resultado: {
            USD: ingSA.USD - egrSA.USD,
            ARS: ingSA.ARS - egrSA.ARS
          }
        });
      }
    }

    res.json({
      ingresos,
      egresos,
      resultado,
      detalleEgresos,
      porEdificio
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
