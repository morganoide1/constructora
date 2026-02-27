const mongoose = require('mongoose');

const reservaSchema = new mongoose.Schema({
  espacio:  { type: mongoose.Schema.Types.ObjectId, ref: 'Espacio', required: true },
  edificio: { type: mongoose.Schema.Types.ObjectId, ref: 'Edificio', required: true },
  cliente:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fecha:    { type: Date, required: true },
  estado:   { type: String, enum: ['confirmada', 'cancelada'], default: 'confirmada' },
  notas:    { type: String }
}, { timestamps: true });

reservaSchema.index({ espacio: 1, fecha: 1, estado: 1 });

module.exports = mongoose.model('Reserva', reservaSchema);
