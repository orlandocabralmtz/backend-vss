const mongoose = require("mongoose");

const cameraSchema = new mongoose.Schema({
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
});

function arrayLimit(val) {
  return val.length <= 10; // Limitar a 10 entradas
}

module.exports = mongoose.model("Camera", cameraSchema);
