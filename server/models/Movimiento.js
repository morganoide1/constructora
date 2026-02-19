const mongoose = require('mongoose');

const movimientoSchema = new mongoose.Schema({
  caja: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caja',
    required: true
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
  // Para transferencias
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
  // Relaciones opcionales
  venta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venta'
  },
  certificado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificado'
  },
  // Usuario que realizó el movimiento
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
