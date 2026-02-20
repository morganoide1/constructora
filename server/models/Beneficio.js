const mongoose = require('mongoose');

const beneficioSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  imagen: {
    type: String,
    trim: true
  },
  link: {
    type: String,
    trim: true
  },
  categoria: {
    type: String,
    enum: ['descuento', 'servicio', 'experiencia', 'otro'],
    default: 'otro'
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Beneficio', beneficioSchema);
