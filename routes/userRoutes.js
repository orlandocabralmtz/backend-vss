const express = require('express');
const { registerUser, loginUser, getUsers, deleteUser, getUserById } = require('../controllers/userController');
const router = express.Router();
const protect = require('../middleware/authMiddleware');

// Ruta para registrar un nuevo usuario
router.post('/register', protect(["admin"]), registerUser);

// Ruta para iniciar sesión (login)
router.post('/login', loginUser);

// Ruta para obtener los usuarios registrados
router.get('/', protect(["admin"]), getUsers); // Esta ruta devolverá todos los usuarios

// Ruta para eliminar un usuario
router.delete('/:id', protect(['admin']), deleteUser);

// Ruta para obtener un usuario por su ID
router.get('/:id', protect(["admin"]), getUserById);

module.exports = router;
