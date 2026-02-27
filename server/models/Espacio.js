const mongoose = require('mongoose');

const espacioSchema = new mongoose.Schema({
  edificio:    { type: mongoose.Schema.Types.ObjectId, ref: 'Edificio', required: true },
  nombre:      { type: String, required: true, trim: true },
  descripcion: { type: String },
  capacidad:   { type: Number },
  activo:      { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Espacio', espacioSchema);
