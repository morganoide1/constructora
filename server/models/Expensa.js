const mongoose = require('mongoose');

const expensaSchema = new mongoose.Schema({
  propiedad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Propiedad',
    required: true
  },
  periodo: {
    mes: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    año: {
      type: Number,
      required: true
    }
  },
  montoTotal: {
    type: Number,
    required: true
  },
  moneda: {
    type: String,
    enum: ['USD', 'ARS'],
    default: 'ARS'
  },
  detalle: {
    ordinarias: { type: Number, default: 0 },
    extraordinarias: { type: Number, default: 0 },
    servicios: { type: Number, default: 0 },
    otros: { type: Number, default: 0 }
  },
  fechaVencimiento: {
    type: Date
  },
  estado: {
    type: String,
    enum: ['pendiente', 'pagada'],
    default: 'pendiente'
  },
  fechaPago: {
    type: Date
  },
  notas: {
    type: String,
    trim: true
  },
  archivo: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expensa', expensaSchema);
