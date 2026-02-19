const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, adminOnly, generateToken } = require('../middleware/auth');

const router = express.Router();

// Registrar usuario (solo admin puede crear usuarios)
router.post('/register',
  auth,
  adminOnly,
  [
    body('nombre').trim().notEmpty().withMessage('Nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Password debe tener al menos 6 caracteres'),
    body('role').isIn(['admin', 'cliente']).withMessage('Rol inválido')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { nombre, email, password, role, telefono } = req.body;

      // Verificar si el email ya existe
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }

      const user = new User({ nombre, email, password, role, telefono });
      await user.save();

      res.status(201).json({ 
        message: 'Usuario creado exitosamente',
        user 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Password es requerido')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      if (!user.activo) {
        return res.status(401).json({ error: 'Usuario inactivo' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = generateToken(user._id);

      res.json({ 
        token, 
        user
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Obtener usuario actual
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// Listar todos los usuarios (solo admin)
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar usuario
router.put('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const { nombre, email, telefono, role, activo } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { nombre, email, telefono, role, activo },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cambiar password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Password actual incorrecto' });
    }

    req.user.password = newPassword;
    await req.user.save();

    res.json({ message: 'Password actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Setup inicial (crear primer admin si no existe)
router.post('/setup', async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.status(400).json({ error: 'Ya existe un administrador' });
    }

    const { nombre, email, password } = req.body;

    const admin = new User({
      nombre,
      email,
      password,
      role: 'admin'
    });

    await admin.save();
    const token = generateToken(admin._id);

    res.status(201).json({ 
      message: 'Administrador creado exitosamente',
      token,
      user: admin
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
