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
    await Nvr.deleteMany(); // Limpiar también los NVRs existentes
    console.log("Datos existentes eliminados");

    // Crear 4 NVRs
    const nvrData = [
      {
        name: "NVR 1",
        ipAddress: "192.168.1.10",
        macAddress: "00:14:22:01:23:01",
        model: "Modelo NVR1",
        maxChannels: 6,
        capacity: 1000,
        location: "Oficina A",
        branch: "Sucursal 1",
      },
      {
        name: "NVR 2",
        ipAddress: "192.168.1.11",
        macAddress: "00:14:22:01:23:02",
        model: "Modelo NVR2",
        maxChannels: 6,
        capacity: 1000,
        location: "Oficina B",
        branch: "Sucursal 2",
      },
      {
        name: "NVR 3",
        ipAddress: "192.168.1.12",
        macAddress: "00:14:22:01:23:03",
        model: "Modelo NVR3",
        maxChannels: 6,
        capacity: 1000,
        location: "Oficina C",
        branch: "Sucursal 3",
      },
      {
        name: "NVR 4",
        ipAddress: "192.168.1.13",
        macAddress: "00:14:22:01:23:04",
        model: "Modelo NVR4",
        maxChannels: 6,
        capacity: 1000,
        location: "Oficina D",
        branch: "Sucursal 4",
      },
    ];

    const nvrInstances = await Nvr.insertMany(nvrData);
    console.log("NVRs añadidos");

    // Crear 20 Cámaras sin asignar NVR
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
