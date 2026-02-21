const mongoose = require('mongoose');

const gastoSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  propiedad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Propiedad'
  },
  tipo: {
    type: String,
    enum: ['expensas', 'mantenimiento', 'servicios', 'otro'],
    required: true
  },
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  monto: {
    type: Number,
    required: true
  },
  moneda: {
    type: String,
    enum: ['USD', 'ARS'],
    default: 'ARS'
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  archivo: {
    type: String,
    trim: true
  },
  archivoNombre: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Gasto', gastoSchema);
