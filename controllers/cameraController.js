const Camera = require("../models/Camera");
const Nvr = require("../models/Nvr");
const mongoose = require("mongoose");

// Crear una nueva cámara
const createCamera = async (req, res) => {
  try {
    const camera = await Camera.create(req.body);
    res.status(201).json(camera);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtener todas las cámaras
const getAllCameras = async (req, res) => {
  try {
    const cameras = await Camera.find().populate("nvr", "name"); // Obtiene el NVR y solo su nombre
    res.json(cameras);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las cámaras" });
  }
};



// Asignar una cámara a un NVR
const assignCameraToNvr = async (req, res) => {
  try {
    const { cameraId, nvrId } = req.params;

    // Validar IDs
    if (!mongoose.Types.ObjectId.isValid(cameraId) || !mongoose.Types.ObjectId.isValid(nvrId)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    // Buscar cámara y NVR
    const camera = await Camera.findById(cameraId);
    const newNvr = await Nvr.findById(nvrId);

    if (!camera || !newNvr) {
      return res.status(404).json({ message: "Cámara o NVR no encontrado" });
    }

    // Verificar capacidad del nuevo NVR
    if (newNvr.cameras.length >= newNvr.maxChannels) {
      return res.status(400).json({ message: "El nuevo NVR alcanzó su capacidad máxima" });
    }

    // Quitar la cámara del NVR anterior
    if (camera.nvr) {
      const previousNvr = await Nvr.findById(camera.nvr);
      if (previousNvr) {
        previousNvr.cameras = previousNvr.cameras.filter(
          (id) => id.toString() !== camera._id.toString()
        );
        await previousNvr.save();
      }
    }

    // Registrar la reasignación (con historial limitado)
    if (camera.reassignments.length >= 10) {
      camera.reassignments.shift(); // Eliminar la entrada más antigua
    }

    camera.reassignments.push({
      nvr: newNvr._id,
      date: new Date(),
    });

    // Actualizar la cámara y el nuevo NVR
    camera.nvr = newNvr._id;
    camera.assignedDate = new Date();
    await camera.save();

    newNvr.cameras.push(camera._id);
    await newNvr.save();

    res.status(200).json({
      message: "Cámara reasignada con éxito",
      camera,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



const getCameraHistory = async (req, res) => {
  try {
    const { cameraId } = req.params;

    // Validar que el ID sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(cameraId)) {
      return res.status(400).json({ message: "El ID de la cámara no es válido" });
    }

    // Buscar la cámara
    const camera = await Camera.findById(cameraId).select("name reassignments").populate("reassignments.nvr", "name maxChannels");

    if (!camera) {
      return res.status(404).json({ message: "Cámara no encontrada" });
    }

    res.status(200).json({
      message: `Historial de reasignaciones para la cámara ${camera.name}`,
      history: camera.reassignments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



module.exports = { createCamera, getAllCameras, assignCameraToNvr, getCameraHistory };
