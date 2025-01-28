const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Camera = require("../models/Camera");
const Nvr = require("../models/Nvr");

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
    await Nvr.deleteMany();

    console.log("Datos existentes eliminados");

    // Crear NVRs
    const nvrs = await Nvr.insertMany([
      { name: "NVR 1", ipAddress: "192.168.1.201", maxChannels: 16, location: "Sala 1" },
      { name: "NVR 2", ipAddress: "192.168.1.202", maxChannels: 16, location: "Sala 2" },
      { name: "NVR 3", ipAddress: "192.168.1.203", maxChannels: 8, location: "Sala 3" },
      { name: "NVR 4", ipAddress: "192.168.1.204", maxChannels: 8, location: "Sala 4" },
    ]);

    console.log("NVRs añadidos");

    // Crear Cámaras
    const cameras = [];
    for (let i = 1; i <= 20; i++) {
      cameras.push({
        name: `Cámara ${i}`,
        model: `Modelo X${i}`,
        ipAddress: `192.168.1.${100 + i}`,
        location: `Ubicación ${Math.ceil(i / 5)}`, // Cambia de ubicación cada 5 cámaras
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
