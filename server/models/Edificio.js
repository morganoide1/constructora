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
  driveUrl: {
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
