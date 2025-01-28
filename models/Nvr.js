const mongoose = require("mongoose");

const nvrSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Nombre del NVR
    ipAddress: { type: String, required: true, unique: true }, // Dirección IP única
    maxChannels: { type: Number, required: true }, // Número máximo de cámaras soportadas
    location: { type: String, required: true }, // Ubicación física
    cameras: [{ type: mongoose.Schema.Types.ObjectId, ref: "Camera" }], // Cámaras asignadas (relación)
  },
  { timestamps: true } // Registra automáticamente "createdAt" y "updatedAt"
);

module.exports = mongoose.model("NVR", nvrSchema);
