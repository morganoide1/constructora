const mongoose = require('mongoose');

const movimientoSchema = new mongoose.Schema({
  caja: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caja',
    required: true
  },
  edificio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Edificio'
  },
  tipo: {
    type: String,
    enum: ['ingreso', 'egreso', 'transferencia_entrada', 'transferencia_salida'],
    required: true
  },
  monto: {
    type: Number,
    required: true
  },
  concepto: {
    type: String,
    required: true,
    trim: true
  },
  referencia: {
    type: String,
    trim: true
  },
  cajaOrigen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caja'
  },
  cajaDestino: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caja'
  },
  tipoCambio: {
    type: Number
  },
  venta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venta'
  },
  certificado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificado'
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  notas: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Movimiento', movimientoSchema);
