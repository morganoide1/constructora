const mongoose = require('mongoose');

const cuotaSchema = new mongoose.Schema({
  numero: Number,
  monto: Number,
  moneda: {
    type: String,
    enum: ['USD', 'ARS'],
    default: 'USD'
  },
  fechaVencimiento: Date,
  fechaPago: Date,
  estado: {
    type: String,
    enum: ['pendiente', 'pagada', 'vencida', 'parcial'],
    default: 'pendiente'
  },
  montoPagado: {
    type: Number,
    default: 0
  },
  comprobante: String,
  notas: String
});

const ventaSchema = new mongoose.Schema({
  propiedad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Propiedad',
    required: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fechaVenta: {
    type: Date,
    default: Date.now
  },
  precioVenta: {
    type: Number,
    required: true
  },
  moneda: {
    type: String,
    enum: ['USD', 'ARS'],
    default: 'USD'
  },
  // Plan de pagos
  anticipo: {
    monto: Number,
    fechaPago: Date,
    pagado: { type: Boolean, default: false }
  },
  cuotas: [cuotaSchema],
  // Totales calculados
  totalPagado: {
    type: Number,
    default: 0
  },
  saldoPendiente: {
    type: Number
  },
  // Estado de la venta
  estado: {
    type: String,
    enum: ['reserva', 'boleto', 'escritura', 'cancelada'],
    default: 'reserva'
  },
  // Documentación
  documentos: [{
    tipo: String,
    url: String,
    fecha: Date
  }],
  notas: String,
  vendedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calcular saldo pendiente antes de guardar
ventaSchema.pre('save', function(next) {
  this.saldoPendiente = this.precioVenta - this.totalPagado;
  next();
});

module.exports = mongoose.model('Venta', ventaSchema);
