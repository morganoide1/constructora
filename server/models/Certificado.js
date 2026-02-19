const mongoose = require('mongoose');

const certificadoSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: true,
    unique: true
  },
  obra: {
    type: String,
    required: true,
    trim: true
  },
  contratista: {
    nombre: { type: String, required: true },
    cuit: String,
    direccion: String,
    contacto: String
  },
  periodo: {
    inicio: Date,
    fin: Date
  },
  descripcion: {
    type: String,
    required: true
  },
  items: [{
    descripcion: String,
    unidad: String,
    cantidad: Number,
    precioUnitario: Number,
    subtotal: Number
  }],
  montoTotal: {
    type: Number,
    required: true
  },
  moneda: {
    type: String,
    enum: ['USD', 'ARS'],
    default: 'ARS'
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aprobado', 'pagado', 'rechazado'],
    default: 'pendiente'
  },
  fechaEmision: {
    type: Date,
    default: Date.now
  },
  fechaAprobacion: Date,
  fechaPago: Date,
  aprobadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Referencia al movimiento de caja cuando se paga
  movimiento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movimiento'
  },
  documentos: [{
    tipo: String,
    url: String,
    fecha: Date
  }],
  notas: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Certificado', certificadoSchema);
