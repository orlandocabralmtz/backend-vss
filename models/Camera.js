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
    macAddress: { type: String, required: true }, // Nuevo campo obligatorio
    serialNumber: { type: String, required: true }, // Nuevo campo obligatorio
    firmware: { type: String }, // Nuevo campo opcional
    resolution: { type: String }, // Nuevo campo opcional
    fps: { type: Number }, // Nuevo campo opcional
  },
  { timestamps: true } // Esto agrega los campos createdAt y updatedAt automáticamente
);

function arrayLimit(val) {
  return val.length <= 10; // Limitar a 10 entradas
}

module.exports = mongoose.model("Camera", cameraSchema);
