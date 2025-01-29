const express = require("express");
const router = express.Router();
const { createCamera, getAllCameras, assignCameraToNvr, getCameraHistory, updateCamera} = require("../controllers/cameraController");

// Ruta para crear una nueva cámara
router.post("/", createCamera);

// Ruta para obtener todas las cámaras
router.get("/", getAllCameras);


// Ruta para asignar una cámara a un NVR
router.put("/:cameraId/assign/:nvrId", assignCameraToNvr);

// Ruta para obtener el historial de asignaciones de una cámara
router.get("/:cameraId/history", getCameraHistory);

// Ruta para actualizar una cámara
router.patch('/:cameraId', updateCamera);

module.exports = router;
