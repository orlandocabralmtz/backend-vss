const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Función para registrar un nuevo usuario
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Verificar si el correo ya existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Crear el nuevo usuario
    const user = new User({ name, email, password, role });

    // Guardar el usuario en la base de datos
    await user.save();

    // Crear y firmar el JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h', // El token expira en 1 hora
    });

    res.status(201).json({ token }); // Devolver el token al usuario
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error en el servidor al registrar el usuario' });
  }
};

// Obtener todos los usuarios registrados
const getUsers = async (req, res) => {
  try {
    const users = await User.find(); // Obtener todos los usuarios
    res.status(200).json(users); // Devolver la lista de usuarios
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los usuarios', error: error.message });
  }
};

// Obtener un usuario por su ID
const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar el usuario en la base de datos
    const user = await User.findById(id);
    
    // Verificar si el usuario existe
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Devolver la información del usuario
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el usuario', error: error.message });
  }
};

// Función para hacer login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Verificar si el correo existe en la base de datos
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Correo o contraseña incorrectos' });
  }

  // Verificar si la contraseña es correcta
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Correo o contraseña incorrectos' });
  }

  // Crear el token JWT
  const token = jwt.sign(
    { userId: user._id, role: user.role, name:user.name }, // Payload
    process.env.JWT_SECRET, // Clave secreta
    { expiresIn: '1h' } // Tiempo de expiración (puedes ajustarlo según sea necesario)
  );

  // Enviar el token como respuesta
  res.status(200).json({
    message: 'Login exitoso',
    token, // El token JWT generado
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si el usuario está autenticado y tiene el rol de 'admin'
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para eliminar usuarios' });
    }

    // Verificar si el usuario a eliminar existe
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // No permitir que un usuario elimine su propio perfil
    if (req.user.id === user._id.toString()) {
      return res.status(400).json({ message: 'No puedes eliminar tu propio usuario' });
    }

    // Eliminar al usuario
    await User.findByIdAndDelete(id);

    res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el usuario:', error.message);
    // Si el error es por un token inválido o cualquier otro tipo de fallo, se captura y se maneja
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }
    // Para otros tipos de error del servidor
    res.status(500).json({ message: 'Error al eliminar el usuario', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  getUserById, 
  deleteUser,
};
