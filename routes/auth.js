const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Endpoint para login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    // Crear el token JWT
    const token = jwt.sign({ userId: user._id, role: user.role }, 'mi_clave_secreta', {
      expiresIn: '1h', // Expira en 1 hora
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});

module.exports = router;
