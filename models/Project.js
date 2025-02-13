// models/Project.js
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // Nombre del proyecto (único)
    description: { type: String }, // Descripción opcional del proyecto
    cameras: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Camera", // Referencia al modelo de cámaras
      },
    ],
    nvrs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NVR", // Referencia al modelo de NVRs
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Usuario que crea el proyecto
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Usuario que actualiza el proyecto
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);