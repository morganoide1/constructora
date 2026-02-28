const mongoose = require('mongoose');

const planAdelantoSchema = new mongoose.Schema({
  titulo:        { type: String, required: true, trim: true },
  descripcion:   { type: String, trim: true },
  descuento:     { type: Number, required: true, min: 0, max: 100 }, // porcentaje
  cuotasMinimas: { type: Number, default: 1, min: 1 },              // mínimo para aplicar
  vigenciaHasta: { type: Date },                                     // null = sin vencimiento
  activo:        { type: Boolean, default: true },
  edificio:      { type: mongoose.Schema.Types.ObjectId, ref: 'Edificio' } // null = todos
}, { timestamps: true });

module.exports = mongoose.model('PlanAdelanto', planAdelantoSchema);
