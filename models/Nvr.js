const mongoose = require("mongoose");

const nvrSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Nombre del NVR
    ipAddress: { type: String, required: true, unique: true }, // Dirección IP principal (única)
    macAddress: { type: String, required: true, unique: true }, // Dirección MAC principal (única)
    ipAddressSecondary: { type: String, default: null }, // Dirección IP secundaria (opcional)
    macAddressSecondary: { type: String, default: null }, // Dirección MAC secundaria (opcional)
    model: { type: String, required: true }, // Modelo del NVR
    maxChannels: { type: Number, required: true }, // Número máximo de cámaras soportadas
    channelsOccupied: { type: Number, default: 0 }, // Número de canales ocupados
    capacity: { type: Number, required: true }, // Capacidad de almacenamiento (GB/TB)
    location: { type: String, required: true }, // Ubicación física
    branch: { type: String, required: true }, // Sucursal o delegación
    cameras: [{ type: mongoose.Schema.Types.ObjectId, ref: "Camera" }], // Cámaras asignadas (relación)
  },
  { timestamps: true } // Registra automáticamente "createdAt" y "updatedAt"
);

module.exports = mongoose.model("NVR", nvrSchema);
