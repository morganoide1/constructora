const mongoose = require('mongoose');

const mantenimientoSchema = new mongoose.Schema({
  edificio:    { type: mongoose.Schema.Types.ObjectId, ref: 'Edificio', required: true },
  tipo:        { type: String, enum: ['limpieza', 'mantenimiento', 'reparacion', 'inspeccion', 'otro'], default: 'mantenimiento' },
  titulo:      { type: String, required: true, trim: true },
  descripcion: { type: String },
  fecha:       { type: Date, required: true },
  imagen:      { type: String },
  creadoPor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

mantenimientoSchema.index({ edificio: 1, fecha: -1 });

module.exports = mongoose.model('Mantenimiento', mantenimientoSchema);
