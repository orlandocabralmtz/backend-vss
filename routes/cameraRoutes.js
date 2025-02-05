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

// Middleware de validación para macAddress y serialNumber
const validateMacAndSerial = (req, res, next) => {
  const { macAddress, serialNumber } = req.body;
  
  // Validar que ambos campos estén presentes
  if (!macAddress || !serialNumber) {
    return res.status(400).json({ message: "macAddress y serialNumber son obligatorios" });
  }
  next();
};

// Ruta para crear una nueva cámara con validación
router.post("/", validateMacAndSerial, createCamera);

// Ruta para obtener todas las cámaras
router.get("/", getAllCameras);

// Ruta para asignar una cámara a un NVR
router.put("/:cameraId/assign/:nvrId", assignCameraToNvr);

// Ruta para obtener el historial de asignaciones de una cámara
router.get("/:cameraId/history", getCameraHistory);

// Ruta para actualizar una cámara
router.patch('/:cameraId', updateCamera);

// Ruta para eliminar una cámara
router.delete('/:cameraId', deleteCamera);

// Ruta para obtener una cámara por su ID
router.get("/:cameraId", getCameraById);

// Ruta para importar cámaras desde un archivo CSV
router.post("/import", importCamerasFromExcel);  // Nueva ruta para importar cámaras

module.exports = router;
