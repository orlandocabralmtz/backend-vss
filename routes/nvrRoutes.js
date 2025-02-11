const express = require("express");
const router = express.Router();
const {
  createNvr,
  getAllNvrs,
  getNvrById,
  updateNvr, // Asegúrate de importar el controlador updateNvr
} = require("../controllers/nvrController");

// Ruta para crear un nuevo NVR
router.post("/", createNvr);

// Ruta para obtener todos los NVRs
router.get("/", getAllNvrs);

// Ruta para obtener un NVR por su ID
router.get("/:id", getNvrById);

// Ruta para actualizar un NVR por su ID
router.put("/:id", updateNvr); // Asegúrate de que esta ruta esté definida

module.exports = router;