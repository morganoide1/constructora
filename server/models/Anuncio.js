const mongoose = require('mongoose');

const anuncioSchema = new mongoose.Schema({
  titulo:    { type: String, required: true, trim: true },
  contenido: { type: String, required: true },
  imagen:    { type: String },
  edificio:  { type: mongoose.Schema.Types.ObjectId, ref: 'Edificio', default: null },
  activo:    { type: Boolean, default: true },
  autor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Anuncio', anuncioSchema);
