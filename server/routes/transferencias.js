const express = require('express');
const Caja = require('../models/Caja');
const Movimiento = require('../models/Movimiento');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Realizar transferencia entre cajas
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { cajaOrigenId, cajaDestinoId, monto, tipoCambio, concepto, notas } = req.body;

    // Validaciones
    if (cajaOrigenId === cajaDestinoId) {
      return res.status(400).json({ error: 'Las cajas de origen y destino deben ser diferentes' });
    }

    const cajaOrigen = await Caja.findById(cajaOrigenId);
    const cajaDestino = await Caja.findById(cajaDestinoId);

    if (!cajaOrigen || !cajaDestino) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    if (cajaOrigen.saldo < monto) {
      return res.status(400).json({ error: 'Saldo insuficiente en caja de origen' });
    }

    // Calcular monto destino (aplicar tipo de cambio si las monedas son diferentes)
    let montoDestino = monto;
    let tcUsado = null;

    if (cajaOrigen.tipo !== cajaDestino.tipo) {
      if (!tipoCambio || tipoCambio <= 0) {
        return res.status(400).json({ error: 'Se requiere tipo de cambio para transferencias entre diferentes monedas' });
      }
      tcUsado = tipoCambio;
      
      // USD -> ARS: multiplicar
      // ARS -> USD: dividir
      if (cajaOrigen.tipo === 'USD' && cajaDestino.tipo === 'ARS') {
        montoDestino = monto * tipoCambio;
      } else {
        montoDestino = monto / tipoCambio;
      }
    }

    // Actualizar saldos
    cajaOrigen.saldo -= monto;
    cajaDestino.saldo += montoDestino;

    await cajaOrigen.save();
    await cajaDestino.save();

    // Crear movimientos
    const conceptoTransferencia = concepto || `Transferencia a ${cajaDestino.nombre}`;

    const movimientoSalida = new Movimiento({
      caja: cajaOrigen._id,
      tipo: 'transferencia_salida',
      monto,
      concepto: conceptoTransferencia,
      cajaOrigen: cajaOrigen._id,
      cajaDestino: cajaDestino._id,
      tipoCambio: tcUsado,
      usuario: req.user._id,
      notas
    });

    const movimientoEntrada = new Movimiento({
      caja: cajaDestino._id,
      tipo: 'transferencia_entrada',
      monto: montoDestino,
      concepto: `Transferencia desde ${cajaOrigen.nombre}`,
      cajaOrigen: cajaOrigen._id,
      cajaDestino: cajaDestino._id,
      tipoCambio: tcUsado,
      usuario: req.user._id,
      notas
    });

    await movimientoSalida.save();
    await movimientoEntrada.save();

    res.status(201).json({
      message: 'Transferencia realizada exitosamente',
      transferencia: {
        origen: {
          caja: cajaOrigen.nombre,
          montoDebitado: monto,
          nuevoSaldo: cajaOrigen.saldo
        },
        destino: {
          caja: cajaDestino.nombre,
          montoAcreditado: montoDestino,
          nuevoSaldo: cajaDestino.saldo
        },
        tipoCambio: tcUsado
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Historial de transferencias
router.get('/historial', auth, adminOnly, async (req, res) => {
  try {
    const { desde, hasta, limit = 50 } = req.query;
    
    let query = { 
      tipo: { $in: ['transferencia_entrada', 'transferencia_salida'] } 
    };
    
    if (desde || hasta) {
      query.fecha = {};
      if (desde) query.fecha.$gte = new Date(desde);
      if (hasta) query.fecha.$lte = new Date(hasta);
    }

    const transferencias = await Movimiento.find(query)
      .populate('caja', 'nombre tipo')
      .populate('cajaOrigen', 'nombre tipo')
      .populate('cajaDestino', 'nombre tipo')
      .populate('usuario', 'nombre')
      .sort({ fecha: -1 })
      .limit(parseInt(limit));

    res.json(transferencias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
