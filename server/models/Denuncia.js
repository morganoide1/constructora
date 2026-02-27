const mongoose = require('mongoose');

const respuestaSchema = new mongoose.Schema({
  mensaje: { type: String, required: true },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fecha: { type: Date, default: Date.now }
});

const denunciaSchema = new mongoose.Schema({
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  propiedad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Propiedad'
  },
  tipo: {
    type: String,
    enum: ['reclamo', 'consulta', 'sugerencia', 'urgencia'],
    required: true
  },
  asunto: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'en_proceso', 'resuelto', 'cerrado'],
    default: 'pendiente'
  },
  prioridad: {
    type: String,
    enum: ['baja', 'media', 'alta', 'urgente'],
    default: 'media'
  },
  edificio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Edificio'
  },
  visibleCliente: {
    type: Boolean,
    default: true
  },
  aprobadaVecinos: {
    type: Boolean,
    default: false
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  archivo: {
    type: String,
    trim: true
  },
  respuestas: [respuestaSchema],
  fechaCierre: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Denuncia', denunciaSchema);
