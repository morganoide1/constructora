const mongoose = require('mongoose');

const lineaPresupuestoSchema = new mongoose.Schema({
  concepto: {
    type: String,
    required: true,
    trim: true
  },
  tipo: {
    type: String,
    enum: ['ingreso', 'egreso'],
    required: true
  },
  monto: {
    type: Number,
    required: true
  },
  moneda: {
    type: String,
    enum: ['USD', 'ARS'],
    default: 'USD'
  }
});

const presupuestoSchema = new mongoose.Schema({
  edificio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Edificio',
    required: true
  },
  nombre: {
    type: String,
    trim: true
  },
  lineas: [lineaPresupuestoSchema],
  notas: {
    type: String,
    trim: true
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Presupuesto', presupuestoSchema);
