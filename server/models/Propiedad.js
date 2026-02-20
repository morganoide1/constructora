const mongoose = require('mongoose');

const propiedadSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  edificio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Edificio'
  },
  tipo: {
    type: String,
    enum: ['departamento', 'local', 'cochera', 'terreno'],
    default: 'departamento'
  },
  ubicacion: {
    piso: String,
    unidad: String,
    direccion: String
  },
  superficie: {
    cubierta: Number,
    semicubierta: Number,
    descubierta: Number,
    total: Number
  },
  precioLista: {
    type: Number,
    required: true
  },
  valorFuturo: {
    type: Number
  },
  estado: {
    type: String,
    enum: ['disponible', 'reservado', 'vendido', 'escriturado'],
    default: 'disponible'
  },
  caracteristicas: [String],
  imagenes: [String],
  planos: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('Propiedad', propiedadSchema);
