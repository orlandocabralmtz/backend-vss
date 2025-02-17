const express = require("express");
const router = express.Router();
const {
  createNvr,
  getAllNvrs,
  getNvrById,
  updateNvr, // Asegúrate de importar el controlador updateNvr
  deleteNvr, // Asegúrate de importar el controlador deleteNvr
} = require("../controllers/nvrController");
const protect = require("../middleware/authMiddleware"); // Asegúrate de importar el middleware de protección



// Ruta para crear un nuevo NVR
router.post("/",protect(["admin"]), createNvr);

// Ruta para obtener todos los NVRs
router.get("/",protect(["admin", "junior","readOnly"]), getAllNvrs);

// Ruta para obtener un NVR por su ID
router.get("/:id",protect(["admin", "junior","readOnly"]), getNvrById);

// Ruta para actualizar un NVR por su ID
router.put("/:id", protect(["admin", "junior"]), updateNvr); // Asegúrate de que esta ruta esté definida


// Ruta para elimnar un NVR por su ID
router.delete("/:id",protect(["admin"]), deleteNvr); // Asegúrate de que esta ruta esté definida
module.exports = router;