const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Camera = require("../models/Camera");

// Configurar dotenv para las variables de entorno
dotenv.config();

// Conectar a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Conexión a MongoDB establecida"))
  .catch((err) => {
    console.error("Error conectando a MongoDB:", err);
    process.exit(1);
  });

// Función para insertar datos de ejemplo
const seedDatabase = async () => {
  try {
    // Eliminar datos existentes
    await Camera.deleteMany();

    console.log("Datos existentes eliminados");

    // Crear Cámaras sin NVRs
    const cameras = [];
    for (let i = 1; i <= 20; i++) {
      cameras.push({
        name: `Cámara ${i}`,
        model: `Modelo X${i}`,
        ipAddress: `192.168.1.${100 + i}`,
        location: `Ubicación ${Math.ceil(i / 5)}`, // Cambia de ubicación cada 5 cámaras
        macAddress: `00:14:22:01:23:${i.toString().padStart(2, '0')}`, // MAC Address único
        serialNumber: `SN${1000 + i}`, // Número de serie único
        firmware: `v1.0.${i}`, // Firmware de ejemplo
        resolution: `1920x1080`, // Resolución por defecto
        fps: 30, // Frames por segundo por defecto
        nvr: null, // Sin NVR asignado
        assignedDate: null, // Sin fecha de asignación
      });
    }

    await Camera.insertMany(cameras);
    console.log("Cámaras añadidas");

    console.log("Base de datos sembrada con éxito");
    process.exit();
  } catch (error) {
    console.error("Error sembrando la base de datos:", error);
    process.exit(1);
  }
};

// Ejecutar la función
seedDatabase();
