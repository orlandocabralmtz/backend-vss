const mongoose = require("mongoose");

// Función para conectar a MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI); // Sin opciones adicionales
    console.log(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error de conexión: ${error.message}`);
    process.exit(1); // Detener el proceso si falla la conexión
  }
};

module.exports = connectDB;
