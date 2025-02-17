const express = require("express");
const router = express.Router();
const { 
  createCamera, 
  getAllCameras, 
  assignCameraToNvr, 
  getCameraHistory, 
  updateCamera, 
  deleteCamera, 
  getCameraById, 
  importCamerasFromExcel
} = require("../controllers/cameraController");
const protect = require("../middleware/authMiddleware"); // Asegúrate de importar el middleware de protección

// Middleware de validación para macAddress y serialNumber
const validateMacAndSerial = (req, res, next) => {
  const { macAddress, serialNumber } = req.body;
  
  // Validar que ambos campos estén presentes
  if (!macAddress || !serialNumber) {
    return res.status(400).json({ message: "macAddress y serialNumber son obligatorios" });
  }
  next();
};

// Ruta para crear una nueva cámara (solo admin y junior)
router.post("/", protect(["admin", "junior"]), validateMacAndSerial, createCamera);

// Ruta para obtener todas las cámaras (readOnly, junior, admin)
router.get("/", protect(["admin", "junior", "readOnly"]), getAllCameras);

// Ruta para asignar una cámara a un NVR (solo admin y junior)
router.put("/:cameraId/assign/:nvrId", protect(["admin", "junior"]), assignCameraToNvr);

// Ruta para obtener el historial de asignaciones de una cámara (readOnly, junior, admin)
router.get("/:cameraId/history", protect(["admin", "junior", "readOnly"]), getCameraHistory);

// Ruta para actualizar una cámara (solo admin y junior)
router.patch('/:cameraId', protect(["admin", "junior"]), updateCamera);

// Ruta para eliminar una cámara (solo admin)
router.delete('/:cameraId', protect(["admin"]), deleteCamera);

// Ruta para obtener una cámara por su ID (readOnly, junior, admin)
router.get("/:cameraId", protect(["admin", "junior", "readOnly"]), getCameraById);

// Ruta para importar cámaras desde un archivo Excel (solo admin y junior)
router.post("/import", protect(["admin"]), importCamerasFromExcel);  // Nueva ruta para importar cámaras

module.exports = router;

