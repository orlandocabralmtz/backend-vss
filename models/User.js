const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Definición del esquema de usuario
const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  correo: {
    type: String,
    required: true,
    unique: true, // Asegura que no haya dos usuarios con el mismo correo
    match: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/, // Validación básica de correo
  },
  contraseña: {
    type: String,
    required: true,
    minlength: 6, // Asegura que la contraseña tenga al menos 6 caracteres
  },
  rol: {
    type: String,
    enum: ['admin', 'junior', 'readonly'], // Roles predefinidos
    default: 'junior', // Valor predeterminado si no se especifica
  },
});

// Encriptar la contraseña antes de guardar el usuario
userSchema.pre('save', async function (next) {
  if (!this.isModified('contraseña')) return next(); // Si la contraseña no fue modificada, no se hace nada
  try {
    const salt = await bcrypt.genSalt(10); // Genera un salt para encriptar la contraseña
    this.contraseña = await bcrypt.hash(this.contraseña, salt); // Encripta la contraseña
    next(); // Continúa con el proceso de guardado
  } catch (err) {
    next(err); // Si hay un error, lo pasa al siguiente middleware
  }
});

// Método para verificar si la contraseña ingresada coincide con la almacenada
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.contraseña); // Compara la contraseña ingresada con la encriptada
};

const User = mongoose.model('User', userSchema);

module.exports = User;
