const mongoose = require('mongoose');

const cajaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  tipo: {
    type: String,
    enum: ['USD', 'ARS'],
    required: true
  },
  categoria: {
    type: String,
    enum: ['principal', 'chica'],
    required: true
  },
  saldo: {
    type: Number,
    default: 0
  },
  descripcion: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Caja', cajaSchema);
