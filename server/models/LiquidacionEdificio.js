const mongoose = require('mongoose');

const gastoItemSchema = new mongoose.Schema({
  descripcion:  { type: String, required: true, trim: true },
  monto:        { type: Number, required: true },
  esRecurrente: { type: Boolean, default: true }
}, { _id: true });

const liquidacionSchema = new mongoose.Schema({
  edificio:         { type: mongoose.Schema.Types.ObjectId, ref: 'Edificio', required: true },
  periodo:          { mes: { type: Number, required: true, min: 1, max: 12 }, año: { type: Number, required: true } },
  gastos:           [gastoItemSchema],
  moneda:           { type: String, enum: ['ARS', 'USD'], default: 'ARS' },
  fechaVencimiento: { type: Date },
  estado:           { type: String, enum: ['borrador', 'liquidada'], default: 'borrador' },
  notas:            { type: String }
}, { timestamps: true });

liquidacionSchema.index({ edificio: 1, 'periodo.año': -1, 'periodo.mes': -1 });

module.exports = mongoose.model('LiquidacionEdificio', liquidacionSchema);
