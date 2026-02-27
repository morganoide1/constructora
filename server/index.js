require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const cajasRoutes = require('./routes/cajas');
const clientesRoutes = require('./routes/clientes');
const ventasRoutes = require('./routes/ventas');
const certificadosRoutes = require('./routes/certificados');
const transferenciasRoutes = require('./routes/transferencias');
const edificiosRoutes = require('./routes/edificios');
const pylRoutes = require('./routes/pyl');
const beneficiosRoutes = require('./routes/beneficios');
const gastosRoutes = require('./routes/gastos');
const presupuestosRoutes = require('./routes/presupuestos');
const expensasRoutes = require('./routes/expensas');
const denunciasRoutes = require('./routes/denuncias');
const anunciosRoutes = require('./routes/anuncios');
const espaciosRoutes = require('./routes/espacios');
const reservasRoutes = require('./routes/reservas');
const liquidacionesRoutes = require('./routes/liquidaciones');
const mantenimientoRoutes = require('./routes/mantenimiento');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del cliente en producción
app.use(express.static(path.join(__dirname, '../client/dist')));

// Build MongoDB URL from individual components if MONGO_URL is not set
let mongoUrl = process.env.MONGO_URL;
if (!mongoUrl && process.env.MONGOHOST) {
  mongoUrl = `mongodb://${process.env.MONGOUSER}:${process.env.MONGOPASSWORD}@${process.env.MONGOHOST}:${process.env.MONGOPORT}`;
}
if (!mongoUrl) {
  mongoUrl = 'mongodb://mongo:TgGjtMMxQTIzldmFsWTAIUysIgegUECh@mongodb.railway.internal:27017';
}

console.log("MONGOHOST:", process.env.MONGOHOST || "NOT SET");

// Conectar a MongoDB
mongoose.connect(mongoUrl)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/cajas', cajasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/certificados', certificadosRoutes);
app.use('/api/transferencias', transferenciasRoutes);
app.use('/api/edificios', edificiosRoutes);
app.use('/api/pyl', pylRoutes);
app.use('/api/beneficios', beneficiosRoutes);
app.use('/api/gastos', gastosRoutes);
app.use('/api/presupuestos', presupuestosRoutes);
app.use('/api/expensas', expensasRoutes);
app.use('/api/denuncias', denunciasRoutes);
app.use('/api/anuncios', anunciosRoutes);
app.use('/api/espacios', espaciosRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/liquidaciones', liquidacionesRoutes);
app.use('/api/mantenimiento', mantenimientoRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ruta para servir la aplicación React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
