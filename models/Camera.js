const mongoose = require("mongoose");

const cameraSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    model: { type: String, required: true },
    ipAddress: { type: String, required: true },
    location: { type: String, required: true },
    nvr: { type: mongoose.Schema.Types.ObjectId, ref: "NVR", default: null },
    assignedDate: { type: Date, default: null },
    reassignments: {
      type: [
        {
          nvr: { type: mongoose.Schema.Types.ObjectId, ref: "NVR" },
          date: { type: Date },
        },
      ],
      validate: [arrayLimit, "Solo se permiten un máximo de 10 reasignaciones"],
    },
    macAddress: { type: String, required: true },
    serialNumber: { type: String, required: true },
    firmware: { type: String },
    resolution: { type: String },
    fps: { type: Number },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // El usuario que crea la cámara
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // El usuario que actualiza la cámara
    updateHistory: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Usuario que hizo la actualización
      date: { type: Date, default: Date.now }, // Fecha de la actualización
      changes: { type: String }, // Descripción de los cambios realizados
    }],
  },
  { timestamps: true }
);

function arrayLimit(val) {
  return val.length <= 10; // Limitar a 10 entradas
}

module.exports = mongoose.model("Camera", cameraSchema);
