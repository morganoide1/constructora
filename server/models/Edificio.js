const mongoose = require('mongoose');

const edificioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  direccion: {
    type: String,
    trim: true
  },
  estado: {
    type: String,
    enum: ['en_construccion', 'finalizado', 'en_venta'],
    default: 'en_construccion'
  },
  avanceObra: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  porcentajeVendido: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  rentabilidadPozo: {
    type: Number,
    default: 0
  },
  fechaInicioObra: {
    type: Date
  },
  fechaEntregaEstimada: {
    type: Date
  },
  driveUrl: {
    type: String,
    trim: true
  },
  expensasUrl: {
    type: String,
    trim: true
  },
  historialObraUrl: {
    type: String,
    trim: true
  },
  imagen: {
    type: String,
    trim: true
  },
  linkPagoAutomatico: {
    type: String,
    trim: true
  },
  linkPagoMomento: {
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

module.exports = mongoose.model('Edificio', edificioSchema);
